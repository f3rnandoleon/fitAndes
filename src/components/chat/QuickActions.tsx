"use client";

import type { ChatAction } from "@/lib/chat/types";

interface Props {
  actions?: ChatAction[];
  suggestions?: string[];
  onAction: (action: ChatAction) => void;
  onSuggestion: (text: string) => void;
}

export default function QuickActions({ actions = [], suggestions = [], onAction, onSuggestion }: Props) {
  if (actions.length === 0 && suggestions.length === 0) return null;

  return (
    <div className="mt-3 flex flex-wrap gap-2">
      {actions.map((action) => (
        <button
          key={`${action.type}-${action.productId ?? action.orderId ?? action.href ?? action.label}`}
          type="button"
          onClick={() => onAction(action)}
          className="rounded-full border px-3 py-1.5 text-[11px] uppercase transition-colors hover:bg-[#f0ece6]"
          style={{ letterSpacing: "0.12em", borderColor: "#ddd5cb", color: "#5f564e" }}
        >
          {action.label}
        </button>
      ))}
      {suggestions.map((suggestion) => (
        <button
          key={suggestion}
          type="button"
          onClick={() => onSuggestion(suggestion)}
          className="rounded-full border px-3 py-1.5 text-[11px] uppercase transition-colors hover:bg-[#f0ece6]"
          style={{ letterSpacing: "0.12em", borderColor: "#ddd5cb", color: "#5f564e" }}
        >
          {suggestion}
        </button>
      ))}
    </div>
  );
}

