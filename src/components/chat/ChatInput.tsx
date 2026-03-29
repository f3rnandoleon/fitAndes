"use client";

import { useId, useRef, useState, type ChangeEvent } from "react";
import type { ChatAttachment, ChatAttachmentPreview } from "@/lib/chat/types";

export interface ChatInputPreparedAttachment extends ChatAttachment, ChatAttachmentPreview {}

interface SubmitPayload {
  message: string;
  displayText: string;
  attachments: ChatInputPreparedAttachment[];
}

interface Props {
  disabled?: boolean;
  onSubmit: (payload: SubmitPayload) => Promise<void> | void;
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === "string" ? reader.result : "";
      const base64 = result.includes(",") ? result.split(",")[1] : result;
      resolve(base64);
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

export default function ChatInput({ disabled = false, onSubmit }: Props) {
  const inputId = useId();
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [message, setMessage] = useState("");
  const [attachment, setAttachment] = useState<ChatInputPreparedAttachment | null>(null);
  const [loadingFile, setLoadingFile] = useState(false);

  async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) return;
    if (file.size > 5 * 1024 * 1024) return;

    setLoadingFile(true);
    try {
      const base64 = await fileToBase64(file);
      setAttachment({
        name: file.name,
        mimeType: file.type,
        data: base64,
        previewUrl: URL.createObjectURL(file),
      });
    } finally {
      setLoadingFile(false);
    }
  }

  async function handleSubmit() {
    const trimmed = message.trim();
    if (!trimmed && !attachment) return;

    await onSubmit({
      message: trimmed || "Buscame algo parecido a esta prenda",
      displayText: trimmed || "Quiero algo parecido a esta imagen",
      attachments: attachment ? [attachment] : [],
    });

    setMessage("");
    setAttachment(null);
    if (fileRef.current) fileRef.current.value = "";
  }

  return (
    <div className="border-t px-4 py-4" style={{ borderColor: "#ece6dc", background: "#fbf9f5" }}>
      {attachment ? (
        <div className="mb-3 flex items-center gap-3 rounded-2xl border bg-white px-3 py-2" style={{ borderColor: "#ece6dc" }}>
          {attachment.previewUrl ? <img src={attachment.previewUrl} alt={attachment.name ?? "Adjunto"} className="h-14 w-14 rounded-xl object-cover" /> : null}
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm" style={{ color: "#1a1a1a" }}>
              {attachment.name ?? "Imagen adjunta"}
            </p>
            <p className="text-xs" style={{ color: "#8f8478" }}>
              La imagen se usa para buscar parecido aproximado
            </p>
          </div>
          <button type="button" onClick={() => setAttachment(null)} className="text-xs uppercase" style={{ letterSpacing: "0.12em", color: "#8f8478" }}>
            Quitar
          </button>
        </div>
      ) : null}

      <div className="flex items-end gap-2">
        <button
          type="button"
          disabled={disabled || loadingFile}
          onClick={() => fileRef.current?.click()}
          className="flex h-11 w-11 items-center justify-center rounded-full border transition-colors hover:bg-white disabled:opacity-45"
          style={{ borderColor: "#ddd5cb", color: "#5f564e" }}
          aria-label="Adjuntar imagen"
        >
          +
        </button>

        <label htmlFor={inputId} className="sr-only">
          Escribe tu mensaje
        </label>
        <textarea
          id={inputId}
          rows={1}
          value={message}
          disabled={disabled}
          onChange={(event) => setMessage(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              void handleSubmit();
            }
          }}
          placeholder="Escribe lo que buscas o sube una imagen"
          className="max-h-28 min-h-11 flex-1 resize-none rounded-[22px] border px-4 py-3 text-sm focus:outline-none disabled:opacity-45"
          style={{ borderColor: "#ddd5cb", background: "white" }}
        />

        <button
          type="button"
          disabled={disabled || loadingFile || (!message.trim() && !attachment)}
          onClick={() => void handleSubmit()}
          className="rounded-full bg-[#111111] px-4 py-3 text-[11px] uppercase text-white transition-opacity hover:opacity-85 disabled:opacity-45"
          style={{ letterSpacing: "0.14em" }}
        >
          Enviar
        </button>
      </div>

      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
    </div>
  );
}

