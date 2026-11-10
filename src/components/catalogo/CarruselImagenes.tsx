"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

interface Props {
  imagenes: string[];
  alt: string;
  className?: string;
  imgClassName?: string;
  duracionMs?: number;
  mostrarIndicadores?: boolean;
  mostrarControles?: boolean;
  autoPlay?: boolean;
}

export default function CarruselImagenes({
  imagenes,
  alt,
  className = "",
  imgClassName = "",
  duracionMs = 3000,
  mostrarIndicadores = true,
  mostrarControles = true,
  autoPlay = false,
}: Props) {
  const [indiceActual, setIndiceActual] = useState(0);
  const claveImagenes = imagenes.join("|");

  function mover(paso: number) {
    setIndiceActual((actual) => (actual + paso + imagenes.length) % imagenes.length);
  }

  function manejarControl(paso: number) {
    return (event: { preventDefault: () => void; stopPropagation: () => void }) => {
      event.preventDefault();
      event.stopPropagation();
      mover(paso);
    };
  }

  useEffect(() => {
    setIndiceActual(0);
  }, [claveImagenes]);

  useEffect(() => {
    if (!autoPlay || imagenes.length <= 1) return;

    // Respetar preferencias de accesibilidad de movimiento reducido
    if (typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }

    const intervalo = window.setInterval(() => {
      setIndiceActual((actual) => (actual + 1) % imagenes.length);
    }, duracionMs);

    return () => window.clearInterval(intervalo);
  }, [autoPlay, duracionMs, imagenes.length, claveImagenes]);

  if (imagenes.length === 0) return null;

  // En tarjetas de producto (sin controles): imagen principal fija y segunda imagen en hover (estilo e-commerce moda)
  if (!mostrarControles && imagenes.length > 1) {
    return (
      <div className={`relative h-full w-full overflow-hidden ${className}`.trim()}>
        <Image
          src={imagenes[0]}
          alt={alt}
          fill
          sizes="(max-width: 768px) 100vw, 50vw"
          className={`object-cover transition-transform duration-500 group-hover:scale-105 ${imgClassName}`.trim()}
        />
        <Image
          src={imagenes[1]}
          alt={`${alt} vista alternativa`}
          fill
          sizes="(max-width: 768px) 100vw, 50vw"
          className={`object-cover opacity-0 transition-opacity duration-500 group-hover:opacity-100 ${imgClassName}`.trim()}
        />
      </div>
    );
  }

  return (
    <div className={`relative h-full w-full overflow-hidden ${className}`.trim()}>
      <div
        className="flex h-full transition-transform duration-700 ease-out"
        style={{
          width: `${imagenes.length * 100}%`,
          transform: `translateX(-${indiceActual * (100 / imagenes.length)}%)`,
        }}
      >
        {imagenes.map((imagen, index) => (
          <div key={`${imagen}-${index}`} className="relative h-full shrink-0" style={{ width: `${100 / imagenes.length}%` }}>
            <Image src={imagen} alt={alt} fill sizes="(max-width: 768px) 100vw, 50vw" className={`object-cover ${imgClassName}`.trim()} />
          </div>
        ))}
      </div>

      {mostrarControles && imagenes.length > 1 && (
        <>
          <button
            type="button"
            aria-label="Imagen anterior"
            onClick={manejarControl(-1)}
            className="absolute left-3 top-1/2 z-10 hidden md:flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border text-sm transition-opacity hover:opacity-85 bg-foreground/50 border-background/30 text-background"
          >
            {"‹"}
          </button>
          <button
            type="button"
            aria-label="Imagen siguiente"
            onClick={manejarControl(1)}
            className="absolute right-3 top-1/2 z-10 hidden md:flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border text-sm transition-opacity hover:opacity-85 bg-foreground/50 border-background/30 text-background"
          >
            {"›"}
          </button>
        </>
      )}

      {mostrarIndicadores && imagenes.length > 1 && (
        <div
          className="absolute bottom-3 left-1/2 hidden md:flex -translate-x-1/2 items-center gap-1.5 rounded-full px-2 py-1 bg-foreground/30"
        >
          {imagenes.map((_, index) => (
            <span
              key={index}
              className="h-1.5 w-1.5 rounded-full transition-all duration-300"
              style={{
                background: index === indiceActual ? "var(--background)" : "rgba(245,242,238,0.45)",
                transform: index === indiceActual ? "scale(1.15)" : "scale(1)",
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
