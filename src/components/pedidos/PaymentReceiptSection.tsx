"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Props = {
  orderId: string;
  paymentMethod?: string | null;
  paymentStatus?: string | null;
  defaultPaymentId?: string | null;
};

function shouldShowSection(paymentMethod?: string | null, paymentStatus?: string | null) {
  if (paymentMethod !== "QR") return false;
  return paymentStatus !== "PAID";
}

export default function PaymentReceiptSection({ orderId, paymentMethod, paymentStatus, defaultPaymentId = null }: Props) {
  const router = useRouter();
  const [paymentId, setPaymentId] = useState<string | null>(defaultPaymentId);
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (defaultPaymentId) {
      window.localStorage.setItem(`fitandes-payment:${orderId}`, defaultPaymentId);
      setPaymentId(defaultPaymentId);
      return;
    }

    const storedPaymentId = window.localStorage.getItem(`fitandes-payment:${orderId}`);
    if (storedPaymentId) {
      setPaymentId(storedPaymentId);
    }
  }, [defaultPaymentId, orderId]);

  if (!shouldShowSection(paymentMethod, paymentStatus)) {
    return null;
  }

  async function handleSubmit() {
    if (!paymentId) {
      setError("No encontre la transaccion QR asociada a este pedido. Vuelve a crear el pedido desde checkout si lo acabas de generar.");
      return;
    }

    if (!file) {
      setError("Selecciona una imagen antes de continuar.");
      return;
    }

    setError("");
    setMessage("");
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch(`/api/payments/${paymentId}/upload-comprobante`, {
        method: "POST",
        body: formData,
      });

      const data = (await response.json().catch(() => null)) as { message?: string } | null;
      if (!response.ok) {
        setError(data?.message ?? "No pude subir el comprobante.");
        setLoading(false);
        return;
      }

      setMessage(data?.message ?? "Comprobante enviado correctamente.");
      setFile(null);
      router.refresh();
    } catch {
      setError("Ocurrio un problema al subir el comprobante.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="border p-5 space-y-4" style={{ borderColor: "var(--border)", background: "var(--surface)" }}>
      <div>
        <p className="text-xs uppercase mb-2" style={{ letterSpacing: "0.14em", color: "var(--subtle)" }}>
          Pago QR
        </p>
        <p className="text-sm" style={{ color: "var(--muted)" }}>
          Tu pedido esta pendiente de pago. Sube el comprobante para que el sistema central notifique al equipo y lo revisen.
        </p>
      </div>

      <input
        type="file"
        accept="image/*"
        onChange={(event) => setFile(event.target.files?.[0] ?? null)}
        className="block w-full text-sm"
      />

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

      <button
        type="button"
        onClick={handleSubmit}
        disabled={loading}
        className="inline-flex items-center justify-center bg-[#111111] px-5 py-3 text-xs uppercase text-white transition-opacity hover:opacity-85 disabled:cursor-not-allowed disabled:opacity-60"
        style={{ letterSpacing: "0.16em" }}
      >
        {loading ? "Subiendo..." : "Subir comprobante"}
      </button>
    </div>
  );
}
