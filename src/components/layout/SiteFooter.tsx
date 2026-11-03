"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FaWhatsapp, FaTiktok, FaFacebook } from "react-icons/fa";
import { getWhatsAppLink, SOCIAL_LINKS, WHATSAPP_DISPLAY } from "@/lib/constants";

export default function SiteFooter() {
  const pathname = usePathname();

  // No renderizar footer en login, registro o checkout para no distraer del flujo transaccional
  if (pathname === "/login" || pathname === "/registro" || pathname === "/checkout" || pathname?.startsWith("/pagar")) {
    return null;
  }

  return (
    <footer className="bg-foreground text-background border-t border-border/20">
      <div className="mx-auto grid max-w-[1240px] grid-cols-1 gap-10 px-5 py-14 sm:grid-cols-2 sm:px-6 lg:grid-cols-4 lg:py-16">
        <div>
          <p
            className="text-xl font-bold uppercase mb-4"
            style={{ fontFamily: "var(--font-serif, Georgia, serif)", letterSpacing: "0.25em" }}
          >
            FitAndes
          </p>
          <p className="text-sm leading-7 text-background/80">
            Moda boliviana de alta calidad con fibras nobles y acabados artesanales. Catálogo visual y compra guiada.
          </p>
        </div>

        <div>
          <p className="text-xs uppercase font-semibold mb-5 text-subtle" style={{ letterSpacing: "0.2em" }}>
            Explorar
          </p>
          <div className="flex flex-col gap-3">
            {[
              { label: "Catálogo completo", href: "/catalogo" },
              { label: "Nueva colección", href: "/#nuevo" },
              { label: "Nuestras sucursales", href: "/ubicaciones" },
              { label: "Sobre nosotros", href: "/nosotros" },
            ].map((item) => (
              <Link key={item.label} href={item.href} className="text-sm hover:opacity-50 transition-opacity text-background">
                {item.label}
              </Link>
            ))}
          </div>
        </div>

        <div>
          <p className="text-xs uppercase font-semibold mb-5 text-subtle" style={{ letterSpacing: "0.2em" }}>
            Ayuda & Cuenta
          </p>
          <div className="flex flex-col gap-3">
            {[
              { label: "Preguntas frecuentes", href: "/faq" },
              { label: "Políticas y cambios", href: "/politicas" },
              { label: "Mis pedidos", href: "/pedidos" },
              { label: "Iniciar sesión", href: "/login" },
            ].map((item) => (
              <Link key={item.label} href={item.href} className="text-sm hover:opacity-50 transition-opacity text-background">
                {item.label}
              </Link>
            ))}
          </div>
        </div>

        <div>
          <p className="text-xs uppercase font-semibold mb-5 text-subtle" style={{ letterSpacing: "0.2em" }}>
            Contacto y Redes
          </p>
          <div className="flex flex-col gap-3">
            <a
              href={getWhatsAppLink()}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2.5 text-sm hover:opacity-75 transition-opacity text-background"
            >
              <FaWhatsapp className="text-lg text-[#25d366]" />
              <span>WhatsApp ({WHATSAPP_DISPLAY})</span>
            </a>
            <a
              href={SOCIAL_LINKS.tiktok}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2.5 text-sm hover:opacity-75 transition-opacity text-background"
            >
              <FaTiktok className="text-base text-background/80" />
              <span>TikTok (@fitandes)</span>
            </a>
            <a
              href={SOCIAL_LINKS.facebook}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2.5 text-sm hover:opacity-75 transition-opacity text-background"
            >
              <FaFacebook className="text-base text-[#1877f2]" />
              <span>Facebook</span>
            </a>
          </div>
        </div>
      </div>

      <div className="border-t border-border/10 py-6 text-center text-xs text-background/60">
        <p>© {new Date().getFullYear()} FitAndes. Confección Textil Boliviana. Todos los derechos reservados.</p>
      </div>
    </footer>
  );
}
