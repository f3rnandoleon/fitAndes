import { parseJsonRecord, readString } from "@/lib/central-api";
import { DeliveryMethod } from "@/types/checkout";
import { CanonicalCustomerContext } from "@/types/canonical-customer";

export function normalizeCustomerContext(data: Record<string, unknown> | null): CanonicalCustomerContext {
  const user = parseJsonRecord(data?.user);
  const profile = parseJsonRecord(data?.profile);
  const defaultAddress = parseJsonRecord(data?.defaultAddress);
  const defaultDeliveryMethod = readString(profile, "metodoEntregaPredeterminado", "defaultDeliveryMethod") as DeliveryMethod | null;

  return {
    user: user
      ? {
          fullname: readString(user, "nombreCompleto", "fullname"),
          email: readString(user, "email"),
        }
      : null,
    profile: profile
      ? {
          phone: readString(profile, "telefono", "phone"),
          defaultDeliveryMethod,
          notes: readString(profile, "notas", "notes"),
        }
      : null,
    defaultAddress: defaultAddress
      ? {
          recipientName: readString(defaultAddress, "nombreDestinatario", "recipientName"),
          phone: readString(defaultAddress, "telefono", "phone"),
          department: readString(defaultAddress, "departamento", "department"),
          city: readString(defaultAddress, "ciudad", "city"),
          zone: readString(defaultAddress, "zona", "zone"),
          addressLine: readString(defaultAddress, "direccion", "addressLine"),
          reference: readString(defaultAddress, "referencia", "reference"),
        }
      : null,
  };
}
