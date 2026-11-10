"use client";

import Link from "next/link";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { FaWhatsapp, FaTiktok, FaFacebook } from "react-icons/fa";
import { getWhatsAppLink, SOCIAL_LINKS, WHATSAPP_DISPLAY } from "@/lib/constants";
import LegalContentModal, { LegalModalSection } from "@/components/layout/LegalContentModal";

export default function SiteFooter() {
  const pathname = usePathname();
  const [legalModalOpen, setLegalModalOpen] = useState(false);
  const [legalSection, setLegalSection] = useState<LegalModalSection>("terminos");

  // No renderizar footer en login, registro o checkout para no distraer del flujo transaccional
  if (pathname === "/login" || pathname === "/registro" || pathname === "/checkout" || pathname?.startsWith("/pagar")) {
    return null;
  }

  function handleOpenLegal(section: LegalModalSection) {
    setLegalSection(section);
    setLegalModalOpen(true);
  }

  return (
    <>
      <footer className="bg-foreground text-background border-t border-border/20">
        <div className="mx-auto grid max-w-[1240px] grid-cols-1 gap-10 px-5 py-14 sm:grid-cols-2 sm:px-6 lg:grid-cols-4 lg:py-16">
          {/* Columna 1: Marca */}
          <div>
            <p
              className="text-xl font-bold uppercase mb-4"
              style={{ fontFamily: "var(--font-serif, Georgia, serif)", letterSpacing: "0.25em" }}
            >
              FitAndes
            </p>
            <p className="text-sm leading-7 text-background/80">
              Ropa con fibras nobles y acabados artesanales. Catálogo visual y compra guiada.
            </p>
          </div>

          {/* Columna 2: Explorar */}
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

          {/* Columna 3: Información Legal & FAQ (Exclusivamente los 4 elementos solicitados con apertura en Modal) */}
          <div>
            <p className="text-xs uppercase font-semibold mb-5 text-subtle" style={{ letterSpacing: "0.2em" }}>
              Legal y Ayuda
            </p>
            <div className="flex flex-col gap-3 text-left">
              <button
                type="button"
                onClick={() => handleOpenLegal("terminos")}
                className="text-left text-sm hover:opacity-60 transition-opacity text-background"
              >
                Términos y condiciones
              </button>
              <button
                type="button"
                onClick={() => handleOpenLegal("privacidad")}
                className="text-left text-sm hover:opacity-60 transition-opacity text-background"
              >
                Privacidad de datos
              </button>
              <button
                type="button"
                onClick={() => handleOpenLegal("cookies")}
                className="text-left text-sm hover:opacity-60 transition-opacity text-background"
              >
                Política de cookies
              </button>
              <button
                type="button"
                onClick={() => handleOpenLegal("faq")}
                className="text-left text-sm hover:opacity-60 transition-opacity text-background"
              >
                Preguntas frecuentes (FAQ)
              </button>
            </div>
          </div>

          {/* Columna 4: Contacto y Redes */}
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

        {/* Barra inferior */}
        <div className="border-t border-border/10 py-6 px-4">
          <div className="max-w-[1240px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left text-xs text-background/60">
            <p>© {new Date().getFullYear()} FitAndes. Todos los derechos reservados.</p>
            <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1">
              <button
                type="button"
                onClick={() => handleOpenLegal("terminos")}
                className="hover:text-background transition-colors underline-offset-2 hover:underline"
              >
                Términos y condiciones
              </button>
              <span>·</span>
              <button
                type="button"
                onClick={() => handleOpenLegal("privacidad")}
                className="hover:text-background transition-colors underline-offset-2 hover:underline"
              >
                Privacidad de datos
              </button>
              <span>·</span>
              <button
                type="button"
                onClick={() => handleOpenLegal("cookies")}
                className="hover:text-background transition-colors underline-offset-2 hover:underline"
              >
                Política de cookies
              </button>
              <span>·</span>
              <button
                type="button"
                onClick={() => handleOpenLegal("faq")}
                className="hover:text-background transition-colors underline-offset-2 hover:underline"
              >
                FAQ
              </button>
            </div>
          </div>
        </div>
      </footer>

      {/* Modal interactivo de contenido legal y FAQ */}
      <LegalContentModal
        isOpen={legalModalOpen}
        initialSection={legalSection}
        onClose={() => setLegalModalOpen(false)}
      />
    </>
  );
}
