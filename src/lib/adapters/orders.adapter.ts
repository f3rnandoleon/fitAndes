import { parseJsonRecord, readString } from "@/lib/central-api";
import { CanonicalOrderPatchPayload, CanonicalDelivery } from "@/types/canonical-order";
import type { Pedido } from "@/types/pedidos";

export function parsePedidoArray(data: unknown): Pedido[] {
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

export function parsePedidoDetail(data: unknown): Pedido | null {
  const record = parseJsonRecord(data);

  if (record) {
    const pedido = record.pedido;
    if (pedido && typeof pedido === "object") return pedido as Pedido;

    const order = record.order;
    if (order && typeof order === "object") return order as Pedido;
  }

  return record ? (record as unknown as Pedido) : null;
}

export function extractErrorMessage(data: Record<string, unknown> | null, fallback: string) {
  const errors = data?.errors;
  if (Array.isArray(errors)) {
    const firstError = errors.find((error) => error && typeof error === "object") as { message?: unknown } | undefined;
    if (typeof firstError?.message === "string") return firstError.message;
  }

  if (typeof data?.message === "string") return data.message;
  if (typeof data?.error === "string") return data.error;
  return fallback;
}

export function extractOrderInfo(data: Record<string, unknown> | null) {
  const order = parseJsonRecord(data?.pedido) ?? parseJsonRecord(data?.order) ?? data;

  return {
    orderId: readString(order, "_id", "id") ?? readString(data, "orderId", "pedidoId"),
    orderNumber:
      readString(order, "numeroPedido", "orderNumber", "numeroVenta") ??
      readString(data, "orderNumber", "numeroPedido"),
  };
}

export function buildCentralDeliveryPayload(source: Record<string, unknown>): CanonicalDelivery | Record<string, unknown> | null {
  const metodo = readString(source, "metodo", "method");
  if (!metodo) return null;

  if (metodo === "PICKUP_POINT") {
    return {
      metodo: "PICKUP_POINT",
      direccion: readString(source, "direccion", "address", "puntoRecojo"),
      telefono: readString(source, "telefono", "phone"),
      nombreDestinatario: readString(source, "nombreDestinatario", "recipientName"),
      programadoPara: readString(source, "programadoPara", "scheduledAt"),
    };
  }

  if (metodo === "SHIPPING_NATIONAL") {
    return {
      metodo: "SHIPPING_NATIONAL",
      departamento: readString(source, "departamento", "department"),
      ciudad: readString(source, "ciudad", "city"),
      empresaEnvio: readString(source, "empresaEnvio", "shippingCompany"),
      sucursal: readString(source, "sucursal", "branch"),
      nombreDestinatario: readString(source, "nombreDestinatario", "recipientName"),
      nombreRemitente: readString(source, "nombreRemitente", "senderName"),
      ciRemitente: readString(source, "ciRemitente", "senderCI"),
      telefonoRemitente: readString(source, "telefonoRemitente", "senderPhone"),
    };
  }

  return { metodo };
}

export function buildCanonicalOrderPatchPayload(payload: unknown): CanonicalOrderPatchPayload | unknown | null {
  const source = parseJsonRecord(payload);
  if (!source) return null;

  const canonical: Record<string, unknown> = {};
  const estadoPedido = readString(source, "estadoPedido", "orderStatus");
  if (estadoPedido) {
    canonical.estadoPedido = estadoPedido;
  }

  const entregaSource =
    parseJsonRecord(source.entrega) ??
    parseJsonRecord(source.deliverySnapshot) ??
    parseJsonRecord(source.delivery);

  if (entregaSource) {
    const entrega = buildCentralDeliveryPayload(entregaSource);
    if (entrega) {
      canonical.entrega = entrega;
    }
  }

  return Object.keys(canonical).length > 0 ? canonical : source;
}
