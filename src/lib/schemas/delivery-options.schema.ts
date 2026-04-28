import { z } from "zod";

const pickupPointSchema = z.object({
  id: z.string().trim().min(1, "Cada punto de recojo debe tener id."),
  name: z.string().trim().min(1, "Cada punto de recojo debe tener nombre."),
});

const pickupScheduleSchema = z.object({
  id: z.string().trim().min(1),
  day: z.string().trim().min(1),
  start: z.string().trim().regex(/^\d{2}:\d{2}$/, "Hora de inicio invalida."),
  end: z.string().trim().regex(/^\d{2}:\d{2}$/, "Hora de fin invalida."),
  label: z.string().trim().min(1),
});

const shippingDepartmentSchema = z.object({
  name: z.string().trim().min(1),
  branches: z.array(z.string().trim().min(1)).min(1, "Cada departamento debe tener al menos una sucursal."),
});

const shippingCompanySchema = z.object({
  id: z.string().trim().min(1),
  name: z.string().trim().min(1),
  departments: z.array(shippingDepartmentSchema),
});

export const deliveryOptionsSchema = z.object({
  pickupPoints: z.array(pickupPointSchema),
  pickupSchedules: z.array(pickupScheduleSchema),
  shippingCompanies: z.array(shippingCompanySchema),
});

export type DeliveryOptionsInput = z.infer<typeof deliveryOptionsSchema>;
