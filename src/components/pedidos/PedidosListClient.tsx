"use client";

import { useState } from "react";
import Link from "next/link";
import {
  getPedidoEstado,
  getPedidoEstadoTone,
  getPedidoMetodoPago,
  getPedidoNumero,
  getPedidoTotal,
  type Pedido,
} from "@/types/pedidos";
import StockReservationTimer from "@/components/checkout/StockReservationTimer";
import UploadComprobanteModal from "@/components/pedidos/UploadComprobanteModal";

interface PedidosListClientProps {
  pedidos: Pedido[];
}

export default function PedidosListClient({ pedidos }: PedidosListClientProps) {
  const [modalOrder, setModalOrder] = useState<Pedido | null>(null);

  const estadoColor: Record<string, React.CSSProperties> = {
    success: { color: "var(--success)", background: "#e7efe9", borderColor: "#c5d8c9" },
    warning: { color: "#6a4f21", background: "#efe5d5", borderColor: "#cfbc98" },
    danger: { color: "var(--danger)", background: "#f3e3e0", borderColor: "#d9b2ac" },
    accent: { color: "#2450a6", background: "#e7eefb", borderColor: "#c4d3f3" },
    neutral: { color: "var(--muted)", background: "#ece7e0", borderColor: "var(--border)" },
  };

  if (pedidos.length === 0) {
    return (
      <div className="border p-16 text-center rounded-xl bg-white" style={{ borderColor: "var(--border)" }}>
        <p className="text-4xl mb-3 text-subtle">◈</p>
        <p className="text-base text-muted">No tienes pedidos aún</p>
        <Link
          href="/catalogo"
          className="mt-4 inline-block text-xs uppercase text-white px-5 py-2.5 rounded hover:opacity-85 transition-opacity"
          style={{ letterSpacing: "0.16em", background: "#1a1a1a" }}
        >
          Ver catálogo
        </Link>
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col gap-3">
        {pedidos.map((pedido) => {
          const isPendingPayment =
            pedido.estadoPedido === "PENDING_PAYMENT" || pedido.orderStatus === "PENDING_PAYMENT";
          const isQr = getPedidoMetodoPago(pedido) === "QR";
          const isPaid = pedido.estadoPago === "PAID" || pedido.paymentStatus === "PAID";
          const hasReceipt = Boolean(pedido.pago?.comprobanteUrl);

          return (
            <div
              key={pedido._id}
              className="border px-5 py-4 rounded-xl bg-white transition-all hover:border-foreground/30 shadow-xs"
              style={{ borderColor: "var(--border)" }}
            >
              <div className="flex items-center justify-between flex-wrap gap-3">
                <Link
                  href={`/pedidos/${pedido._id}`}
                  className="flex-1 min-w-[200px] hover:opacity-80 transition-opacity"
                >
                  <div className="flex items-center gap-3">
                    <p className="text-sm font-medium text-foreground">
                      {getPedidoNumero(pedido)}
                    </p>
                    {isPendingPayment && (
                      <StockReservationTimer
                        expiresAt={pedido.reservaExpiraEn}
                        createdAt={pedido.createdAt}
                        status={pedido.estadoReservaStock}
                        compact
                      />
                    )}
                  </div>
                  <p className="text-xs text-subtle mt-0.5">
                    {new Date(pedido.createdAt).toLocaleDateString("es-BO", {
                      day: "2-digit",
                      month: "long",
                      year: "numeric",
                    })}
                  </p>
                </Link>

                <div className="flex items-center gap-3 sm:gap-4 flex-wrap">
                  <span className="text-xs text-subtle">
                    {pedido.items?.length ?? 0} item{pedido.items?.length !== 1 ? "s" : ""}
                  </span>

                  <span
                    className="text-[11px] uppercase tracking-wider px-2.5 py-1 border rounded-full font-medium"
                    style={estadoColor[getPedidoEstadoTone(pedido)]}
                  >
                    {getPedidoEstado(pedido)}
                  </span>

                  <p
                    className="text-sm font-semibold"
                    style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
                  >
                    Bs. {getPedidoTotal(pedido).toFixed(2)}
                  </p>

                  {/* Accion directa de comprobante QR */}
                  {isQr && !isPaid && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        setModalOrder(pedido);
                      }}
                      className="px-3 py-1.5 text-[11px] uppercase tracking-wider font-medium rounded bg-amber-100 text-amber-900 border border-amber-300 hover:bg-amber-200 transition-colors cursor-pointer"
                    >
                      {hasReceipt ? "Actualizar comprobante" : "Subir comprobante QR"}
                    </button>
                  )}

                  <Link
                    href={`/pedidos/${pedido._id}`}
                    className="text-xs text-subtle hover:text-foreground pl-1"
                    title="Ver detalle"
                  >
                    →
                  </Link>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {modalOrder && (
        <UploadComprobanteModal
          isOpen={Boolean(modalOrder)}
          onClose={() => setModalOrder(null)}
          orderId={modalOrder._id}
          orderNumber={getPedidoNumero(modalOrder)}
          existingReceiptUrl={modalOrder.pago?.comprobanteUrl}
        />
      )}
    </>
  );
}
