"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";

interface UploadComprobanteModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderId: string;
  orderNumber?: string | null;
  existingPaymentId?: string | null;
  existingReceiptUrl?: string | null;
  onSuccess?: () => void;
}

export default function UploadComprobanteModal({
  isOpen,
  onClose,
  orderId,
  orderNumber,
  existingPaymentId,
  existingReceiptUrl,
  onSuccess,
}: UploadComprobanteModalProps) {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  function handleFileChange(selectedFile: File | null) {
    if (!selectedFile) {
      setFile(null);
      setPreviewUrl(null);
      return;
    }

    if (!selectedFile.type.startsWith("image/")) {
      setError("Solo se permiten archivos de imagen (JPG, PNG, WEBP).");
      return;
    }

    if (selectedFile.size > 5 * 1024 * 1024) {
      setError("El comprobante no debe superar los 5 MB.");
      return;
    }

    setError("");
    setFile(selectedFile);
    setPreviewUrl(URL.createObjectURL(selectedFile));
  }

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault();
    if (!file) {
      setError("Por favor adjunta la captura de tu comprobante de pago.");
      return;
    }

    setUploading(true);
    setError("");

    try {
      let activePaymentId = existingPaymentId;

      // Si no existe paymentId previo, inicializarlo mediante el BFF
      if (!activePaymentId) {
        const paymentRes = await fetch("/api/payments", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ orderId }),
        });

        const paymentData = await paymentRes.json();
        if (!paymentRes.ok || !paymentData.paymentId) {
          throw new Error(paymentData.message || "No se pudo registrar la transacción de pago.");
        }
        activePaymentId = paymentData.paymentId;
      }

      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch(`/api/payments/${activePaymentId}/upload-comprobante`, {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "No se pudo subir el comprobante.");
      }

      setSuccess(true);
      if (onSuccess) {
        onSuccess();
      }

      setTimeout(() => {
        onClose();
        router.refresh();
      }, 1500);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error inesperado al subir el comprobante.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-border p-6 space-y-5 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between border-b border-border/60 pb-3">
          <div>
            <h3 className="text-lg font-serif text-foreground">
              Subir Comprobante QR
            </h3>
            <p className="text-xs text-muted">
              Pedido #{orderNumber || orderId.slice(-6)}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={uploading}
            className="text-muted hover:text-foreground text-sm font-bold p-1"
          >
            ✕
          </button>
        </div>

        {success ? (
          <div className="py-8 text-center space-y-3">
            <div className="w-12 h-12 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto">
              ✓
            </div>
            <p className="text-base font-serif text-foreground font-medium">
              ¡Comprobante subido con éxito!
            </p>
            <p className="text-xs text-muted">
              El equipo de Fit Andes revisará tu pago a la brevedad posible.
            </p>
          </div>
        ) : (
          <form onSubmit={handleUpload} className="space-y-4">
            <div className="p-3.5 bg-amber-50/70 border border-amber-200 rounded-lg text-xs text-amber-900 space-y-1">
              <p className="font-semibold flex items-center gap-1.5">
                <span>🏦</span> Pago por QR BancoSol
              </p>
              <p className="text-[11px] text-amber-800 leading-relaxed">
                Asegúrate de que la captura muestre la fecha, hora y número de transacción de la transferencia.
              </p>
            </div>

            {/* Dropzone / Preview */}
            <div className="border-2 border-dashed border-border rounded-xl p-5 text-center hover:border-foreground/30 transition-colors bg-surface/30">
              {previewUrl ? (
                <div className="space-y-3">
                  <div className="relative aspect-[4/3] w-full max-w-[220px] mx-auto rounded-lg overflow-hidden border border-border shadow-xs">
                    <Image
                      src={previewUrl}
                      alt="Vista previa de comprobante"
                      fill
                      className="object-cover"
                    />
                  </div>
                  <p className="text-xs text-muted truncate">{file?.name}</p>
                  <label
                    htmlFor="modal-receipt-file"
                    className="inline-block text-[11px] text-foreground font-medium cursor-pointer underline hover:opacity-75"
                  >
                    Elegir otra imagen
                  </label>
                </div>
              ) : existingReceiptUrl ? (
                <div className="space-y-3">
                  <div className="relative aspect-[4/3] w-full max-w-[180px] mx-auto rounded-lg overflow-hidden border border-border shadow-xs">
                    <Image
                      src={existingReceiptUrl}
                      alt="Comprobante previo"
                      fill
                      className="object-cover opacity-80"
                    />
                  </div>
                  <p className="text-[11px] text-muted">Comprobante anterior registrado</p>
                  <label
                    htmlFor="modal-receipt-file"
                    className="inline-block px-3 py-1.5 border border-border rounded bg-white text-xs text-foreground font-medium cursor-pointer hover:bg-surface"
                  >
                    Reemplazar por nuevo comprobante
                  </label>
                </div>
              ) : (
                <label
                  htmlFor="modal-receipt-file"
                  className="cursor-pointer block py-4 group"
                >
                  <div className="w-10 h-10 bg-background rounded-full flex items-center justify-center mx-auto mb-2 border border-border group-hover:scale-110 transition-transform">
                    <svg className="w-5 h-5 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a2 2 0 002 2h12 a2 2 0 002-2v-1M16 8l-4-4m0 0L8 8m4-4v12" />
                    </svg>
                  </div>
                  <p className="text-xs font-medium text-foreground">
                    Toca para adjuntar comprobante
                  </p>
                  <p className="text-[10px] text-muted mt-0.5">JPG, PNG hasta 5 MB</p>
                </label>
              )}

              <input
                id="modal-receipt-file"
                type="file"
                accept="image/*"
                onChange={(e) => handleFileChange(e.target.files?.[0] ?? null)}
                className="hidden"
              />
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded text-xs text-red-700">
                {error}
              </div>
            )}

            <div className="pt-2 flex justify-end gap-2.5">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onClose}
                disabled={uploading}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="sm"
                loading={uploading}
                disabled={uploading || !file}
              >
                {uploading ? "Subiendo..." : "Enviar comprobante"}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
