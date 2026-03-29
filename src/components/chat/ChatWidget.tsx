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

type WindowMode = "compact" | "wide" | "full";

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
  const [hintVisible, setHintVisible] = useState(true);
  const [windowMode, setWindowMode] = useState<WindowMode>("compact");

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
    if (open) {
      setUnread(0);
      setHintVisible(false);
    }
  }, [open]);

  useEffect(() => {
    if (!hintVisible || open) return;
    const timeout = window.setTimeout(() => setHintVisible(false), 10000);
    return () => window.clearTimeout(timeout);
  }, [hintVisible, open]);

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

  function cycleWindowSize() {
    setWindowMode((current) => {
      if (current === "compact") return "wide";
      if (current === "wide") return "compact";
      return "wide";
    });
  }

  function toggleFullscreen() {
    setWindowMode((current) => (current === "full" ? "wide" : "full"));
  }

  function clearChat() {
    const initialMemory = createInitialMemory(memory.userAuthenticated);
    setMessages([buildWelcomeMessage()]);
    setMemory(initialMemory);
    setUnread(0);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(MEMORY_KEY, JSON.stringify(initialMemory));
      window.localStorage.setItem(HISTORY_KEY, JSON.stringify([buildWelcomeMessage()]));
    }
  }

  if (pathname === "/login" || pathname === "/registro") return null;

  return (
    <>
      <ChatWindow
        open={open}
        mode={windowMode}
        loading={loading}
        messages={messages}
        onClose={() => setOpen(false)}
        onSubmit={sendMessage}
        onAction={handleAction}
        onSuggestion={(text) => void sendMessage({ message: text, displayText: text, attachments: [] })}
        onAddToCart={handleAddToCart}
        onCycleSize={cycleWindowSize}
        onToggleFullscreen={toggleFullscreen}
        onClearChat={clearChat}
      />

      {hintVisible && !open ? (
        <div className="fixed bottom-20 right-24 z-50 max-w-[260px] rounded-[22px] border bg-white px-4 py-3 text-sm leading-relaxed shadow-[0_20px_45px_rgba(17,17,17,0.12)]" style={{ borderColor: "#ece6dc", color: "#5f564e" }}>
          Consulta productos, tallas, similares o tus pedidos de forma comoda.
          <span className="absolute -bottom-2 right-6 h-4 w-4 rotate-45 border-r border-b bg-white" style={{ borderColor: "#ece6dc" }} />
        </div>
      ) : null}

      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="fixed bottom-4 right-4 z-50 flex h-16 w-16 items-center justify-center rounded-full bg-[#111111] text-white shadow-[0_20px_45px_rgba(17,17,17,0.25)] transition-transform hover:-translate-y-1"
        aria-label="Abrir asistente de FitAndes"
      >
        <MessageIcon />
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

function MessageIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <path d="M7 18l-3 2V6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H7Z" />
      <path d="M8 9h8" />
      <path d="M8 13h5" />
    </svg>
  );
}
