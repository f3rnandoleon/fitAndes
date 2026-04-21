import { NextResponse, type NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { getToken } from "next-auth/jwt";
import { authOptions } from "@/lib/auth-options";
import { buildCentralApiHeaders, type CentralApiRole } from "@/lib/central-api";
import type {
  CheckoutCustomerContext,
  CheckoutDeliveryInput,
  CheckoutItemInput,
  CheckoutSubmitPayload,
  DeliveryMethod,
} from "@/types/checkout";

const API_URL = process.env.NEXT_PUBLIC_API_URL;
const WHATSAPP_NUMBER = "59176574068";

type CheckoutAuth = {
  id: string;
  role: CentralApiRole;
  fullname?: string | null;
  email?: string | null;
  accessToken?: string | null;
};

type JsonRecord = Record<string, unknown>;

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

function parseJsonRecord(data: unknown): JsonRecord | null {
  return data && typeof data === "object" ? (data as JsonRecord) : null;
}

function readString(source: JsonRecord | null, key: string): string | null {
  const value = source?.[key];
  return typeof value === "string" && value ? value : null;
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

async function fetchCentralJson(path: string, init: RequestInit, auth: CheckoutAuth) {
  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      ...buildCentralApiHeaders(
        {
          userId: auth.id,
          role: auth.role,
          accessToken: auth.accessToken,
        },
        { includeJsonContentType: init.body ? true : false },
      ),
      ...(init.headers ?? {}),
    },
    cache: "no-store",
  });

  const data = await response.json().catch(() => null);
  return { response, data: parseJsonRecord(data) };
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

async function syncRemoteCart(auth: CheckoutAuth, items: CheckoutItemInput[]) {
  const clearCart = await fetch(`${API_URL}/cart`, {
    method: "DELETE",
    headers: buildCentralApiHeaders({ userId: auth.id, role: auth.role, accessToken: auth.accessToken }),
    cache: "no-store",
  });

  if (!clearCart.ok) {
    const data = parseJsonRecord(await clearCart.json().catch(() => null));
    return {
      ok: false,
      status: clearCart.status,
      message: extractErrorMessage(data, "No pude sincronizar tu carrito con el sistema central."),
    };
  }

  for (const item of items) {
    const addItem = await fetch(`${API_URL}/cart/items`, {
      method: "POST",
      headers: buildCentralApiHeaders(
        {
          userId: auth.id,
          role: auth.role,
          accessToken: auth.accessToken,
        },
        { includeJsonContentType: true },
      ),
      body: JSON.stringify({
        productoId: item.productoId,
        variantId: item.variantId ?? undefined,
        color: item.color,
        colorSecundario: item.colorSecundario ?? undefined,
        talla: item.talla,
        cantidad: item.cantidad,
      }),
      cache: "no-store",
    });

    if (!addItem.ok) {
      const data = parseJsonRecord(await addItem.json().catch(() => null));
      return {
        ok: false,
        status: addItem.status,
        message: extractErrorMessage(data, `No pude agregar ${item.nombre} al carrito del sistema central.`),
      };
    }
  }

  return { ok: true as const };
}

function buildOrderCheckoutPayload(payload: CheckoutSubmitPayload) {
  const notes = compactText(payload.notes);

  if (payload.delivery.method === "WHATSAPP") {
    return {
      metodoPago: payload.paymentMethod,
      delivery: { method: "WHATSAPP" },
      notes,
    };
  }

  if (payload.delivery.method === "PICKUP_POINT") {
    return {
      metodoPago: payload.paymentMethod,
      delivery: {
        method: "PICKUP_POINT",
        address: compactText(payload.delivery.address),
        phone: normalizePhone(payload.delivery.phone),
        recipientName: compactText(payload.delivery.recipientName),
        scheduledAt: compactText(payload.delivery.scheduledAt),
      },
      notes,
    };
  }

  return {
    metodoPago: payload.paymentMethod,
    delivery: {
      method: "SHIPPING_NATIONAL",
      department: compactText(payload.delivery.department),
      city: compactText(payload.delivery.city),
      shippingCompany: compactText(payload.delivery.shippingCompany),
      branch: compactText(payload.delivery.branch),
      recipientName: compactText(payload.delivery.recipientName),
      senderName: compactText(payload.delivery.senderName),
      senderCI: compactText(payload.delivery.senderCI),
      senderPhone: normalizePhone(payload.delivery.senderPhone),
    },
    notes,
  };
}

