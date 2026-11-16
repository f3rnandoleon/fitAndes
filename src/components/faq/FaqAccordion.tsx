"use client";

import { useState } from "react";
import { FiChevronDown } from "react-icons/fi";

export interface FaqEntry {
  pregunta: string;
  respuesta: string;
}

export default function FaqAccordion({ items }: { items: FaqEntry[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <div className="space-y-3">
      {items.map((faq, index) => {
        const isOpen = openIndex === index;
        return (
          <div
            key={index}
            className="overflow-hidden rounded-[var(--radius-md)] border border-border bg-white shadow-2xs transition-colors"
          >
            <button
              type="button"
              onClick={() => setOpenIndex(isOpen ? null : index)}
              aria-expanded={isOpen}
              className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left transition-colors hover:bg-surface/40 cursor-pointer"
            >
              <span className="text-sm sm:text-base font-medium text-foreground">
                {faq.pregunta}
              </span>
              <FiChevronDown
                className={`h-4 w-4 shrink-0 text-subtle transition-transform duration-200 ${
                  isOpen ? "rotate-180 text-foreground" : ""
                }`}
                aria-hidden="true"
              />
            </button>
            {isOpen && (
              <div className="border-t border-border/50 bg-background/50 px-5 py-4 text-sm sm:text-[15px] text-muted leading-relaxed">
                {faq.respuesta}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

