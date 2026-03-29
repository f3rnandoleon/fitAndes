import type { ChatMemory } from "@/lib/chat/types";

function normalizeString(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function normalizeNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function normalizeStringArray(value: unknown, max = 6): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is string => typeof item === "string" && item.trim().length > 0)
    .slice(0, max);
}

export function createInitialMemory(authenticated = false): ChatMemory {
  return {
    lastIntent: null,
    lastProductIds: [],
    lastOrderIds: [],
    selectedProductId: null,
    selectedOrderId: null,
    filters: {
      query: null,
      color: null,
      talla: null,
      minPrice: null,
      maxPrice: null,
    },
    pendingAction: null,
    pendingProductId: null,
    preferredColor: null,
    preferredTalla: null,
    preferredQuantity: null,
    userAuthenticated: authenticated,
  };
}

export function normalizeMemory(input: unknown, authenticated = false): ChatMemory {
  if (!input || typeof input !== "object") {
    return createInitialMemory(authenticated);
  }

  const raw = input as Partial<ChatMemory>;
  return {
    lastIntent: raw.lastIntent ?? null,
    lastProductIds: normalizeStringArray(raw.lastProductIds),
    lastOrderIds: normalizeStringArray(raw.lastOrderIds),
    selectedProductId: normalizeString(raw.selectedProductId),
    selectedOrderId: normalizeString(raw.selectedOrderId),
    filters: {
      query: normalizeString(raw.filters?.query),
      color: normalizeString(raw.filters?.color),
      talla: normalizeString(raw.filters?.talla),
      minPrice: normalizeNumber(raw.filters?.minPrice),
      maxPrice: normalizeNumber(raw.filters?.maxPrice),
    },
    pendingAction: raw.pendingAction === "agregar_carrito" ? "agregar_carrito" : null,
    pendingProductId: normalizeString(raw.pendingProductId),
    preferredColor: normalizeString(raw.preferredColor),
    preferredTalla: normalizeString(raw.preferredTalla),
    preferredQuantity: normalizeNumber(raw.preferredQuantity),
    userAuthenticated: authenticated,
  };
}

export function resolveOrdinalReference(ids: string[], ordinalIndex: number | null, fallbackId?: string | null): string | null {
  if (ordinalIndex !== null && ids[ordinalIndex]) return ids[ordinalIndex];
  return fallbackId ?? null;
}

