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
  precioVenta: number;
  productoSnapshot?: PedidoItemProductSnapshot | null;
  variante?: PedidoItemVariantSnapshot | null;
}

export interface PedidoDelivery {
  method?: "WHATSAPP" | "PICKUP_LAPAZ" | "HOME_DELIVERY" | null;
  pickupPoint?: "TELEFERICO_MORADO" | "TELEFERICO_ROJO" | "CORREOS" | null;
  address?: string | null;
  phone?: string | null;
}

export interface PedidoTotales {
  subtotal?: number | null;
  descuento?: number | null;
  impuesto?: number | null;
  total?: number | null;
}

export interface Pedido {
  _id: string;
  numeroVenta: string;
  createdAt: string;
  estado: string;
  total?: number | null;
  subtotal?: number | null;
  descuento?: number | null;
  metodoPago?: string | null;
  items?: PedidoItem[];
  delivery?: PedidoDelivery | null;
  totales?: PedidoTotales | null;
}

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
