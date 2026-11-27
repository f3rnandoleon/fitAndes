"use client";

import { useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { FaClock, FaWhatsapp } from "react-icons/fa";
import { getWhatsAppLink, WHATSAPP_DISPLAY } from "@/lib/constants";

export function ReservationExpiredBanner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const [dismissed, setDismissed] = useState(false);

  const isExpiredRedirect = searchParams.get("reservaExpirada") === "1";

  if (!isExpiredRedirect || dismissed) {
    return null;
  }

  function handleDismiss() {
    setDismissed(true);
    const nextParams = new URLSearchParams(searchParams.toString());
    nextParams.delete("reservaExpirada");
    const nextQuery = nextParams.toString();
    router.replace(nextQuery ? `${pathname}?${nextQuery}` : pathname, { scroll: false });
  }

  const helpWhatsappUrl = getWhatsAppLink(
    "Hola FitAndes, terminó mi tiempo límite de reserva de 10 minutos en la web y quisiera consultar por mi pago/prendas."
  );

  return (
    <div
      role="alert"
      className="mb-6 rounded-[22px] border border-amber-300 bg-amber-50/90 p-4 sm:p-5 text-amber-950 shadow-xs"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2.5 sm:gap-3 min-w-0 flex-1">
          <span className="mt-0.5 flex h-8 w-8 sm:h-9 sm:w-9 shrink-0 items-center justify-center rounded-full bg-amber-200 text-amber-900">
            <FaClock className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
          </span>
          <div className="min-w-0 flex-1 space-y-1.5 text-xs sm:text-sm leading-relaxed break-words">
            <p className="font-semibold text-amber-950">Tiempo límite de reserva terminado</p>
            <p className="text-amber-900">
              Pasaron los 10 minutos sin recibir tu comprobante de pago, por lo que las prendas fueron liberadas y
              vuelven a estar disponibles en el catálogo. Puedes agregarlas nuevamente para intentar tu compra.
            </p>
            <p className="pt-0.5 text-xs">
              ¿Ya realizaste tu transferencia por QR?{" "}
              <a
                href={helpWhatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 font-semibold text-amber-950 underline underline-offset-2 hover:opacity-80"
              >
                <FaWhatsapp className="h-3.5 w-3.5 text-[#1fb959]" />
                Escríbenos por WhatsApp ({WHATSAPP_DISPLAY})
              </a>
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleDismiss}
          aria-label="Cerrar aviso"
          className="shrink-0 rounded-full border border-amber-300 bg-white/80 px-2.5 py-1 text-xs font-medium text-amber-900 hover:bg-white transition-colors cursor-pointer"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
