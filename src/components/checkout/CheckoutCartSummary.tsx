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
    <Card padding="none" className="overflow-hidden">
      <div className="hidden md:grid grid-cols-[minmax(0,1fr)_120px_120px_48px] gap-4 px-6 py-4 border-b text-[10px] uppercase tracking-[0.14em] text-subtle border-border/60">
        <span>Producto</span>
        <span className="text-center">Cantidad</span>
        <span className="text-right">Precio</span>
        <span className="sr-only">Acciones</span>
      </div>

      <div className="divide-y divide-border/40">
        {items.map((item) => (
          <article key={item.id} className="grid gap-4 md:grid-cols-[minmax(0,1fr)_120px_120px_48px] px-5 sm:px-6 py-5 items-center">
            <div className="flex gap-4 min-w-0">
              <div className="relative h-24 w-20 shrink-0 overflow-hidden border border-border/50 bg-surface/30">
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
                  <p className="text-[10px] mt-1 uppercase tracking-wider text-subtle">
                    {item.modelo}
                  </p>
                )}
                <p className="text-[11px] mt-2 text-muted">
                  Variante: {item.color} / {item.talla}
                </p>
                {item.stockDisponible !== undefined && (
                  <p className="text-[11px] mt-1 text-muted">
                    Stock disponible: {item.stockDisponible}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center md:justify-center">
              <div className="inline-flex items-center border border-border bg-white">
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

            <div className="md:text-right">
              <p className="text-base text-foreground font-serif">
                {formatPrice(item.precio * item.cantidad)}
              </p>
              <p className="text-[11px] mt-1 text-subtle">
                {formatPrice(item.precio)} c/u
              </p>
            </div>

            <div className="flex md:justify-end">
              <button
                type="button"
                onClick={() => removeItem(item.id)}
                className="flex h-10 w-10 items-center justify-center text-lg transition-opacity hover:opacity-50 text-subtle"
                aria-label={`Quitar ${item.nombre}`}
              >
                ×
              </button>
            </div>
          </article>
        ))}
      </div>
    </Card>
  );
}
