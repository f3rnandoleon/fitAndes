import { CheckoutDeliveryInput, CheckoutItemInput } from "@/types/checkout";
import { formatPrice } from "@/lib/format";

const WHATSAPP_NUMBER = process.env.WHATSAPP_NUMBER ?? "59176574068";

/**
 * Generates a human-readable label for the delivery method.
 */
export function getDeliveryLabel(delivery: CheckoutDeliveryInput): string {
  if (delivery.method === "WHATSAPP") return "Coordinacion por WhatsApp";

  if (delivery.method === "PICKUP_POINT") {
    return [delivery.recipientName, delivery.address, delivery.scheduledAt].filter(Boolean).join(" - ") || "Punto de encuentro";
  }

  const destination = [delivery.department, delivery.city].filter(Boolean).join(", ");
  const carrier = [delivery.shippingCompany, delivery.branch].filter(Boolean).join(" - ");
  return [destination, carrier].filter(Boolean).join(" / ") || "Envio nacional";
}

/**
 * Builds a WhatsApp URL with the order details for customer confirmation.
 */
export function buildWhatsappUrl({
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
}): string {
  const lines = [
    "Hola FitAndes, quiero confirmar este pedido web:",
    orderNumber ? `Pedido: ${orderNumber}` : "Pedido: nuevo registro web",
    "",
    `Cliente: ${customerName}`,
    `Correo: ${customerEmail}`,
    `Entrega: ${getDeliveryLabel(delivery)}`,
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
      `   Subtotal: ${formatPrice(item.cantidad * item.precio)}`
    );
  });

  lines.push("", `Total: ${formatPrice(total)}`);

  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(lines.join("\n"))}`;
}
