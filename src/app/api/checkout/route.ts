import { NextResponse, type NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { getToken } from "next-auth/jwt";
import { authOptions } from "@/lib/auth-options";
import { CENTRAL_API_URL, parseJsonRecord, type CentralApiRole } from "@/lib/central-api";
import { fetchCentralJson, syncRemoteCart } from "@/lib/central-client";
import { extractOrderInfo } from "@/lib/adapters/orders.adapter";
import { extractPaymentId } from "@/lib/adapters/payments.adapter";
import { normalizeCustomerContext } from "@/lib/adapters/customers.adapter";
import { buildCanonicalCheckoutPayload, buildLegacyCheckoutPayload } from "@/lib/adapters/checkout.adapter";
import type { CheckoutDeliveryInput, CheckoutItemInput, CheckoutSubmitPayload } from "@/types/checkout";
import { checkoutPayloadSchema } from "@/lib/schemas/checkout.schema";
import { firstZodIssueMessage } from "@/lib/schemas/common";
import { logger } from "@/lib/logger";
import { getRequestId } from "@/lib/request-context";
import { formatPrice } from "@/lib/format";
import { normalizePhone, compactText } from "@/lib/text";
import { validateCheckoutPayload } from "@/lib/checkout/validation";
import { buildWhatsappUrl, getDeliveryLabel } from "@/lib/checkout/notifications";
import { createQrPayment } from "@/lib/checkout/payment";
import { getCheckoutAuth, type CheckoutAuth } from "@/lib/checkout/auth";
import { extractErrorMessage } from "@/lib/adapters/orders.adapter";

const WHATSAPP_NUMBER = process.env.WHATSAPP_NUMBER ?? "59176574068";





export async function GET(request: NextRequest) {
  const requestId = await getRequestId();
  const auth = await getCheckoutAuth(request);

  if (!auth || auth.role !== "CLIENTE") {
    return NextResponse.json({ message: "Debes iniciar sesion para continuar." }, { status: 401 });
  }

  if (!CENTRAL_API_URL) {
    return NextResponse.json({ message: "La API principal no esta configurada." }, { status: 500 });
  }

  try {
    const result = await fetchCentralJson(
      [
        { path: "/clientes/me", method: "GET" },
        { path: "/customers/me", method: "GET" },
      ],
      auth,
      { requestId }
    );

    const data = parseJsonRecord(result.data);
    if (!result.response.ok) {
      return NextResponse.json(
        { message: extractErrorMessage(data, "No pude cargar tus datos de cliente.") },
        { status: result.response.status }
      );
    }

    return NextResponse.json(normalizeCustomerContext(data));
  } catch (error) {
    logger.error("Checkout GET customer profile failed", { error, requestId, userId: auth.userId });
    return NextResponse.json({ message: "No pude consultar tu perfil de cliente." }, { status: 502 });
  }
}

export async function POST(request: NextRequest) {
  const requestId = await getRequestId();
  const auth = await getCheckoutAuth(request);

  if (!auth || auth.role !== "CLIENTE") {
    return NextResponse.json({ ok: false, message: "Debes iniciar sesion para finalizar la compra." }, { status: 401 });
  }

  if (!CENTRAL_API_URL) {
    return NextResponse.json({ ok: false, message: "La API principal no esta configurada." }, { status: 500 });
  }

  let rawPayload: unknown;

  try {
    rawPayload = await request.json();
  } catch {
    return NextResponse.json({ ok: false, message: "No pude leer los datos del checkout." }, { status: 400 });
  }

  const parsedPayload = checkoutPayloadSchema.safeParse(rawPayload);
  if (!parsedPayload.success) {
    logger.warn("Checkout validation failed (schema)", { error: parsedPayload.error.format(), requestId, userId: auth.userId });
    return NextResponse.json({ ok: false, message: firstZodIssueMessage(parsedPayload.error) }, { status: 400 });
  }

  const payload: CheckoutSubmitPayload = parsedPayload.data;

  const validationError = validateCheckoutPayload(payload);
  if (validationError) {
    logger.warn("Checkout validation failed (business logic)", { validationError, requestId, userId: auth.userId });
    return NextResponse.json({ ok: false, message: validationError }, { status: 400 });
  }

  logger.info("Checkout started", { requestId, userId: auth.userId, itemsCount: payload.items.length, paymentMethod: payload.paymentMethod });

  const syncResult = await syncRemoteCart(auth, payload.items, { requestId });
  if (!syncResult.ok) {
    logger.error("Checkout cart sync failed", { 
      phase: syncResult.phase, 
      status: syncResult.result?.response.status,
      requestId, 
      userId: auth.userId 
    });
    const errorData = parseJsonRecord(syncResult.result?.data);
    const itemName = "item" in syncResult && syncResult.item ? syncResult.item.nombre : "el producto";
    const msg = syncResult.phase === "clear"
      ? extractErrorMessage(errorData, "No pude sincronizar tu carrito con el sistema central.")
      : extractErrorMessage(errorData, `No pude agregar ${itemName} al carrito del sistema central.`);
    return NextResponse.json({ ok: false, message: msg }, { status: syncResult.result?.response.status ?? 502 });
  }

  try {
    const canonicalCheckoutPayload = buildCanonicalCheckoutPayload(payload);
    const legacyCheckoutPayload = buildLegacyCheckoutPayload(payload);

    const result = await fetchCentralJson(
      [
        {
          path: "/pedidos/checkout",
          method: "POST",
          body: JSON.stringify(canonicalCheckoutPayload),
        },
        {
          path: "/pedidos/checkout",
          method: "POST",
          body: JSON.stringify(legacyCheckoutPayload),
        },
        {
          path: "/orders/checkout",
          method: "POST",
          body: JSON.stringify(legacyCheckoutPayload),
        },
      ],
      auth,
      { requestId }
    );

    const data = parseJsonRecord(result.data);
    if (!result.response.ok) {
      logger.error("Checkout API submission failed", { 
        status: result.response.status, 
        requestId, 
        userId: auth.userId,
        error: data
      });
      return NextResponse.json(
        {
          ok: false,
          message: extractErrorMessage(
            data,
            !auth.accessToken
              ? "Tu sesion actual no tiene el token del backend. Cierra sesion e inicia de nuevo para finalizar la compra."
              : "No pude registrar tu pedido en este momento. Intenta nuevamente."
          ),
        },
        { status: result.response.status }
      );
    }

    const { orderId, orderNumber } = extractOrderInfo(data);
    const total = payload.items.reduce((sum, item) => sum + item.precio * item.cantidad, 0);
    const whatsappUrl =
      payload.delivery.method === "WHATSAPP"
        ? buildWhatsappUrl({
            customerName: auth.fullname ?? "Cliente FitAndes",
            customerEmail: auth.email ?? "-",
            items: payload.items,
            delivery: payload.delivery,
            total,
            orderNumber,
            notes: payload.notes?.trim() ?? null,
          })
        : null;

    let paymentId: string | null = null;
    let warning: string | null = null;

    if (payload.paymentMethod === "QR" && orderId) {
      const paymentSetup = await createQrPayment(auth, orderId, { requestId });
      paymentId = paymentSetup.paymentId;
      warning = paymentSetup.warning;

      if (!paymentId) {
        logger.warn("Checkout payment setup warning", { warning, requestId, orderId });
      }
    }

    logger.info("Checkout successful", { 
      requestId, 
      userId: auth.userId, 
      orderId, 
      orderNumber, 
      hasPayment: !!paymentId 
    });

    return NextResponse.json({
      ok: true,
      orderId,
      orderNumber,
      paymentId,
      receiptRequired: payload.paymentMethod === "QR",
      whatsappUrl,
      warning,
      message:
        payload.paymentMethod === "QR"
          ? "Pedido registrado. El siguiente paso es subir tu comprobante QR."
          : "Pedido registrado correctamente.",
    });
  } catch (error) {
    logger.error("Checkout process critical failure", { error, requestId, userId: auth.userId });
    return NextResponse.json(
      {
        ok: false,
        message: "No pude conectar con la API principal para guardar el pedido.",
      },
      { status: 502 }
    );
  }
}
