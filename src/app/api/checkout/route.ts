import { NextResponse, type NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { getToken } from "next-auth/jwt";
import { authOptions } from "@/lib/auth-options";
import {
  buildCentralApiHeaders,
  CENTRAL_API_URL,
  fetchCentralApiWithFallback,
  parseJsonRecord,
  readString,
  type CentralApiRole,
} from "@/lib/central-api";
import type {
  CheckoutCustomerContext,
  CheckoutDeliveryInput,
  CheckoutItemInput,
  CheckoutSubmitPayload,
  DeliveryMethod,
} from "@/types/checkout";
import { checkoutPayloadSchema } from "@/lib/schemas/checkout.schema";
import { firstZodIssueMessage } from "@/lib/schemas/common";

const WHATSAPP_NUMBER = process.env.WHATSAPP_NUMBER ?? "59176574068";

type CheckoutAuth = {
  id: string;
  role: CentralApiRole;
  fullname?: string | null;
  email?: string | null;
  accessToken?: string | null;
};

type JsonRecord = Record<string, unknown>;

type CentralJsonAttempt = {
  path: string;
  method?: string;
  body?: BodyInit | null;
  headers?: HeadersInit;
};

function normalizePhone(phone?: string) {
  return (phone ?? "").replace(/\D/g, "").trim();
}

function compactText(value?: string | null) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

function formatMoney(value: number) {
  return new Intl.NumberFormat("es-BO", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

async function getCheckoutAuth(request: NextRequest): Promise<CheckoutAuth | null> {
  const session = await getServerSession(authOptions);

  if (session?.user?.id && session.user.role) {
    return {
      id: session.user.id,
      role: session.user.role,
      fullname: session.user.fullname,
      email: session.user.email,
      accessToken: session.accessToken ?? null,
    };
  }

  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });

  if (!token || typeof token.id !== "string" || typeof token.role !== "string") {
    return null;
  }

  return {
    id: token.id,
    role: token.role as CentralApiRole,
    fullname: typeof token.fullname === "string" ? token.fullname : null,
    email: typeof token.email === "string" ? token.email : null,
    accessToken: typeof token.accessToken === "string" ? token.accessToken : null,
  };
}

async function fetchCentralJson(attempts: CentralJsonAttempt[], auth: CheckoutAuth) {
  return fetchCentralApiWithFallback(
    attempts.map((attempt) => {
      const body = attempt.body ?? undefined;
      const headers = new Headers(
        buildCentralApiHeaders(
          {
            userId: auth.id,
            role: auth.role,
            accessToken: auth.accessToken,
          },
          { includeJsonContentType: typeof body === "string" },
        ),
      );

      new Headers(attempt.headers ?? undefined).forEach((value, key) => {
        headers.set(key, value);
      });

      return {
        path: attempt.path,
        init: {
          method: attempt.method ?? "GET",
          headers,
          body,
        },
      };
    }),
  );
}

function firstValidationMessage(data: JsonRecord | null) {
  const errors = data?.errors;
  if (!Array.isArray(errors)) return null;

  const firstError = errors.find((error) => error && typeof error === "object") as { message?: unknown } | undefined;
  return typeof firstError?.message === "string" ? firstError.message : null;
}

function extractErrorMessage(data: JsonRecord | null, fallback: string) {
  return (
    firstValidationMessage(data) ||
    (typeof data?.message === "string" ? data.message : null) ||
    (typeof data?.error === "string" ? data.error : null) ||
    fallback
  );
}

function deliveryLabel(delivery: CheckoutDeliveryInput) {
  if (delivery.method === "WHATSAPP") return "Coordinacion por WhatsApp";

  if (delivery.method === "PICKUP_POINT") {
    return [delivery.recipientName, delivery.address, delivery.scheduledAt].filter(Boolean).join(" - ") || "Punto de encuentro";
  }

  const destination = [delivery.department, delivery.city].filter(Boolean).join(", ");
  const carrier = [delivery.shippingCompany, delivery.branch].filter(Boolean).join(" - ");
  return [destination, carrier].filter(Boolean).join(" / ") || "Envio nacional";
}

function buildWhatsappUrl({
  customerName,
  customerEmail,
  items,
  delivery,
  total,
  orderNumber,
  notes,
}: {
  customerName: string;
  customerEmail: string;
  items: CheckoutItemInput[];
  delivery: CheckoutDeliveryInput;
  total: number;
  orderNumber?: string | null;
  notes?: string | null;
}) {
  const lines = [
    "Hola FitAndes, quiero confirmar este pedido web:",
    orderNumber ? `Pedido: ${orderNumber}` : "Pedido: nuevo registro web",
    "",
    `Cliente: ${customerName}`,
    `Correo: ${customerEmail}`,
    `Entrega: ${deliveryLabel(delivery)}`,
  ];

  if (delivery.phone) {
    lines.push(`Celular de contacto: ${delivery.phone}`);
  }

  if (delivery.senderPhone) {
    lines.push(`Celular remitente: ${delivery.senderPhone}`);
  }

  if (notes) {
    lines.push(`Observaciones: ${notes}`);
  }

  lines.push("", "Productos:");

  items.forEach((item, index) => {
    lines.push(
      `${index + 1}. ${item.nombre}${item.modelo ? ` / ${item.modelo}` : ""}`,
      `   Variante: ${item.color}${item.colorSecundario ? ` / ${item.colorSecundario}` : ""} / ${item.talla}`,
      `   Cantidad: ${item.cantidad}`,
      `   Subtotal: Bs. ${formatMoney(item.cantidad * item.precio)}`,
    );
  });

  lines.push("", `Total: Bs. ${formatMoney(total)}`);

  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(lines.join("\n"))}`;
}

function validatePayload(payload: CheckoutSubmitPayload) {
  if (!payload || !Array.isArray(payload.items) || payload.items.length === 0) {
    return "No hay productos para registrar.";
  }

  if (!payload.delivery || !["WHATSAPP", "PICKUP_POINT", "SHIPPING_NATIONAL"].includes(payload.delivery.method)) {
    return "Selecciona un metodo de entrega valido.";
  }

  if (!["EFECTIVO", "QR"].includes(payload.paymentMethod)) {
    return "Selecciona un metodo de pago valido.";
  }

  const invalidItem = payload.items.find(
    (item) => !item.productoId || !item.color || !item.talla || !Number.isInteger(item.cantidad) || item.cantidad < 1,
  );

  if (invalidItem) {
    return "Hay un producto sin datos suficientes para generar el pedido.";
  }

  if (payload.notes && payload.notes.trim().length > 300) {
    return "Las observaciones no pueden superar los 300 caracteres.";
  }

  if (payload.delivery.method === "PICKUP_POINT") {
    if (!compactText(payload.delivery.address)) {
      return "Ingresa el punto de encuentro o direccion de referencia.";
    }

    if (normalizePhone(payload.delivery.phone).length < 8) {
      return "Ingresa un celular valido para coordinar la entrega.";
    }
  }

  if (payload.delivery.method === "SHIPPING_NATIONAL") {
    if (payload.paymentMethod !== "QR") {
      return "El envio nacional solo esta disponible con pago QR.";
    }

    if (!compactText(payload.delivery.department) || !compactText(payload.delivery.shippingCompany) || !compactText(payload.delivery.senderName)) {
      return "Completa departamento, empresa de envio y nombre del remitente.";
    }

    if (!compactText(payload.delivery.senderCI)) {
      return "Ingresa el CI del remitente.";
    }

    if (normalizePhone(payload.delivery.senderPhone).length < 8) {
      return "Ingresa un celular valido del remitente.";
    }
  }

  return null;
}

function buildCanonicalDeliveryPayload(delivery: CheckoutDeliveryInput) {
  if (delivery.method === "WHATSAPP") {
    return { metodo: "WHATSAPP" as const };
  }

  if (delivery.method === "PICKUP_POINT") {
    return {
      metodo: "PICKUP_POINT" as const,
      direccion: compactText(delivery.address),
      telefono: normalizePhone(delivery.phone),
      nombreDestinatario: compactText(delivery.recipientName),
      programadoPara: compactText(delivery.scheduledAt),
    };
  }

  return {
    metodo: "SHIPPING_NATIONAL" as const,
    departamento: compactText(delivery.department),
    ciudad: compactText(delivery.city),
    empresaEnvio: compactText(delivery.shippingCompany),
    sucursal: compactText(delivery.branch),
    nombreDestinatario: compactText(delivery.recipientName),
    nombreRemitente: compactText(delivery.senderName),
    ciRemitente: compactText(delivery.senderCI),
    telefonoRemitente: normalizePhone(delivery.senderPhone),
  };
}

function buildLegacyDeliveryPayload(delivery: CheckoutDeliveryInput) {
  if (delivery.method === "WHATSAPP") {
    return { method: "WHATSAPP" as const };
  }

  if (delivery.method === "PICKUP_POINT") {
    return {
      method: "PICKUP_POINT" as const,
      address: compactText(delivery.address),
      phone: normalizePhone(delivery.phone),
      recipientName: compactText(delivery.recipientName),
      scheduledAt: compactText(delivery.scheduledAt),
    };
  }

  return {
    method: "SHIPPING_NATIONAL" as const,
    department: compactText(delivery.department),
    city: compactText(delivery.city),
    shippingCompany: compactText(delivery.shippingCompany),
    branch: compactText(delivery.branch),
    recipientName: compactText(delivery.recipientName),
    senderName: compactText(delivery.senderName),
    senderCI: compactText(delivery.senderCI),
    senderPhone: normalizePhone(delivery.senderPhone),
  };
}

function buildCanonicalCheckoutPayload(payload: CheckoutSubmitPayload) {
  return {
    metodoPago: payload.paymentMethod,
    entrega: buildCanonicalDeliveryPayload(payload.delivery),
    notas: compactText(payload.notes),
  };
}

function buildLegacyCheckoutPayload(payload: CheckoutSubmitPayload) {
  return {
    metodoPago: payload.paymentMethod,
    delivery: buildLegacyDeliveryPayload(payload.delivery),
    notes: compactText(payload.notes),
  };
}

async function syncRemoteCart(auth: CheckoutAuth, items: CheckoutItemInput[]) {
  const clearCartResult = await fetchCentralApiWithFallback([
    {
      path: "/carrito",
      init: {
        method: "DELETE",
        headers: buildCentralApiHeaders({ userId: auth.id, role: auth.role, accessToken: auth.accessToken }),
      },
    },
    {
      path: "/cart",
      init: {
        method: "DELETE",
        headers: buildCentralApiHeaders({ userId: auth.id, role: auth.role, accessToken: auth.accessToken }),
      },
    },
  ]);

  if (!clearCartResult.response.ok) {
    const data = parseJsonRecord(clearCartResult.data);
    return {
      ok: false as const,
      status: clearCartResult.response.status,
      message: extractErrorMessage(data, "No pude sincronizar tu carrito con el sistema central."),
    };
  }

  for (const item of items) {
    const headers = buildCentralApiHeaders(
      { userId: auth.id, role: auth.role, accessToken: auth.accessToken },
      { includeJsonContentType: true },
    );

    const canonicalItemBody = {
      productoId: item.productoId,
      varianteId: item.variantId ?? undefined,
      color: item.color,
      colorSecundario: item.colorSecundario ?? undefined,
      talla: item.talla,
      cantidad: item.cantidad,
    };

    const legacyItemBody = {
      productoId: item.productoId,
      variantId: item.variantId ?? undefined,
      color: item.color,
      colorSecundario: item.colorSecundario ?? undefined,
      talla: item.talla,
      cantidad: item.cantidad,
    };

    const addItemResult = await fetchCentralApiWithFallback([
      {
        path: "/carrito/items",
        init: {
          method: "POST",
          headers,
          body: JSON.stringify(canonicalItemBody),
        },
      },
      {
        path: "/carrito/items",
        init: {
          method: "POST",
          headers,
          body: JSON.stringify(legacyItemBody),
        },
      },
      {
        path: "/cart/items",
        init: {
          method: "POST",
          headers,
          body: JSON.stringify(legacyItemBody),
        },
      },
    ]);

    if (!addItemResult.response.ok) {
      const data = parseJsonRecord(addItemResult.data);
      return {
        ok: false as const,
        status: addItemResult.response.status,
        message: extractErrorMessage(data, `No pude agregar ${item.nombre} al carrito del sistema central.`),
      };
    }
  }

  return { ok: true as const };
}

function extractOrderInfo(data: JsonRecord | null) {
  const order = parseJsonRecord(data?.pedido) ?? parseJsonRecord(data?.order) ?? data;

  return {
    orderId: readString(order, "_id", "id") ?? readString(data, "orderId", "pedidoId"),
    orderNumber:
      readString(order, "numeroPedido", "orderNumber", "numeroVenta") ??
      readString(data, "orderNumber", "numeroPedido"),
  };
}

function extractPaymentId(data: JsonRecord | null) {
  const payment = parseJsonRecord(data?.pago) ?? parseJsonRecord(data?.payment) ?? data;
  return readString(payment, "_id", "id") ?? readString(data, "paymentId", "pagoId");
}

async function createQrPayment(auth: CheckoutAuth, orderId: string) {
  const canonicalBody = {
    pedidoId: orderId,
    metodoPago: "QR",
    idempotencyKey: `checkout-${orderId}`,
  };

  const legacyBody = {
    orderId,
    metodoPago: "QR",
    idempotencyKey: `checkout-${orderId}`,
  };

  const result = await fetchCentralJson(
    [
      { path: "/pagos", method: "POST", body: JSON.stringify(canonicalBody) },
      { path: "/pagos", method: "POST", body: JSON.stringify(legacyBody) },
      { path: "/payments", method: "POST", body: JSON.stringify(legacyBody) },
    ],
    auth,
  );

  const data = parseJsonRecord(result.data);
  const paymentId = extractPaymentId(data);
  if (result.response.ok || paymentId) {
    return {
      ok: true as const,
      paymentId,
      warning: result.response.ok ? null : extractErrorMessage(data, "No pude recuperar la transaccion QR existente."),
    };
  }

  return {
    ok: false as const,
    paymentId: null,
    warning: extractErrorMessage(data, "El pedido se creo, pero no pude preparar el pago QR."),
  };
}

function normalizeCheckoutContext(data: JsonRecord | null): CheckoutCustomerContext {
  const user = parseJsonRecord(data?.user);
  const profile = parseJsonRecord(data?.profile);
  const defaultAddress = parseJsonRecord(data?.defaultAddress);
  const defaultDeliveryMethod = readString(profile, "metodoEntregaPredeterminado", "defaultDeliveryMethod") as DeliveryMethod | null;

  return {
    user: user
      ? {
          fullname: readString(user, "nombreCompleto", "fullname"),
          email: readString(user, "email"),
        }
      : null,
    profile: profile
      ? {
          phone: readString(profile, "telefono", "phone"),
          defaultDeliveryMethod,
          notes: readString(profile, "notas", "notes"),
        }
      : null,
    defaultAddress: defaultAddress
      ? {
          recipientName: readString(defaultAddress, "nombreDestinatario", "recipientName"),
          phone: readString(defaultAddress, "telefono", "phone"),
          department: readString(defaultAddress, "departamento", "department"),
          city: readString(defaultAddress, "ciudad", "city"),
          zone: readString(defaultAddress, "zona", "zone"),
          addressLine: readString(defaultAddress, "direccion", "addressLine"),
          reference: readString(defaultAddress, "referencia", "reference"),
        }
      : null,
  };
}

export async function GET(request: NextRequest) {
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
    );

    const data = parseJsonRecord(result.data);
    if (!result.response.ok) {
      return NextResponse.json(
        { message: extractErrorMessage(data, "No pude cargar tus datos de cliente.") },
        { status: result.response.status },
      );
    }

    return NextResponse.json(normalizeCheckoutContext(data));
  } catch {
    return NextResponse.json({ message: "No pude consultar tu perfil de cliente." }, { status: 502 });
  }
}

export async function POST(request: NextRequest) {
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
    return NextResponse.json({ ok: false, message: firstZodIssueMessage(parsedPayload.error) }, { status: 400 });
  }

  const payload: CheckoutSubmitPayload = parsedPayload.data;

  const validationError = validatePayload(payload);
  if (validationError) {
    return NextResponse.json({ ok: false, message: validationError }, { status: 400 });
  }

  const syncResult = await syncRemoteCart(auth, payload.items);
  if (!syncResult.ok) {
    return NextResponse.json({ ok: false, message: syncResult.message }, { status: syncResult.status });
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
    );

    const data = parseJsonRecord(result.data);
    if (!result.response.ok) {
      return NextResponse.json(
        {
          ok: false,
          message: extractErrorMessage(
            data,
            !auth.accessToken
              ? "Tu sesion actual no tiene el token del backend. Cierra sesion e inicia de nuevo para finalizar la compra."
              : "No pude registrar tu pedido en este momento. Intenta nuevamente.",
          ),
        },
        { status: result.response.status },
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
      const paymentSetup = await createQrPayment(auth, orderId);
      paymentId = paymentSetup.paymentId;
      warning = paymentSetup.warning;
    }

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
  } catch {
    return NextResponse.json(
      {
        ok: false,
        message: "No pude conectar con la API principal para guardar el pedido.",
      },
      { status: 502 },
    );
  }
}
