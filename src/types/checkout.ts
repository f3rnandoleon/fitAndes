export const DELIVERY_METHODS = ["WHATSAPP", "PICKUP_POINT", "SHIPPING_NATIONAL"] as const;

export const PAYMENT_METHODS = ["EFECTIVO", "QR"] as const;

export type DeliveryMethod = (typeof DELIVERY_METHODS)[number];
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export interface PickupPointOption {
  id: string;
  name: string;
  costoBOB?: number;
  costoEstimadoBOB?: number;
}

export interface PickupScheduleOption {
  id: string;
  day: string;
  start: string;
  end: string;
  label: string;
}

export interface ShippingDepartmentOption {
  name: string;
  branches: string[];
  modalidadCobro?: string;
  costoEstimadoBOB?: number;
  tiempoEstimadoHoras?: string;
}

export interface ShippingCompanyOption {
  id: string;
  name: string;
  modalidadCobro?: string;
  costoEstimadoBOB?: number;
  tiempoEstimadoHoras?: string;
  departments: ShippingDepartmentOption[];
}

export interface ShippingPolicy {
  nationalFlatFee?: number;
  currency?: string;
  estimatedTime?: string | null;
}

export interface DeliveryOptionsConfig {
  pickupPoints: PickupPointOption[];
  pickupSchedules: PickupScheduleOption[];
  shippingCompanies: ShippingCompanyOption[];
  shippingPolicy?: ShippingPolicy;
}

export interface CheckoutItemInput {
  id: string;
  productoId?: string;
  variantId?: string | null;
  nombre: string;
  modelo?: string;
  imagen?: string | null;
  color: string;
  colorSecundario?: string | null;
  talla: string;
  cantidad: number;
  precio: number;
  stockDisponible: number;
}

export interface CheckoutDeliveryInput {
  method: DeliveryMethod;
  address?: string;
  phone?: string;
  recipientName?: string;
  scheduledAt?: string;
  department?: string;
  city?: string;
  shippingCompany?: string;
  branch?: string;
  senderName?: string;
  senderCI?: string;
  senderPhone?: string;
}

export interface ClienteInvitadoInput {
  nombreCompleto: string;
  telefono: string;
  email?: string;
  ci?: string;
}

export interface CheckoutSubmitPayload {
  items: CheckoutItemInput[];
  paymentMethod: PaymentMethod;
  delivery: CheckoutDeliveryInput;
  notes?: string;
  esInvitado?: boolean;
  clienteInvitado?: ClienteInvitadoInput;
}

export interface CheckoutSubmitResponse {
  ok: boolean;
  orderId?: string | null;
  orderNumber?: string | null;
  paymentId?: string | null;
  receiptRequired?: boolean;
  whatsappUrl?: string | null;
  message?: string;
  warning?: string | null;
}

export interface CheckoutCustomerContext {
  user: {
    fullname?: string | null;
    email?: string | null;
  } | null;
  profile: {
    phone?: string | null;
    defaultDeliveryMethod?: DeliveryMethod | null;
    notes?: string | null;
  } | null;
  defaultAddress: {
    recipientName?: string | null;
    phone?: string | null;
    department?: string | null;
    city?: string | null;
    zone?: string | null;
    addressLine?: string | null;
    reference?: string | null;
  } | null;
}

export interface CheckoutBootstrapResponse extends CheckoutCustomerContext {
  deliveryOptions: DeliveryOptionsConfig | null;
}
