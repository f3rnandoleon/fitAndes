import { buildOrderCard, buildProductCard, formatReadyToReserve } from "@/lib/chat/formatter";
import { interpretWithGemini } from "@/lib/chat/gemini";
import { normalizeMemory, resolveOrdinalReference } from "@/lib/chat/memory";
import { parseRuleIntent } from "@/lib/chat/parser";
import type { ChatAction, ChatMemory, ChatResponse } from "@/lib/chat/types";
import {
  findSimilarProducts,
  getProductByCode,
  getProductDetail,
  resolveVariant,
  searchProducts,
} from "@/services/chat-catalogo.service";
import { getMisPedidos, getPedidoDetalle } from "@/services/chat-pedidos.service";
import type { CatalogProduct } from "@/types/catalogo";

function buildBaseMemory(memory: ChatMemory, overrides: Partial<ChatMemory>): ChatMemory {
  return normalizeMemory({ ...memory, ...overrides }, overrides.userAuthenticated ?? memory.userAuthenticated);
}

function productActionsOnEmpty(): ChatAction[] {
  return [{ type: "open_catalog", label: "Ver catalogo", href: "/catalogo" }];
}

function loginAction(): ChatAction[] {
  return [{ type: "open_login", label: "Iniciar sesion", href: "/login" }];
}

function resolveProductId(messageProductId: string | null, ordinalIndex: number | null, memory: ChatMemory): string | null {
  return resolveOrdinalReference(memory.lastProductIds, ordinalIndex, messageProductId ?? memory.selectedProductId);
}

function resolveOrderId(messageOrderId: string | null, ordinalIndex: number | null, memory: ChatMemory): string | null {
  return resolveOrdinalReference(memory.lastOrderIds, ordinalIndex, messageOrderId ?? memory.selectedOrderId);
}

function withNoCatalogReply(memory: ChatMemory, sourceMode: ChatResponse["sourceMode"]): ChatResponse {
  return {
    reply: "No pude consultar el catalogo en este momento. Intenta de nuevo en unos segundos.",
    intent: "fallback",
    actions: productActionsOnEmpty(),
    suggestions: ["Mostrar novedades", "Quiero algo negro"],
    memory,
    sourceMode,
  };
}

function withNoOrdersReply(memory: ChatMemory, sourceMode: ChatResponse["sourceMode"]): ChatResponse {
  return {
    reply: "No pude consultar tus pedidos en este momento. Intenta nuevamente en un momento.",
    intent: "fallback",
    actions: loginAction(),
    suggestions: ["Ver catalogo", "Buscar productos"],
    memory,
    sourceMode,
  };
}

function buildSearchReply(count: number, filters: ChatMemory["filters"]): string {
  const parts = [];
  if (filters.query) parts.push(`"${filters.query}"`);
  if (filters.color) parts.push(`color ${filters.color}`);
  if (filters.talla) parts.push(`talla ${filters.talla}`);
  if (parts.length === 0) {
    return `Encontre ${count} opciones del catalogo para ti.`;
  }
  return `Encontre ${count} opcion${count !== 1 ? "es" : ""} para ${parts.join(", ")}.`;
}

