"use client";

import Image from "next/image";
import { FiX } from "react-icons/fi";
import { formatPrice } from "@/lib/format";
import { Card } from "@/components/ui/Card";
import type { EvaluatedLineItem } from "@/types/promociones";

interface CartItem {
  id: string;
  productoId?: string;
  variantId?: string | null;
  nombre: string;
  modelo?: string | null;
  color: string;
  talla: string;
  cantidad: number;
  precio: number;
  precioLista?: number | null;
  imagen?: string | null;
  stockDisponible?: number;
}

interface Props {
  items: CartItem[];
  evaluatedItems?: EvaluatedLineItem[];
  updateQuantity: (id: string, quantity: number) => void;
  removeItem: (id: string) => void;
}

function findEvaluatedLine(item: CartItem, evaluatedItems?: EvaluatedLineItem[]): EvaluatedLineItem | null {
  if (!evaluatedItems || evaluatedItems.length === 0) return null;
  return (
    evaluatedItems.find(
      (line) =>
        line.productoId === item.productoId &&
        ((item.variantId && line.varianteId === item.variantId) ||
          (line.color === item.color && line.talla === item.talla)),
    ) ?? null
  );
}

/**
 * Displays the list of items in the cart for review during checkout.
 * Fully responsive: compact e-commerce cards on mobile (zero horizontal overflow)
 * and structured table columns on desktop.
 */
