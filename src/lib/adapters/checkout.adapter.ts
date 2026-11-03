import { CheckoutDeliveryInput, CheckoutSubmitPayload } from "@/types/checkout";
import { CanonicalCheckoutPayload, CanonicalDelivery } from "@/types/canonical-order";

function normalizePhone(phone?: string) {
  return (phone ?? "").replace(/\D/g, "").trim();
}

function compactText(value?: string | null) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

export function buildCanonicalDeliveryPayload(delivery: CheckoutDeliveryInput): CanonicalDelivery {
  if (delivery.method === "WHATSAPP") {
    return { metodo: "WHATSAPP" };
  }

  if (delivery.method === "PICKUP_POINT") {
    return {
      metodo: "PICKUP_POINT",
      direccion: compactText(delivery.address),
      telefono: normalizePhone(delivery.phone),
      nombreDestinatario: compactText(delivery.recipientName),
      programadoPara: compactText(delivery.scheduledAt),
    };
  }

  return {
    metodo: "SHIPPING_NATIONAL",
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

export function buildLegacyDeliveryPayload(delivery: CheckoutDeliveryInput) {
  if (delivery.method === "WHATSAPP") {
    return { method: "WHATSAPP" };
  }

  if (delivery.method === "PICKUP_POINT") {
    return {
      method: "PICKUP_POINT",
      address: compactText(delivery.address),
      phone: normalizePhone(delivery.phone),
      recipientName: compactText(delivery.recipientName),
      scheduledAt: compactText(delivery.scheduledAt),
    };
  }

  return {
    method: "SHIPPING_NATIONAL",
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

export function buildCanonicalCheckoutPayload(payload: CheckoutSubmitPayload): CanonicalCheckoutPayload {
  const base: CanonicalCheckoutPayload = {
    metodoPago: payload.paymentMethod,
    entrega: buildCanonicalDeliveryPayload(payload.delivery),
    notas: compactText(payload.notes),
  };

  if (payload.esInvitado) {
    base.esInvitado = true;
    base.clienteInvitado = payload.clienteInvitado;
    base.items = payload.items.map((item) => ({
      productoId: item.productoId || item.id,
      variantId: item.variantId ?? undefined,
      color: item.color,
      talla: item.talla,
      cantidad: item.cantidad,
      precio: item.precio,
    }));
  }

  return base;
}

export interface LegacyCheckoutPayload {
  metodoPago: CheckoutSubmitPayload["paymentMethod"];
  delivery: ReturnType<typeof buildLegacyDeliveryPayload>;
  notes?: string;
  esInvitado?: boolean;
  clienteInvitado?: CheckoutSubmitPayload["clienteInvitado"];
  items?: CheckoutSubmitPayload["items"];
}

export function buildLegacyCheckoutPayload(payload: CheckoutSubmitPayload): LegacyCheckoutPayload {
  const base: LegacyCheckoutPayload = {
    metodoPago: payload.paymentMethod,
    delivery: buildLegacyDeliveryPayload(payload.delivery),
    notes: compactText(payload.notes),
  };

  if (payload.esInvitado) {
    base.esInvitado = true;
    base.clienteInvitado = payload.clienteInvitado;
    base.items = payload.items;
  }

  return base;
}
