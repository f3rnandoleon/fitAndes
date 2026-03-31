export interface PedidoItem {
  _id?: string;
  nombre?: string | null;
  color?: string | null;
  talla?: string | null;
  cantidad: number;
  precioVenta: number;
}

export interface PedidoDelivery {
  method?: "WHATSAPP" | "PICKUP_LAPAZ" | "HOME_DELIVERY" | null;
  pickupPoint?: "TELEFERICO_MORADO" | "TELEFERICO_ROJO" | "CORREOS" | null;
  address?: string | null;
  phone?: string | null;
}

export interface Pedido {
  _id: string;
  numeroVenta: string;
  createdAt: string;
  estado: string;
  total?: number;
  subtotal?: number;
  descuento?: number;
  metodoPago?: string;
  items?: PedidoItem[];
  delivery?: PedidoDelivery | null;
}
