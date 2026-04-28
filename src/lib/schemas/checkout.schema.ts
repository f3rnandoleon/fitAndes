import { z } from "zod";
import { DELIVERY_METHODS, PAYMENT_METHODS } from "@/types/checkout";

const deliveryMethodEnum = z.enum(DELIVERY_METHODS);
const paymentMethodEnum = z.enum(PAYMENT_METHODS);

export const checkoutItemSchema = z.object({
  id: z.string().trim().min(1),
  productoId: z.string().trim().min(1, "Cada item debe tener productoId."),
  variantId: z.string().trim().min(1).nullable().optional(),
  nombre: z.string().trim().min(1),
  modelo: z.string().trim().max(160).optional(),
  imagen: z.string().trim().url().nullable().optional().or(z.literal("").transform(() => null)),
  color: z.string().trim().min(1),
  colorSecundario: z.string().trim().min(1).nullable().optional(),
  talla: z.string().trim().min(1),
  cantidad: z.number().int().min(1).max(1000),
  precio: z.number().nonnegative(),
  stockDisponible: z.number().int().min(0),
});

export const checkoutDeliverySchema = z.object({
  method: deliveryMethodEnum,
  address: z.string().trim().max(300).optional(),
  phone: z.string().trim().max(40).optional(),
  recipientName: z.string().trim().max(160).optional(),
  scheduledAt: z.string().trim().max(120).optional(),
  department: z.string().trim().max(120).optional(),
  city: z.string().trim().max(120).optional(),
  shippingCompany: z.string().trim().max(120).optional(),
  branch: z.string().trim().max(160).optional(),
  senderName: z.string().trim().max(160).optional(),
  senderCI: z.string().trim().max(60).optional(),
  senderPhone: z.string().trim().max(40).optional(),
});

export const checkoutPayloadSchema = z.object({
  items: z.array(checkoutItemSchema).min(1, "Debes enviar al menos un producto."),
  paymentMethod: paymentMethodEnum,
  delivery: checkoutDeliverySchema,
  notes: z.string().trim().max(300, "Las observaciones no pueden superar los 300 caracteres.").optional(),
});

export type CheckoutPayloadInput = z.infer<typeof checkoutPayloadSchema>;
