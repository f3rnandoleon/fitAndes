import { DeliveryMethod } from "./checkout";

export interface CanonicalCustomerContext {
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
