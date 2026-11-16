"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FiGrid, FiPackage, FiMapPin, FiUser, FiShoppingBag, FiArrowLeft } from "react-icons/fi";

const PORTAL_LINKS = [
  { href: "/dashboard", label: "Dashboard", icon: FiGrid },
  { href: "/pedidos", label: "Mis pedidos", icon: FiPackage },
  { href: "/direcciones", label: "Mis direcciones", icon: FiMapPin },
  { href: "/perfil", label: "Mi perfil", icon: FiUser },
];

export default function PortalSidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex lg:flex-col gap-2.5 lg:gap-2 overflow-x-auto lg:overflow-visible pb-2 lg:pb-0 no-scrollbar lg:sticky lg:top-24 lg:self-start">
      {PORTAL_LINKS.map((link) => {
        const active = pathname === link.href || (link.href !== "/" && pathname?.startsWith(link.href));
        const Icon = link.icon;
        return (
          <Link
            key={link.href}
            href={link.href}
            className={`shrink-0 inline-flex items-center gap-2.5 border px-4 py-3 text-[11px] uppercase transition-all rounded-[var(--radius-md)] tracking-[0.14em] ${
              active
                ? "bg-foreground text-background border-foreground shadow-sm font-medium"
                : "bg-white text-muted border-border hover:bg-surface hover:text-foreground"
            }`}
            aria-current={active ? "page" : undefined}
          >
            <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span>{link.label}</span>
          </Link>
        );
      })}

      <div className="hidden lg:block my-2 border-t border-border/70" />

      <Link
        href="/catalogo"
        className="shrink-0 inline-flex items-center gap-2.5 border border-border bg-surface/60 px-4 py-3 text-[11px] uppercase tracking-[0.14em] text-foreground transition-all rounded-[var(--radius-md)] hover:bg-white"
      >
        <FiShoppingBag className="h-4 w-4 shrink-0 lg:hidden" aria-hidden="true" />
        <FiArrowLeft className="hidden lg:block h-4 w-4 shrink-0" aria-hidden="true" />
        <span>Volver al catálogo</span>
      </Link>
    </aside>
  );
}
