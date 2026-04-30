"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { formatPrice } from "@/lib/format";
import { useReservationCart } from "@/components/providers/ReservationCartProvider";
import type { CheckoutSubmitPayload, CheckoutSubmitResponse } from "@/types/checkout";

export default function QRPaymentConfirmationClient() {
  const router = useRouter();
  const { clearCart } = useReservationCart();
  const [payload, setPayload] = useState<CheckoutSubmitPayload | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const qrImageUrl = "https://res.cloudinary.com/dq1jeikev/image/upload/v1777531404/comprobante_sglufd.jpg";

  useEffect(() => {
    const stored = window.localStorage.getItem("fitandes-pending-checkout");
    if (!stored) {
      router.replace("/checkout");
      return;
    }
    try {
      setPayload(JSON.parse(stored));
    } catch {
      router.replace("/checkout");
    }
  }, [router]);

  if (!payload) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-pulse text-subtle">Cargando datos de tu pedido...</div>
      </div>
    );
  }

  const total = payload.items.reduce((acc, item) => acc + item.precio * item.cantidad, 0);

  async function handleFinalize() {
    if (!file) {
      setError("Por favor selecciona una imagen de tu comprobante antes de finalizar.");
      return;
    }

    setError("");
    setProcessing(true);

    try {
      // 1. Crear el pedido
      const checkoutResponse = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const checkoutData = (await checkoutResponse.json().catch(() => null)) as CheckoutSubmitResponse | null;

      if (!checkoutResponse.ok || !checkoutData?.ok || !checkoutData.orderId || !checkoutData.paymentId) {
        throw new Error(checkoutData?.message || "No pude crear tu pedido. Intenta nuevamente.");
      }

      // 2. Subir el comprobante
      const formData = new FormData();
      formData.append("file", file);

      const uploadResponse = await fetch(`/api/payments/${checkoutData.paymentId}/upload-comprobante`, {
        method: "POST",
        body: formData,
      });

      // Use response directly if needed, otherwise ignore json() if not used
      if (!uploadResponse.ok) {
        // El pedido se creo pero el comprobante fallo. 
        // Redirigimos al detalle para que lo intente de nuevo ahi.
        router.push(`/pedidos/${checkoutData.orderId}`);
        return;
      }

      // 3. Limpiar todo
      window.localStorage.removeItem("fitandes-pending-checkout");
      clearCart();
      setSuccess(true);

      setTimeout(() => {
        router.push(`/pedidos/${checkoutData.orderId}`);
        router.refresh();
      }, 1500);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Ocurrio un error al procesar tu pedido.";
      setError(message);
      setProcessing(false);
    }
  }

  async function handleDownloadQR() {
    try {
      const response = await fetch(qrImageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `fitandes-qr-pago.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch {
      window.open(qrImageUrl, "_blank");
    }
  }

  if (success) {
    return (
      <Card className="max-w-md mx-auto text-center py-12">
        <div className="w-16 h-16 bg-success/10 text-success rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-2xl font-serif mb-2">¡Pedido creado con éxito!</h2>
        <p className="text-sm text-muted">Hemos recibido tu pago y tu pedido ya está registrado. Te redirigiremos en un momento.</p>
      </Card>
    );
  }

  return (
    <div className="grid gap-8 lg:grid-cols-2 max-w-5xl mx-auto">
      <Card className="flex flex-col items-center text-center">
        <p className="text-[10px] uppercase tracking-[0.2em] text-subtle mb-4">Paso 1: Realizar el Pago</p>
        <h2 className="text-xl font-serif mb-6">Pagar con QR</h2>
        
        <div className="relative w-full aspect-square max-w-[320px] bg-white p-4 border border-border/50 rounded-xl mb-6 shadow-sm">
          <Image src={qrImageUrl} alt="QR de Pago FitAndes" fill className="object-contain p-2" />
        </div>

        <div className="space-y-4 w-full max-w-[320px]">
          <div className="flex justify-between items-center py-3 border-y border-border/50">
            <span className="text-sm text-muted">Total a pagar:</span>
            <span className="text-lg font-bold text-foreground">{formatPrice(total)}</span>
          </div>
          <Button variant="outline" size="sm" onClick={handleDownloadQR} className="w-full">
            Descargar Código QR
          </Button>
        </div>
      </Card>

      <Card className="flex flex-col">
        <p className="text-[10px] uppercase tracking-[0.2em] text-subtle mb-4">Paso 2: Finalizar Pedido</p>
        <h2 className="text-xl font-serif mb-6">Confirmar y Enviar</h2>
        
        <div className="flex-1 flex flex-col justify-center">
          <div className="border-2 border-dashed border-border rounded-2xl p-8 text-center bg-surface/30">
            <input type="file" id="receipt-upload" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] ?? null)} className="hidden" />
            <label htmlFor="receipt-upload" className="cursor-pointer">
              <div className="w-12 h-12 bg-background rounded-full flex items-center justify-center mx-auto mb-4 border border-border">
                <svg className="w-6 h-6 text-subtle" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a2 2 0 002 2h12 a2 2 0 002-2v-1M16 8l-4-4m0 0L8 8m4-4v12" />
                </svg>
              </div>
              <p className="text-sm font-medium mb-1">{file ? file.name : "Sube tu comprobante aquí"}</p>
              <p className="text-xs text-muted">El pedido se creará al subir el archivo</p>
            </label>
          </div>

          {error && <div className="mt-4 p-3 bg-danger/5 border border-danger/20 text-danger text-xs rounded-lg">{error}</div>}

          <div className="mt-8">
            <Button variant="primary" size="lg" className="w-full" onClick={handleFinalize} disabled={!file || processing}>
              {processing ? "Procesando pedido..." : "Confirmar y Finalizar Pedido"}
            </Button>
            <p className="mt-4 text-[11px] text-center text-muted">
              Al hacer clic, tu pedido se registrará en el sistema y se notificará al equipo.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
