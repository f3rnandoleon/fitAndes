import Link from "next/link";
import { getWhatsAppLink } from "@/lib/constants";

export default function NotFound() {
  return (
    <main className="min-h-[70vh] flex items-center justify-center px-4 py-16">
      <div className="max-w-md w-full text-center space-y-6">
        <span className="inline-block text-xs uppercase tracking-[0.25em] text-accent font-medium">
          Error 404
        </span>
        <h1 className="text-3xl sm:text-4xl font-serif text-foreground font-normal tracking-tight">
          Prenda o página no encontrada
        </h1>
        <p className="text-sm text-muted leading-relaxed">
          La prenda que buscas ya no está disponible en este enlace o la dirección ha cambiado.
          Explora nuestra colección activa con lo mejor de la confección boliviana.
        </p>

        <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/catalogo"
            className="w-full sm:w-auto px-6 py-3 bg-foreground text-background text-xs uppercase tracking-widest font-medium hover:bg-foreground/90 transition-all rounded-sm shadow-sm"
          >
            Explorar Catálogo
          </Link>
          <Link
            href="/"
            className="w-full sm:w-auto px-6 py-3 border border-border text-foreground text-xs uppercase tracking-widest font-medium hover:bg-surface transition-all rounded-sm"
          >
            Ir al Inicio
          </Link>
        </div>

        <div className="pt-4 border-t border-border/40">
          <p className="text-xs text-muted">
            ¿Buscabas una prenda específica?{" "}
            <a
              href={getWhatsAppLink("Hola, estaba buscando una prenda en la página pero no la encuentro.")}
              target="_blank"
              rel="noopener noreferrer"
              className="text-foreground underline underline-offset-4 hover:text-accent transition-colors"
            >
              Consultar por WhatsApp
            </a>
          </p>
        </div>
      </div>
    </main>
  );
}

