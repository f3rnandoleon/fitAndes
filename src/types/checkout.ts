export const DELIVERY_METHODS = ["WHATSAPP", "PICKUP_LAPAZ", "HOME_DELIVERY"] as const;

export const PICKUP_POINTS = ["TELEFERICO_MORADO", "TELEFERICO_ROJO", "CORREOS"] as const;

export const PAYMENT_METHODS = ["EFECTIVO", "QR"] as const;

export type DeliveryMethod = (typeof DELIVERY_METHODS)[number];
export type PickupPoint = (typeof PICKUP_POINTS)[number];
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export interface CheckoutItemInput {
  id: string;
  productoId?: string;
  variantId?: string | null;
  nombre: string;
  modelo?: string;
  imagen?: string | null;
  color: string;
  talla: string;
  cantidad: number;
  precio: number;
  stockDisponible: number;
}

export interface CheckoutDeliveryInput {
  method: DeliveryMethod;
  pickupPoint?: PickupPoint | null;
  phone?: string;
  address?: string;
}

export interface CheckoutSubmitPayload {
  items: CheckoutItemInput[];
  paymentMethod: PaymentMethod;
  delivery: CheckoutDeliveryInput;
}

export interface CheckoutSubmitResponse {
  ok: boolean;
  orderId?: string | null;
  orderNumber?: string | null;
  whatsappUrl?: string | null;
  message?: string;
}
