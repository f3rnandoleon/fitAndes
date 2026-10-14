"use client";

import { useEffect, useState } from "react";

interface StockReservationTimerProps {
  expiresAt?: string | null;
  createdAt?: string | null;
  status?: string | null;
  compact?: boolean;
  onExpire?: () => void;
}

export default function StockReservationTimer({
  expiresAt,
  createdAt,
  status,
  compact = false,
  onExpire,
}: StockReservationTimerProps) {
  const [timeLeft, setTimeLeft] = useState<number | null>(null);

  useEffect(() => {
    // Determine expiration target timestamp
    let targetTime: number | null = null;
    if (expiresAt) {
      targetTime = new Date(expiresAt).getTime();
    } else if (createdAt) {
      // Default to 30 minutes from creation
      targetTime = new Date(createdAt).getTime() + 30 * 60 * 1000;
    }

    if (!targetTime || isNaN(targetTime)) {
      setTimeLeft(null);
      return;
    }

    function updateTimer() {
      const remaining = Math.max(0, (targetTime as number) - Date.now());
      setTimeLeft(remaining);
      if (remaining === 0 && onExpire) {
        onExpire();
      }
    }

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [expiresAt, createdAt, onExpire]);

  if (timeLeft === null) return null;

  const isExpired = timeLeft <= 0 || status === "EXPIRADO" || status === "EXPIRED";
  const totalSeconds = Math.floor(timeLeft / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  const formattedTime = `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;

  // Stage calculation
  const isCritical = totalSeconds < 300 && !isExpired; // Less than 5 min
  const isWarning = totalSeconds >= 300 && totalSeconds < 900 && !isExpired; // 5 - 15 min
  const isCalm = totalSeconds >= 900 && !isExpired; // > 15 min

  if (compact) {
    if (isExpired) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold tracking-wider uppercase bg-zinc-100 text-zinc-700 border border-zinc-300">
          <span className="w-1.5 h-1.5 rounded-full bg-zinc-500" />
          Reserva expirada
        </span>
      );
    }

    return (
      <span
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold tracking-wider uppercase border transition-all ${
          isCritical
            ? "bg-red-50 text-red-700 border-red-300 animate-pulse"
            : isWarning
            ? "bg-amber-50 text-amber-800 border-amber-300"
            : "bg-emerald-50 text-emerald-800 border-emerald-300"
        }`}
      >
        <span
          className={`w-1.5 h-1.5 rounded-full ${
            isCritical ? "bg-red-500" : isWarning ? "bg-amber-500" : "bg-emerald-500"
          }`}
        />
        Reserva: {formattedTime}
      </span>
    );
  }

  // Full banner view
  if (isExpired) {
    return (
      <div className="border border-zinc-300 bg-zinc-50 p-4 rounded-xl text-zinc-700 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-200 text-zinc-700 font-bold shrink-0">
            ✕
          </span>
          <div>
            <p className="font-semibold text-zinc-900">Tiempo de reserva finalizado</p>
            <p className="text-zinc-600 mt-0.5 leading-relaxed">
              La reserva automática de stock por 30 minutos ha concluido. Si ya realizaste tu transferencia QR, sube tu comprobante para verificar disponibilidad prioritaria.
            </p>
          </div>
        </div>
        <span className="self-start sm:self-center shrink-0 px-2.5 py-1 bg-zinc-200 rounded text-[10px] uppercase font-bold tracking-wider">
          EXPIRADO
        </span>
      </div>
    );
  }

  return (
    <div
      className={`border p-4 rounded-xl text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs transition-colors ${
        isCritical
          ? "border-red-300 bg-red-50/80 text-red-900"
          : isWarning
          ? "border-amber-300 bg-amber-50/80 text-amber-900"
          : "border-emerald-300 bg-emerald-50/80 text-emerald-900"
      }`}
    >
      <div className="flex items-center gap-3">
        <div
          className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 font-bold text-base ${
            isCritical
              ? "bg-red-200 text-red-800 animate-bounce"
              : isWarning
              ? "bg-amber-200 text-amber-900"
              : "bg-emerald-200 text-emerald-900"
          }`}
        >
          ⏱
        </div>
        <div>
          <div className="flex items-center gap-2">
            <p className="font-semibold text-sm">Reserva de prendas garantizada</p>
            <span
              className={`px-2 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase ${
                isCritical
                  ? "bg-red-200 text-red-800"
                  : isWarning
                  ? "bg-amber-200 text-amber-800"
                  : "bg-emerald-200 text-emerald-800"
              }`}
            >
              {status || "RESERVADO"}
            </span>
          </div>
          <p className="text-[11px] opacity-90 mt-0.5 leading-relaxed">
            {isCritical
              ? "¡Últimos minutos! Sube tu comprobante QR para evitar que las tallas sean liberadas al público."
              : isWarning
              ? "Tu stock está apartado temporalmente mientras realizas la transferencia de BancoSol."
              : "Prendas bloqueadas en inventario central por 30 minutos mientras completas tu pago."}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3 self-end sm:self-center shrink-0">
        <div className="text-right">
          <p className="text-[10px] uppercase tracking-wider opacity-75">Tiempo restante</p>
          <p
            className={`text-xl font-bold font-mono tracking-wider ${
              isCritical ? "text-red-700 animate-pulse" : ""
            }`}
          >
            {formattedTime}
          </p>
        </div>
      </div>
    </div>
  );
}
