"use client";

import Image from "next/image";
import { getPedidoMetodoPago, getPedidoEstadoPago, type Pedido } from "@/types/pedidos";

type Props = {
  pedido: Pedido;
  defaultPaymentId?: string | null;
};

export default function PaymentReceiptSection({ pedido }: Props) {
  const paymentMethod = getPedidoMetodoPago(pedido);
  const paymentStatus = getPedidoEstadoPago(pedido);
  const comprobanteUrl = pedido.pago?.comprobanteUrl;

  if (paymentMethod !== "QR") {
    return null;
  }

  // Estado 1: Pago ya verificado y confirmado
  if (paymentStatus === "PAID") {
    return (
      <div className="border p-6 text-center space-y-3" style={{ borderColor: "#c5d8c9", background: "#e7efe9" }}>
        <div className="w-10 h-10 bg-success/10 text-success rounded-full flex items-center justify-center mx-auto mb-2">
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <p className="text-sm font-medium" style={{ color: "#2f6b43" }}>Comprobante verificado exitosamente</p>
        <p className="text-xs" style={{ color: "#4a7a57" }}>Tu pago ha sido confirmado y tu pedido esta en proceso.</p>
      </div>
    );
  }

  // Estado 2: Pago pendiente (asumimos comprobante enviado segun flujo de checkout)
  return (
    <div className="border p-5 space-y-5" style={{ borderColor: "var(--border)", background: "var(--surface)" }}>
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 bg-accent/10 text-accent rounded-full flex items-center justify-center shrink-0">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div>
          <p className="text-sm font-medium" style={{ color: "var(--foreground)" }}>Verificando tu pago QR</p>
          <p className="text-xs mt-1 leading-relaxed" style={{ color: "var(--muted)" }}>
            Hemos recibido tu comprobante. Nuestro equipo esta validando la transaccion en el sistema central. 
            Te notificaremos en cuanto el pedido sea confirmado.
          </p>
        </div>
      </div>
      
      {comprobanteUrl && (
        <div className="pt-4 border-t" style={{ borderColor: "var(--border)" }}>
          <p className="text-[10px] uppercase tracking-widest text-subtle mb-3">Tu comprobante enviado:</p>
          <div className="relative aspect-[3/4] w-full max-w-[180px] border border-border/50 rounded overflow-hidden shadow-sm bg-white">
            <Image src={comprobanteUrl} alt="Comprobante de pago" fill className="object-cover" />
          </div>
        </div>
      )}
    </div>
  );
}
