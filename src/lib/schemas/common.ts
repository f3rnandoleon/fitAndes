import { z } from "zod";

export const nonEmptyTrimmedString = z.string().trim().min(1);

export function firstZodIssueMessage(error: z.ZodError, fallback = "Datos invalidos") {
  return error.issues[0]?.message ?? fallback;
}

export function safeOptionalTrimmedString(maxLength?: number) {
  let schema = z.string().trim();

  if (typeof maxLength === "number") {
    schema = schema.max(maxLength);
  }

  return schema.optional();
}
