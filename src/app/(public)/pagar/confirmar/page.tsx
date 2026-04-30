import { Suspense } from "react";
import QRPaymentConfirmationClient from "@/components/checkout/QRPaymentConfirmationClient";

export default function PagarConfirmarPage() {
  return (
    <main className="min-h-[calc(100vh-82px)] px-4 sm:px-6 py-10 sm:py-16 bg-[#fbf9f5]">
      <div className="max-w-[1240px] mx-auto">
        <header className="text-center mb-12 sm:mb-16">
          <p className="text-[10px] uppercase tracking-[0.2em] text-subtle mb-3">Paso Final</p>
          <h1 className="text-4xl sm:text-5xl font-serif text-foreground">Completa tu pago QR</h1>
          <p className="mt-4 text-sm text-muted max-w-lg mx-auto leading-relaxed">
            Realiza la transferencia y sube tu comprobante para que podamos registrar tu pedido y reservar tus productos.
          </p>
        </header>

        <Suspense fallback={<div className="text-center py-20 text-subtle animate-pulse">Preparando entorno de pago...</div>}>
          <QRPaymentConfirmationClient />
        </Suspense>
      </div>
    </main>
  );
}
