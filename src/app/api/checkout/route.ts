import { NextResponse, type NextRequest } from "next/server";
import { CENTRAL_API_URL, parseJsonRecord } from "@/lib/central-api";
import { fetchCentralJson, syncRemoteCart } from "@/lib/central-client";
import { extractOrderInfo } from "@/lib/adapters/orders.adapter";
import { normalizeCustomerContext } from "@/lib/adapters/customers.adapter";
import { buildCanonicalCheckoutPayload, buildLegacyCheckoutPayload } from "@/lib/adapters/checkout.adapter";
import type { CheckoutSubmitPayload } from "@/types/checkout";
import { checkoutPayloadSchema } from "@/lib/schemas/checkout.schema";
import { firstZodIssueMessage } from "@/lib/schemas/common";
import { logger } from "@/lib/logger";
import { getRequestId } from "@/lib/request-context";
import { validateCheckoutPayload } from "@/lib/checkout/validation";
import { buildWhatsappUrl } from "@/lib/checkout/notifications";
import { createQrPayment } from "@/lib/checkout/payment";
import { getCheckoutAuth } from "@/lib/checkout/auth";
import { extractErrorMessage } from "@/lib/adapters/orders.adapter";

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
    logger.warn("Checkout validation failed (schema)", { error: parsedPayload.error.format(), requestId, userId: auth?.userId });
    return NextResponse.json({ ok: false, message: firstZodIssueMessage(parsedPayload.error) }, { status: 400 });
  }

  const payload: CheckoutSubmitPayload = parsedPayload.data;
  const isPromoExpress = Boolean(payload.promoExpress);
  const isGuest = Boolean(payload.esInvitado || !auth || auth.role !== "CLIENTE");

  if (isGuest) {
    payload.esInvitado = true;
  }

  const validationError = validateCheckoutPayload(payload);
  if (validationError) {
    logger.warn("Checkout validation failed (business logic)", { validationError, requestId, userId: auth?.userId });
    return NextResponse.json({ ok: false, message: validationError }, { status: 400 });
  }

  logger.info("Checkout started", {
    requestId,
    isGuest,
    isPromoExpress,
    userId: auth?.userId ?? "invitado",
    itemsCount: payload.items.length,
    paymentMethod: payload.paymentMethod
  });

  // Sincronizar carrito remoto únicamente en flujo clásico autenticado.
  // En Promo Express enviamos items directamente para no borrar el carrito BD si la reserva de 10 min expira.
  if (!isGuest && auth && !isPromoExpress) {
    const syncResult = await syncRemoteCart(auth, payload.items, { requestId });
    if (!syncResult.ok) {
      logger.error("Checkout cart sync failed", { 
        phase: syncResult.phase, 
        status: syncResult.result?.response.status,
        requestId, 
        userId: auth.userId 
      });
      const errorData = parseJsonRecord(syncResult.result?.data);
      const itemName = "item" in syncResult && syncResult.item ? (syncResult.item as { nombre: string }).nombre : "el producto";
      const msg = syncResult.phase === "clear"
        ? extractErrorMessage(errorData, "No pude sincronizar tu carrito con el sistema central.")
        : extractErrorMessage(errorData, `No pude agregar ${itemName} al carrito del sistema central.`);
      return NextResponse.json({ ok: false, message: msg }, { status: syncResult.result?.response.status ?? 502 });
    }
  }

  try {
    const canonicalCheckoutPayload = buildCanonicalCheckoutPayload(payload);
    const legacyCheckoutPayload = buildLegacyCheckoutPayload(payload);

    const checkoutAttempts = isPromoExpress
      ? [
          {
            path: "/pedidos/checkout",
            method: "POST",
            body: JSON.stringify(canonicalCheckoutPayload),
          },
        ]
      : [
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
        ];

    const result = await fetchCentralJson(
      checkoutAttempts,
      isGuest ? null : auth,
      { requestId }
    );

    const data = parseJsonRecord(result.data);
    if (!result.response.ok) {
      logger.error("Checkout API submission failed", { 
        status: result.response.status, 
        requestId, 
        userId: auth?.userId ?? "invitado",
        error: data
      });
      return NextResponse.json(
        {
          ok: false,
          code: typeof data?.code === "string" ? data.code : null,
          message: extractErrorMessage(
            data,
            !isGuest && !auth?.accessToken
              ? "Tu sesion actual no tiene el token del backend. Cierra sesion e inicia de nuevo para finalizar la compra."
              : "No pude registrar tu pedido en este momento. Intenta nuevamente."
          ),
        },
        { status: result.response.status }
      );
    }

    const { orderId, orderNumber } = extractOrderInfo(data);
    const pedidoRecord = parseJsonRecord(data?.pedido) ?? parseJsonRecord(data?.order);
    const readNumber = (...values: unknown[]): number | null => {
      for (const value of values) {
        if (typeof value === "number" && Number.isFinite(value)) return value;
      }
      return null;
    };

    const backendSubtotal = readNumber(pedidoRecord?.subtotal, data?.subtotal);
    const backendCostoEnvio = readNumber(pedidoRecord?.costoEnvio, data?.costoEnvio);
    const backendTotal = readNumber(pedidoRecord?.total, data?.total);
    const backendDescuento = readNumber(pedidoRecord?.descuento, data?.descuento);
    const backendDescuentoCatalogo = readNumber(pedidoRecord?.descuentoCatalogo, data?.descuentoCatalogo);
    const backendDescuentoPromociones = readNumber(pedidoRecord?.descuentoPromociones, data?.descuentoPromociones);
    const backendDescuentoEnvio = readNumber(pedidoRecord?.descuentoEnvio, data?.descuentoEnvio);
    const expiresAt =
      (typeof data?.expiresAt === "string" && data.expiresAt.trim()) ||
      (typeof pedidoRecord?.reservaExpiraEn === "string" && pedidoRecord.reservaExpiraEn.trim()) ||
      null;
    const reservationToken =
      typeof data?.reservationToken === "string" && data.reservationToken.trim()
        ? data.reservationToken.trim()
        : null;
    const appliedCupon =
      (typeof pedidoRecord?.cuponCodigo === "string" && pedidoRecord.cuponCodigo.trim()) ||
      (typeof payload.cuponCodigo === "string" && payload.cuponCodigo.trim().toUpperCase()) ||
      null;
    const fallbackTotal = payload.items.reduce((sum, item) => sum + item.precio * item.cantidad, 0);
    const total = backendTotal ?? fallbackTotal;
    const customerDisplayName = isGuest
      ? payload.clienteInvitado?.nombreCompleto || payload.delivery.recipientName || "Cliente"
      : auth?.fullname ?? "Cliente FitAndes";
    const customerEmail = isGuest
      ? payload.clienteInvitado?.email || undefined
      : auth?.email ?? undefined;

    const whatsappUrl =
      !isPromoExpress && payload.delivery.method === "WHATSAPP"
        ? buildWhatsappUrl({
            customerName: customerDisplayName,
            customerEmail,
            items: payload.items,
            delivery: payload.delivery,
            total,
            descuento: backendDescuento,
            cuponCodigo: appliedCupon,
            orderNumber: orderNumber ?? undefined,
          })
        : null;

    let paymentId: string | null = (data && typeof data === "object" && "paymentId" in data && typeof data.paymentId === "string") ? data.paymentId : null;
    let warning: string | null = null;

    if (payload.paymentMethod === "QR" && orderId && !paymentId && auth) {
      const paymentSetup = await createQrPayment(auth, orderId, { requestId });
      paymentId = paymentSetup.paymentId;
      warning = paymentSetup.warning;

      if (!paymentId) {
        logger.warn("Checkout payment setup warning", { warning, requestId, orderId });
      }
    }

    logger.info("Checkout successful", { 
      requestId, 
      userId: auth?.userId ?? "invitado", 
      orderId, 
      orderNumber, 
      hasPayment: !!paymentId,
      isPromoExpress
    });

    return NextResponse.json({
      ok: true,
      orderId,
      orderNumber,
      paymentId,
      expiresAt,
      reservationToken,
      receiptRequired: payload.paymentMethod === "QR",
      whatsappUrl,
      subtotal: backendSubtotal,
      costoEnvio: backendCostoEnvio,
      total,
      descuento: backendDescuento,
      descuentoCatalogo: backendDescuentoCatalogo,
      descuentoPromociones: backendDescuentoPromociones,
      descuentoEnvio: backendDescuentoEnvio,
      cuponCodigo: appliedCupon,
      warning,
      message:
        payload.paymentMethod === "QR"
          ? "Pedido registrado. El siguiente paso es subir tu comprobante QR."
          : "Pedido registrado correctamente.",
    });
  } catch (error) {
    logger.error("Checkout process critical failure", { error, requestId, userId: auth?.userId });
    return NextResponse.json(
      {
        ok: false,
        message: "No pude conectar con la API principal para guardar el pedido.",
      },
      { status: 502 }
    );
  }
}
