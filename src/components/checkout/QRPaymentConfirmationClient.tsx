"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { formatPrice } from "@/lib/format";
import { useReservationCart } from "@/components/providers/ReservationCartProvider";
import { resolveFinalCheckoutTotal } from "@/components/checkout/CheckoutSummarySidebar";
import type { CheckoutSubmitPayload, CheckoutSubmitResponse } from "@/types/checkout";
import { getCouponErrorMessage, type PricingSummary } from "@/types/promociones";

interface PendingPreviewData {
  shippingCost?: number;
  shippingLabel?: string;
  pricingSummary?: PricingSummary | null;
}

export default function QRPaymentConfirmationClient() {
  const router = useRouter();
  const { clearCart } = useReservationCart();
  const [payload, setPayload] = useState<CheckoutSubmitPayload | null>(null);
  const [shippingCost, setShippingCost] = useState(0);
  const [shippingLabel, setShippingLabel] = useState("Gratis");
  const [pricingSummary, setPricingSummary] = useState<PricingSummary | null>(null);
  const [pricingLoading, setPricingLoading] = useState(false);
  const [couponWarning, setCouponWarning] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const qrImageUrl =
    process.env.NEXT_PUBLIC_BANCOSOL_QR_URL ||
    "https://res.cloudinary.com/dq1jeikev/image/upload/v1777964054/comprobante_xvdhuf.jpg";

  useEffect(() => {
    const stored = window.localStorage.getItem("fitandes-pending-checkout");
    if (!stored) {
      router.replace("/checkout");
      return;
    }

    let parsedPayload: CheckoutSubmitPayload;
    try {
      parsedPayload = JSON.parse(stored) as CheckoutSubmitPayload;
      setPayload(parsedPayload);
    } catch {
      router.replace("/checkout");
      return;
    }

    let initialShipping = 0;
    try {
      const rawPreview = window.localStorage.getItem("fitandes-pending-checkout-preview");
      if (rawPreview) {
        const preview = JSON.parse(rawPreview) as PendingPreviewData;
        if (typeof preview.shippingCost === "number" && Number.isFinite(preview.shippingCost)) {
          initialShipping = preview.shippingCost;
          setShippingCost(preview.shippingCost);
        }
        if (typeof preview.shippingLabel === "string" && preview.shippingLabel.trim()) {
          setShippingLabel(preview.shippingLabel);
        }
        if (preview.pricingSummary) {
          setPricingSummary(preview.pricingSummary);
        }
      }
    } catch {
      // Ignora preview corrupto; re-evaluaremos en servidor
    }

    // Re-evaluación en vivo contra el servidor central para asegurar el monto exacto a transferir
    const validItems = parsedPayload.items
      .filter((item) => Boolean(item.productoId))
      .map((item) => ({
        productoId: item.productoId,
        varianteId: item.variantId ?? undefined,
        color: item.color,
        talla: item.talla,
        cantidad: item.cantidad,
      }));

    if (validItems.length === 0) return;

    const controller = new AbortController();
    setPricingLoading(true);
    void fetch("/api/promociones/evaluar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: controller.signal,
      body: JSON.stringify({
        items: validItems,
        cuponCodigo: parsedPayload.cuponCodigo || undefined,
        costoEnvio: initialShipping,
        telefonoInvitado: parsedPayload.esInvitado ? parsedPayload.clienteInvitado?.telefono : undefined,
      }),
    })
      .then(async (res) => {
        const data = await res.json().catch(() => null);
        if (!res.ok || !data?.ok || !data.resumenPrecios) return;
        const summary = data.resumenPrecios as PricingSummary;
        setPricingSummary(summary);
        if (parsedPayload.cuponCodigo && summary.cuponValido === false) {
          setCouponWarning(getCouponErrorMessage(summary.cuponErrorCodigo, summary.cuponErrorMensaje));
        }
      })
      .catch(() => {
        // Mantiene el preview guardado si falla la red
      })
      .finally(() => {
        if (!controller.signal.aborted) setPricingLoading(false);
      });

    return () => controller.abort();
  }, [router]);

  if (!payload) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-pulse text-subtle">Cargando datos de tu pedido...</div>
      </div>
    );
  }

  const baseItemsTotal = payload.items.reduce((acc, item) => acc + item.precio * item.cantidad, 0);
  const total = resolveFinalCheckoutTotal(baseItemsTotal, shippingCost, pricingSummary);
  const descuentoCatalogo = pricingSummary?.descuentoCatalogo ?? 0;
  const descuentoPromociones = pricingSummary?.descuentoPromociones ?? 0;
  const descuentoEnvio = pricingSummary?.descuentoEnvio ?? 0;
  const netShipping = Math.max(0, shippingCost - descuentoEnvio);
  const subtotalBase = pricingSummary
    ? descuentoCatalogo > 0
      ? pricingSummary.subtotalLista
      : pricingSummary.subtotalPostCatalogo
    : baseItemsTotal;
  const hasAnyDiscount = descuentoCatalogo > 0 || descuentoPromociones > 0 || descuentoEnvio > 0;

  async function handleFinalize() {
    if (!file) {
      setError("Por favor selecciona una imagen de tu comprobante antes de finalizar.");
      return;
    }

    setError("");
    setProcessing(true);

    try {
      // 1. Crear el pedido (nunca enviamos montos de descuento; solo cuponCodigo opcional)
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

      // 3. Limpiar todo (el pedido ya se creó, así que vaciamos el carrito local)
      window.localStorage.removeItem("fitandes-pending-checkout");
      window.localStorage.removeItem("fitandes-pending-checkout-preview");
      clearCart();

      const isGuest = Boolean(payload?.esInvitado);

      if (!uploadResponse.ok) {
        // El pedido se creó pero el comprobante falló.
        if (isGuest) {
          router.push(
            `/checkout/confirmacion?orderId=${checkoutData.orderId}&numero=${encodeURIComponent(
              checkoutData.orderNumber || "",
            )}&metodo=${encodeURIComponent(payload?.delivery?.method || "")}&comprobante=0`,
          );
        } else {
          router.push(`/pedidos/${checkoutData.orderId}`);
        }
        return;
      }

      setSuccess(true);

      setTimeout(() => {
        if (isGuest) {
          router.push(
            `/checkout/confirmacion?orderId=${checkoutData.orderId}&numero=${encodeURIComponent(
              checkoutData.orderNumber || "",
            )}&metodo=${encodeURIComponent(payload?.delivery?.method || "")}&comprobante=1`,
          );
        } else {
          router.push(`/pedidos/${checkoutData.orderId}`);
          router.refresh();
        }
      }, 1500);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Ocurrió un error al procesar tu pedido.";
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
        <p className="text-sm text-muted">Hemos recibido tu comprobante bancario y tu pedido ya está registrado. Te redirigiremos en un momento.</p>
      </Card>
    );
  }

  return (
    <div className="grid gap-6 sm:gap-8 lg:grid-cols-2 max-w-5xl mx-auto">
      <Card padding="none" className="p-4 sm:p-6 flex flex-col items-center text-center">
        <p className="text-[10px] uppercase tracking-[0.2em] text-subtle mb-3 sm:mb-4">Paso 1: Realizar el Pago</p>
        <h2 className="text-xl font-serif mb-5 sm:mb-6">Pagar con QR</h2>

        <div className="relative w-full aspect-square max-w-[280px] sm:max-w-[320px] bg-white p-3 sm:p-4 border border-border/50 rounded-xl mb-5 sm:mb-6 shadow-sm">
          <Image src={qrImageUrl} alt="QR de Pago FitAndes" fill className="object-contain p-2" />
        </div>

        <div className="space-y-4 w-full max-w-[320px]">
          <div className="py-3 border-y border-border/50 space-y-2 text-xs text-left">
            {hasAnyDiscount && (
              <div className="flex items-start justify-between gap-3 text-muted">
                <span className="min-w-0">{descuentoCatalogo > 0 ? "Precio de lista" : "Subtotal prendas"}</span>
                <span className="shrink-0 whitespace-nowrap">{formatPrice(subtotalBase)}</span>
              </div>
            )}
            {descuentoCatalogo > 0 && (
              <div className="flex items-start justify-between gap-3 text-success">
                <span className="min-w-0">Rebajas de catálogo</span>
                <span className="shrink-0 whitespace-nowrap font-medium">- {formatPrice(descuentoCatalogo)}</span>
              </div>
            )}
            {descuentoPromociones > 0 && (
              <div className="flex items-start justify-between gap-3 text-success">
                <span className="min-w-0 break-words">
                  Promociones{payload.cuponCodigo ? ` (${payload.cuponCodigo})` : ""}
                </span>
                <span className="shrink-0 whitespace-nowrap font-medium">- {formatPrice(descuentoPromociones)}</span>
              </div>
            )}
            {shippingCost > 0 && (
              <div className="flex items-start justify-between gap-3 text-muted">
                <span className="min-w-0">Envío</span>
                <span className="shrink-0 whitespace-nowrap">
                  {descuentoEnvio > 0 && netShipping === 0 ? (
                    <span className="text-success font-medium">Gratis</span>
                  ) : (
                    formatPrice(netShipping)
                  )}
                </span>
              </div>
            )}
            {shippingCost === 0 && shippingLabel && (
              <div className="flex items-start justify-between gap-3 text-muted">
                <span className="min-w-0">Envío</span>
                <span className="shrink-0 whitespace-nowrap text-success">{shippingLabel}</span>
              </div>
            )}
            <div className="flex justify-between items-center gap-3 pt-2 border-t border-border/40">
              <span className="text-sm text-muted">Total a pagar:</span>
              <span className={`text-lg font-bold text-foreground whitespace-nowrap ${pricingLoading ? "opacity-60" : ""}`}>
                {formatPrice(total)}
              </span>
            </div>
          </div>

          {couponWarning && (
            <div className="rounded-lg border border-amber-300 bg-amber-50 p-2.5 text-[11px] text-amber-900 text-left leading-snug">
              <strong>Aviso sobre tu cupón:</strong> {couponWarning}
            </div>
          )}

          <Button variant="outline" size="sm" onClick={handleDownloadQR} className="w-full">
            Descargar Código QR
          </Button>
        </div>
      </Card>

      <Card padding="none" className="p-4 sm:p-6 flex flex-col">
        <p className="text-[10px] uppercase tracking-[0.2em] text-subtle mb-3 sm:mb-4">Paso 2: Finalizar Pedido</p>
        <h2 className="text-xl font-serif mb-5 sm:mb-6">Confirmar y Enviar</h2>

        <div className="flex-1 flex flex-col justify-center">
          <div className="border-2 border-dashed border-border rounded-2xl p-5 sm:p-8 text-center bg-surface/30">
            <input type="file" id="receipt-upload" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] ?? null)} className="hidden" />
            <label htmlFor="receipt-upload" className="cursor-pointer block">
              <div className="w-12 h-12 bg-background rounded-full flex items-center justify-center mx-auto mb-4 border border-border">
                <svg className="w-6 h-6 text-subtle" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a2 2 0 002 2h12 a2 2 0 002-2v-1M16 8l-4-4m0 0L8 8m4-4v12" />
                </svg>
              </div>
              <p className="text-sm font-medium mb-1 break-all">{file ? file.name : "Sube tu comprobante aquí"}</p>
              <p className="text-xs text-muted">El pedido se creará y la reserva se extenderá al subir el archivo</p>
            </label>
          </div>

          {error && <div className="mt-4 p-3 bg-danger/5 border border-danger/20 text-danger text-xs rounded-lg">{error}</div>}

          <div className="mt-8">
            <Button variant="primary" size="lg" className="w-full" onClick={handleFinalize} disabled={!file || processing}>
              {processing ? "Procesando pedido..." : "Confirmar y Finalizar Pedido"}
            </Button>
            <p className="mt-4 text-[11px] text-center text-muted">
              Al hacer clic, tu pedido se registrará en el sistema y se notificará de inmediato al equipo.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
