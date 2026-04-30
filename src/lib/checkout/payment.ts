import { CentralApiAuth, parseJsonRecord } from "@/lib/central-api";
import { fetchCentralJson } from "@/lib/central-client";
import { extractPaymentId } from "@/lib/adapters/payments.adapter";
import { extractErrorMessage } from "@/lib/adapters/orders.adapter";

/**
 * Creates a QR payment for a given order in the central system.
 * Uses an idempotency key based on the order ID to prevent duplicates.
 */
export async function createQrPayment(
  auth: CentralApiAuth, 
  orderId: string, 
  options?: { requestId?: string }
) {
  const requestId = options?.requestId;
  
  const canonicalBody = {
    pedidoId: orderId,
    metodoPago: "QR",
    idempotencyKey: `checkout-${orderId}`,
  };

  const legacyBody = {
    orderId,
    metodoPago: "QR",
    idempotencyKey: `checkout-${orderId}`,
  };

  const result = await fetchCentralJson(
    [
      { path: "/pagos", method: "POST", body: JSON.stringify(canonicalBody) },
      { path: "/pagos", method: "POST", body: JSON.stringify(legacyBody) },
      { path: "/payments", method: "POST", body: JSON.stringify(legacyBody) },
    ],
    auth,
    { requestId }
  );

  const data = parseJsonRecord(result.data);
  const paymentId = extractPaymentId(data);
  
  if (result.response.ok || paymentId) {
    return {
      ok: true as const,
      paymentId,
      warning: result.response.ok ? null : extractErrorMessage(data, "No pude recuperar la transaccion QR existente."),
    };
  }

  return {
    ok: false as const,
    paymentId: null,
    warning: extractErrorMessage(data, "El pedido se creo, pero no pude preparar el pago QR."),
  };
}
