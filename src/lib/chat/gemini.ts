import { CHAT_INTENTS } from "@/lib/chat/intents";
import type { ChatAttachment, ChatInterpretation, ChatMemory } from "@/lib/chat/types";

const GEMINI_API_KEY = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
const GEMINI_MODEL = process.env.GEMINI_CHAT_MODEL ?? "gemini-2.0-flash";

type GeminiResponse = {
  candidates?: Array<{
    content?: {
      parts?: Array<{
        text?: string;
      }>;
    };
  }>;
};

function safeJsonParse<T>(value: string): T | null {
  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
}

function summarizeMemory(memory: ChatMemory): string {
  return JSON.stringify({
    lastIntent: memory.lastIntent,
    lastProductIds: memory.lastProductIds,
    lastOrderIds: memory.lastOrderIds,
    selectedProductId: memory.selectedProductId,
    selectedOrderId: memory.selectedOrderId,
    filters: memory.filters,
    pendingAction: memory.pendingAction,
    pendingProductId: memory.pendingProductId,
    preferredColor: memory.preferredColor,
    preferredTalla: memory.preferredTalla,
    preferredQuantity: memory.preferredQuantity,
    userAuthenticated: memory.userAuthenticated,
  });
}

function buildPrompt(message: string, memory: ChatMemory, hasImage: boolean): string {
  return [
    "Eres un clasificador de intención para un chatbot de ecommerce de ropa.",
    "No respondas en lenguaje natural. Devuelve solo JSON válido.",
    `Intenciones permitidas: ${CHAT_INTENTS.join(", ")}.`,
    "Extrae estas entidades cuando existan: query, keywords, color, talla, quantity, minPrice, maxPrice, code, productId, orderId, ordinalIndex.",
    "Si el usuario adjunta imagen, describe la prenda de forma aproximada y úsala solo para inferir query, color y talla si es posible.",
    "No inventes IDs ni datos.",
    `Hay imagen adjunta: ${hasImage ? "si" : "no"}.`,
    `Memoria actual: ${summarizeMemory(memory)}`,
    `Mensaje del usuario: ${message}`,
  ].join("\n");
}

function buildSchema() {
  return {
    type: "OBJECT",
    properties: {
      intent: { type: "STRING", enum: CHAT_INTENTS },
      confidence: { type: "NUMBER" },
      query: { type: "STRING" },
      keywords: { type: "ARRAY", items: { type: "STRING" } },
      color: { type: "STRING" },
      talla: { type: "STRING" },
      quantity: { type: "INTEGER" },
      minPrice: { type: "NUMBER" },
      maxPrice: { type: "NUMBER" },
      code: { type: "STRING" },
      productId: { type: "STRING" },
      orderId: { type: "STRING" },
      ordinalIndex: { type: "INTEGER" },
    },
    required: ["intent"],
  };
}

function isValidIntent(value: unknown): value is ChatInterpretation["intent"] {
  return typeof value === "string" && CHAT_INTENTS.includes(value as ChatInterpretation["intent"]);
}

export async function interpretWithGemini(message: string, memory: ChatMemory, attachments: ChatAttachment[] = []): Promise<ChatInterpretation | null> {
  if (!GEMINI_API_KEY) return null;

  const parts: Array<Record<string, unknown>> = [{ text: buildPrompt(message, memory, attachments.length > 0) }];
  for (const attachment of attachments.slice(0, 1)) {
    parts.push({
      inline_data: {
        mime_type: attachment.mimeType,
        data: attachment.data,
      },
    });
  }

  const payload = {
    contents: [
      {
        role: "user",
        parts,
      },
    ],
    generationConfig: {
      response_mime_type: "application/json",
      response_schema: buildSchema(),
      temperature: 0.1,
      maxOutputTokens: 350,
    },
  };

  try {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": GEMINI_API_KEY,
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(8000),
    });

    if (!res.ok) return null;

    const data = (await res.json()) as GeminiResponse;
    const rawText = data.candidates?.[0]?.content?.parts?.map((part) => part.text ?? "").join("").trim();
    if (!rawText) return null;

    const parsed = safeJsonParse<Record<string, unknown>>(rawText);
    if (!parsed || !isValidIntent(parsed.intent)) return null;

    return {
      intent: parsed.intent,
      confidence: typeof parsed.confidence === "number" ? parsed.confidence : 0.75,
      entities: {
        query: typeof parsed.query === "string" && parsed.query.trim() ? parsed.query.trim() : null,
        keywords: Array.isArray(parsed.keywords) ? parsed.keywords.filter((item): item is string => typeof item === "string") : [],
        color: typeof parsed.color === "string" && parsed.color.trim() ? parsed.color.trim() : null,
        talla: typeof parsed.talla === "string" && parsed.talla.trim() ? parsed.talla.trim().toUpperCase() : null,
        quantity:
          typeof parsed.quantity === "number" && Number.isFinite(parsed.quantity) && parsed.quantity > 0
            ? parsed.quantity
            : null,
        minPrice: typeof parsed.minPrice === "number" && Number.isFinite(parsed.minPrice) ? parsed.minPrice : null,
        maxPrice: typeof parsed.maxPrice === "number" && Number.isFinite(parsed.maxPrice) ? parsed.maxPrice : null,
        code: typeof parsed.code === "string" && parsed.code.trim() ? parsed.code.trim() : null,
        productId: typeof parsed.productId === "string" && parsed.productId.trim() ? parsed.productId.trim() : null,
        orderId: typeof parsed.orderId === "string" && parsed.orderId.trim() ? parsed.orderId.trim() : null,
        ordinalIndex:
          typeof parsed.ordinalIndex === "number" && Number.isInteger(parsed.ordinalIndex) && parsed.ordinalIndex >= 0
            ? parsed.ordinalIndex
            : null,
      },
    };
  } catch {
    return null;
  }
}

