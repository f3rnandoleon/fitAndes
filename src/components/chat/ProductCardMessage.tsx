"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import type { ChatAction, ProductCardData } from "@/lib/chat/types";
import { catalogVariantIsAvailable, getCatalogVariantAvailableStock } from "@/types/catalogo";

interface AddSelection {
  color: string;
  talla: string;
  cantidad: number;
}

interface Props {
  card: ProductCardData;
  onAction: (action: ChatAction) => void;
  onAdd: (card: ProductCardData, selection: AddSelection) => void;
}

function unique<T>(items: T[]): T[] {
  return Array.from(new Set(items));
}

export default function ProductCardMessage({ card, onAction, onAdd }: Props) {
  const availableVariants = card.variants.filter(catalogVariantIsAvailable);
  const [selectedColor, setSelectedColor] = useState(card.preferredColor ?? availableVariants[0]?.color ?? "");
  const [selectedTalla, setSelectedTalla] = useState(card.preferredTalla ?? availableVariants[0]?.talla ?? "");
  const [cantidad, setCantidad] = useState(card.preferredQuantity ?? 1);

  const colors = unique(availableVariants.map((variant) => variant.color));
  const tallasDisponibles = unique(
    availableVariants.filter((variant) => !selectedColor || variant.color === selectedColor).map((variant) => variant.talla),
  );

  useEffect(() => {
    if (!selectedColor && colors[0]) {
      setSelectedColor(colors[0]);
    }
  }, [colors, selectedColor]);

  useEffect(() => {
    if (selectedTalla && tallasDisponibles.includes(selectedTalla)) return;
    if (card.preferredTalla && tallasDisponibles.includes(card.preferredTalla)) {
      setSelectedTalla(card.preferredTalla);
      return;
    }
    setSelectedTalla(tallasDisponibles[0] ?? "");
  }, [card.preferredTalla, selectedTalla, tallasDisponibles]);

  const selectedVariant =
    availableVariants.find((variant) => variant.color === selectedColor && variant.talla === selectedTalla) ??
    availableVariants.find((variant) => variant.color === selectedColor) ??
    availableVariants[0] ??
    null;

  const stock = selectedVariant ? getCatalogVariantAvailableStock(selectedVariant) : 0;
  const canAdd = Boolean(selectedVariant && stock > 0);

  return (
    <article className="overflow-hidden rounded-[28px] border bg-white shadow-[0_18px_35px_rgba(17,17,17,0.06)]" style={{ borderColor: "#ece6dc" }}>
      <div className="grid gap-0 sm:grid-cols-[120px_minmax(0,1fr)]">
        <div className="relative h-full min-h-[160px] overflow-hidden" style={{ background: "#f3eee8" }}>
          {card.image ? <Image src={card.image} alt={card.title} fill sizes="120px" className="object-cover" /> : null}
        </div>

        <div className="p-4 sm:p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[11px] uppercase" style={{ letterSpacing: "0.12em", color: "#8f8478" }}>
                {card.model}
              </p>
              <h3 className="mt-1 text-lg" style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}>
                {card.title}
              </h3>
              <p className="mt-1 text-sm" style={{ color: "#5f564e" }}>
                {card.subtitle}
              </p>
            </div>
            <a href={card.detailHref} className="text-[11px] uppercase transition-opacity hover:opacity-60" style={{ letterSpacing: "0.12em", color: "#8f8478" }}>
              Web
            </a>
          </div>

          {card.description ? (
            <p className="mt-3 text-sm leading-relaxed" style={{ color: "#6b6058" }}>
              {card.description}
            </p>
          ) : null}

          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <label className="text-xs uppercase" style={{ letterSpacing: "0.12em", color: "#8f8478" }}>
              Color
              <select
                value={selectedColor}
                onChange={(event) => setSelectedColor(event.target.value)}
                className="mt-2 w-full border px-3 py-2 text-sm"
                style={{ borderColor: "#ddd5cb", background: "#fff" }}
              >
                {colors.map((color) => (
                  <option key={color} value={color}>
                    {color}
                  </option>
                ))}
              </select>
            </label>

            <label className="text-xs uppercase" style={{ letterSpacing: "0.12em", color: "#8f8478" }}>
              Talla
              <select
                value={selectedTalla}
                onChange={(event) => setSelectedTalla(event.target.value)}
                className="mt-2 w-full border px-3 py-2 text-sm"
                style={{ borderColor: "#ddd5cb", background: "#fff" }}
              >
                {tallasDisponibles.map((talla) => (
                  <option key={talla} value={talla}>
                    {talla}
                  </option>
                ))}
              </select>
            </label>

            <label className="text-xs uppercase" style={{ letterSpacing: "0.12em", color: "#8f8478" }}>
              Cantidad
              <input
                type="number"
                min={1}
                max={Math.max(stock, 1)}
                value={cantidad}
                onChange={(event) => {
                  const nextValue = Number(event.target.value);
                  setCantidad(Number.isFinite(nextValue) ? Math.max(1, Math.min(nextValue, Math.max(stock, 1))) : 1);
                }}
                className="mt-2 w-full border px-3 py-2 text-sm"
                style={{ borderColor: "#ddd5cb", background: "#fff" }}
              />
            </label>
          </div>

          <p className="mt-3 text-xs uppercase" style={{ letterSpacing: "0.12em", color: stock > 0 ? "#4f7a57" : "#a54a3f" }}>
            {stock > 0 ? `${stock} disponibles en esta variante` : "Sin stock en esta variante"}
          </p>

          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              disabled={!canAdd}
              onClick={() => selectedVariant && onAdd(card, { color: selectedVariant.color, talla: selectedVariant.talla, cantidad })}
              className="rounded-full px-4 py-2 text-[11px] uppercase text-white transition-opacity disabled:cursor-not-allowed disabled:opacity-45 hover:opacity-85"
              style={{ letterSpacing: "0.14em", background: "#111111" }}
            >
              Agregar a reserva
            </button>
            {card.actions?.map((action) => (
              <button
                key={`${action.type}-${action.productId ?? action.label}`}
                type="button"
                onClick={() => onAction(action)}
                className="rounded-full border px-4 py-2 text-[11px] uppercase transition-colors hover:bg-[#f0ece6]"
                style={{ letterSpacing: "0.14em", borderColor: "#ddd5cb", color: "#5f564e" }}
              >
                {action.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </article>
  );
}




