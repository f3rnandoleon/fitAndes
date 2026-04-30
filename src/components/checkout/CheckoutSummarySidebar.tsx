"use client";

import { formatPrice } from "@/lib/format";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

interface Props {
  totalAmount: number;
  totalItems: number;
  loading: boolean;
  error?: string;
  onSubmit: () => void;
  authenticated: boolean;
}

/**
 * Sidebar component for checkout that shows the total and the submit button.
 */
export function CheckoutSummarySidebar({
  totalAmount,
  totalItems,
  loading,
  error,
  onSubmit,
  authenticated
}: Props) {
  return (
    <Card className="sticky top-24 space-y-6">
      <div>
        <p className="text-[10px] uppercase tracking-[0.16em] text-subtle mb-4">
          Resumen de compra
        </p>
        <div className="space-y-3">
          <div className="flex justify-between text-[11px] uppercase tracking-wider text-muted">
            <span>Productos ({totalItems})</span>
            <span>{formatPrice(totalAmount)}</span>
          </div>
          <div className="flex justify-between text-[11px] uppercase tracking-wider text-muted">
            <span>Envio</span>
            <span className="text-[10px]">Por calcular</span>
          </div>
          <div className="pt-3 border-t border-border flex justify-between items-baseline">
            <span className="text-sm font-medium text-foreground uppercase tracking-widest">Total</span>
            <span className="text-2xl font-serif text-foreground">{formatPrice(totalAmount)}</span>
          </div>
        </div>
      </div>

      {error && (
        <div className="border border-danger/20 bg-danger/5 px-4 py-3 text-xs text-danger">
          {error}
        </div>
      )}

      <Button
        variant="primary"
        size="lg"
        className="w-full"
        loading={loading}
        onClick={onSubmit}
        disabled={!authenticated}
      >
        {authenticated ? "Confirmar pedido" : "Inicia sesion para continuar"}
      </Button>

      <p className="text-[10px] text-center text-subtle leading-relaxed">
        Al confirmar tu pedido, aceptas nuestros terminos de reserva y politicas de entrega.
      </p>
    </Card>
  );
}
