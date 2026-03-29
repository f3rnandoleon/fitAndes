import {
  ADD_KEYWORDS,
  CODE_KEYWORDS,
  COLOR_ALIASES,
  GREETING_KEYWORDS,
  HELP_KEYWORDS,
  ORDER_KEYWORDS,
  QUERY_STOPWORDS,
  SIMILAR_KEYWORDS,
  SIZE_ALIASES,
} from "@/lib/chat/intents";
import type { ChatEntities, ChatInterpretation, ChatMemory } from "@/lib/chat/types";

function normalizeText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function hasKeyword(text: string, keywords: string[]): boolean {
  return keywords.some((keyword) => text.includes(normalizeText(keyword)));
}

function detectColor(text: string): string | null {
  for (const [canonical, aliases] of Object.entries(COLOR_ALIASES)) {
    if (aliases.some((alias) => text.includes(normalizeText(alias).replace("@", "")))) {
      return canonical;
    }
  }
  return null;
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function detectTalla(text: string): string | null {
  for (const [canonical, aliases] of Object.entries(SIZE_ALIASES)) {
    if (aliases.some((alias) => new RegExp(`(^|\\b)${escapeRegex(normalizeText(alias))}(\\b|$)`, "i").test(text))) {
      return canonical;
    }
  }
  return null;
}

function detectQuantity(text: string): number | null {
  const match = text.match(/(?:x|llevar|quiero|agrega|agregar|añade|anade|necesito)\s*(\d{1,2})/i) ?? text.match(/(\d{1,2})\s*(?:unidades?|piezas?)/i);
  if (!match) return null;
  const value = Number(match[1]);
  return Number.isFinite(value) && value > 0 ? value : null;
}

function detectPriceRange(text: string): { minPrice: number | null; maxPrice: number | null } {
  const between = text.match(/entre\s+(\d+(?:[.,]\d+)?)\s+y\s+(\d+(?:[.,]\d+)?)/i);
  if (between) {
    return {
      minPrice: Number(between[1].replace(",", ".")),
      maxPrice: Number(between[2].replace(",", ".")),
    };
  }

  const under = text.match(/(?:menos de|hasta|maximo|maximo de|máximo|máximo de)\s+(\d+(?:[.,]\d+)?)/i);
  if (under) {
    return {
      minPrice: null,
      maxPrice: Number(under[1].replace(",", ".")),
    };
  }

  const over = text.match(/(?:mas de|más de|desde)\s+(\d+(?:[.,]\d+)?)/i);
  if (over) {
    return {
      minPrice: Number(over[1].replace(",", ".")),
      maxPrice: null,
    };
  }

  return { minPrice: null, maxPrice: null };
}

function detectOrdinal(text: string): number | null {
  const pairs: Array<[RegExp, number]> = [
    [/\b(primer[oa]?|1er|1ra|uno|una|primera)\b/i, 0],
    [/\b(segund[oa]?|2do|2da|dos|segunda)\b/i, 1],
    [/\b(tercer[oa]?|3er|3ra|tres|tercera)\b/i, 2],
    [/\b(cuart[oa]?|4to|4ta|cuarta)\b/i, 3],
  ];

  for (const [pattern, index] of pairs) {
    if (pattern.test(text)) return index;
  }
  return null;
}

function createEntities(overrides: Partial<ChatEntities> = {}): ChatEntities {
  return {
    query: null,
    keywords: [],
    color: null,
    talla: null,
    quantity: null,
    minPrice: null,
    maxPrice: null,
    code: null,
    productId: null,
    orderId: null,
    ordinalIndex: null,
    ...overrides,
  };
}

function extractInternalIntent(message: string): ChatInterpretation | null {
  const detailProduct = message.match(/^detalle producto ([a-f0-9]{24})$/i);
  if (detailProduct) {
    return {
      intent: "ver_detalle",
      confidence: 1,
      entities: createEntities({ productId: detailProduct[1] }),
    };
  }

  const similarProduct = message.match(/^similares producto ([a-f0-9]{24})$/i);
  if (similarProduct) {
    return {
      intent: "ver_similares",
      confidence: 1,
      entities: createEntities({ productId: similarProduct[1] }),
    };
  }

  const detailOrder = message.match(/^detalle pedido ([a-f0-9]{24})$/i);
  if (detailOrder) {
    return {
      intent: "ver_pedido",
      confidence: 1,
      entities: createEntities({ orderId: detailOrder[1] }),
    };
  }

  return null;
}

function extractCode(message: string, normalized: string): string | null {
  const tagged = normalized.match(/(?:codigo|codigo qr|codigo de barras|qr|barra)[:\s-]+([a-z0-9\-_]+)/i);
  if (tagged?.[1]) return tagged[1];

  const trimmed = message.trim();
  if (/^[A-Z0-9\-_]{6,}$/i.test(trimmed) && /\d/.test(trimmed)) {
    return trimmed;
  }

  return null;
}

function extractQuery(normalized: string, color: string | null, talla: string | null, code: string | null): string | null {
  const withoutNumbers = normalized.replace(/\d+(?:[.,]\d+)?/g, " ");
  const tokens = withoutNumbers
    .split(/[^a-z0-9]+/)
    .filter(Boolean)
    .filter((token) => !QUERY_STOPWORDS.has(token));

  const cleaned = tokens.filter((token) => {
    if (code && normalizeText(code) === token) return false;
    if (color && token === normalizeText(color)) return false;
    if (talla && token === normalizeText(talla)) return false;
    return token.length > 1;
  });

  return cleaned.length > 0 ? cleaned.join(" ") : null;
}

export function parseRuleIntent(message: string, memory: ChatMemory): ChatInterpretation {
  const internal = extractInternalIntent(message.trim());
  if (internal) return internal;

  const normalized = normalizeText(message);
  const color = detectColor(normalized) ?? memory.preferredColor;
  const talla = detectTalla(normalized) ?? memory.preferredTalla;
  const quantity = detectQuantity(normalized) ?? memory.preferredQuantity;
  const { minPrice, maxPrice } = detectPriceRange(normalized);
  const ordinalIndex = detectOrdinal(normalized);
  const code = extractCode(message, normalized);
  const query = extractQuery(normalized, color, talla, code);
  const entities = createEntities({
    color,
    talla,
    quantity,
    minPrice,
    maxPrice,
    code,
    query,
    keywords: query ? query.split(/\s+/) : [],
    ordinalIndex,
    productId: memory.pendingProductId,
  });

  const onlyGreeting = normalized.length <= 24 && hasKeyword(normalized, GREETING_KEYWORDS);
  if (onlyGreeting || hasKeyword(normalized, HELP_KEYWORDS)) {
    return { intent: "ayuda", entities, confidence: 0.95 };
  }

  if (code || hasKeyword(normalized, CODE_KEYWORDS)) {
    return { intent: "buscar_por_codigo", entities, confidence: code ? 0.98 : 0.7 };
  }

  if (hasKeyword(normalized, ORDER_KEYWORDS)) {
    const wantsDetail = /\b(detalle|ver|mostrar|muestrame|muéstrame)\b/i.test(normalized) || ordinalIndex !== null;
    return { intent: wantsDetail ? "ver_pedido" : "ver_pedidos", entities, confidence: 0.92 };
  }

  if (hasKeyword(normalized, SIMILAR_KEYWORDS)) {
    return {
      intent: "ver_similares",
      entities: { ...entities, productId: memory.selectedProductId ?? entities.productId },
      confidence: 0.9,
    };
  }

  if (hasKeyword(normalized, ADD_KEYWORDS) || (memory.pendingAction === "agregar_carrito" && (color || talla || quantity))) {
    return {
      intent: "agregar_carrito",
      entities: { ...entities, productId: memory.pendingProductId ?? memory.selectedProductId ?? entities.productId },
      confidence: 0.9,
    };
  }

  const asksDetail =
    /\b(fotos|foto|detalle|detalles)\b/i.test(normalized) ||
    ((/\b(ver|mostrar|muestrame|muéstrame)\b/i.test(normalized) && Boolean(memory.selectedProductId)) ||
      (ordinalIndex !== null && memory.lastProductIds.length > 0));
  if (asksDetail) {
    return {
      intent: "ver_detalle",
      entities: { ...entities, productId: memory.selectedProductId ?? entities.productId },
      confidence: 0.82,
    };
  }

  if (query || color || talla || minPrice !== null || maxPrice !== null) {
    return { intent: "buscar_producto", entities, confidence: 0.86 };
  }

  return { intent: hasKeyword(normalized, GREETING_KEYWORDS) ? "ayuda" : "fallback", entities, confidence: 0.4 };
}
