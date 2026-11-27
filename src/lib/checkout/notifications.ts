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
  descuento,
  cuponCodigo,
  orderNumber,
}: {
  customerName?: string;
  customerEmail?: string;
  items: CheckoutItemInput[];
  delivery: CheckoutDeliveryInput;
  total: number;
  descuento?: number | null;
  cuponCodigo?: string | null;
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

  if (cuponCodigo) {
    lines.push("", `Cupón aplicado: ${cuponCodigo}`);
  }
  if (typeof descuento === "number" && descuento > 0) {
    lines.push(`Descuento: -${formatPrice(descuento)}`);
  }

  lines.push("", `Total: ${formatPrice(total)}`);

  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(lines.join("\n"))}`;
}

/**
 * Builds a detailed WhatsApp URL for Promo Express orders after QR receipt upload.
 */
export function buildPromoExpressWhatsappUrl({
  orderNumber,
  customerName,
  customerPhone,
  isLaPaz,
  department,
  items,
  subtotal,
  descuentoTotal,
  cuponCodigo,
  costoEnvio,
  descuentoEnvio,
  total,
}: {
  orderNumber?: string | null;
  customerName: string;
  customerPhone: string;
  isLaPaz: boolean;
  department: string;
  items: CheckoutItemInput[];
  subtotal: number;
  descuentoTotal?: number;
  cuponCodigo?: string | null;
  costoEnvio: number;
  descuentoEnvio?: number;
  total: number;
}): string {
  const netShipping = Math.max(0, costoEnvio - (descuentoEnvio ?? 0));
  const locationLabel = isLaPaz
    ? "La Paz (Entrega por coordinar)"
    : `Envío departamental a ${department}`;

  const lines: string[] = [
    "¡Hola FitAndes! Acabo de realizar mi pedido y subir mi comprobante de pago QR para coordinar la entrega:",
    "",
    `Pedido: ${orderNumber || "Confirmado en web"}`,
    `Nombre: ${customerName}`,
    `Celular: ${customerPhone}`,
    `Ubicación: ${locationLabel}`,
    "",
    "Detalle de prendas:",
  ];

  items.forEach((item, index) => {
    lines.push(
      `${index + 1}. ${item.nombre}${item.modelo ? ` (${item.modelo})` : ""}`,
      `   Color: ${item.color}${item.colorSecundario ? ` / ${item.colorSecundario}` : ""} | Talla: ${item.talla} | Cant: ${item.cantidad}`,
      `   Subtotal: ${formatPrice(item.cantidad * item.precio)}`
    );
  });

  lines.push("", "Resumen de pago:");
  lines.push(`Subtotal prendas: ${formatPrice(subtotal)}`);

  if (cuponCodigo) {
    lines.push(`Cupón aplicado: ${cuponCodigo}`);
  }
  if (typeof descuentoTotal === "number" && descuentoTotal > 0) {
    lines.push(`Descuento aplicado: -${formatPrice(descuentoTotal)}`);
  }

  if (isLaPaz) {
    lines.push("Envío: Gratis (La Paz)");
  } else if (netShipping === 0 && costoEnvio > 0) {
    lines.push(`Envío a ${department}: Gratis (promo aplicada)`);
  } else {
    lines.push(`Envío a ${department}: ${formatPrice(netShipping)}`);
  }

  lines.push(`Total pagado por QR: ${formatPrice(total)}`);
  lines.push("", "Quedo atento(a) para coordinar la entrega/envío. ¡Gracias!");

  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(lines.join("\n"))}`;
}
