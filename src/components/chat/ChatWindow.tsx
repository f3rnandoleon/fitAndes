"use client";

import { useEffect, useRef } from "react";
import ChatInput from "@/components/chat/ChatInput";
import ChatMessage from "@/components/chat/ChatMessage";
import type { ChatAction, ProductCardData, TranscriptMessage } from "@/lib/chat/types";

interface Props {
  open: boolean;
  loading: boolean;
  messages: TranscriptMessage[];
  onClose: () => void;
  onSubmit: (payload: {
    message: string;
    displayText: string;
    attachments: Array<{ name?: string; mimeType: string; data: string; previewUrl?: string }>;
  }) => Promise<void>;
  onAction: (action: ChatAction) => void;
  onSuggestion: (text: string) => void;
  onAddToCart: (card: ProductCardData, selection: { color: string; talla: string; cantidad: number }) => void;
}

export default function ChatWindow({ open, loading, messages, onClose, onSubmit, onAction, onSuggestion, onAddToCart }: Props) {
  const listRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, open]);

  if (!open) return null;

  return (
    <section className="fixed bottom-24 right-4 z-50 flex h-[min(78vh,680px)] w-[min(420px,calc(100vw-2rem))] flex-col overflow-hidden rounded-[32px] border bg-[#fbf9f5] shadow-[0_30px_70px_rgba(17,17,17,0.18)]">
      <header className="flex items-center justify-between border-b px-5 py-4" style={{ borderColor: "#ece6dc" }}>
        <div>
          <p className="text-[11px] uppercase" style={{ letterSpacing: "0.18em", color: "#8f8478" }}>
            FitAndes Chat
          </p>
          <h2 className="mt-1 text-xl" style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}>
            Asistente de productos
          </h2>
          <p className="mt-1 text-xs" style={{ color: "#8f8478" }}>
            Texto + imagen con modo gratis y fallback por reglas
          </p>
        </div>
        <button type="button" onClick={onClose} className="rounded-full border px-3 py-2 text-[11px] uppercase" style={{ letterSpacing: "0.14em", borderColor: "#ddd5cb", color: "#5f564e" }}>
          Cerrar
        </button>
      </header>

      <div ref={listRef} className="flex-1 space-y-4 overflow-y-auto px-4 py-4">
        {messages.map((message) => (
          <ChatMessage key={message.id} message={message} onAction={onAction} onSuggestion={onSuggestion} onAddToCart={onAddToCart} />
        ))}
        {loading ? (
          <div className="inline-flex rounded-[24px] border px-4 py-3 text-sm" style={{ borderColor: "#ece6dc", background: "#f0ece6", color: "#6b6058" }}>
            Pensando...
          </div>
        ) : null}
      </div>

      <ChatInput disabled={loading} onSubmit={onSubmit} />
    </section>
  );
}

