"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import ChatWindow from "@/components/chat/ChatWindow";
import { primeraImagenDeVariante } from "@/lib/catalogo-imagenes";
import { createInitialMemory, normalizeMemory } from "@/lib/chat/memory";
import type { ChatAction, ChatAttachmentPreview, ChatResponse, ProductCardData, TranscriptMessage } from "@/lib/chat/types";
import { useReservationCart } from "@/components/providers/ReservationCartProvider";

const SESSION_KEY = "fitandes-chat-session";
const MEMORY_KEY = "fitandes-chat-memory";
const HISTORY_KEY = "fitandes-chat-history";

function createId(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`;
}

function buildWelcomeMessage(): TranscriptMessage {
  return {
    id: createId(),
    role: "assistant",
    text: "Puedo ayudarte a encontrar productos, ver detalles, sugerir similares, buscar por codigo y revisar tus pedidos.",
    suggestions: ["Quiero una polera negra", "Muestrame novedades", "Buscar por codigo", "Mis pedidos"],
    createdAt: Date.now(),
    sourceMode: "rules",
  };
}

function sanitizeMessages(messages: TranscriptMessage[]): TranscriptMessage[] {
  return messages.slice(-20).map((message) => ({ ...message, attachments: undefined }));
}

export default function ChatWidget() {
  const pathname = usePathname();
  const router = useRouter();
  const { addItem } = useReservationCart();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [unread, setUnread] = useState(0);
  const [sessionId, setSessionId] = useState("");
  const [memory, setMemory] = useState(createInitialMemory(false));
  const [messages, setMessages] = useState<TranscriptMessage[]>([buildWelcomeMessage()]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const storedSessionId = window.localStorage.getItem(SESSION_KEY) ?? createId();
    const storedMemory = normalizeMemory(safeParse(window.localStorage.getItem(MEMORY_KEY)), false);
    const storedMessages = safeParse(window.localStorage.getItem(HISTORY_KEY));

    setSessionId(storedSessionId);
    setMemory(storedMemory);
    if (Array.isArray(storedMessages) && storedMessages.length > 0) {
      setMessages(storedMessages as TranscriptMessage[]);
    }

    window.localStorage.setItem(SESSION_KEY, storedSessionId);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined" || !sessionId) return;
    window.localStorage.setItem(MEMORY_KEY, JSON.stringify(memory));
    window.localStorage.setItem(HISTORY_KEY, JSON.stringify(sanitizeMessages(messages)));
  }, [memory, messages, sessionId]);

  useEffect(() => {
    if (open) setUnread(0);
  }, [open]);

  function pushAssistantMessage(message: Omit<TranscriptMessage, "id" | "role" | "createdAt">) {
    setMessages((current) => [
      ...current,
      {
        id: createId(),
        role: "assistant",
        createdAt: Date.now(),
        ...message,
      },
    ]);
    if (!open) setUnread((current) => current + 1);
  }

  async function sendMessage(payload: {
    message: string;
    displayText: string;
    attachments: Array<{ name?: string; mimeType: string; data: string; previewUrl?: string }>;
  }) {
    if (loading || !sessionId) return;

    const userAttachments: ChatAttachmentPreview[] = payload.attachments.map((attachment) => ({
      name: attachment.name,
      mimeType: attachment.mimeType,
      previewUrl: attachment.previewUrl,
    }));

    setMessages((current) => [
      ...current,
      {
        id: createId(),
        role: "user",
        text: payload.displayText,
        attachments: userAttachments,
        createdAt: Date.now(),
      },
    ]);

    setLoading(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: payload.message,
          sessionId,
          memory,
          attachments: payload.attachments.map((attachment) => ({
            name: attachment.name,
            mimeType: attachment.mimeType,
            data: attachment.data,
          })),
        }),
      });

      const data = (await res.json()) as ChatResponse;
      setMemory(normalizeMemory(data.memory, Boolean(data.memory?.userAuthenticated)));
      pushAssistantMessage({
        text: data.reply,
        cards: data.cards,
        actions: data.actions,
        suggestions: data.suggestions,
        sourceMode: data.sourceMode,
      });
    } catch {
      pushAssistantMessage({
        text: "No pude responderte ahora mismo. Intenta de nuevo en un momento.",
        suggestions: ["Quiero una polera negra", "Mostrar catalogo"],
        sourceMode: "rules",
      });
    } finally {
      setLoading(false);
    }
  }

  async function handleAction(action: ChatAction) {
    if (action.type === "open_catalog" || action.type === "open_login") {
      router.push(action.href ?? (action.type === "open_login" ? "/login" : "/catalogo"));
      setOpen(false);
      return;
    }

    if (action.type === "view_detail" && action.productId) {
      await sendMessage({ message: `detalle producto ${action.productId}`, displayText: action.label, attachments: [] });
      return;
    }

    if (action.type === "show_similar" && action.productId) {
      await sendMessage({ message: `similares producto ${action.productId}`, displayText: action.label, attachments: [] });
      return;
    }

    if (action.type === "show_order" && action.orderId) {
      await sendMessage({ message: `detalle pedido ${action.orderId}`, displayText: action.label, attachments: [] });
    }
  }

  function handleAddToCart(card: ProductCardData, selection: { color: string; talla: string; cantidad: number }) {
    const variant = card.variants.find((item) => item.color === selection.color && item.talla === selection.talla);
    if (!variant) return;

    addItem({
      id: `${card.id}-${variant.color}-${variant.talla}`,
      productoId: card.id,
      nombre: card.title,
      modelo: card.model,
      imagen: primeraImagenDeVariante(variant) ?? card.image,
      color: variant.color,
      talla: variant.talla,
      cantidad: selection.cantidad,
      precio: card.price,
      stockDisponible: variant.stock,
    });

    setMemory((current) =>
      normalizeMemory(
        {
          ...current,
          pendingAction: null,
          pendingProductId: null,
          preferredColor: variant.color,
          preferredTalla: variant.talla,
          preferredQuantity: selection.cantidad,
        },
        current.userAuthenticated,
      ),
    );

    pushAssistantMessage({
      text: `Agregue ${selection.cantidad} unidad${selection.cantidad !== 1 ? "es" : ""} de ${card.title} (${variant.color} / ${variant.talla}) a tu reserva.`,
      suggestions: ["Ver detalle", "Quiero algo parecido", "Mostrar catalogo"],
      sourceMode: "rules",
    });
  }

  if (pathname === "/login" || pathname === "/registro") return null;

  return (
    <>
      <ChatWindow
        open={open}
        loading={loading}
        messages={messages}
        onClose={() => setOpen(false)}
        onSubmit={sendMessage}
        onAction={handleAction}
        onSuggestion={(text) => void sendMessage({ message: text, displayText: text, attachments: [] })}
        onAddToCart={handleAddToCart}
      />

      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="fixed bottom-4 right-4 z-50 flex h-16 w-16 items-center justify-center rounded-full bg-[#111111] text-white shadow-[0_20px_45px_rgba(17,17,17,0.25)] transition-transform hover:-translate-y-1"
        aria-label="Abrir asistente de FitAndes"
      >
        <span className="text-xs uppercase" style={{ letterSpacing: "0.16em" }}>
          Chat
        </span>
        {unread > 0 ? (
          <span className="absolute -right-1 -top-1 flex h-6 min-w-6 items-center justify-center rounded-full bg-[#d04d37] px-1 text-[10px] font-semibold text-white">
            {unread}
          </span>
        ) : null}
      </button>
    </>
  );
}

function safeParse(raw: string | null): unknown {
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

