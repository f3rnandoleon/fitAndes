import { parseJsonRecord, readString } from "@/lib/central-api";

export function extractPaymentId(data: Record<string, unknown> | null) {
  const payment = parseJsonRecord(data?.pago) ?? parseJsonRecord(data?.payment) ?? data;
  return readString(payment, "_id", "id") ?? readString(data, "paymentId", "pagoId");
}
