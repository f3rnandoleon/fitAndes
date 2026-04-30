import { DeliveryMethod, PaymentMethod } from "./checkout";

export interface CanonicalDelivery {
  metodo: DeliveryMethod;
  direccion?: string;
  telefono?: string;
  nombreDestinatario?: string;
  programadoPara?: string;
  departamento?: string;
  ciudad?: string;
  empresaEnvio?: string;
  sucursal?: string;
  nombreRemitente?: string;
  ciRemitente?: string;
  telefonoRemitente?: string;
}

export interface CanonicalOrderPatchPayload {
  estadoPedido?: string;
  entrega?: CanonicalDelivery;
}

export interface CanonicalOrderItem {
  productoId: string;
  varianteId?: string;
  color: string;
  colorSecundario?: string;
  talla: string;
  cantidad: number;
}

export interface CanonicalCheckoutPayload {
  metodoPago: PaymentMethod;
  entrega: CanonicalDelivery;
  notas?: string;
}
