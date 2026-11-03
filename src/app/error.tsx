"use client";

import { useEffect } from "react";
import Link from "next/link";
import { getWhatsAppLink } from "@/lib/constants";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Registro para monitoreo interno
    console.error("FitAndes Application Error:", error);
  }, [error]);

  return (
    <main className="min-h-[70vh] flex items-center justify-center px-4 py-16">
      <div className="max-w-md w-full text-center space-y-6">
        <span className="inline-block text-xs uppercase tracking-[0.25em] text-danger font-medium">
          Aviso del Sistema
        </span>
        <h1 className="text-3xl sm:text-4xl font-serif text-foreground font-normal tracking-tight">
          Ocurrió un contratiempo
        </h1>
        <p className="text-sm text-muted leading-relaxed">
          No pudimos cargar esta sección correctamente. Puede deberse a una intermitencia temporal de conexión
          con nuestros servidores.
        </p>

        <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={() => reset()}
            className="w-full sm:w-auto px-6 py-3 bg-foreground text-background text-xs uppercase tracking-widest font-medium hover:bg-foreground/90 transition-all rounded-sm shadow-sm cursor-pointer"
          >
            Reintentar
          </button>
          <Link
            href="/"
            className="w-full sm:w-auto px-6 py-3 border border-border text-foreground text-xs uppercase tracking-widest font-medium hover:bg-surface transition-all rounded-sm"
          >
            Volver al Inicio
          </Link>
        </div>

        <div className="pt-4 border-t border-border/40">
          <p className="text-xs text-muted">
            Si el problema persiste, escríbenos directamente a{" "}
            <a
              href={getWhatsAppLink("Hola, tuve un inconveniente al cargar una sección en la tienda web.")}
              target="_blank"
              rel="noopener noreferrer"
              className="text-foreground underline underline-offset-4 hover:text-accent transition-colors"
            >
              Atención al Cliente
            </a>
          </p>
        </div>
      </div>
    </main>
  );
}

