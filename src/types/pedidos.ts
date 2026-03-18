export interface PedidoItem {
  _id?: string;
  nombre?: string | null;
  color?: string | null;
  talla?: string | null;
  cantidad: number;
  precioVenta: number;
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
}