export async function runChat(input: {
  message: string;
  memory: unknown;
  attachments?: Array<{ name?: string; mimeType: string; data: string }>;
  auth: { userId: string | null; accessToken?: string | null };
}): Promise<ChatResponse> {
  const customerAuth = input.auth.userId ? { userId: input.auth.userId, role: "CLIENTE" as const, accessToken: input.auth.accessToken ?? null } : null;
  const memory = normalizeMemory(input.memory, Boolean(input.auth.userId));
  const aiInterpretation = await interpretWithGemini(input.message, memory, input.attachments ?? []);
  const interpretation = aiInterpretation ?? parseRuleIntent(input.message, memory);
  const sourceMode: ChatResponse["sourceMode"] = aiInterpretation ? "ai" : "rules";
  const entities = interpretation.entities;

  if (interpretation.intent === "ayuda") {
    return {
      reply:
        "Puedo ayudarte a buscar productos, mostrar detalles, sugerir similares, buscar por codigo y revisar tus pedidos si ya iniciaste sesion.",
      intent: "ayuda",
      suggestions: ["Quiero una polera negra", "Muestrame novedades", "Mis pedidos", "Buscar por codigo"],
      memory: buildBaseMemory(memory, { lastIntent: "ayuda", userAuthenticated: Boolean(input.auth.userId) }),
      sourceMode,
    };
  }

  if (interpretation.intent === "buscar_por_codigo") {
    if (!entities.code) {
      return {
        reply: "Envia el codigo QR o de barras y te busco la coincidencia exacta.",
        intent: "buscar_por_codigo",
        suggestions: ["Codigo ABC12345", "Quiero una polera negra"],
        memory: buildBaseMemory(memory, { lastIntent: "buscar_por_codigo", userAuthenticated: Boolean(input.auth.userId) }),
        sourceMode,
      };
    }

    const byCode = await getProductByCode(entities.code);
    if (byCode === undefined) {
      return withNoCatalogReply(memory, sourceMode);
    }

    if (!byCode) {
      return {
        reply: "No encontre un producto con ese codigo. Si quieres, puedo buscar algo parecido por nombre, color o talla.",
        intent: "buscar_por_codigo",
        suggestions: ["Quiero algo negro", "Mostrar catalogo"],
        actions: productActionsOnEmpty(),
        memory: buildBaseMemory(memory, { lastIntent: "buscar_por_codigo", userAuthenticated: Boolean(input.auth.userId) }),
        sourceMode,
      };
    }

    const detail = await getProductDetail(byCode._id);
    if (!detail) {
      return withNoCatalogReply(memory, sourceMode);
    }

    return {
      reply: "Encontre una coincidencia exacta por codigo.",
      intent: "buscar_por_codigo",
      cards: [
        buildProductCard(detail, {
          preferredColor: byCode.variante.color,
          preferredTalla: byCode.variante.talla,
          preferredQuantity: entities.quantity ?? 1,
        }),
      ],
      suggestions: ["Ver similares", "Agregar a reserva"],
      memory: buildBaseMemory(memory, {
        lastIntent: "buscar_por_codigo",
        lastProductIds: [detail._id],
        selectedProductId: detail._id,
        preferredColor: byCode.variante.color,
        preferredTalla: byCode.variante.talla,
        preferredQuantity: entities.quantity ?? 1,
        pendingAction: null,
        pendingProductId: null,
        userAuthenticated: Boolean(input.auth.userId),
      }),
      sourceMode,
    };
  }

  if (interpretation.intent === "ver_pedidos") {
    if (!input.auth.userId) {
      return {
        reply: "Para mostrarte tus pedidos primero debes iniciar sesion.",
        intent: "ver_pedidos",
        actions: loginAction(),
        suggestions: ["Quiero una chompa negra", "Mostrar catalogo"],
        memory: buildBaseMemory(memory, { lastIntent: "ver_pedidos", userAuthenticated: false }),
        sourceMode,
      };
    }

    const orders = await getMisPedidos(customerAuth);
    if (orders === null) return withNoOrdersReply(memory, sourceMode);
    if (orders.length === 0) {
      return {
        reply: "Todavia no tienes pedidos registrados. Si quieres, te ayudo a encontrar algo para tu proxima compra.",
        intent: "ver_pedidos",
        actions: productActionsOnEmpty(),
        suggestions: ["Mostrar novedades", "Quiero una polera"],
        memory: buildBaseMemory(memory, { lastIntent: "ver_pedidos", lastOrderIds: [], selectedOrderId: null, userAuthenticated: true }),
        sourceMode,
      };
    }

    return {
      reply: `Tienes ${orders.length} pedido${orders.length !== 1 ? "s" : ""} registrado${orders.length !== 1 ? "s" : ""}.`,
      intent: "ver_pedidos",
      cards: orders.slice(0, 4).map((order) => buildOrderCard(order)),
      suggestions: ["Ver el primero", "Quiero volver al catalogo"],
      memory: buildBaseMemory(memory, {
        lastIntent: "ver_pedidos",
        lastOrderIds: orders.map((order) => order._id).slice(0, 6),
        selectedOrderId: orders[0]?._id ?? null,
        userAuthenticated: true,
      }),
      sourceMode,
    };
  }

  if (interpretation.intent === "ver_pedido") {
    if (!input.auth.userId) {
      return {
        reply: "Necesitas iniciar sesion para revisar un pedido especifico.",
        intent: "ver_pedido",
        actions: loginAction(),
        memory: buildBaseMemory(memory, { lastIntent: "ver_pedido", userAuthenticated: false }),
        sourceMode,
      };
    }

    const orderId = resolveOrderId(entities.orderId, entities.ordinalIndex, memory);
    if (!orderId) {
      return {
        reply: "Dime cual pedido quieres ver o primero pide 'mis pedidos'.",
        intent: "ver_pedido",
        suggestions: ["Mis pedidos"],
        memory: buildBaseMemory(memory, { lastIntent: "ver_pedido", userAuthenticated: true }),
        sourceMode,
      };
    }

    const order = await getPedidoDetalle(customerAuth, orderId);
    if (order === undefined) return withNoOrdersReply(memory, sourceMode);
    if (!order) {
      return {
        reply: "No encontre ese pedido en tu cuenta.",
        intent: "ver_pedido",
        suggestions: ["Mis pedidos"],
        memory: buildBaseMemory(memory, { lastIntent: "ver_pedido", userAuthenticated: true }),
        sourceMode,
      };
    }

    return {
      reply: `Aqui tienes el detalle de ${order.numeroVenta}.`,
      intent: "ver_pedido",
      cards: [buildOrderCard(order)],
      suggestions: ["Mis pedidos", "Volver al catalogo"],
      memory: buildBaseMemory(memory, {
        lastIntent: "ver_pedido",
        selectedOrderId: order._id,
        userAuthenticated: true,
      }),
      sourceMode,
    };
  }

  if (interpretation.intent === "ver_detalle") {
    let productId = resolveProductId(entities.productId, entities.ordinalIndex, memory);
    if (!productId && entities.query) {
      const hits = await searchProducts({
        query: entities.query,
        color: entities.color,
        talla: entities.talla,
        minPrice: entities.minPrice,
        maxPrice: entities.maxPrice,
        limit: 1,
      });
      if (hits === null) return withNoCatalogReply(memory, sourceMode);
      productId = hits[0]?._id ?? null;
    }

    if (!productId) {
      return {
        reply: "Dime que producto quieres ver y te muestro el detalle.",
        intent: "ver_detalle",
        suggestions: ["Quiero una chompa negra", "Mostrar catalogo"],
        memory: buildBaseMemory(memory, { lastIntent: "ver_detalle", userAuthenticated: Boolean(input.auth.userId) }),
        sourceMode,
      };
    }

    const product = await getProductDetail(productId);
    if (product === undefined) return withNoCatalogReply(memory, sourceMode);
    if (!product) {
      return {
        reply: "Ese producto ya no esta disponible. Si quieres, te muestro opciones parecidas.",
        intent: "ver_detalle",
        suggestions: ["Mostrar similares", "Ver catalogo"],
        actions: productActionsOnEmpty(),
        memory: buildBaseMemory(memory, { lastIntent: "ver_detalle", userAuthenticated: Boolean(input.auth.userId) }),
        sourceMode,
      };
    }

    const variant = resolveVariant(product, entities.color ?? memory.preferredColor, entities.talla ?? memory.preferredTalla);

    return {
      reply: `Este es el detalle de ${product.nombre}.`,
      intent: "ver_detalle",
      cards: [
        buildProductCard(product, {
          preferredColor: entities.color ?? variant?.color ?? null,
          preferredTalla: entities.talla ?? variant?.talla ?? null,
          preferredQuantity: entities.quantity ?? memory.preferredQuantity ?? 1,
        }),
      ],
      suggestions: ["Quiero algo parecido", "Agregar a reserva"],
      memory: buildBaseMemory(memory, {
        lastIntent: "ver_detalle",
        lastProductIds: [product._id],
        selectedProductId: product._id,
        preferredColor: entities.color ?? variant?.color ?? null,
        preferredTalla: entities.talla ?? variant?.talla ?? null,
        preferredQuantity: entities.quantity ?? memory.preferredQuantity ?? 1,
        pendingAction: null,
        pendingProductId: null,
        userAuthenticated: Boolean(input.auth.userId),
      }),
      sourceMode,
    };
  }

  if (interpretation.intent === "ver_similares") {
    let productId = resolveProductId(entities.productId, entities.ordinalIndex, memory);
    let baseProduct: CatalogProduct | null | undefined = null;

    if (!productId && entities.query) {
      const hits = await searchProducts({ query: entities.query, color: entities.color, talla: entities.talla, limit: 1 });
      if (hits === null) return withNoCatalogReply(memory, sourceMode);
      baseProduct = hits[0] ?? null;
      productId = baseProduct?._id ?? null;
    }

    if (!productId) {
      return {
        reply: "Primero dime cual producto te gusto y luego te muestro similares.",
        intent: "ver_similares",
        suggestions: ["Quiero una polera negra", "Mostrar catalogo"],
        memory: buildBaseMemory(memory, { lastIntent: "ver_similares", userAuthenticated: Boolean(input.auth.userId) }),
        sourceMode,
      };
    }

    const detail = baseProduct ?? (await getProductDetail(productId));
    if (detail === undefined) return withNoCatalogReply(memory, sourceMode);
    if (!detail) {
      return {
        reply: "No pude identificar el producto base para buscar similares.",
        intent: "ver_similares",
        suggestions: ["Mostrar catalogo"],
        actions: productActionsOnEmpty(),
        memory: buildBaseMemory(memory, { lastIntent: "ver_similares", userAuthenticated: Boolean(input.auth.userId) }),
        sourceMode,
      };
    }

    const similars = await findSimilarProducts(detail, entities.color ?? memory.preferredColor);
    if (similars === null) return withNoCatalogReply(memory, sourceMode);
    if (similars.length === 0) {
      return {
        reply: "No encontre productos realmente parecidos ahora mismo, pero puedo seguir buscando por color, talla o precio.",
        intent: "ver_similares",
        suggestions: ["Quiero algo negro", "Quiero algo mas barato"],
        memory: buildBaseMemory(memory, { lastIntent: "ver_similares", selectedProductId: detail._id, userAuthenticated: Boolean(input.auth.userId) }),
        sourceMode,
      };
    }

    return {
      reply: `Te muestro opciones parecidas a ${detail.nombre}.`,
      intent: "ver_similares",
      cards: similars.map((product) => buildProductCard(product)),
      suggestions: ["Ver detalle de la primera", "Quiero algo mas barato"],
      memory: buildBaseMemory(memory, {
        lastIntent: "ver_similares",
        lastProductIds: similars.map((product) => product._id).slice(0, 6),
        selectedProductId: detail._id,
        userAuthenticated: Boolean(input.auth.userId),
      }),
      sourceMode,
    };
  }

  if (interpretation.intent === "agregar_carrito") {
    let productId = resolveProductId(entities.productId, entities.ordinalIndex, memory);
    let targetProduct: CatalogProduct | null | undefined = null;

    if (!productId && entities.query) {
      const hits = await searchProducts({
        query: entities.query,
        color: entities.color,
        talla: entities.talla,
        minPrice: entities.minPrice,
        maxPrice: entities.maxPrice,
        limit: 1,
      });
      if (hits === null) return withNoCatalogReply(memory, sourceMode);
      targetProduct = hits[0] ?? null;
      productId = targetProduct?._id ?? null;
    }

    if (!productId) {
      return {
        reply: "Todavia no se que producto quieres agregar. Dime cual te interesa y te lo preparo.",
        intent: "agregar_carrito",
        suggestions: ["Quiero una chompa negra", "Mostrar catalogo"],
        memory: buildBaseMemory(memory, { lastIntent: "agregar_carrito", userAuthenticated: Boolean(input.auth.userId) }),
        sourceMode,
      };
    }

    const product = targetProduct ?? (await getProductDetail(productId));
    if (product === undefined) return withNoCatalogReply(memory, sourceMode);
    if (!product) {
      return {
        reply: "Ese producto ya no esta disponible para reserva.",
        intent: "agregar_carrito",
        actions: productActionsOnEmpty(),
        memory: buildBaseMemory(memory, { lastIntent: "agregar_carrito", userAuthenticated: Boolean(input.auth.userId) }),
        sourceMode,
      };
    }

    const preferredColor = entities.color ?? memory.preferredColor;
    const preferredTalla = entities.talla ?? memory.preferredTalla;
    const preferredQuantity = entities.quantity ?? memory.preferredQuantity ?? 1;
    const variant = resolveVariant(product, preferredColor, preferredTalla);
    const exactVariantExists = product.variantes.some(
      (item) =>
        item.stock > 0 &&
        (!preferredColor || item.color.toLowerCase() === preferredColor.toLowerCase()) &&
        (!preferredTalla || item.talla.toUpperCase() === preferredTalla.toUpperCase()),
    );

    const needsMoreSelection = !exactVariantExists && product.variantes.filter((item) => item.stock > 0).length > 1;
    if (needsMoreSelection) {
      return {
        reply: `Antes de agregar ${product.nombre}, selecciona color y talla en la tarjeta.`,
        intent: "agregar_carrito",
        cards: [
          buildProductCard(product, {
            preferredColor: preferredColor ?? variant?.color ?? null,
            preferredTalla: preferredTalla ?? variant?.talla ?? null,
            preferredQuantity,
          }),
        ],
        suggestions: ["Quiero talla M", "Quiero color negro"],
        memory: buildBaseMemory(memory, {
          lastIntent: "agregar_carrito",
          selectedProductId: product._id,
          pendingAction: "agregar_carrito",
          pendingProductId: product._id,
          preferredColor: preferredColor ?? variant?.color ?? null,
          preferredTalla: preferredTalla ?? variant?.talla ?? null,
          preferredQuantity,
          userAuthenticated: Boolean(input.auth.userId),
        }),
        sourceMode,
      };
    }

    return {
      reply: formatReadyToReserve(product, preferredColor ?? variant?.color ?? null, preferredTalla ?? variant?.talla ?? null),
      intent: "agregar_carrito",
      cards: [
        buildProductCard(product, {
          preferredColor: preferredColor ?? variant?.color ?? null,
          preferredTalla: preferredTalla ?? variant?.talla ?? null,
          preferredQuantity,
        }),
      ],
      suggestions: ["Quiero algo parecido", "Ver detalle"],
      memory: buildBaseMemory(memory, {
        lastIntent: "agregar_carrito",
        lastProductIds: [product._id],
        selectedProductId: product._id,
        pendingAction: null,
        pendingProductId: null,
        preferredColor: preferredColor ?? variant?.color ?? null,
        preferredTalla: preferredTalla ?? variant?.talla ?? null,
        preferredQuantity,
        userAuthenticated: Boolean(input.auth.userId),
      }),
      sourceMode,
    };
  }

  if (interpretation.intent === "buscar_producto") {
    const products = await searchProducts({
      query: entities.query,
      color: entities.color,
      talla: entities.talla,
      minPrice: entities.minPrice,
      maxPrice: entities.maxPrice,
      limit: 4,
    });

    if (products === null) return withNoCatalogReply(memory, sourceMode);

    if (products.length === 0) {
      return {
        reply: "No encontre resultados con esos filtros. Si quieres, puedo intentar con otro color, talla o precio.",
        intent: "buscar_producto",
        actions: productActionsOnEmpty(),
        suggestions: ["Mostrar novedades", "Quiero algo negro", "Quiero algo talla M"],
        memory: buildBaseMemory(memory, {
          lastIntent: "buscar_producto",
          filters: {
            query: entities.query,
            color: entities.color,
            talla: entities.talla,
            minPrice: entities.minPrice,
            maxPrice: entities.maxPrice,
          },
          userAuthenticated: Boolean(input.auth.userId),
        }),
        sourceMode,
      };
    }

    return {
      reply: buildSearchReply(products.length, {
        query: entities.query,
        color: entities.color,
        talla: entities.talla,
        minPrice: entities.minPrice,
        maxPrice: entities.maxPrice,
      }),
      intent: "buscar_producto",
      cards: products.map((product) =>
        buildProductCard(product, {
          preferredColor: entities.color,
          preferredTalla: entities.talla,
          preferredQuantity: entities.quantity ?? 1,
        }),
      ),
      suggestions: ["Ver detalle de la primera", "Quiero algo parecido", "Agregar la primera"],
      memory: buildBaseMemory(memory, {
        lastIntent: "buscar_producto",
        lastProductIds: products.map((product) => product._id).slice(0, 6),
        selectedProductId: products[0]?._id ?? null,
        filters: {
          query: entities.query,
          color: entities.color,
          talla: entities.talla,
          minPrice: entities.minPrice,
          maxPrice: entities.maxPrice,
        },
        preferredColor: entities.color,
        preferredTalla: entities.talla,
        preferredQuantity: entities.quantity ?? 1,
        userAuthenticated: Boolean(input.auth.userId),
      }),
      sourceMode,
    };
  }

  return {
    reply: "Puedo ayudarte a encontrar productos, revisar detalles, sugerir similares, buscar por codigo o ver tus pedidos.",
    intent: "fallback",
    suggestions: ["Quiero una chompa negra", "Buscar por codigo", "Mis pedidos"],
    memory: buildBaseMemory(memory, { lastIntent: "fallback", userAuthenticated: Boolean(input.auth.userId) }),
    sourceMode,
  };
}



