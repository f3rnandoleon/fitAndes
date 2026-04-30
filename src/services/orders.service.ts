import type { CentralApiAuth } from "@/lib/central-api";
import { fetchCentralJson } from "@/lib/central-client";
import { parsePedidoArray, parsePedidoDetail } from "@/lib/adapters/orders.adapter";
import type { Pedido } from "@/types/pedidos";
import { logger } from "@/lib/logger";
import { getRequestId } from "@/lib/request-context";

async function fetchOrders(auth: CentralApiAuth): Promise<Pedido[] | null> {
  const result = await fetchCentralJson(
    [
      { path: "/pedidos" },
      { path: "/orders" },
      { path: "/mis-pedidos" },
    ],
    auth,
    { timeoutMs: 10000, requestId: await getRequestId() }
  );

  if (!result.response.ok) {
    logger.error("Fetch orders failed", { status: result.response.status, userId: auth.userId });
    return null;
  }
  return parsePedidoArray(result.data);
}

async function fetchOrder(auth: CentralApiAuth, orderId: string): Promise<Pedido | null | undefined> {
  const result = await fetchCentralJson(
    [
      { path: `/pedidos/${orderId}` },
      { path: `/orders/${orderId}` },
      { path: `/mis-pedidos/${orderId}` },
    ],
    auth,
    { timeoutMs: 10000, requestId: await getRequestId() }
  );

  if (result.response.status === 404 || result.response.status === 400) return null;
  if (!result.response.ok) {
    logger.error("Fetch order detail failed", { status: result.response.status, orderId, userId: auth.userId });
    return undefined;
  }
  return parsePedidoDetail(result.data);
}

export async function getOrders(auth: CentralApiAuth | null): Promise<Pedido[] | null> {
  if (!auth?.userId) return [];

  try {
    return await fetchOrders(auth);
  } catch {
    return null;
  }
}

export async function getOrderDetail(auth: CentralApiAuth | null, orderId: string): Promise<Pedido | null | undefined> {
  if (!auth?.userId || !orderId) return null;

  try {
    return await fetchOrder(auth, orderId);
  } catch {
    return undefined;
  }
}
