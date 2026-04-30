import { CheckoutSubmitPayload } from "@/types/checkout";
import { normalizePhone, compactText } from "@/lib/text";

/**
 * Validates the checkout payload for business logic rules.
 * Returns an error message string if invalid, or null if valid.
 */
export function validateCheckoutPayload(payload: CheckoutSubmitPayload): string | null {
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
    (item) => !item.productoId || !item.color || !item.talla || !Number.isInteger(item.cantidad) || item.cantidad < 1
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
