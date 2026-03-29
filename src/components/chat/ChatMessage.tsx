"use client";

import QuickActions from "@/components/chat/QuickActions";
import ProductCardMessage from "@/components/chat/ProductCardMessage";
import type { ChatAction, ProductCardData, TranscriptMessage } from "@/lib/chat/types";

interface Props {
  message: TranscriptMessage;
  onAction: (action: ChatAction) => void;
  onSuggestion: (text: string) => void;
  onAddToCart: (card: ProductCardData, selection: { color: string; talla: string; cantidad: number }) => void;
}

export default function ChatMessage({ message, onAction, onSuggestion, onAddToCart }: Props) {
  const isUser = message.role === "user";

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div className={`max-w-[92%] ${isUser ? "items-end" : "items-start"} flex flex-col gap-2`}>
        <div
          className={`rounded-[28px] px-4 py-3 text-sm leading-relaxed ${isUser ? "text-white" : "text-[#1a1a1a]"}`}
          style={{
            background: isUser ? "#111111" : "#f0ece6",
            border: isUser ? "none" : "1px solid #e4dbd0",
          }}
        >
          {message.text}
        </div>

        {message.attachments?.length ? (
          <div className="flex flex-wrap gap-2">
            {message.attachments.map((attachment) =>
              attachment.previewUrl ? (
                <img key={attachment.previewUrl} src={attachment.previewUrl} alt={attachment.name ?? "Adjunto"} className="h-24 w-24 rounded-2xl object-cover" />
              ) : null,
            )}
          </div>
        ) : null}

        {message.cards?.map((card) => {
          if (card.type === "product") {
            return <ProductCardMessage key={`product-${card.id}`} card={card} onAction={onAction} onAdd={onAddToCart} />;
          }

          return (
            <article key={`order-${card.id}`} className="w-full rounded-[28px] border bg-white p-4 shadow-[0_18px_35px_rgba(17,17,17,0.06)]" style={{ borderColor: "#ece6dc" }}>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[11px] uppercase" style={{ letterSpacing: "0.12em", color: "#8f8478" }}>
                    Pedido
                  </p>
                  <h3 className="mt-1 text-lg" style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}>
                    {card.title}
                  </h3>
                  <p className="mt-1 text-sm" style={{ color: "#5f564e" }}>
                    {card.subtitle}
                  </p>
                </div>
                <span className="rounded-full px-3 py-1 text-[11px] uppercase" style={{ letterSpacing: "0.12em", background: "#f0ece6", color: "#6b6058" }}>
                  {card.status}
                </span>
              </div>

              <p className="mt-3 text-sm" style={{ color: "#1a1a1a" }}>
                Total: <strong>Bs. {card.total.toFixed(2)}</strong>
              </p>

              {card.items.length > 0 ? (
                <div className="mt-3 flex flex-col gap-2">
                  {card.items.slice(0, 3).map((item, index) => (
                    <div key={`${card.id}-${index}`} className="text-sm" style={{ color: "#6b6058" }}>
                      {item.nombre} · {item.cantidad}
                      {item.color ? ` · ${item.color}` : ""}
                      {item.talla ? ` · ${item.talla}` : ""}
                    </div>
                  ))}
                </div>
              ) : null}

              <QuickActions actions={card.actions} onAction={onAction} suggestions={[]} onSuggestion={onSuggestion} />
            </article>
          );
        })}

        {!isUser ? <QuickActions actions={message.actions} suggestions={message.suggestions} onAction={onAction} onSuggestion={onSuggestion} /> : null}
      </div>
    </div>
  );
}

