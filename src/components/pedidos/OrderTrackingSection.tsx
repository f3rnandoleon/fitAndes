"use client";

import { useState } from "react";
import type { OrderTracking, TrackingEstado } from "@/types/pedidos";
import { Badge } from "@/components/ui/Badge";

interface OrderTrackingSectionProps {
  tracking: OrderTracking | null;
  metodoEntrega?: string | null;
}

const ESTADOS_MAP: Record<string, { label: string; badge: "default" | "success" | "warning" | "danger" | "accent"; step: number }> = {
  PENDING: { label: "En espera de preparación", badge: "default", step: 1 },
  PREPARING: { label: "Preparando paquete", badge: "warning", step: 2 },
  READY: { label: "Listo para despacho / recojo", badge: "accent", step: 2 },
  IN_TRANSIT: { label: "En camino / En tránsito", badge: "accent", step: 3 },
  DELIVERED: { label: "Entregado con éxito", badge: "success", step: 4 },
  CANCELLED: { label: "Envío cancelado", badge: "danger", step: 0 },
};

function formatDate(dateStr?: string | null) {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  if (!Number.isFinite(d.getTime())) return null;
  return d.toLocaleDateString("es-BO", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function OrderTrackingSection({ tracking, metodoEntrega }: OrderTrackingSectionProps) {
  const [copied, setCopied] = useState(false);

  // Si no hay tracking asignado aún
  if (!tracking) {
    // Si es recojo presencial en punto de encuentro
    if (metodoEntrega === "PICKUP_POINT" || metodoEntrega === "PICKUP_LAPAZ") {
      return (
        <div className="border p-5 rounded-lg space-y-2" style={{ borderColor: "var(--border)", background: "var(--surface)" }}>
          <p className="text-xs uppercase tracking-wider text-subtle font-medium">
            Seguimiento de Entrega
          </p>
          <div className="flex items-center gap-3 text-sm text-muted">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Punto de encuentro en La Paz. Tu pedido será llevado en el horario programado.</span>
          </div>
        </div>
      );
    }

    return (
      <div className="border p-5 rounded-lg space-y-2" style={{ borderColor: "var(--border)", background: "var(--surface)" }}>
        <p className="text-xs uppercase tracking-wider text-subtle font-medium">
          Seguimiento de Envío (Courier / Flota)
        </p>
        <p className="text-sm text-muted">
          Una vez verificado tu pago y despachado el paquete, verás aquí el número de guía de transporte y el estado en ruta.
        </p>
      </div>
    );
  }

  const estadoInfo = ESTADOS_MAP[tracking.estado] ?? {
    label: tracking.estado,
    badge: "default" as const,
    step: 1,
  };

  const handleCopyGuide = () => {
    if (!tracking.codigoSeguimiento) return;
    navigator.clipboard.writeText(tracking.codigoSeguimiento);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const currentStep = estadoInfo.step;

  return (
    <div className="border p-5 sm:p-6 rounded-lg space-y-5" style={{ borderColor: "var(--border)", background: "var(--surface)" }}>
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3 pb-4 border-b" style={{ borderColor: "var(--border)" }}>
        <div>
          <p className="text-xs uppercase tracking-wider text-subtle font-medium">
            Seguimiento de Despacho
          </p>
          <h2 className="text-lg font-serif mt-1 font-semibold text-foreground">
            {tracking.nombreTransportista ?? "Transporte Interdepartamental"}
          </h2>
        </div>
        <Badge variant={estadoInfo.badge}>{estadoInfo.label}</Badge>
      </div>

      {/* Código de Guía Destacado */}
      {tracking.codigoSeguimiento ? (
        <div className="p-3.5 rounded-lg border flex items-center justify-between gap-3 bg-background/60" style={{ borderColor: "var(--border)" }}>
          <div>
            <p className="text-[10px] uppercase tracking-wider text-subtle">
              Número de Guía de Transporte
            </p>
            <p className="font-mono text-base sm:text-lg font-semibold tracking-wide text-foreground mt-0.5">
              {tracking.codigoSeguimiento}
            </p>
          </div>
          <button
            type="button"
            onClick={handleCopyGuide}
            className="px-3 py-1.5 text-xs font-medium rounded border border-border/80 hover:bg-surface transition-colors shrink-0"
            style={{ color: "var(--foreground)" }}
          >
            {copied ? "✓ Copiado" : "Copiar guía"}
          </button>
        </div>
      ) : null}

      {/* Timeline de Pasos */}
      {tracking.estado !== "CANCELLED" && (
        <div className="pt-2">
          <p className="text-[11px] uppercase tracking-wider text-subtle mb-4">
            Progreso del Envío
          </p>
          <div className="grid grid-cols-4 gap-2 relative">
            {/* Paso 1: Confirmado */}
            <div className="text-center">
              <div
                className={`w-7 h-7 mx-auto rounded-full flex items-center justify-center text-xs font-semibold mb-1.5 ${
                  currentStep >= 1 ? "bg-accent text-white" : "bg-muted/20 text-muted"
                }`}
              >
                1
              </div>
              <p className="text-[11px] font-medium text-foreground">Confirmado</p>
            </div>

            {/* Paso 2: Preparado */}
            <div className="text-center">
              <div
                className={`w-7 h-7 mx-auto rounded-full flex items-center justify-center text-xs font-semibold mb-1.5 ${
                  currentStep >= 2 ? "bg-accent text-white" : "bg-muted/20 text-muted"
                }`}
              >
                2
              </div>
              <p className="text-[11px] font-medium text-foreground">Empaquetado</p>
              {formatDate(tracking.preparadoEn) && (
                <p className="text-[9px] text-subtle mt-0.5">{formatDate(tracking.preparadoEn)}</p>
              )}
            </div>

            {/* Paso 3: En Tránsito */}
            <div className="text-center">
              <div
                className={`w-7 h-7 mx-auto rounded-full flex items-center justify-center text-xs font-semibold mb-1.5 ${
                  currentStep >= 3 ? "bg-accent text-white" : "bg-muted/20 text-muted"
                }`}
              >
                3
              </div>
              <p className="text-[11px] font-medium text-foreground">En camino</p>
              {formatDate(tracking.enTransitoEn) && (
                <p className="text-[9px] text-subtle mt-0.5">{formatDate(tracking.enTransitoEn)}</p>
              )}
            </div>

            {/* Paso 4: Entregado */}
            <div className="text-center">
              <div
                className={`w-7 h-7 mx-auto rounded-full flex items-center justify-center text-xs font-semibold mb-1.5 ${
                  currentStep >= 4 ? "bg-success text-white" : "bg-muted/20 text-muted"
                }`}
              >
                4
              </div>
              <p className="text-[11px] font-medium text-foreground">Entregado</p>
              {formatDate(tracking.entregadoEn) && (
                <p className="text-[9px] text-subtle mt-0.5">{formatDate(tracking.entregadoEn)}</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Detalles del destinatario y notas */}
      <div className="pt-3 border-t grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs" style={{ borderColor: "var(--border)" }}>
        {tracking.nombreDestinatario && (
          <div>
            <span className="text-subtle">Consignatario: </span>
            <span className="text-foreground font-medium">{tracking.nombreDestinatario}</span>
          </div>
        )}
        {tracking.telefono && (
          <div>
            <span className="text-subtle">Celular de contacto: </span>
            <span className="text-foreground font-medium">{tracking.telefono}</span>
          </div>
        )}
      </div>
    </div>
  );
}
