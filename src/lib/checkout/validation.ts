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
    return "Selecciona un método de entrega válido.";
  }

  if (!["EFECTIVO", "QR"].includes(payload.paymentMethod)) {
    return "Selecciona un método de pago válido.";
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

  // Validación de datos para compra como invitado
  if (payload.esInvitado) {
    if (!payload.clienteInvitado || !compactText(payload.clienteInvitado.nombreCompleto)) {
      return "Ingresa tu nombre completo para continuar.";
    }
    if (!payload.clienteInvitado.telefono || normalizePhone(payload.clienteInvitado.telefono).length < 7) {
      return "Ingresa un número de celular de contacto válido.";
    }
  }

  if (payload.delivery.method === "PICKUP_POINT") {
    if (!compactText(payload.delivery.address)) {
      return "Ingresa el punto de encuentro o dirección de referencia.";
    }

    if (normalizePhone(payload.delivery.phone).length < 7) {
      return "Ingresa un celular válido para coordinar la entrega.";
    }
  }

  if (payload.delivery.method === "SHIPPING_NATIONAL") {
    if (payload.paymentMethod !== "QR") {
      return "El envío nacional solo está disponible con pago QR.";
    }

    if (
      !compactText(payload.delivery.department) ||
      !compactText(payload.delivery.shippingCompany)
    ) {
      return "Completa departamento y empresa de envío de la encomienda.";
    }

    if (!compactText(payload.delivery.senderCI) && (!payload.esInvitado || !compactText(payload.clienteInvitado?.ci))) {
      return "Ingresa el CI del destinatario para el despacho.";
    }

    const celDestinatario = payload.delivery.senderPhone || payload.clienteInvitado?.telefono;
    if (normalizePhone(celDestinatario).length < 7) {
      return "Ingresa un celular válido del destinatario.";
    }
  }

  return null;
}