function extractOrderInfo(data: JsonRecord | null) {
  const order = parseJsonRecord(data?.order) ?? data;

  return {
    orderId: readString(order, "_id") ?? readString(order, "id") ?? readString(data, "orderId"),
    orderNumber:
      readString(order, "orderNumber") ??
      readString(order, "numeroPedido") ??
      readString(order, "numeroVenta") ??
      readString(data, "orderNumber"),
  };
}

function extractPaymentId(data: JsonRecord | null) {
  const payment = parseJsonRecord(data?.payment) ?? data;
  return readString(payment, "_id") ?? readString(payment, "id") ?? readString(data, "paymentId");
}

async function createQrPayment(auth: CheckoutAuth, orderId: string) {
  const { response, data } = await fetchCentralJson(
    "/payments",
    {
      method: "POST",
      body: JSON.stringify({
        orderId,
        metodoPago: "QR",
        idempotencyKey: `checkout-${orderId}`,
      }),
    },
    auth,
  );

  const paymentId = extractPaymentId(data);
  if (response.ok || paymentId) {
    return {
      ok: true as const,
      paymentId,
      warning: response.ok ? null : extractErrorMessage(data, "No pude recuperar la transaccion QR existente."),
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
  const defaultDeliveryMethod = readString(profile, "defaultDeliveryMethod") as DeliveryMethod | null;

  return {
    user: user
      ? {
          fullname: readString(user, "fullname"),
          email: readString(user, "email"),
        }
      : null,
    profile: profile
      ? {
          phone: readString(profile, "phone"),
          defaultDeliveryMethod,
          notes: readString(profile, "notes"),
        }
      : null,
    defaultAddress: defaultAddress
      ? {
          recipientName: readString(defaultAddress, "recipientName"),
          phone: readString(defaultAddress, "phone"),
          department: readString(defaultAddress, "department"),
          city: readString(defaultAddress, "city"),
          zone: readString(defaultAddress, "zone"),
          addressLine: readString(defaultAddress, "addressLine"),
          reference: readString(defaultAddress, "reference"),
        }
      : null,
  };
}

export async function GET(request: NextRequest) {
  const auth = await getCheckoutAuth(request);

  if (!auth || auth.role !== "CLIENTE") {
    return NextResponse.json({ message: "Debes iniciar sesion para continuar." }, { status: 401 });
  }

  if (!API_URL) {
    return NextResponse.json({ message: "La API principal no esta configurada." }, { status: 500 });
  }

  try {
    const { response, data } = await fetchCentralJson("/customers/me", { method: "GET" }, auth);

    if (!response.ok) {
      return NextResponse.json(
        { message: extractErrorMessage(data, "No pude cargar tus datos de cliente.") },
        { status: response.status },
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

  if (!API_URL) {
    return NextResponse.json({ ok: false, message: "La API principal no esta configurada." }, { status: 500 });
  }

  let payload: CheckoutSubmitPayload;

  try {
    payload = (await request.json()) as CheckoutSubmitPayload;
  } catch {
    return NextResponse.json({ ok: false, message: "No pude leer los datos del checkout." }, { status: 400 });
  }

  const validationError = validatePayload(payload);
  if (validationError) {
    return NextResponse.json({ ok: false, message: validationError }, { status: 400 });
  }

  const syncResult = await syncRemoteCart(auth, payload.items);
  if (!syncResult.ok) {
    return NextResponse.json({ ok: false, message: syncResult.message }, { status: syncResult.status });
  }

  try {
    const { response, data } = await fetchCentralJson(
      "/orders/checkout",
      {
        method: "POST",
        body: JSON.stringify(buildOrderCheckoutPayload(payload)),
      },
      auth,
    );

    if (!response.ok) {
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
        { status: response.status },
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
