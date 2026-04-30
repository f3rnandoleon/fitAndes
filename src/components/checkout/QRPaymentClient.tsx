"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { formatPrice } from "@/lib/format";
import { getPedidoTotal, type Pedido } from "@/types/pedidos";

interface Props {
  paymentId: string;
  order: Pedido;
}

export default function QRPaymentClient({ paymentId, order }: Props) {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const qrImageUrl = "https://res.cloudinary.com/dq1jeikev/image/upload/v1777531404/comprobante_sglufd.jpg";
  const total = getPedidoTotal(order);

  async function handleUpload() {
    if (!file) {
      setError("Por favor selecciona una imagen de tu comprobante.");
      return;
    }

    setError("");
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch(`/api/payments/${paymentId}/upload-comprobante`, {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Error al subir el comprobante.");
      }

      setSuccess(true);
      // Wait a bit before redirecting
      setTimeout(() => {
        router.push(`/pedidos/${order._id}`);
        router.refresh();
      }, 1500);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Ocurrio un error inesperado.";
      setError(message);
      setUploading(false);
    }
  }

  async function handleDownloadQR() {
    try {
      const response = await fetch(qrImageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `fitandes-qr-pago-${order.numeroPedido || order._id}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch {
      window.open(qrImageUrl, "_blank");
    }
  }

  async function handleShare() {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "QR de Pago - FitAndes",
          text: `Pago para el pedido ${order.numeroPedido || order._id} por un total de ${formatPrice(total)}`,
          url: qrImageUrl,
        });
      } catch (err) {
        console.log("Error sharing", err);
      }
    } else {
      handleDownloadQR();
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
        <h2 className="text-2xl font-serif mb-2">¡Comprobante recibido!</h2>
        <p className="text-sm text-muted">Estamos verificando tu pago. Te redirigiremos al detalle de tu pedido en un momento.</p>
      </Card>
    );
  }

  return (
    <div className="grid gap-8 lg:grid-cols-2 max-w-5xl mx-auto">
      {/* Columna QR */}
      <Card className="flex flex-col items-center text-center">
        <p className="text-[10px] uppercase tracking-[0.2em] text-subtle mb-4">Paso 1: Escanear y Pagar</p>
        <h2 className="text-xl font-serif mb-6">Codigo QR de Pago</h2>
        
        <div className="relative w-full aspect-square max-w-[320px] bg-white p-4 border border-border/50 rounded-xl mb-6 shadow-sm">
          <Image 
            src={qrImageUrl} 
            alt="QR de Pago FitAndes" 
            fill
            className="object-contain p-2"
          />
        </div>

        <div className="space-y-4 w-full max-w-[320px]">
          <div className="flex justify-between items-center py-3 border-y border-border/50">
            <span className="text-sm text-muted">Monto a pagar:</span>
            <span className="text-lg font-bold text-foreground">{formatPrice(total)}</span>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <Button variant="outline" size="sm" onClick={handleDownloadQR} className="w-full">
              Descargar
            </Button>
            <Button variant="outline" size="sm" onClick={handleShare} className="w-full">
              Compartir
            </Button>
          </div>
        </div>
        
        <p className="mt-8 text-[11px] text-muted leading-relaxed">
          Escanea el codigo desde tu aplicacion bancaria favorita. <br/>
          Asegurate de que el monto coincida exactamente con el total de tu pedido.
        </p>
      </Card>

      {/* Columna Subida */}
      <Card className="flex flex-col">
        <p className="text-[10px] uppercase tracking-[0.2em] text-subtle mb-4">Paso 2: Confirmar Pago</p>
        <h2 className="text-xl font-serif mb-6">Subir Comprobante</h2>
        
        <div className="flex-1 flex flex-col justify-center">
          <div className="border-2 border-dashed border-border rounded-2xl p-8 text-center transition-colors hover:border-accent/40 bg-surface/30">
            <input 
              type="file" 
              id="receipt-upload" 
              accept="image/*" 
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              className="hidden"
            />
            <label htmlFor="receipt-upload" className="cursor-pointer group">
              <div className="w-12 h-12 bg-background rounded-full flex items-center justify-center mx-auto mb-4 border border-border group-hover:border-accent/40 group-hover:scale-110 transition-all">
                <svg className="w-6 h-6 text-subtle" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a2 2 0 002 2h12 a2 2 0 002-2v-1M16 8l-4-4m0 0L8 8m4-4v12" />
                </svg>
              </div>
              <p className="text-sm font-medium mb-1">
                {file ? file.name : "Selecciona tu comprobante"}
              </p>
              <p className="text-xs text-muted">Imagen (JPG, PNG) hasta 5MB</p>
            </label>
          </div>

          {error && (
            <div className="mt-4 p-3 bg-danger/5 border border-danger/20 text-danger text-xs rounded-lg">
              {error}
            </div>
          )}

          <div className="mt-8 space-y-4">
            <Button 
              variant="primary" 
              size="lg" 
              className="w-full" 
              onClick={handleUpload}
              disabled={!file || uploading}
            >
              {uploading ? "Subiendo..." : "Confirmar y Finalizar"}
            </Button>
            
            <p className="text-[11px] text-center text-muted">
              Una vez subido, el equipo verificara la transaccion y procesara tu pedido.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
