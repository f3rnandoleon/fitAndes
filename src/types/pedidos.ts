export interface PedidoItemProductSnapshot {
  nombre?: string | null;
  modelo?: string | null;
  sku?: string | null;
  imagen?: string | null;
}

export interface PedidoItemVariantSnapshot {
  variantId?: string | null;
  codigoBarra?: string | null;
  qrCode?: string | null;
  color?: string | null;
  colorSecundario?: string | null;
  talla?: string | null;
}

export interface PedidoItem {
  _id?: string;
  productoId?: string | null;
  variantId?: string | null;
  nombre?: string | null;
  color?: string | null;
  colorSecundario?: string | null;
  talla?: string | null;
  cantidad: number;
  precioVenta?: number | null;
  precioUnitario?: number | null;
  productoSnapshot?: PedidoItemProductSnapshot | null;
  variante?: PedidoItemVariantSnapshot | null;
}

export interface PedidoDelivery {
  method?: "WHATSAPP" | "PICKUP_LAPAZ" | "HOME_DELIVERY" | "PICKUP_POINT" | "SHIPPING_NATIONAL" | null;
  pickupPoint?: "TELEFERICO_MORADO" | "TELEFERICO_ROJO" | "CORREOS" | string | null;
  address?: string | null;
  phone?: string | null;
  department?: string | null;
  city?: string | null;
  shippingCompany?: string | null;
  branch?: string | null;
  recipientName?: string | null;
  senderName?: string | null;
  senderCI?: string | null;
  senderPhone?: string | null;
  scheduledAt?: string | null;
}

export interface PedidoTotales {
  subtotal?: number | null;
  descuento?: number | null;
  impuesto?: number | null;
  total?: number | null;
}

export interface Pedido {
  _id: string;
  id?: string;
  numeroVenta?: string | null;
  numeroPedido?: string | null;
  orderNumber?: string | null;
  sourceSaleNumber?: string | null;
  createdAt: string;
  estado?: string | null;
  orderStatus?: string | null;
  paymentStatus?: string | null;
  fulfillmentStatus?: string | null;
  stockReservationStatus?: string | null;
  total?: number | null;
  subtotal?: number | null;
  descuento?: number | null;
  metodoPago?: string | null;
  items?: PedidoItem[];
  delivery?: PedidoDelivery | null;
  deliverySnapshot?: PedidoDelivery | null;
  totales?: PedidoTotales | null;
}

const CLIENT_ORDER_EDIT_WINDOW_MS = 30 * 60 * 1000;

export function getPedidoSubtotal(pedido: Pedido): number {
  if (typeof pedido.subtotal === "number") return pedido.subtotal;
  if (typeof pedido.totales?.subtotal === "number") return pedido.totales.subtotal;
  return 0;
}

export function getPedidoDescuento(pedido: Pedido): number {
  if (typeof pedido.descuento === "number") return pedido.descuento;
  if (typeof pedido.totales?.descuento === "number") return pedido.totales.descuento;
  return 0;
}

export function getPedidoTotal(pedido: Pedido): number {
  if (typeof pedido.total === "number") return pedido.total;
  if (typeof pedido.totales?.total === "number") return pedido.totales.total;
  return getPedidoSubtotal(pedido) - getPedidoDescuento(pedido);
}

export function getPedidoNumero(pedido: Pedido): string {
  return pedido.orderNumber ?? pedido.numeroPedido ?? pedido.numeroVenta ?? pedido.sourceSaleNumber ?? pedido._id;
}

export function getPedidoEstado(pedido: Pedido): string {
  if (pedido.orderStatus === "DELIVERED") return "ENTREGADO";
  if (pedido.orderStatus === "IN_TRANSIT") return "EN CAMINO";
  if (pedido.orderStatus === "READY") return "LISTO";
  if (pedido.orderStatus === "PREPARING") return "PREPARANDO";
  if (pedido.orderStatus === "CONFIRMED") return "CONFIRMADO";
  if (pedido.orderStatus === "CANCELLED") return "CANCELADO";

  if (pedido.paymentStatus === "FAILED") return "PAGO FALLIDO";
  if (pedido.paymentStatus === "REFUNDED") return "REEMBOLSADO";
  if (pedido.paymentStatus === "PAID") return "PAGADO";
  if (pedido.paymentStatus === "PENDING") return "PENDIENTE DE PAGO";

  return pedido.estado ?? "PENDIENTE";
}

export function getPedidoEstadoTone(pedido: Pedido): "success" | "warning" | "danger" | "neutral" | "accent" {
  if (pedido.orderStatus === "DELIVERED" || pedido.paymentStatus === "PAID" || pedido.estado === "PAGADA") {
    return "success";
  }

  if (pedido.orderStatus === "CONFIRMED" || pedido.orderStatus === "PREPARING" || pedido.orderStatus === "READY" || pedido.orderStatus === "IN_TRANSIT") {
    return "accent";
  }

  if (pedido.orderStatus === "CANCELLED" || pedido.paymentStatus === "FAILED" || pedido.paymentStatus === "REFUNDED" || pedido.estado === "CANCELADA") {
    return "danger";
  }

  if (pedido.orderStatus === "PENDING_PAYMENT" || pedido.paymentStatus === "PENDING" || pedido.estado === "PENDIENTE") {
    return "warning";
  }

  return "neutral";
}

export function getPedidoMetodoPago(pedido: Pedido): string | null {
  return pedido.metodoPago ?? null;
}

export function getPedidoDelivery(pedido: Pedido): PedidoDelivery | null {
  return pedido.deliverySnapshot ?? pedido.delivery ?? null;
}

export function getPedidoItemPrecioUnitario(item: PedidoItem): number {
  if (typeof item.precioUnitario === "number") return item.precioUnitario;
  if (typeof item.precioVenta === "number") return item.precioVenta;
  return 0;
}

export function getPedidoItemNombre(item: PedidoItem): string {
  return item.nombre ?? item.productoSnapshot?.nombre ?? "Producto";
}

export function getPedidoItemModelo(item: PedidoItem): string | null {
  return item.productoSnapshot?.modelo ?? null;
}

export function getPedidoItemColor(item: PedidoItem): string | null {
  return item.color ?? item.variante?.color ?? null;
}

export function getPedidoItemTalla(item: PedidoItem): string | null {
  return item.talla ?? item.variante?.talla ?? null;
}

export function getPedidoItemColorSecundario(item: PedidoItem): string | null {
  return item.colorSecundario ?? item.variante?.colorSecundario ?? null;
}

export function getPedidoClientEditDeadline(pedido: Pedido): Date | null {
  const createdAt = new Date(pedido.createdAt);
  if (!Number.isFinite(createdAt.getTime())) return null;
  return new Date(createdAt.getTime() + CLIENT_ORDER_EDIT_WINDOW_MS);
}

export function getPedidoClientEditRemainingMs(pedido: Pedido, now = Date.now()): number {
  const deadline = getPedidoClientEditDeadline(pedido);
  if (!deadline) return 0;
  return Math.max(0, deadline.getTime() - now);
}

export function canPedidoBeEditedByClient(pedido: Pedido, now = Date.now()): boolean {
  return pedido.orderStatus === "PENDING_PAYMENT" && getPedidoClientEditRemainingMs(pedido, now) > 0;
}

export function canPedidoBeCancelledByClient(pedido: Pedido, now = Date.now()): boolean {
  return canPedidoBeEditedByClient(pedido, now);
}
