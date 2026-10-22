"use client";

import { useState } from "react";
import type { Pedido, PedidoEntregaTracking } from "@/types/pedidos";

interface Props {
  pedido: Pedido;
  tracking: PedidoEntregaTracking | null;
}

const STEPS = [
  { key: "PENDING", label: "Pedido Registrado", desc: "En cola de almacén" },
  { key: "PREPARING", label: "Preparando", desc: "Empaquetado y rotulado" },
  { key: "IN_TRANSIT", label: "En Camino", desc: "Despachado con transportista" },
  { key: "DELIVERED", label: "Entregado", desc: "Recibido satisfactoriamente" },
];

function getStepIndex(estado?: string | null): number {
  if (!estado) return 0;
  switch (estado.toUpperCase()) {
    case "PREPARING":
    case "PREPARACION":
      return 1;
    case "IN_TRANSIT":
    case "EN_TRANSITO":
    case "DESPACHADO":
      return 2;
    case "DELIVERED":
    case "ENTREGADO":
      return 3;
    case "CANCELLED":
    case "CANCELADO":
      return -1;
    default:
      return 0;
  }
}

export default function OrderTrackingSection({ pedido, tracking }: Props) {
  const [copied, setCopied] = useState(false);

  // If order was cancelled, don't show normal tracking steps
  const isCancelled =
    pedido.estadoPedido === "CANCELLED" ||
    pedido.orderStatus === "CANCELLED" ||
    tracking?.estado === "CANCELLED";

  if (isCancelled) {
    return null;
  }

  const currentStep = getStepIndex(tracking?.estado ?? pedido.estadoEntrega ?? pedido.fulfillmentStatus);
  const carrier = tracking?.nombreTransportista || pedido.delivery?.shippingCompany || pedido.entrega?.empresaEnvio;
  const trackingCode = tracking?.codigoSeguimiento;
  const recipient = tracking?.nombreDestinatario || pedido.delivery?.recipientName || pedido.delivery?.senderName;

  const copyCode = async () => {
    if (!trackingCode) return;
    try {
      await navigator.clipboard.writeText(trackingCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  };

  return (
    <div
      className="border rounded-xl p-5 sm:p-6 space-y-6"
      style={{
        borderColor: "var(--border, #ece6dc)",
        background: "var(--surface, #ffffff)",
      }}
    >
      <div className="flex items-center justify-between flex-wrap gap-2 pb-3 border-b" style={{ borderColor: "var(--border, #ece6dc)" }}>
        <div>
          <p className="text-[10px] uppercase font-semibold tracking-wider text-muted-foreground" style={{ letterSpacing: "0.14em", color: "#8f8478" }}>
            Despacho y Envío
          </p>
          <h3 className="text-base sm:text-lg font-medium text-foreground mt-0.5">
            Estado de tu Entrega
          </h3>
        </div>
        {carrier ? (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-[#f5efe6] text-[#6d5d4d] border border-[#e5dac9]">
            {carrier}
          </span>
        ) : null}
      </div>

      {/* Timeline Steps */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {STEPS.map((step, idx) => {
          const isCompleted = idx < currentStep;
          const isCurrent = idx === currentStep;

          return (
            <div key={step.key} className="flex flex-col items-center text-center space-y-2">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold transition-all ${
                  isCompleted
                    ? "bg-[#2f6b43] text-white"
                    : isCurrent
                    ? "bg-[#d04d37] text-white ring-4 ring-[#d04d37]/20"
                    : "bg-[#f0ebe3] text-[#a4998d]"
                }`}
              >
                {isCompleted ? (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  idx + 1
                )}
              </div>
              <div>
                <p
                  className={`text-xs font-medium ${
                    isCurrent ? "text-[#d04d37] font-semibold" : isCompleted ? "text-[#2f6b43]" : "text-[#8f8478]"
                  }`}
                >
                  {step.label}
                </p>
                <p className="text-[10px] text-[#a4998d] leading-tight mt-0.5">{step.desc}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Logistics & Tracking Code Details */}
      {(trackingCode || carrier || tracking?.enTransitoEn || tracking?.entregadoEn) && (
        <div
          className="rounded-lg p-4 space-y-2.5 text-xs border"
          style={{ background: "#fbf9f5", borderColor: "#ede5d8" }}
        >
          {trackingCode ? (
            <div className="flex items-center justify-between flex-wrap gap-2">
              <span className="text-[#8f8478]">Número de Guía / Código:</span>
              <div className="flex items-center gap-2">
                <span className="font-mono font-semibold text-sm text-[#111111] bg-white px-2 py-0.5 rounded border border-[#e5dac9]">
                  {trackingCode}
                </span>
                <button
                  type="button"
                  onClick={copyCode}
                  className="text-[11px] px-2 py-1 bg-white border border-[#e5dac9] rounded text-[#6d5d4d] hover:bg-[#f5efe6] transition-colors"
                >
                  {copied ? "¡Copiado!" : "Copiar"}
                </button>
              </div>
            </div>
          ) : (
            <p className="text-[#8f8478] italic">
              El transportista asignará el número de guía en cuanto el paquete esté en tránsito.
            </p>
          )}

          {recipient ? (
            <div className="flex justify-between flex-wrap gap-1 text-[#6d5d4d]">
              <span className="text-[#8f8478]">Destinatario:</span>
              <span className="font-medium text-[#111111]">{recipient}</span>
            </div>
          ) : null}

          {tracking?.enTransitoEn ? (
            <div className="flex justify-between flex-wrap gap-1 text-[#6d5d4d]">
              <span className="text-[#8f8478]">Despachado en:</span>
              <span>
                {new Date(tracking.enTransitoEn).toLocaleDateString("es-BO", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </div>
          ) : null}

          {tracking?.entregadoEn ? (
            <div className="flex justify-between flex-wrap gap-1 text-[#2f6b43]">
              <span className="font-medium">Entregado en:</span>
              <span>
                {new Date(tracking.entregadoEn).toLocaleDateString("es-BO", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
