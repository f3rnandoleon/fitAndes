import type { Pedido } from "@/types/pedidos";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? process.env.API_URL ?? "";

export async function getMisPedidos(userId: string): Promise<Pedido[] | null> {
  if (!userId || !API_URL) return [];

  try {
    const res = await fetch(`${API_URL}/mis-pedidos`, {
      headers: { "x-user-id": userId },
      cache: "no-store",
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return Array.isArray(data) ? (data as Pedido[]) : [];
  } catch {
    return null;
  }
}

export async function getPedidoDetalle(userId: string, pedidoId: string): Promise<Pedido | null | undefined> {
  if (!userId || !pedidoId || !API_URL) return null;

  try {
    const res = await fetch(`${API_URL}/mis-pedidos/${pedidoId}`, {
      headers: { "x-user-id": userId },
      cache: "no-store",
      signal: AbortSignal.timeout(10000),
    });
    if (res.status === 404 || res.status === 400) return null;
    if (!res.ok) return undefined;
    return (await res.json()) as Pedido;
  } catch {
    return undefined;
  }
}

