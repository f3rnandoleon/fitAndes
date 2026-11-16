"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { SEASONAL_THEME_ENABLED } from "@/lib/constants";

export default function ChristmasTopBanner() {
  const pathname = usePathname();

  if (!SEASONAL_THEME_ENABLED) {
    return null;
  }

  // Ocultar en checkout, pago, login y registro
  if (
    pathname === "/checkout" ||
    pathname?.startsWith("/pagar") ||
    pathname === "/login" ||
    pathname === "/registro"
  ) {
    return null;
  }

  return (
    <aside
      aria-label="Especial de temporada"
      className="bg-[#8b1525] text-white text-[11px] sm:text-xs py-2 px-3 border-b border-[#a82033]/70 shadow-xs relative z-40 text-center"
    >
      <Link href="/catalogo" className="hover:underline underline-offset-4">
        Colección de temporada disponible — Retiro gratis en La Paz y envíos a toda Bolivia
      </Link>
    </aside>
  );
}
