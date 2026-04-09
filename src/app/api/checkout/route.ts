import { NextResponse, type NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { getToken } from "next-auth/jwt";
import { authOptions } from "@/lib/auth-options";
import { buildCentralApiHeaders, type CentralApiRole } from "@/lib/central-api";
import type { CheckoutDeliveryInput, CheckoutItemInput, CheckoutSubmitPayload } from "@/types/checkout";

const API_URL = process.env.NEXT_PUBLIC_API_URL;
const WHATSAPP_NUMBER = "59176574068";

type CheckoutAuth = {
  id: string;
  role: CentralApiRole;
  fullname?: string | null;
  email?: string | null;
  accessToken?: string | null;
};

function normalizePhone(phone?: string) {
  return (phone ?? "").replace(/\D/g, "").trim();
}

function formatMoney(value: number) {
  return new Intl.NumberFormat("es-BO", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

function readSaleTotal(saleData: Record<string, unknown> | null): number | null {
  if (!saleData) return null;

  const totales = saleData.totales;
  if (!totales || typeof totales !== "object") return null;

  const total = (totales as { total?: unknown }).total;
  return typeof total === "number" ? total : null;
}

function deliveryLabel(delivery: CheckoutDeliveryInput) {
  if (delivery.method === "WHATSAPP") return "Coordinacion por WhatsApp";

  if (delivery.method === "PICKUP_LAPAZ") {
    const labels: Record<string, string> = {
      TELEFERICO_MORADO: "Teleferico Morado (Faro Murillo, Obelisco)",
      TELEFERICO_ROJO: "Teleferico Rojo (Estacion Central, 16 de Julio)",
      CORREOS: "Correos",
    };

    return labels[delivery.pickupPoint ?? ""] ?? "Entrega en La Paz";
  }

  return "Entrega en casa";
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

function buildWhatsappUrl({
  customerName,
  customerEmail,
  items,
  paymentMethod,
  delivery,
  total,
  orderNumber,
}: {
  customerName: string;
  customerEmail: string;
  items: CheckoutItemInput[];
  paymentMethod: string;
  delivery: CheckoutDeliveryInput;
  total: number;
  orderNumber?: string | null;
}) {
  const lines = [
    "Hola FitAndes, quiero confirmar este pedido web:",
    orderNumber ? `Pedido: ${orderNumber}` : "Pedido: nuevo registro web",
    "",
    `Cliente: ${customerName}`,
    `Correo: ${customerEmail}`,
    `Metodo de pago: ${paymentMethod}`,
    `Entrega: ${deliveryLabel(delivery)}`,
  ];

  if (delivery.phone) {
    lines.push(`Celular de contacto: ${delivery.phone}`);
  }

  if (delivery.method === "HOME_DELIVERY" && delivery.address) {
    lines.push(`Direccion: ${delivery.address}`);
  }

  lines.push("", "Productos:");

  items.forEach((item, index) => {
    lines.push(
      `${index + 1}. ${item.nombre}${item.modelo ? ` / ${item.modelo}` : ""}`,
      `   Variante: ${item.color} / ${item.talla}`,
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

  if (!payload.delivery || !["WHATSAPP", "PICKUP_LAPAZ", "HOME_DELIVERY"].includes(payload.delivery.method)) {
    return "Selecciona un metodo de entrega valido.";
  }

  if (!["EFECTIVO", "QR"].includes(payload.paymentMethod)) {
    return "Selecciona un metodo de pago valido.";
  }

  const invalidItem = payload.items.find(
    (item) => !item.productoId || !item.color || !item.talla || item.cantidad < 1,
  );

  if (invalidItem) {
    return "Hay un producto sin datos suficientes para generar el pedido.";
  }

  if (payload.delivery.method === "PICKUP_LAPAZ") {
    if (!payload.delivery.pickupPoint) {
      return "Selecciona un punto de entrega en La Paz.";
    }

    if (normalizePhone(payload.delivery.phone).length < 8) {
      return "Ingresa un celular valido para coordinar la entrega.";
    }
  }

  if (payload.delivery.method === "HOME_DELIVERY") {
    if (!payload.delivery.address?.trim()) {
      return "Ingresa la direccion exacta de entrega.";
    }

    if (normalizePhone(payload.delivery.phone).length < 8) {
      return "Ingresa un celular valido para la entrega en casa.";
    }
  }

  return null;
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

  const salePayload = {
    items: payload.items.map((item) => ({
      productoId: item.productoId,
      variantId: item.variantId ?? undefined,
      color: item.color,
      talla: item.talla,
      cantidad: item.cantidad,
    })),
    metodoPago: payload.paymentMethod,
    tipoVenta: "WEB",
    descuento: 0,
    delivery: {
      method: payload.delivery.method,
      pickupPoint: payload.delivery.method === "PICKUP_LAPAZ" ? payload.delivery.pickupPoint ?? null : null,
      address: payload.delivery.method === "HOME_DELIVERY" ? payload.delivery.address?.trim() ?? "" : null,
      phone:
        payload.delivery.method === "PICKUP_LAPAZ" || payload.delivery.method === "HOME_DELIVERY"
          ? normalizePhone(payload.delivery.phone)
          : null,
    },
  };

  try {
    const saleResponse = await fetch(`${API_URL}/ventas`, {
      method: "POST",
      headers: buildCentralApiHeaders(
        {
          userId: auth.id,
          role: auth.role,
          accessToken: auth.accessToken,
        },
        { includeJsonContentType: true },
      ),
      body: JSON.stringify(salePayload),
      cache: "no-store",
    });

    const rawText = await saleResponse.text();
    let saleData: Record<string, unknown> | null = null;

    if (rawText) {
      try {
        saleData = JSON.parse(rawText) as Record<string, unknown>;
      } catch {
        saleData = { message: rawText };
      }
    }

    if (!saleResponse.ok) {
      const validationErrors = Array.isArray(saleData?.errors) ? saleData.errors : [];
      const firstValidationMessage = validationErrors.find(
        (error): error is { message?: string } => Boolean(error && typeof error === "object"),
      )?.message;
      const message =
        firstValidationMessage ||
        (typeof saleData?.message === "string" && saleData.message) ||
        (typeof saleData?.error === "string" && saleData.error) ||
        (!auth.accessToken
          ? "Tu sesion actual no tiene el token del backend. Cierra sesion e inicia de nuevo para finalizar la compra."
          : "No pude registrar tu pedido en este momento. Intenta nuevamente.");

      return NextResponse.json({ ok: false, message }, { status: saleResponse.status });
    }

    const total = readSaleTotal(saleData) ?? payload.items.reduce((sum, item) => sum + item.precio * item.cantidad, 0);
    const orderId = (typeof saleData?._id === "string" && saleData._id) || (typeof saleData?.id === "string" && saleData.id) || null;
    const orderNumber = (typeof saleData?.numeroVenta === "string" && saleData.numeroVenta) || null;
    const whatsappUrl =
      payload.delivery.method === "WHATSAPP"
        ? buildWhatsappUrl({
            customerName: auth.fullname ?? "Cliente FitAndes",
            customerEmail: auth.email ?? "-",
            items: payload.items,
            paymentMethod: payload.paymentMethod,
            delivery: payload.delivery,
            total,
            orderNumber,
          })
        : null;

    return NextResponse.json({
      ok: true,
      orderId,
      orderNumber,
      whatsappUrl,
      message: "Pedido registrado correctamente.",
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
