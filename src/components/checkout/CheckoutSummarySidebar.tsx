"use client";

import { useState, type FormEvent } from "react";
import { FiCheckCircle, FiTag, FiX } from "react-icons/fi";
import { formatPrice } from "@/lib/format";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import type { PricingSummary } from "@/types/promociones";

interface Props {
  totalAmount: number;
  totalItems: number;
  shippingCost?: number;
  shippingLabel?: string;
  pricingSummary?: PricingSummary | null;
  pricingLoading?: boolean;
  appliedCoupon?: string | null;
  couponLoading?: boolean;
  couponError?: string | null;
  couponSuccess?: string | null;
  onApplyCoupon?: (code: string) => Promise<void> | void;
  onRemoveCoupon?: () => Promise<void> | void;
  loading: boolean;
  disabled?: boolean;
  error?: string;
  onSubmit: () => void;
  authenticated: boolean;
}

export function resolveFinalCheckoutTotal(
  totalAmount: number,
  shippingCost: number,
  pricingSummary?: PricingSummary | null,
): number {
  if (!pricingSummary) {
    return totalAmount + shippingCost;
  }

  const netShipping = Math.max(0, shippingCost - (pricingSummary.descuentoEnvio ?? 0));
  const expectedWithoutShipping = Math.max(0, pricingSummary.subtotalPostCatalogo - pricingSummary.descuentoPromociones);

  // Si el servidor ya incorporó el flete neto en totalFinal, lo respetamos tal cual;
  // si totalFinal equivale exactamente al neto de prendas sin envío y hay flete pendiente, lo sumamos.
  if (
    netShipping > 0 &&
    Math.abs(pricingSummary.totalFinal - expectedWithoutShipping) < 0.01 &&
    Math.abs(pricingSummary.totalFinal - (expectedWithoutShipping + netShipping)) >= 0.01
  ) {
    return Number((pricingSummary.totalFinal + netShipping).toFixed(2));
  }

  return pricingSummary.totalFinal;
}

/**
 * Componente lateral/inferior de resumen de compra con soporte para cupones,
 * promociones automáticas, rebajas de catálogo y costo de envío.
 */
