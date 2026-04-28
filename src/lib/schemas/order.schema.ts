import { z } from "zod";

const deliveryMethodSchema = z.enum(["WHATSAPP", "PICKUP_POINT", "SHIPPING_NATIONAL"]);

const orderDeliveryPatchSchema = z
  .object({
    metodo: deliveryMethodSchema.optional(),
    method: deliveryMethodSchema.optional(),
    direccion: z.string().trim().max(300).optional(),
    address: z.string().trim().max(300).optional(),
    puntoRecojo: z.string().trim().max(160).optional(),
    telefono: z.string().trim().max(40).optional(),
    phone: z.string().trim().max(40).optional(),
    nombreDestinatario: z.string().trim().max(160).optional(),
    recipientName: z.string().trim().max(160).optional(),
    programadoPara: z.string().trim().max(120).optional(),
    scheduledAt: z.string().trim().max(120).optional(),
    departamento: z.string().trim().max(120).optional(),
    department: z.string().trim().max(120).optional(),
    ciudad: z.string().trim().max(120).optional(),
    city: z.string().trim().max(120).optional(),
    empresaEnvio: z.string().trim().max(120).optional(),
    shippingCompany: z.string().trim().max(120).optional(),
    sucursal: z.string().trim().max(160).optional(),
    branch: z.string().trim().max(160).optional(),
    nombreRemitente: z.string().trim().max(160).optional(),
    senderName: z.string().trim().max(160).optional(),
    ciRemitente: z.string().trim().max(60).optional(),
    senderCI: z.string().trim().max(60).optional(),
    telefonoRemitente: z.string().trim().max(40).optional(),
    senderPhone: z.string().trim().max(40).optional(),
  })
  .refine(
    (value) => Object.values(value).some((item) => item !== undefined),
    "Debes enviar al menos un dato de entrega.",
  );

export const orderPatchSchema = z
  .object({
    estadoPedido: z.string().trim().min(1).max(60).optional(),
    orderStatus: z.string().trim().min(1).max(60).optional(),
    entrega: orderDeliveryPatchSchema.optional(),
    delivery: orderDeliveryPatchSchema.optional(),
    deliverySnapshot: orderDeliveryPatchSchema.optional(),
  })
  .refine(
    (value) =>
      Boolean(value.estadoPedido || value.orderStatus || value.entrega || value.delivery || value.deliverySnapshot),
    "Debes enviar al menos un cambio para el pedido.",
  );

export type OrderPatchInput = z.infer<typeof orderPatchSchema>;
