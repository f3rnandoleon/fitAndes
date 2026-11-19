"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { FiCalendar, FiCheckCircle, FiLayers, FiTag, FiX, FiZap } from "react-icons/fi";
import { formatPrice } from "@/lib/format";
import {
  formatPromotionBadgeLabel,
  formatPromotionBenefitDescription,
  formatPromotionScopeLabel,
  formatPromotionValidityLabel,
  isPromotionCurrentlyActive,
  type PublicPromotion,
} from "@/types/promociones";

interface Props {
  promociones: PublicPromotion[];
}

const EXCLUDED_PATH_PREFIXES = ["/login", "/registro", "/checkout", "/pagar"];
const SESSION_STORAGE_PREFIX = "fitandes-promo-modal-seen:";

function getPromotionConditionBullets(promo: PublicPromotion): string[] {
  const bullets: string[] = [];
  const cond = promo.condiciones;

  if (cond) {
    const montoMin = Number(cond.montoMinimo ?? 0);
    if (Number.isFinite(montoMin) && montoMin > 0) {
      bullets.push(`Compra mínima de ${formatPrice(montoMin)}`);
    }

    const cantMin = Number(cond.cantidadMinima ?? 0);
    if (Number.isFinite(cantMin) && cantMin > 1) {
      bullets.push(`Mínimo ${Math.floor(cantMin)} prendas en el carrito`);
    }

    if (cond.soloPrimeraCompra) {
      bullets.push("Exclusivo para tu primera compra web");
    }
  }

  const maxDesc = Number(promo.descuentoMaximo ?? 0);
  if (Number.isFinite(maxDesc) && maxDesc > 0) {
    bullets.push(`Tope máximo de descuento: ${formatPrice(maxDesc)}`);
  }

  if (promo.acumulableConRebajasCatalogo === true) {
    bullets.push("Acumulable con rebajas de catálogo");
  } else if (promo.acumulableConRebajasCatalogo === false) {
    bullets.push("No acumulable con rebajas de catálogo");
  }

  if (promo.acumulable === true) {
    bullets.push("Acumulable con otras promociones");
  } else if (promo.acumulable === false) {
    bullets.push("No acumulable con otras promociones");
  }

  return bullets;
}

