import type { Metadata } from "next";
import Link from "next/link";
import { SITE_NAME, SITE_URL, getWhatsAppLink } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Sobre Nosotros | FitAndes",
  description:
    "Conoce la historia, valores y el compromiso de FitAndes con la confección textil y artesanal boliviana.",
  openGraph: {
    title: "Sobre Nosotros - FitAndes",
    description: "Confección boliviana de alta calidad con identidad andina.",
    url: `${SITE_URL}/nosotros`,
    siteName: SITE_NAME,
  },
};

export default function NosotrosPage() {
  return (
    <main className="min-h-screen bg-background text-foreground pb-20">
      {/* Hero Section */}
      <section className="relative py-16 sm:py-24 border-b border-border/40 bg-surface/30">
        <div className="max-w-4xl mx-auto px-5 text-center space-y-4">
          <span className="text-xs uppercase tracking-[0.25em] text-accent font-semibold">
            Nuestra Historia & Raíces
          </span>
          <h1 className="text-4xl sm:text-5xl font-serif text-foreground font-normal tracking-tight">
            Moda con Identidad Andina
          </h1>
          <p className="text-base sm:text-lg text-muted max-w-2xl mx-auto leading-relaxed">
            Nacidos en el corazón de Bolivia, combinamos la calidez y maestría del tejido andino con
            siluetas contemporáneas pensadas para tu día a día.
          </p>
        </div>
      </section>

      {/* Main Content */}
      <section className="max-w-4xl mx-auto px-5 py-12 sm:py-16 space-y-16">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
          <div className="space-y-4">
            <h2 className="text-2xl sm:text-3xl font-serif text-foreground font-normal">
              Tradición textil y diseño moderno
            </h2>
            <p className="text-sm sm:text-base text-muted leading-relaxed">
              En <strong>FitAndes</strong> creemos que una prenda no solo abriga: cuenta una historia.
              Cada una de nuestras chompas y poleras está pensada para resistir el paso del tiempo, utilizando
              fibras seleccionadas por su suavidad, durabilidad y textura única.
            </p>
            <p className="text-sm sm:text-base text-muted leading-relaxed">
              Trabajamos con confeccionistas locales en talleres bolivianos, rescatando el legado del tejido artesanal
              y fusionándolo con acabados de corte internacional.
            </p>
          </div>
          <div className="bg-surface rounded-2xl p-8 border border-border/60 shadow-sm space-y-4">
            <h3 className="text-sm uppercase tracking-widest text-accent font-semibold">
              Nuestros Pilares
            </h3>
            <ul className="space-y-3 text-sm text-foreground/90">
              <li className="flex items-start gap-2.5">
                <span className="text-accent font-bold">✓</span>
                <span><strong>Calidad 100% Boliviana:</strong> Confeccionado éticamente en La Paz y El Alto.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="text-accent font-bold">✓</span>
                <span><strong>Fibras nobles:</strong> Hilos térmicos y algodones de alta densidad para máxima resistencia.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="text-accent font-bold">✓</span>
                <span><strong>Comercio Transparente:</strong> Precios justos directos de taller al cliente, sin intermediarios inflados.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="text-accent font-bold">✓</span>
                <span><strong>Atención personalizada:</strong> Asesoría directa en tallas, colores y puntos de entrega.</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Commitment Banner */}
        <div className="border border-accent/20 bg-accent/5 rounded-2xl p-8 sm:p-10 text-center space-y-5">
          <h2 className="text-2xl sm:text-3xl font-serif text-foreground">
            Lleva la calidez andina donde vayas
          </h2>
          <p className="text-sm sm:text-base text-muted max-w-xl mx-auto leading-relaxed">
            Descubre nuestra línea completa de chompas clásicas, cuellos altos, cárdigans y poleras básicas
            confeccionadas para brindarte comodidad inigualable.
          </p>
          <div className="pt-2 flex flex-wrap justify-center gap-4">
            <Link
              href="/catalogo"
              className="px-6 py-3 bg-foreground text-background text-xs uppercase tracking-widest font-semibold hover:bg-foreground/90 transition-all rounded-sm shadow-sm"
            >
              Ver Catálogo Completo
            </Link>
            <a
              href={getWhatsAppLink("Hola, me gustaría saber más sobre la marca FitAndes.")}
              target="_blank"
              rel="noopener noreferrer"
              className="px-6 py-3 border border-border bg-background text-foreground text-xs uppercase tracking-widest font-semibold hover:bg-surface transition-all rounded-sm"
            >
              Contactar por WhatsApp
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}

