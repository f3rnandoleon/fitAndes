import { buildCentralApiHeaders, type CentralApiAuth } from "@/lib/central-api";
import type { Pedido } from "@/types/pedidos";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? process.env.API_URL ?? "";

function parsePedidoArray(data: unknown): Pedido[] {
  if (Array.isArray(data)) return data as Pedido[];

  if (data && typeof data === "object") {
    const orders = (data as { orders?: unknown }).orders;
    if (Array.isArray(orders)) return orders as Pedido[];
  }

  return [];
}

async function fetchJson(path: string, auth: CentralApiAuth): Promise<{ ok: boolean; status: number; data: unknown }> {
  const res = await fetch(`${API_URL}${path}`, {
    headers: buildCentralApiHeaders(auth),
    cache: "no-store",
    signal: AbortSignal.timeout(10000),
  });

  const data = await res.json().catch(() => null);
  return { ok: res.ok, status: res.status, data };
}

async function fetchOrdersFrom(path: string, auth: CentralApiAuth): Promise<Pedido[] | null> {
  const response = await fetchJson(path, auth);
  if (!response.ok) return null;
  return parsePedidoArray(response.data);
}

async function fetchOrderFrom(path: string, auth: CentralApiAuth): Promise<Pedido | null | undefined> {
  const response = await fetchJson(path, auth);

  if (response.status === 404 || response.status === 400) return null;
  if (!response.ok) return undefined;
  if (!response.data || typeof response.data !== "object") return null;

  return response.data as Pedido;
}

export async function getOrders(auth: CentralApiAuth | null): Promise<Pedido[] | null> {
  if (!auth?.userId || !API_URL) return [];

  try {
    const modernOrders = await fetchOrdersFrom("/orders", auth);
    if (modernOrders) return modernOrders;

    const legacyOrders = await fetchOrdersFrom("/mis-pedidos", auth);
    return legacyOrders ?? null;
  } catch {
    return null;
  }
}

export async function getOrderDetail(auth: CentralApiAuth | null, orderId: string): Promise<Pedido | null | undefined> {
  if (!auth?.userId || !orderId || !API_URL) return null;

  try {
    const modernOrder = await fetchOrderFrom(`/orders/${orderId}`, auth);
    if (modernOrder !== undefined) return modernOrder;

    return await fetchOrderFrom(`/mis-pedidos/${orderId}`, auth);
  } catch {
    return undefined;
  }
}