export function CheckoutSummarySidebar({
  totalAmount,
  totalItems,
  shippingCost = 0,
  shippingLabel = "Gratis",
  pricingSummary = null,
  pricingLoading = false,
  appliedCoupon = null,
  couponLoading = false,
  couponError = null,
  couponSuccess = null,
  onApplyCoupon,
  onRemoveCoupon,
  loading,
  disabled = false,
  error,
  onSubmit,
  authenticated,
}: Props) {
  const [couponInput, setCouponInput] = useState("");

  const finalTotal = resolveFinalCheckoutTotal(totalAmount, shippingCost, pricingSummary);
  const descuentoCatalogo = pricingSummary?.descuentoCatalogo ?? 0;
  const descuentoPromociones = pricingSummary?.descuentoPromociones ?? 0;
  const descuentoEnvio = pricingSummary?.descuentoEnvio ?? 0;
  const totalSavings = descuentoCatalogo + descuentoPromociones + descuentoEnvio;
  const subtotalBase = pricingSummary
    ? descuentoCatalogo > 0
      ? pricingSummary.subtotalLista
      : pricingSummary.subtotalPostCatalogo
    : totalAmount;
  const promocionesAplicadas = pricingSummary?.promocionesAplicadas ?? [];
  const netShipping = Math.max(0, shippingCost - descuentoEnvio);

  async function handleCouponSubmit(event: FormEvent) {
    event.preventDefault();
    const trimmed = couponInput.trim().toUpperCase();
    if (!trimmed || !onApplyCoupon) return;
    await onApplyCoupon(trimmed);
    setCouponInput("");
  }

  const couponSection = onApplyCoupon ? (
    <div className="pt-4 border-t border-border/70 space-y-2.5">
      <p className="text-[10px] uppercase tracking-[0.16em] text-subtle flex items-center gap-1.5">
        <FiTag className="h-3 w-3" aria-hidden="true" />
        Código de cupón
      </p>

      {appliedCoupon ? (
        <div className="flex items-center justify-between gap-2 rounded-xl border border-success/30 bg-success/10 px-3 py-2.5 sm:px-3.5">
          <div className="flex items-center gap-2 min-w-0">
            <FiCheckCircle className="h-4 w-4 text-success shrink-0" aria-hidden="true" />
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wider text-success truncate">
                {appliedCoupon}
              </p>
              <p className="text-[10px] text-success/80">Cupón aplicado</p>
            </div>
          </div>
          {onRemoveCoupon && (
            <button
              type="button"
              onClick={() => void onRemoveCoupon()}
              disabled={couponLoading}
              aria-label="Quitar cupón"
              className="shrink-0 inline-flex items-center gap-1 rounded-full border border-success/30 bg-white px-2.5 py-1.5 text-[10px] uppercase tracking-wider text-foreground hover:bg-surface transition-colors disabled:opacity-50 cursor-pointer"
            >
              <FiX className="h-3 w-3" />
              Quitar
            </button>
          )}
        </div>
      ) : (
        <form onSubmit={handleCouponSubmit} className="flex items-center gap-2">
          <input
            type="text"
            value={couponInput}
            onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
            placeholder="Ej. INVIERNO15"
            maxLength={40}
            disabled={couponLoading || disabled}
            aria-label="Código de cupón"
            className="min-w-0 flex-1 rounded-full border border-border bg-background px-3.5 sm:px-4 py-2.5 text-sm sm:text-xs uppercase tracking-wider text-foreground placeholder:normal-case placeholder:tracking-normal placeholder:text-subtle/60 focus:border-foreground focus:outline-none"
          />
          <Button
            type="submit"
            variant="secondary"
            size="sm"
            loading={couponLoading}
            disabled={!couponInput.trim() || couponLoading || disabled}
            className="shrink-0 py-2.5"
          >
            Aplicar
          </Button>
        </form>
      )}

      {couponError && (
        <p role="alert" className="text-[11px] text-danger leading-snug">
          {couponError}
        </p>
      )}
      {!couponError && couponSuccess && appliedCoupon && (
        <p className="text-[11px] text-success leading-snug">{couponSuccess}</p>
      )}
    </div>
  ) : null;

  const breakdownContent = (
    <div className="space-y-2.5">
      <div className="flex items-start justify-between gap-3 text-[11px] uppercase tracking-wider text-muted">
        <span className="min-w-0 leading-snug">
          {descuentoCatalogo > 0 ? `Precio de lista (${totalItems})` : `Prendas (${totalItems})`}
        </span>
        <span className="shrink-0 whitespace-nowrap">{formatPrice(subtotalBase)}</span>
      </div>

      {descuentoCatalogo > 0 && (
        <div className="flex items-start justify-between gap-3 text-[11px] uppercase tracking-wider text-success">
          <span className="min-w-0 leading-snug">Rebajas de catálogo</span>
          <span className="shrink-0 whitespace-nowrap font-medium">- {formatPrice(descuentoCatalogo)}</span>
        </div>
      )}

      {promocionesAplicadas.length > 0 ? (
        promocionesAplicadas.map((promo, idx) => (
          <div
            key={promo.promocionId ?? `${promo.nombre}-${idx}`}
            className="flex items-start justify-between gap-3 text-[11px] text-success"
          >
            <span className="min-w-0 inline-flex flex-wrap items-center gap-1.5 leading-snug">
              <span className="uppercase tracking-wider font-medium break-words">{promo.nombre}</span>
              {promo.codigo ? (
                <span className="rounded bg-success/15 px-1.5 py-0.5 text-[9px] font-mono uppercase">
                  {promo.codigo}
                </span>
              ) : null}
            </span>
            <span className="shrink-0 whitespace-nowrap font-medium">
              {promo.descuento > 0 ? `- ${formatPrice(promo.descuento)}` : "Aplicada"}
            </span>
          </div>
        ))
      ) : descuentoPromociones > 0 ? (
        <div className="flex items-start justify-between gap-3 text-[11px] uppercase tracking-wider text-success">
          <span className="min-w-0 leading-snug">Promociones / Cupón</span>
          <span className="shrink-0 whitespace-nowrap font-medium">- {formatPrice(descuentoPromociones)}</span>
        </div>
      ) : null}

      <div className="flex items-start justify-between gap-3 text-[11px] uppercase tracking-wider text-muted">
        <span className="min-w-0 leading-snug">Costo de envío</span>
        <span className="shrink-0 flex items-center gap-1.5 whitespace-nowrap">
          {descuentoEnvio > 0 && shippingCost > 0 ? (
            <>
              <span className="line-through text-subtle">{formatPrice(shippingCost)}</span>
              <span className="text-success font-semibold">
                {netShipping === 0 ? "Gratis" : formatPrice(netShipping)}
              </span>
            </>
          ) : (
            <span className={shippingCost === 0 ? "text-success font-medium" : "text-foreground font-medium"}>
              {shippingLabel}
            </span>
          )}
        </span>
      </div>

      {totalSavings > 0 && (
        <div className="rounded-xl border border-success/20 bg-success/8 px-3 py-2 text-[11px] text-success font-medium flex items-center justify-between gap-3">
          <span>Ahorro total</span>
          <span className="shrink-0 whitespace-nowrap">{formatPrice(totalSavings)}</span>
        </div>
      )}

      <div className="pt-3 border-t border-border flex justify-between items-baseline gap-3">
        <span className="text-xs sm:text-sm font-medium text-foreground uppercase tracking-widest">
          Total a pagar
        </span>
        <div className="text-right shrink-0">
          <span className={`text-xl sm:text-2xl font-serif text-foreground font-bold whitespace-nowrap ${pricingLoading ? "opacity-60" : ""}`}>
            {formatPrice(finalTotal)}
          </span>
          {pricingLoading && (
            <p className="text-[10px] text-subtle">Actualizando...</p>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Tarjeta de cupón y desglose visible en móvil antes de la barra fija */}
      <div className="lg:hidden">
        <Card padding="none" className="rounded-[24px] sm:rounded-[28px] p-4 sm:p-6 space-y-5">
          <div>
            <p className="text-[10px] uppercase tracking-[0.16em] text-subtle mb-3.5 sm:mb-4">
              Resumen de compra
            </p>
            {breakdownContent}
          </div>
          {couponSection}
        </Card>
      </div>

      {/* Barra fija inferior en móvil */}
      <div className="lg:hidden fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 backdrop-blur-md mobile-safe-bottom shadow-[0_-8px_30px_rgba(0,0,0,0.06)]">
        <div className="mx-auto flex max-w-[1240px] flex-col gap-2 px-3.5 sm:px-4 pt-2.5 sm:pt-3 pb-2">
          {error ? (
            <div className="rounded-[14px] border border-danger/30 bg-danger/10 px-3 py-2 text-[11px] sm:text-xs text-danger font-medium leading-snug">
              {error}
            </div>
          ) : null}

          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-[9.5px] sm:text-[10px] uppercase tracking-[0.12em] sm:tracking-[0.16em] text-subtle truncate">
                Total {netShipping > 0 ? "(con envío)" : ""}
              </p>
              <p className={`text-lg sm:text-xl font-serif font-bold leading-tight text-foreground whitespace-nowrap ${pricingLoading ? "opacity-60" : ""}`}>
                {formatPrice(finalTotal)}
              </p>
              <p className={`text-[10.5px] sm:text-[11px] truncate ${totalSavings > 0 ? "text-success font-medium" : "text-muted"}`}>
                {totalSavings > 0
                  ? `Ahorras ${formatPrice(totalSavings)} · ${totalItems} ${totalItems !== 1 ? "prendas" : "prenda"}`
                  : `${totalItems} ${totalItems !== 1 ? "prendas" : "prenda"} · Envío: ${descuentoEnvio > 0 && netShipping === 0 ? "Gratis" : shippingLabel}`}
              </p>
            </div>
            <Button
              variant="primary"
              size="md"
              className="min-w-[138px] sm:min-w-[170px] shrink-0 px-4 sm:px-6 py-2.5 sm:py-3 text-[10px] sm:text-[11px] tracking-[0.12em] sm:tracking-[0.16em] whitespace-nowrap"
              loading={loading}
              disabled={disabled || loading}
              onClick={onSubmit}
            >
              {authenticated ? "Confirmar pedido" : "Finalizar compra"}
            </Button>
          </div>
        </div>
      </div>

      {/* Sidebar sticky en desktop */}
      <div className="hidden lg:block">
        <Card className="sticky top-24 space-y-5">
          <div>
            <p className="text-[10px] uppercase tracking-[0.16em] text-subtle mb-4">
              Resumen de compra
            </p>
            {breakdownContent}
          </div>

          {couponSection}

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
            disabled={disabled || loading}
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