export default function ActivePromotionsModal({ promociones }: Props) {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  const activePromotions = useMemo(
    () => promociones.filter((promo) => isPromotionCurrentlyActive(promo)),
    [promociones],
  );

  const fingerprint = useMemo(
    () =>
      activePromotions
        .map((promo) => promo._id ?? promo.id ?? promo.nombre)
        .sort()
        .join("|"),
    [activePromotions],
  );

  const isExcludedRoute = useMemo(() => {
    if (!pathname) return false;
    return EXCLUDED_PATH_PREFIXES.some((prefix) => pathname.startsWith(prefix));
  }, [pathname]);

  useEffect(() => {
    if (activePromotions.length === 0 || isExcludedRoute || !fingerprint) return;

    const storageKey = `${SESSION_STORAGE_PREFIX}${fingerprint}`;
    try {
      if (window.sessionStorage.getItem(storageKey) === "1") {
        return;
      }
    } catch {
      // Si sessionStorage no está disponible, mostramos el modal normalmente
    }

    const timer = window.setTimeout(() => {
      setIsOpen(true);
    }, 550);

    return () => window.clearTimeout(timer);
  }, [activePromotions.length, isExcludedRoute, fingerprint]);

  const handleClose = () => {
    setIsOpen(false);
    if (fingerprint) {
      try {
        window.sessionStorage.setItem(`${SESSION_STORAGE_PREFIX}${fingerprint}`, "1");
      } catch {
        // Ignora errores de almacenamiento en navegación privada estricta
      }
    }
  };

  useEffect(() => {
    if (!isOpen) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        handleClose();
      }
    }

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, fingerprint]);

  if (!isOpen || activePromotions.length === 0) return null;

  const isSingle = activePromotions.length === 1;
  const primaryPromo = activePromotions[0];
  const singleCategory =
    isSingle &&
    Array.isArray(primaryPromo.categoriasIncluidas) &&
    primaryPromo.categoriasIncluidas.length === 1 &&
    typeof primaryPromo.categoriasIncluidas[0] === "string"
      ? primaryPromo.categoriasIncluidas[0].trim()
      : null;

  const primaryCtaHref = singleCategory
    ? `/catalogo?categoria=${encodeURIComponent(singleCategory)}`
    : "/catalogo";
  const primaryCtaLabel = singleCategory ? `Ver ${singleCategory}` : "Explorar catálogo";

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="active-promotions-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-xs animate-fade-in"
      onClick={handleClose}
    >
      <div
        className="relative w-full max-w-[560px] max-h-[90vh] flex flex-col rounded-[28px] border border-border bg-white text-foreground shadow-2xl overflow-hidden"
        onClick={(event) => event.stopPropagation()}
      >
        {/* Cabecera destacada */}
        <div className="relative border-b border-border/80 bg-gradient-to-br from-[#faf8f5] via-[#fdf5f6] to-[#f3efea] px-6 py-5 sm:px-7 sm:py-6">
          <button
            type="button"
            onClick={handleClose}
            aria-label="Cerrar aviso de promoción"
            className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full border border-border/80 bg-white/80 text-muted hover:text-foreground hover:bg-white transition-colors cursor-pointer"
          >
            <FiX className="h-4 w-4" />
          </button>

          <div className="pr-10">
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-accent px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-white shadow-2xs">
                <FiTag className="h-3 w-3" aria-hidden="true" />
                {isSingle ? "Promoción activa" : `${activePromotions.length} promociones activas`}
              </span>
              <span className="inline-flex items-center gap-1 rounded-full border border-emerald-700/25 bg-emerald-50 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-emerald-900">
                <FiZap className="h-3 w-3" aria-hidden="true" />
                Se activa automáticamente
              </span>
            </div>

            <h2
              id="active-promotions-modal-title"
              className="font-serif text-2xl sm:text-[1.85rem] font-normal leading-tight text-foreground"
            >
              {isSingle ? primaryPromo.nombre : "Beneficios activos en nuestra tienda web"}
            </h2>
            <p className="mt-1.5 text-xs sm:text-sm text-muted leading-relaxed">
              No necesitas ingresar ningún código: el descuento se calcula y aplica automáticamente al agregar tus prendas al carrito.
            </p>
          </div>
        </div>

        {/* Detalle de promociones activas */}
        <div className="flex-1 overflow-y-auto px-6 py-5 sm:px-7 space-y-4">
          {activePromotions.map((promo, index) => {
            const badge = formatPromotionBadgeLabel(promo);
            const benefitDesc = formatPromotionBenefitDescription(promo);
            const scopeLabel = formatPromotionScopeLabel(promo);
            const validityLabel = formatPromotionValidityLabel(promo);
            const conditions = getPromotionConditionBullets(promo);
            const categorias = Array.isArray(promo.categoriasIncluidas)
              ? promo.categoriasIncluidas.filter((c): c is string => typeof c === "string" && Boolean(c.trim()))
              : [];

            return (
              <div
                key={promo._id ?? promo.id ?? `${promo.nombre}-${index}`}
                className="rounded-[20px] border border-border bg-background/70 p-4 sm:p-5 space-y-3"
              >
                <div className="flex flex-wrap items-start justify-between gap-2.5">
                  <div className="min-w-0 flex-1">
                    {!isSingle && (
                      <h3 className="font-serif text-lg font-normal text-foreground leading-snug">
                        {promo.nombre}
                      </h3>
                    )}
                    <p className={`text-xs sm:text-sm text-foreground/90 leading-relaxed ${!isSingle ? "mt-1" : "font-medium"}`}>
                      {promo.descripcion?.trim() || benefitDesc}
                    </p>
                    {promo.descripcion?.trim() && (
                      <p className="mt-1 text-xs text-muted leading-relaxed">{benefitDesc}</p>
                    )}
                  </div>

                  <span className="shrink-0 inline-flex items-center gap-1 rounded-full bg-emerald-950 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-emerald-50">
                    {badge}
                  </span>
                </div>

                {/* Metadatos: Alcance y Vigencia */}
                <div className="grid gap-2 pt-2 border-t border-border/60 text-xs text-muted">
                  <div className="flex items-start gap-2">
                    <FiLayers className="h-3.5 w-3.5 mt-0.5 text-subtle shrink-0" aria-hidden="true" />
                    <div className="min-w-0 flex-1">
                      <span className="font-medium text-foreground">Aplica en: </span>
                      <span>{scopeLabel}</span>
                      {categorias.length > 0 && (
                        <div className="mt-1.5 flex flex-wrap gap-1.5">
                          {categorias.map((categoria) => (
                            <Link
                              key={categoria}
                              href={`/catalogo?categoria=${encodeURIComponent(categoria)}`}
                              onClick={handleClose}
                              className="inline-flex rounded-full border border-border bg-white px-2.5 py-0.5 text-[10px] uppercase tracking-[0.1em] text-foreground hover:border-foreground transition-colors"
                            >
                              {categoria} →
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {validityLabel && (
                    <div className="flex items-center gap-2">
                      <FiCalendar className="h-3.5 w-3.5 text-subtle shrink-0" aria-hidden="true" />
                      <span>{validityLabel}</span>
                    </div>
                  )}
                </div>

                {/* Condiciones y reglas */}
                {conditions.length > 0 && (
                  <ul className="pt-2 border-t border-border/60 space-y-1.5">
                    {conditions.map((condition) => (
                      <li key={condition} className="flex items-start gap-2 text-xs text-muted">
                        <FiCheckCircle className="h-3.5 w-3.5 mt-0.5 text-success shrink-0" aria-hidden="true" />
                        <span>{condition}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            );
          })}
        </div>

        {/* Pie con acciones */}
        <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-2.5 border-t border-border/80 bg-[#faf8f5] px-6 py-4 sm:px-7">
          <button
            type="button"
            onClick={handleClose}
            className="w-full sm:w-auto rounded-full border border-border bg-white px-5 py-2.5 text-[11px] uppercase tracking-[0.14em] text-muted hover:text-foreground hover:border-foreground/50 transition-colors cursor-pointer"
          >
            Seguir navegando
          </button>

          <Link
            href={primaryCtaHref}
            onClick={handleClose}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-full bg-foreground px-6 py-2.5 text-[11px] font-medium uppercase tracking-[0.16em] text-background hover:opacity-90 transition-opacity text-center"
          >
            {primaryCtaLabel}
            <span aria-hidden="true">→</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
