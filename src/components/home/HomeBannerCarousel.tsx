"use client";

import { useEffect, useState, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { FaWhatsapp } from "react-icons/fa";
import { FiChevronLeft, FiChevronRight } from "react-icons/fi";
import type { PublicBanner } from "@/types/catalogo";

interface Props {
  banners: PublicBanner[];
}

export default function HomeBannerCarousel({ banners }: Props) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const total = banners.length;

  useEffect(() => {
    if (total <= 1 || isPaused) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    timerRef.current = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % total);
    }, 5500);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [total, isPaused]);

  if (total === 0) return null;

  const isSingle = total === 1;

  function prevSlide() {
    setCurrentIndex((prev) => (prev - 1 + total) % total);
  }

  function nextSlide() {
    setCurrentIndex((prev) => (prev + 1) % total);
  }

  return (
    <section
      id="inicio"
      aria-label="Campañas destacadas"
      className="relative w-full overflow-hidden bg-[#201d1a]"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={() => setIsPaused(true)}
      onTouchEnd={() => setIsPaused(false)}
    >
      <div className="relative w-full h-[480px] sm:h-[560px] lg:h-[640px]">
        {banners.map((banner, index) => {
          const isActive = index === currentIndex;
          const targetUrl = banner.actionUrl || "/catalogo";
          const isWhatsApp = banner.tipoAccion === "WHATSAPP" || targetUrl.includes("wa.me");

          return (
            <div
              key={banner._id || index}
              aria-hidden={!isActive}
              className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${
                isActive ? "opacity-100 z-10 pointer-events-auto" : "opacity-0 z-0 pointer-events-none"
              }`}
            >
              {/* Desktop Image */}
              <div className="hidden sm:block absolute inset-0">
                <Image
                  src={banner.imagenDesktopUrl}
                  alt={banner.titulo}
                  fill
                  priority={index === 0}
                  sizes="100vw"
                  className="object-cover object-center"
                />
              </div>

              {/* Mobile Image (falls back to desktop if mobile not provided) */}
              <div className="block sm:hidden absolute inset-0">
                <Image
                  src={banner.imagenMobileUrl || banner.imagenDesktopUrl}
                  alt={banner.titulo}
                  fill
                  priority={index === 0}
                  sizes="100vw"
                  className="object-cover object-center"
                />
              </div>

              {/* Degradado oscuro para garantizar legibilidad del texto */}
              <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/45 to-transparent sm:from-black/70 sm:via-black/35 sm:to-black/10" />

              {/* Contenido textual y botón de acción */}
              <div className="relative z-20 h-full max-w-[1240px] mx-auto px-5 sm:px-6 flex flex-col justify-center max-w-2xl text-white">
                <span className="inline-block text-[10px] sm:text-xs uppercase tracking-[0.25em] text-[#d6b785] font-medium mb-3">
                  Campañas & Novedades
                </span>

                <h1
                  className="text-3xl sm:text-5xl lg:text-6xl font-normal leading-tight text-white mb-4"
                  style={{ fontFamily: "var(--font-serif, Georgia, serif)" }}
                >
                  {banner.titulo}
                </h1>

                {banner.descripcion ? (
                  <p className="text-sm sm:text-base text-white/85 max-w-lg mb-8 leading-relaxed">
                    {banner.descripcion}
                  </p>
                ) : null}

                <div className="flex flex-wrap items-center gap-3">
                  {isWhatsApp ? (
                    <a
                      href={targetUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center gap-2.5 rounded-full px-6 py-3.5 text-xs uppercase bg-[#25d366] text-white font-medium hover:bg-[#20b858] transition-transform duration-200 hover:-translate-y-0.5 active:scale-95 shadow-md"
                      style={{ letterSpacing: "0.14em" }}
                    >
                      <FaWhatsapp className="text-base" />
                      Consultar por WhatsApp
                    </a>
                  ) : (
                    <Link
                      href={targetUrl}
                      className="inline-flex items-center justify-center gap-2.5 rounded-full px-6 py-3.5 text-xs uppercase bg-white text-black font-medium hover:bg-white/90 transition-transform duration-200 hover:-translate-y-0.5 active:scale-95 shadow-md"
                      style={{ letterSpacing: "0.14em" }}
                    >
                      Explorar colección
                      <span aria-hidden="true">→</span>
                    </Link>
                  )}

                  <Link
                    href="/catalogo"
                    className="inline-flex items-center justify-center rounded-full border border-white/40 px-5 py-3.5 text-xs uppercase text-white hover:bg-white/10 transition-colors"
                    style={{ letterSpacing: "0.14em" }}
                  >
                    Ver todo el catálogo
                  </Link>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Controles de avance / retroceso (solo cuando hay 2 o más banners) */}
      {!isSingle && (
        <>
          <button
            type="button"
            onClick={prevSlide}
            aria-label="Banner anterior"
            className="absolute left-4 top-1/2 -translate-y-1/2 z-30 flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-full bg-black/40 hover:bg-black/70 text-white backdrop-blur-sm transition-all duration-200 border border-white/20"
          >
            <FiChevronLeft className="text-xl" />
          </button>
          <button
            type="button"
            onClick={nextSlide}
            aria-label="Siguiente banner"
            className="absolute right-4 top-1/2 -translate-y-1/2 z-30 flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-full bg-black/40 hover:bg-black/70 text-white backdrop-blur-sm transition-all duration-200 border border-white/20"
          >
            <FiChevronRight className="text-xl" />
          </button>

          {/* Bullets / Indicadores */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2">
            {banners.map((_, dotIdx) => (
              <button
                key={dotIdx}
                type="button"
                onClick={() => setCurrentIndex(dotIdx)}
                aria-label={`Ir al banner ${dotIdx + 1}`}
                className={`h-2.5 rounded-full transition-all duration-300 ${
                  dotIdx === currentIndex ? "w-8 bg-white" : "w-2.5 bg-white/40 hover:bg-white/60"
                }`}
              />
            ))}
          </div>
        </>
      )}
    </section>
  );
}

