"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function PortalSidebar() {
  const pathname = usePathname();

  const links = [
    { href: "/dashboard", label: "Dashboard" },
    { href: "/pedidos", label: "Mis pedidos" },
    { href: "/catalogo", label: "Catálogo" },
  ];

  return (
    <aside className="flex lg:flex-col gap-3 lg:gap-2 overflow-x-auto lg:overflow-visible pb-2 lg:pb-0 scrollbar-hide">
      {links.map((link) => {
        const active = pathname === link.href || (link.href !== "/" && pathname?.startsWith(link.href));
        return (
          <Link
            key={link.href}
            href={link.href}
            className={`shrink-0 border px-5 py-3 text-[11px] uppercase transition-all rounded-[var(--radius-md)] tracking-[0.16em] ${
              active 
                ? "bg-foreground text-background border-foreground shadow-sm" 
                : "bg-white text-muted border-border hover:bg-background"
            }`}
            aria-current={active ? "page" : undefined}
          >
            {link.label}
          </Link>
        );
      })}
    </aside>
  );
}
