import { CheckoutDeliveryInput, CheckoutItemInput } from "@/types/checkout";
import { formatPrice } from "@/lib/format";
import { WHATSAPP_NUMBER } from "@/lib/constants";

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
}: {
  customerName?: string;
  customerEmail?: string;
  items: CheckoutItemInput[];
  delivery: CheckoutDeliveryInput;
  total: number;
  orderNumber?: string;
}): string {
  const lines: string[] = [
    "Hola, acabo de registrar un pedido en FitAndes:",
    "",
    `Pedido: ${orderNumber ?? "Pendiente de confirmacion"}`,
    `Cliente: ${customerName ?? "Cliente FitAndes"}`,
    customerEmail ? `Correo: ${customerEmail}` : "",
    `Entrega: ${getDeliveryLabel(delivery)}`,
  ].filter(Boolean);

  if (delivery.phone) {
    lines.push(`Telefono: ${delivery.phone}`);
  }

  if (delivery.address && delivery.method !== "PICKUP_POINT") {
    lines.push(`Direccion: ${delivery.address}`);
  }

  if (delivery.department && delivery.method === "SHIPPING_NATIONAL") {
    lines.push(
      `Departamento: ${delivery.department}`,
      delivery.shippingCompany ? `Empresa: ${delivery.shippingCompany}` : "",
      delivery.branch ? `Sucursal: ${delivery.branch}` : "",
      delivery.senderName ? `Destinatario: ${delivery.senderName}` : "",
      delivery.senderCI ? `CI: ${delivery.senderCI}` : "",
      delivery.senderPhone ? `Celular destinatario: ${delivery.senderPhone}` : ""
    );
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
