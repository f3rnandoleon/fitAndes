import { z } from "zod";

const attachmentSchema = z.object({
  name: z.string().trim().min(1).max(120).optional(),
  mimeType: z.string().trim().startsWith("image/", { message: "Solo se permiten imagenes adjuntas." }),
  data: z
    .string()
    .min(1, "La imagen adjunta no puede estar vacia.")
    .max(8_000_000, "La imagen adjunta es demasiado grande."),
});

export const chatRequestSchema = z.object({
  message: z.string().trim().min(1, "El mensaje es obligatorio.").max(2000, "El mensaje es demasiado largo."),
  sessionId: z.string().trim().min(1).max(120).optional(),
  memory: z.unknown().nullable().optional(),
  attachments: z.array(attachmentSchema).max(1, "Solo se permite una imagen por mensaje.").optional(),
});

export type ChatRequestInput = z.infer<typeof chatRequestSchema>;
