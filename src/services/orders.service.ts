import { buildCentralApiHeaders, fetchCentralApiWithFallback, parseJsonRecord, type CentralApiAuth } from "@/lib/central-api";
import type { Pedido } from "@/types/pedidos";

function parsePedidoArray(data: unknown): Pedido[] {
  if (Array.isArray(data)) return data as Pedido[];

  const record = parseJsonRecord(data);
  if (record) {
    const pedidos = record.pedidos;
    if (Array.isArray(pedidos)) return pedidos as Pedido[];

    const orders = record.orders;
    if (Array.isArray(orders)) return orders as Pedido[];
  }

  return [];
}

async function fetchOrders(auth: CentralApiAuth): Promise<Pedido[] | null> {
  const result = await fetchCentralApiWithFallback(
    [
      { path: "/pedidos", init: { headers: buildCentralApiHeaders(auth) } },
      { path: "/orders", init: { headers: buildCentralApiHeaders(auth) } },
      { path: "/mis-pedidos", init: { headers: buildCentralApiHeaders(auth) } },
    ],
    { timeoutMs: 10000 },
  );

  if (!result.response.ok) return null;
  return parsePedidoArray(result.data);
}

function parsePedidoDetail(data: unknown): Pedido | null {
  const record = parseJsonRecord(data);

  if (record) {
    const pedido = record.pedido;
    if (pedido && typeof pedido === "object") return pedido as Pedido;

    const order = record.order;
    if (order && typeof order === "object") return order as Pedido;
  }

  return record ? (record as unknown as Pedido) : null;
}

async function fetchOrder(auth: CentralApiAuth, orderId: string): Promise<Pedido | null | undefined> {
  const result = await fetchCentralApiWithFallback(
    [
      { path: `/pedidos/${orderId}`, init: { headers: buildCentralApiHeaders(auth) } },
      { path: `/orders/${orderId}`, init: { headers: buildCentralApiHeaders(auth) } },
      { path: `/mis-pedidos/${orderId}`, init: { headers: buildCentralApiHeaders(auth) } },
    ],
    { timeoutMs: 10000 },
  );

  if (result.response.status === 404 || result.response.status === 400) return null;
  if (!result.response.ok) return undefined;
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
