"use client";

import { formatPrice } from "@/lib/format";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

interface Props {
  totalAmount: number;
  totalItems: number;
  shippingCost?: number;
  shippingLabel?: string;
  loading: boolean;
  error?: string;
  onSubmit: () => void;
  authenticated: boolean;
}

/**
 * Componente lateral/inferior de resumen de compra con soporte para invitados y costo de envío.
 */
export function CheckoutSummarySidebar({
  totalAmount,
  totalItems,
  shippingCost = 0,
  shippingLabel = "Gratis",
  loading,
  error,
  onSubmit,
  authenticated,
}: Props) {
  const finalTotal = totalAmount + shippingCost;

  return (
    <>
      <div
        className="lg:hidden fixed inset-x-0 bottom-0 z-30 border-t bg-[rgba(251,249,245,0.98)] backdrop-blur-md mobile-safe-bottom"
        style={{ borderColor: "#ece6dc" }}
      >
        <div className="mx-auto flex max-w-[1240px] flex-col gap-2.5 px-4 pt-3 pb-2">
          {error ? (
            <div className="rounded-[14px] border border-danger/30 bg-danger/10 px-3.5 py-2 text-xs text-danger font-medium">
              {error}
            </div>
          ) : null}

          <div className="flex items-center gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-[10px] uppercase tracking-[0.16em] text-subtle">
                Total {shippingCost > 0 ? "(con envío)" : ""}
              </p>
              <p className="text-xl font-serif font-bold text-foreground">
                {formatPrice(finalTotal)}
              </p>
              <p className="text-[11px] text-muted truncate">
                {totalItems} prenda{totalItems !== 1 ? "s" : ""} · Envío: {shippingLabel}
              </p>
            </div>
            <Button
              variant="primary"
              size="md"
              className="min-w-[170px] shrink-0"
              loading={loading}
              onClick={onSubmit}
            >
              {authenticated ? "Confirmar pedido" : "Finalizar compra"}
            </Button>
          </div>
        </div>
      </div>

      <div className="hidden lg:block">
        <Card className="sticky top-24 space-y-6">
          <div>
            <p className="text-[10px] uppercase tracking-[0.16em] text-subtle mb-4">
              Resumen de compra
            </p>
            <div className="space-y-3">
              <div className="flex justify-between text-[11px] uppercase tracking-wider text-muted">
                <span>Prendas ({totalItems})</span>
                <span>{formatPrice(totalAmount)}</span>
              </div>
              <div className="flex justify-between text-[11px] uppercase tracking-wider text-muted">
                <span>Costo de envío</span>
                <span className={shippingCost === 0 ? "text-success font-medium" : "text-foreground font-medium"}>
                  {shippingLabel}
                </span>
              </div>
              <div className="pt-3 border-t border-border flex justify-between items-baseline">
                <span className="text-sm font-medium text-foreground uppercase tracking-widest">Total a pagar</span>
                <span className="text-2xl font-serif text-foreground font-bold">{formatPrice(finalTotal)}</span>
              </div>
            </div>
          </div>

          {error && (
            <div className="border border-danger/30 bg-danger/10 p-3 rounded-xl text-xs text-danger font-medium leading-relaxed">
              {error}
            </div>
          )}

          <Button
            variant="primary"
            size="lg"
            className="w-full"
            loading={loading}
            onClick={onSubmit}
          >
            {authenticated ? "Confirmar pedido" : "Confirmar como invitado"}
          </Button>

          <p className="text-[10px] text-center text-subtle leading-relaxed">
            Al confirmar tu pedido, aceptas nuestras{" "}
            <a href="/politicas" target="_blank" className="underline hover:text-foreground">
              políticas de reserva, cambios y entregas
            </a>.
          </p>
        </Card>
      </div>
    </>
  );
}
