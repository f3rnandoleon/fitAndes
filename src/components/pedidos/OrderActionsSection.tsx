"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  canPedidoBeCancelledByClient,
  getPedidoClientEditDeadline,
  getPedidoClientEditRemainingMs,
  getPedidoEstadoPedido,
  type Pedido,
} from "@/types/pedidos";

function formatRemainingTime(valueMs: number): string {
  const totalSeconds = Math.max(0, Math.floor(valueMs / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

export default function OrderActionsSection({ pedido }: { pedido: Pedido }) {
  const router = useRouter();
  const [remainingMs, setRemainingMs] = useState(() => getPedidoClientEditRemainingMs(pedido));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const deadline = useMemo(() => getPedidoClientEditDeadline(pedido), [pedido]);
  const canCancel = canPedidoBeCancelledByClient(pedido, Date.now()) && remainingMs > 0;

  useEffect(() => {
    setRemainingMs(getPedidoClientEditRemainingMs(pedido));

    if (!canPedidoBeCancelledByClient(pedido)) {
      return;
    }

    const interval = window.setInterval(() => {
      setRemainingMs(getPedidoClientEditRemainingMs(pedido));
    }, 1000);

    return () => window.clearInterval(interval);
  }, [pedido]);

  async function handleCancelOrder() {
    setLoading(true);
    setError("");
    setMessage("");

    try {
      const response = await fetch(`/api/orders/${pedido._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderStatus: "CANCELLED" }),
      });

      const data = (await response.json().catch(() => null)) as { message?: string } | null;
      if (!response.ok) {
        setError(data?.message ?? "No pude cancelar el pedido.");
        setLoading(false);
        return;
      }

      setMessage("Pedido cancelado correctamente.");
      router.refresh();
    } catch {
      setError("Ocurrio un problema al cancelar el pedido.");
    } finally {
      setLoading(false);
    }
  }

  if (getPedidoEstadoPedido(pedido) !== "PENDING_PAYMENT") {
    return null;
  }

  return (
    <div className="border p-5 space-y-4" style={{ borderColor: "var(--border)", background: "var(--surface)" }}>
      <div>
        <p className="text-xs uppercase mb-2" style={{ letterSpacing: "0.14em", color: "var(--subtle)" }}>
          Gestion del pedido
        </p>
        {canCancel ? (
          <p className="text-sm" style={{ color: "var(--muted)" }}>
            Puedes cancelar este pedido mientras siga pendiente. Tiempo restante: <strong>{formatRemainingTime(remainingMs)}</strong>
          </p>
        ) : (
          <p className="text-sm" style={{ color: "var(--muted)" }}>
            La cancelacion por parte del cliente solo esta disponible durante los primeros 30 minutos despues de crear el pedido.
            {deadline ? ` Vencio el ${deadline.toLocaleString("es-BO")}.` : ""}
          </p>
        )}
      </div>

      {message ? (
        <p className="border px-4 py-3 text-sm" style={{ borderColor: "#c5d8c9", background: "#e7efe9", color: "#2f6b43" }}>
          {message}
        </p>
      ) : null}

      {error ? (
        <p className="border px-4 py-3 text-sm" style={{ borderColor: "#d9b2ac", background: "#f6e8e5", color: "#8b3f36" }}>
          {error}
        </p>
      ) : null}

      {canCancel ? (
        <button
          type="button"
          onClick={handleCancelOrder}
          disabled={loading}
          className="inline-flex items-center justify-center border px-5 py-3 text-xs uppercase transition-opacity hover:opacity-85 disabled:cursor-not-allowed disabled:opacity-60"
          style={{ borderColor: "#d9b2ac", color: "#8b3f36", letterSpacing: "0.16em" }}
        >
          {loading ? "Cancelando..." : "Cancelar pedido"}
        </button>
      ) : null}
    </div>
  );
}
