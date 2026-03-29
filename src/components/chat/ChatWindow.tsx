"use client";

import { useEffect, useRef, type CSSProperties } from "react";
import ChatInput from "@/components/chat/ChatInput";
import ChatMessage from "@/components/chat/ChatMessage";
import type { ChatAction, ProductCardData, TranscriptMessage } from "@/lib/chat/types";

type WindowMode = "compact" | "wide" | "full";

interface Props {
  open: boolean;
  mode: WindowMode;
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
  onCycleSize: () => void;
  onToggleFullscreen: () => void;
  onClearChat: () => void;
}

function shellClass(mode: WindowMode): string {
  if (mode === "full") return "inset-0 h-screen w-screen rounded-none";
  if (mode === "wide") return "bottom-6 right-6 h-[min(86vh,820px)] w-[min(760px,calc(100vw-2rem))] rounded-[32px]";
  return "bottom-24 right-4 h-[min(78vh,680px)] w-[min(420px,calc(100vw-2rem))] rounded-[32px]";
}

function shellStyle(mode: WindowMode): CSSProperties {
  if (mode === "full") {
    return { borderColor: "#ece6dc" };
  }

  return {
    borderColor: "#ece6dc",
    resize: "both",
    minWidth: 340,
    minHeight: 480,
    maxWidth: "calc(100vw - 1rem)",
    maxHeight: "calc(100vh - 1rem)",
  };
}

function iconButtonStyle(): CSSProperties {
  return {
    borderColor: "#ddd5cb",
    color: "#5f564e",
  };
}

export default function ChatWindow({
  open,
  mode,
  loading,
  messages,
  onClose,
  onSubmit,
  onAction,
  onSuggestion,
  onAddToCart,
  onCycleSize,
  onToggleFullscreen,
  onClearChat,
}: Props) {
  const listRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, open]);

  if (!open) return null;

  return (
    <>
      <div className="fixed inset-0 z-40 bg-[rgba(17,17,17,0.18)] backdrop-blur-[2px]" onClick={onClose} />
      <section className={`fixed z-50 flex flex-col overflow-hidden border bg-[#fbf9f5] shadow-[0_30px_70px_rgba(17,17,17,0.18)] ${shellClass(mode)}`} style={shellStyle(mode)}>
        <header className="flex items-center justify-between border-b px-5 py-4" style={{ borderColor: "#ece6dc" }}>
          <div>
            <p className="text-[11px] uppercase" style={{ letterSpacing: "0.18em", color: "#8f8478" }}>
              FitAndes Chat
            </p>
            <h2 className="mt-1 text-xl" style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}>
              Asistente de productos
            </h2>
            <p className="mt-1 text-xs" style={{ color: "#8f8478" }}>
              Consulta comoda por texto, imagen, similares y pedidos
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onCycleSize}
              className="flex h-10 w-10 items-center justify-center rounded-full border transition-colors hover:bg-white"
              style={iconButtonStyle()}
              aria-label={mode === "compact" ? "Ampliar chat" : "Compactar chat"}
              title={mode === "compact" ? "Ampliar" : "Compactar"}
            >
              {mode === "compact" ? <ExpandIcon /> : <CollapseIcon />}
            </button>
            <button
              type="button"
              onClick={onToggleFullscreen}
              className="flex h-10 w-10 items-center justify-center rounded-full border transition-colors hover:bg-white"
              style={iconButtonStyle()}
              aria-label={mode === "full" ? "Salir de pantalla completa" : "Pantalla completa"}
              title={mode === "full" ? "Minimizar" : "Maximizar"}
            >
              {mode === "full" ? <MinimizeIcon /> : <MaximizeIcon />}
            </button>
            <button
              type="button"
              onClick={onClearChat}
              className="flex h-10 w-10 items-center justify-center rounded-full border transition-colors hover:bg-white"
              style={iconButtonStyle()}
              aria-label="Limpiar chat"
              title="Limpiar chat"
            >
              <TrashIcon />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex h-10 w-10 items-center justify-center rounded-full border transition-colors hover:bg-white"
              style={iconButtonStyle()}
              aria-label="Cerrar chat"
              title="Cerrar"
            >
              <CloseIcon />
            </button>
          </div>
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
    </>
  );
}

function ExpandIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <path d="M8 3H3v5" />
      <path d="M3 3l7 7" />
      <path d="M16 21h5v-5" />
      <path d="M21 21l-7-7" />
    </svg>
  );
}

function CollapseIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <path d="M10 10H3V3" />
      <path d="M3 10l7-7" />
      <path d="M14 14h7v7" />
      <path d="M21 14l-7 7" />
    </svg>
  );
}

function MaximizeIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <rect x="4" y="4" width="16" height="16" rx="2" />
      <path d="M9 4v4H5" />
      <path d="M15 20v-4h4" />
    </svg>
  );
}

function MinimizeIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <rect x="4" y="4" width="16" height="16" rx="2" />
      <path d="M9 9h6" />
      <path d="M9 15h6" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <path d="M4 7h16" />
      <path d="M10 11v6" />
      <path d="M14 11v6" />
      <path d="M6 7l1 12h10l1-12" />
      <path d="M9 7V4h6v3" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <path d="M6 6l12 12" />
      <path d="M18 6L6 18" />
    </svg>
  );
}
