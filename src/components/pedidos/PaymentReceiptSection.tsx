"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { getPedidoMetodoPago, getPedidoEstadoPago, type Pedido } from "@/types/pedidos";

type Props = {
  pedido: Pedido;
  defaultPaymentId?: string | null;
};

export default function PaymentReceiptSection({ pedido, defaultPaymentId }: Props) {
  const router = useRouter();
  const paymentMethod = getPedidoMetodoPago(pedido);
  const paymentStatus = getPedidoEstadoPago(pedido);
  const comprobanteUrl = pedido.pago?.comprobanteUrl;

  const [paymentId, setPaymentId] = useState<string | null>(defaultPaymentId ?? null);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [showReupload, setShowReupload] = useState(false);

  if (paymentMethod !== "QR") {
    return null;
  }

  // Estado 1: Pago ya verificado y confirmado
  if (paymentStatus === "PAID") {
    return (
      <div className="border p-6 text-center space-y-3 rounded-lg" style={{ borderColor: "#c5d8c9", background: "#e7efe9" }}>
        <div className="w-10 h-10 bg-success/10 text-success rounded-full flex items-center justify-center mx-auto mb-2">
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <p className="text-sm font-medium" style={{ color: "#2f6b43" }}>Comprobante verificado exitosamente</p>
        <p className="text-xs" style={{ color: "#4a7a57" }}>Tu pago ha sido confirmado y tu pedido está en preparación.</p>
        {comprobanteUrl && (
          <div className="pt-2">
            <a
              href={comprobanteUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs underline hover:opacity-75"
              style={{ color: "#2f6b43" }}
            >
              Ver comprobante confirmado
            </a>
          </div>
        )}
      </div>
    );
  }

  // Función para subir o reenviar el comprobante
  async function handleUploadReceipt(e: React.FormEvent) {
    e.preventDefault();
    if (!file) {
      setError("Por favor selecciona una imagen de tu comprobante.");
      return;
    }

    setError("");
    setSuccessMsg("");
    setUploading(true);

    try {
      let activePaymentId = paymentId;

      // Si no tenemos paymentId, lo obtenemos o creamos
      if (!activePaymentId) {
        const paymentRes = await fetch("/api/payments", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ orderId: pedido._id }),
        });
        const paymentData = await paymentRes.json();
        if (!paymentRes.ok || !paymentData.paymentId) {
          throw new Error(paymentData.message || "No pude preparar la transacción de pago.");
        }
        activePaymentId = paymentData.paymentId;
        setPaymentId(activePaymentId);
      }

      const formData = new FormData();
      formData.append("file", file);

      const uploadRes = await fetch(`/api/payments/${activePaymentId}/upload-comprobante`, {
        method: "POST",
        body: formData,
      });

      const uploadData = await uploadRes.json();
      if (!uploadRes.ok) {
        throw new Error(uploadData.message || "Error al subir el comprobante.");
      }

      setSuccessMsg("¡Comprobante subido exitosamente! El administrador fue notificado.");
      setFile(null);
      setShowReupload(false);

      setTimeout(() => {
        router.refresh();
      }, 1200);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Ocurrió un error inesperado al subir el comprobante.";
      setError(msg);
    } finally {
      setUploading(false);
    }
  }

  // Estado 2: Ya tiene comprobante y está en revisión (con opción de reenviar)
  if (comprobanteUrl && !showReupload) {
    return (
      <div className="border p-5 space-y-5 rounded-lg" style={{ borderColor: "var(--border)", background: "var(--surface)" }}>
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-accent/10 text-accent rounded-full flex items-center justify-center shrink-0">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-medium" style={{ color: "var(--foreground)" }}>Verificando tu pago QR</p>
            <p className="text-xs mt-1 leading-relaxed" style={{ color: "var(--muted)" }}>
              Hemos recibido tu comprobante. Nuestro equipo está validando el depósito en el sistema central.
              Te notificaremos en cuanto el pedido sea confirmado.
            </p>
          </div>
        </div>

        <div className="pt-4 border-t flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4" style={{ borderColor: "var(--border)" }}>
          <div>
            <p className="text-[10px] uppercase tracking-widest text-subtle mb-2">Comprobante enviado:</p>
            <div className="relative aspect-[3/4] w-28 border border-border/50 rounded overflow-hidden shadow-sm bg-white">
              <Image src={comprobanteUrl} alt="Comprobante de pago" fill className="object-cover" />
            </div>
          </div>
          <button
            type="button"
            onClick={() => setShowReupload(true)}
            className="text-xs uppercase px-4 py-2 border rounded transition-opacity hover:opacity-75"
            style={{ borderColor: "var(--border)", color: "var(--foreground)", letterSpacing: "0.1em" }}
          >
            Reenviar comprobante
          </button>
        </div>
      </div>
    );
  }

  // Estado 3: Sin comprobante (o re-subida solicitada)
  return (
    <div className="border p-5 space-y-4 rounded-lg" style={{ borderColor: "#cfbc98", background: "#fbf8f2" }}>
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 bg-amber-100 text-amber-800">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <div>
          <p className="text-sm font-medium text-amber-900">
            {comprobanteUrl ? "Reemplazar comprobante QR" : "Comprobante de pago QR pendiente"}
          </p>
          <p className="text-xs mt-1 text-amber-800/80 leading-relaxed">
            Para que podamos confirmar y procesar tu pedido #{pedido.numeroPedido || pedido._id.slice(-6)}, por favor adjunta la captura de tu transferencia o pago QR de BancoSol.
          </p>
        </div>
      </div>

      <form onSubmit={handleUploadReceipt} className="space-y-3 pt-2">
        <div className="border border-dashed border-amber-300 rounded-lg p-4 bg-white/70 text-center">
          <input
            type="file"
            id="receipt-file-input"
            accept="image/*"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            className="hidden"
          />
          <label htmlFor="receipt-file-input" className="cursor-pointer block">
            <p className="text-xs font-medium text-foreground">
              {file ? `Archivo: ${file.name}` : "Toca aquí para seleccionar tu comprobante (JPG o PNG)"}
            </p>
            <p className="text-[10px] text-muted mt-0.5">Tamaño máximo: 5 MB</p>
          </label>
        </div>

        {error && (
          <p className="text-xs text-red-600 bg-red-50 p-2.5 rounded border border-red-200">
            {error}
          </p>
        )}

        {successMsg && (
          <p className="text-xs text-green-700 bg-green-50 p-2.5 rounded border border-green-200">
            {successMsg}
          </p>
        )}

        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={uploading || !file}
            className="px-4 py-2.5 text-xs uppercase tracking-wider bg-foreground text-background rounded hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            {uploading ? "Subiendo..." : "Subir comprobante"}
          </button>
          {showReupload && (
            <button
              type="button"
              onClick={() => setShowReupload(false)}
              className="text-xs text-muted hover:underline"
            >
              Cancelar
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
