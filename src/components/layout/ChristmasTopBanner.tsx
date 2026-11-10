"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FaGift } from "react-icons/fa";

export default function ChristmasTopBanner() {
  const pathname = usePathname();

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
      aria-label="Especial de Navidad"
      className="bg-[#8b1525] text-white text-[11px] sm:text-xs py-2 px-3 border-b border-[#a82033]/70 shadow-xs relative z-40"
    >

    </aside>
  );
}