export function CheckoutCartSummary({ items, evaluatedItems, updateQuantity, removeItem }: Props) {
  return (
    <Card padding="none" className="w-full max-w-full min-w-0 overflow-hidden rounded-[22px] sm:rounded-[28px]">
      <div className="hidden border-b border-border/60 px-6 py-4 text-[10px] uppercase tracking-[0.14em] text-subtle md:grid md:grid-cols-[minmax(0,1fr)_120px_140px_88px] md:gap-4">
        <span>Producto</span>
        <span className="text-center">Cantidad</span>
        <span className="text-right">Precio</span>
        <span className="text-right">Acciones</span>
      </div>

      <div className="divide-y divide-border/50">
        {items.map((item) => {
          const evaluated = findEvaluatedLine(item, evaluatedItems);
          const unitPrice = evaluated?.precioUnitario ?? item.precio;
          const unitListPrice =
            evaluated?.precioLista != null
              ? evaluated.precioLista > unitPrice
                ? evaluated.precioLista
                : null
              : item.precioLista && item.precioLista > unitPrice
                ? item.precioLista
                : null;
          const lineBase = unitPrice * item.cantidad;
          const lineFinal = evaluated?.totalLinea != null ? evaluated.totalLinea : lineBase;
          const linePromoDiscount = evaluated?.descuentoPromociones ?? 0;

          return (
            <article
              key={item.id}
              className="w-full min-w-0 px-3.5 py-4 sm:px-6 sm:py-5 md:grid md:grid-cols-[minmax(0,1fr)_120px_140px_88px] md:items-center md:gap-4"
            >
              {/* Foto + Info principal */}
              <div className="flex items-start gap-3 sm:gap-4 min-w-0">
                <div className="relative h-20 w-[68px] sm:h-24 sm:w-20 shrink-0 overflow-hidden rounded-[14px] sm:rounded-[18px] border border-border/50 bg-surface/30">
                  {item.imagen ? (
                    <Image src={item.imagen} alt={item.nombre} fill sizes="80px" className="object-cover" />
                  ) : (
                    <div className="flex h-full items-center justify-center text-[10px] uppercase text-subtle text-center px-1">
                      Sin foto
                    </div>
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <p className="min-w-0 flex-1 text-[13px] sm:text-sm font-medium uppercase leading-snug text-foreground break-words">
                      {item.nombre}
                    </p>
                    <button
                      type="button"
                      onClick={() => removeItem(item.id)}
                      className="md:hidden shrink-0 -mt-0.5 -mr-1 inline-flex h-7 w-7 items-center justify-center rounded-full text-subtle hover:bg-surface hover:text-danger transition-colors cursor-pointer"
                      aria-label={`Quitar ${item.nombre}`}
                    >
                      <FiX className="h-4 w-4" />
                    </button>
                  </div>

                  {item.modelo && (
                    <p className="mt-0.5 text-[10px] uppercase tracking-wider text-subtle break-words">
                      {item.modelo}
                    </p>
                  )}

                  <div className="mt-2 flex flex-wrap items-center gap-1.5">
                    <span className="inline-flex items-center rounded-full bg-surface/90 border border-border/60 px-2 py-0.5 text-[10.5px] font-medium text-foreground/90 max-w-full truncate">
                      {item.color} · Talla {item.talla}
                    </span>
                    {item.stockDisponible !== undefined && (
                      <span className="text-[10.5px] text-subtle whitespace-nowrap">
                        Disp: {item.stockDisponible}
                      </span>
                    )}
                  </div>

                  {linePromoDiscount > 0 && (
                    <span className="mt-1.5 inline-flex max-w-full rounded-full bg-success/10 px-2.5 py-0.5 text-[10px] font-medium leading-snug text-success">
                      Promo: -{formatPrice(linePromoDiscount)}
                    </span>
                  )}
                </div>
              </div>

              {/* Fila inferior en móvil (Cantidad + Precio en una sola línea limpia) / Columnas 2 y 3 en desktop */}
              <div className="mt-3 pt-3 border-t border-border/40 flex items-center justify-between gap-3 md:contents">
                <div className="flex items-center md:justify-center shrink-0">
                  <div className="inline-flex items-center rounded-full border border-border bg-white shadow-2xs">
                    <button
                      type="button"
                      onClick={() => updateQuantity(item.id, item.cantidad - 1)}
                      className="h-8 w-8 sm:h-9 sm:w-9 text-sm sm:text-base hover:bg-surface rounded-l-full transition-colors cursor-pointer"
                      aria-label={`Reducir cantidad de ${item.nombre}`}
                    >
                      -
                    </button>
                    <span className="flex h-8 sm:h-9 min-w-8 items-center justify-center text-xs sm:text-sm font-semibold tabular-nums">
                      {item.cantidad}
                    </span>
                    <button
                      type="button"
                      onClick={() => updateQuantity(item.id, item.cantidad + 1)}
                      className="h-8 w-8 sm:h-9 sm:w-9 text-sm sm:text-base hover:bg-surface rounded-r-full transition-colors cursor-pointer"
                      aria-label={`Aumentar cantidad de ${item.nombre}`}
                    >
                      +
                    </button>
                  </div>
                </div>

                <div className="min-w-0 text-right">
                  <div className="flex flex-wrap items-baseline justify-end gap-x-2 gap-y-0.5 md:block">
                    <p
                      className={`text-[15px] sm:text-base font-serif font-semibold whitespace-nowrap ${unitListPrice || lineFinal < lineBase ? "text-danger" : "text-foreground"
                        }`}
                    >
                      {formatPrice(lineFinal)}
                    </p>
                    {unitListPrice ? (
                      <p className="text-[11px] line-through text-subtle whitespace-nowrap">
                        {formatPrice(unitListPrice * item.cantidad)}
                      </p>
                    ) : lineFinal < lineBase ? (
                      <p className="text-[11px] line-through text-subtle whitespace-nowrap">
                        {formatPrice(lineBase)}
                      </p>
                    ) : null}
                  </div>
                  <p className="text-[10.5px] sm:text-[11px] mt-0.5 text-subtle whitespace-nowrap">
                    {formatPrice(unitPrice)} c/u
                  </p>
                </div>
              </div>

              {/* Columna 4: Quitar en desktop */}
              <div className="hidden md:flex md:justify-end">
                <button
                  type="button"
                  onClick={() => removeItem(item.id)}
                  className="inline-flex items-center justify-center rounded-full border border-border px-4 py-2 text-[10px] uppercase tracking-[0.14em] text-subtle transition-colors hover:bg-surface hover:text-danger cursor-pointer"
                  aria-label={`Quitar ${item.nombre}`}
                >
                  Quitar
                </button>
              </div>
            </article>
          );
        })}
      </div>
    </Card>
  );
}
