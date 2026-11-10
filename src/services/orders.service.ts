import type { CentralApiAuth } from "@/lib/central-api";
import { fetchCentralJson } from "@/lib/central-client";
import { parsePedidoArray, parsePedidoDetail } from "@/lib/adapters/orders.adapter";
<<<<<<< HEAD
import type { Pedido, OrderTracking } from "@/types/pedidos";
=======
import type { Pedido, PedidoEntregaTracking } from "@/types/pedidos";
>>>>>>> 828b2756dfbf383aeeb12efb4a064add2cacad00
import { logger } from "@/lib/logger";
import { getRequestId } from "@/lib/request-context";

async function fetchOrders(auth: CentralApiAuth): Promise<Pedido[] | null> {
  const result = await fetchCentralJson(
    [
      { path: "/mis-pedidos" },
      { path: "/pedidos" },
      { path: "/orders" },
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
      { path: `/mis-pedidos/${orderId}` },
      { path: `/pedidos/${orderId}` },
      { path: `/orders/${orderId}` },
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

<<<<<<< HEAD
export async function getOrderTracking(auth: CentralApiAuth | null, orderId: string): Promise<OrderTracking | null> {
=======
export async function getOrderTracking(auth: CentralApiAuth | null, orderId: string): Promise<PedidoEntregaTracking | null> {
>>>>>>> 828b2756dfbf383aeeb12efb4a064add2cacad00
  if (!auth?.userId || !orderId) return null;

  try {
    const result = await fetchCentralJson(
      [
        { path: `/entregas/${orderId}` },
<<<<<<< HEAD
        { path: `/deliveries/${orderId}` },
=======
>>>>>>> 828b2756dfbf383aeeb12efb4a064add2cacad00
      ],
      auth,
      { timeoutMs: 10000, requestId: await getRequestId() }
    );

<<<<<<< HEAD
    if (result.response.status === 404 || result.response.status === 403 || !result.response.ok) {
      return null;
    }

    return (result.data as OrderTracking) ?? null;
  } catch {
    return null;
  }
}

=======
    if (!result.response.ok) {
      return null;
    }

    return (result.data as PedidoEntregaTracking) ?? null;
  } catch (error) {
    logger.warn("Fetch order tracking failed", { orderId, error });
    return null;
  }
}
>>>>>>> 828b2756dfbf383aeeb12efb4a064add2cacad00
