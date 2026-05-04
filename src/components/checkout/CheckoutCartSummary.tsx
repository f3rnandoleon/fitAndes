"use client";

import Image from "next/image";
import { formatPrice } from "@/lib/format";
import { Card } from "@/components/ui/Card";

interface CartItem {
  id: string;
  nombre: string;
  modelo?: string | null;
  color: string;
  talla: string;
  cantidad: number;
  precio: number;
  imagen?: string | null;
  stockDisponible?: number;
}

interface Props {
  items: CartItem[];
  updateQuantity: (id: string, quantity: number) => void;
  removeItem: (id: string) => void;
}

/**
 * Displays the list of items in the cart for review during checkout.
 */
export function CheckoutCartSummary({ items, updateQuantity, removeItem }: Props) {
  return (
    <Card padding="none" className="overflow-hidden rounded-[28px]">
      <div className="hidden border-b border-border/60 px-6 py-4 text-[10px] uppercase tracking-[0.14em] text-subtle md:grid md:grid-cols-[minmax(0,1fr)_120px_120px_88px] md:gap-4">
        <span>Producto</span>
        <span className="text-center">Cantidad</span>
        <span className="text-right">Precio</span>
        <span className="text-right">Acciones</span>
      </div>

      <div className="divide-y divide-border/40">
        {items.map((item) => (
          <article key={item.id} className="grid gap-4 px-4 py-5 sm:px-6 md:grid-cols-[minmax(0,1fr)_120px_120px_88px] md:items-center">
            <div className="flex gap-4 min-w-0">
              <div className="relative h-24 w-20 shrink-0 overflow-hidden rounded-[18px] border border-border/50 bg-surface/30">
                {item.imagen ? (
                  <Image src={item.imagen} alt={item.nombre} fill sizes="80px" className="object-cover" />
                ) : (
                  <div className="flex h-full items-center justify-center text-[10px] uppercase text-subtle">
                    Sin foto
                  </div>
                )}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium uppercase leading-snug text-foreground">
                  {item.nombre}
                </p>
                {item.modelo && (
                  <p className="mt-1 text-[10px] uppercase tracking-wider text-subtle">
                    {item.modelo}
                  </p>
                )}
                <p className="mt-2 text-[11px] text-muted">
                  Variante: {item.color} / {item.talla}
                </p>
                {item.stockDisponible !== undefined && (
                  <p className="mt-1 text-[11px] text-muted">
                    Stock disponible: {item.stockDisponible}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between gap-3 md:justify-center">
              <span className="text-[10px] uppercase tracking-[0.14em] text-subtle md:hidden">Cantidad</span>
              <div className="inline-flex items-center rounded-full border border-border bg-white">
                <button
                  type="button"
                  onClick={() => updateQuantity(item.id, item.cantidad - 1)}
                  className="h-10 w-10 text-base hover:bg-surface transition-colors"
                  aria-label={`Reducir cantidad de ${item.nombre}`}
                >
                  -
                </button>
                <span className="flex h-10 min-w-10 items-center justify-center text-sm font-medium">
                  {item.cantidad}
                </span>
                <button
                  type="button"
                  onClick={() => updateQuantity(item.id, item.cantidad + 1)}
                  className="h-10 w-10 text-base hover:bg-surface transition-colors"
                  aria-label={`Aumentar cantidad de ${item.nombre}`}
                >
                  +
                </button>
              </div>
            </div>

            <div className="flex items-end justify-between gap-3 md:block md:text-right">
              <div>
                <p className="text-[10px] uppercase tracking-[0.14em] text-subtle md:hidden">Precio</p>
                <p className="mt-1 text-base font-serif text-foreground md:mt-0">
                  {formatPrice(item.precio * item.cantidad)}
                </p>
                <p className="text-[11px] mt-1 text-subtle">
                  {formatPrice(item.precio)} c/u
                </p>
              </div>
              <button
                type="button"
                onClick={() => removeItem(item.id)}
                className="inline-flex items-center justify-center rounded-full border px-4 py-2 text-[10px] uppercase tracking-[0.14em] text-subtle transition-colors hover:bg-surface md:hidden"
                aria-label={`Quitar ${item.nombre}`}
              >
                Quitar
              </button>
            </div>

            <div className="hidden md:flex md:justify-end">
              <button
                type="button"
                onClick={() => removeItem(item.id)}
                className="inline-flex items-center justify-center rounded-full border border-border px-4 py-2 text-[10px] uppercase tracking-[0.14em] text-subtle transition-colors hover:bg-surface"
                aria-label={`Quitar ${item.nombre}`}
              >
                Quitar
              </button>
            </div>
          </article>
        ))}
      </div>
    </Card>
  );
}
