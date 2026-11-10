"use client";

import { usePathname } from "next/navigation";
import { FaWhatsapp } from "react-icons/fa";
import { getWhatsAppLink } from "@/lib/constants";

export default function FloatingWhatsApp() {
  const pathname = usePathname();

  // Ocultar en páginas de checkout, pago y autenticación para evitar superposiciones con los CTAs móviles
  if (
    pathname === "/checkout" ||
    pathname?.startsWith("/pagar") ||
    pathname === "/login" ||
    pathname === "/registro"
  ) {
    return null;
  }

  return (
    <a
      href={getWhatsAppLink("Hola Fit Andes, quisiera hacer una consulta sobre la colección navideña y envíos.")}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-4 right-4 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-[0_10px_25px_rgba(37,211,102,0.4)] transition-transform hover:scale-110 active:scale-95 sm:bottom-6 group"
      aria-label="Contactar por WhatsApp"
    >
      <span
        className="absolute -top-2.5 -right-1 text-lg transform rotate-12 drop-shadow-md select-none pointer-events-none transition-transform group-hover:scale-125"
        aria-hidden="true"
      >
        🎅
      </span>
      <FaWhatsapp size={30} />
    </a>
  );
}
