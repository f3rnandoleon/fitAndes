import Link from "next/link";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Políticas y Términos Legales | Fit Andes",
  description: "Conoce nuestras políticas de devolución, cambios de prenda, envíos y términos de servicio en Bolivia.",
};

interface PoliticaItem {
  titulo?: string;
  contenido?: string;
  diasLimiteDevolucion?: number;
  version?: string;
  activo?: boolean;
}

interface PoliticasResponse {
  devoluciones?: PoliticaItem;
  privacidad?: PoliticaItem;
  terminos?: PoliticaItem;
  cookies?: PoliticaItem;
}

const DEFAULT_POLITICAS: PoliticasResponse = {
  devoluciones: {
    titulo: "Políticas de Devolución y Cambios",
    contenido:
      "Aceptamos cambios de talla o modelo dentro de los primeros 7 días posteriores a la recepción o retiro de tu pedido. La prenda debe encontrarse en perfectas condiciones, limpia, sin uso y con sus etiquetas originales intactas. Para compras fuera de La Paz, el costo del envío de retorno corre por cuenta del comprador a menos que el producto presente defectos de confección.",
    diasLimiteDevolucion: 7,
  },
  privacidad: {
    titulo: "Política de Privacidad y Tratamiento de Datos",
    contenido:
      "Los datos personales proporcionados (nombre, teléfono, ciudad, cédula de identidad para envíos de encomienda) son utilizados exclusivamente para la coordinación logística, facturación y confirmación de pagos de tus pedidos. No compartimos tu información con terceros no relacionados con el servicio logístico.",
  },
  terminos: {
    titulo: "Términos y Condiciones del Servicio",
    contenido:
      "Al realizar un pedido en Fit Andes a través de la web, se genera una reserva temporal de stock por 30 minutos mientras completas la transferencia QR de BancoSol. Las entregas en puntos de encuentro en La Paz se coordinan en horarios previamente seleccionados. Los envíos interdepartamentales se despachan vía empresas de transporte terrestre reconocidas.",
  },
};

async function getPoliticas(): Promise<PoliticasResponse> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  if (!apiUrl) return DEFAULT_POLITICAS;

  try {
    const res = await fetch(`${apiUrl}/public/politicas`, {
      next: { revalidate: 3600 },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return DEFAULT_POLITICAS;
    const data = await res.json();
    return {
      devoluciones: data.devoluciones ?? DEFAULT_POLITICAS.devoluciones,
      privacidad: data.privacidad ?? DEFAULT_POLITICAS.privacidad,
      terminos: data.terminos ?? DEFAULT_POLITICAS.terminos,
      cookies: data.cookies,
    };
  } catch {
    return DEFAULT_POLITICAS;
  }
}

export default async function PoliticasPage() {
  const politicas = await getPoliticas();

  return (
    <main className="min-h-screen bg-[#fbf9f5] text-[#111111]">
      <div className="max-w-[960px] mx-auto px-4 sm:px-6 py-8 sm:py-12 lg:py-16">
        <div className="flex items-center gap-2 text-[10px] uppercase mb-8" style={{ letterSpacing: "0.16em", color: "#8f8478" }}>
          <Link href="/" className="hover:opacity-60 transition-opacity">
            Inicio
          </Link>
          <span>{">"}</span>
          <span style={{ color: "#d04d37" }}>Políticas y Condiciones</span>
        </div>

        <header className="mb-12 border-b border-border/60 pb-8">
          <p className="text-[10px] uppercase tracking-[0.25em] text-subtle mb-3">Información para Clientes</p>
          <h1
            className="text-4xl sm:text-5xl font-serif text-foreground leading-tight"
            style={{ fontFamily: "Georgia, 'Times New Roman', serif", fontWeight: 400 }}
          >
            Políticas y Términos
          </h1>
          <p className="mt-3 text-sm text-muted max-w-xl leading-relaxed">
            Transparencia, confianza y seguridad en cada compra. Conoce cómo cuidamos tu experiencia con nosotros en Fit Andes.
          </p>
        </header>

        <div className="space-y-12">
          {/* Devoluciones y Cambios */}
          <section id="devoluciones" className="rounded-2xl border border-border bg-white p-6 sm:p-8 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-50 text-amber-800 border border-amber-200">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </span>
              <div>
                <h2 className="text-xl sm:text-2xl font-serif text-foreground">
                  {politicas.devoluciones?.titulo || "Cambios y Devoluciones"}
                </h2>
                {politicas.devoluciones?.diasLimiteDevolucion ? (
                  <span className="text-[11px] uppercase tracking-wider text-muted">
                    Plazo: {politicas.devoluciones.diasLimiteDevolucion} días calendario
                  </span>
                ) : null}
              </div>
            </div>
            <div className="text-sm text-muted leading-relaxed whitespace-pre-line border-t border-border/50 pt-4">
              {politicas.devoluciones?.contenido}
            </div>
          </section>

          {/* Términos y Condiciones */}
          <section id="terminos" className="rounded-2xl border border-border bg-white p-6 sm:p-8 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-50 text-blue-800 border border-blue-200">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </span>
              <div>
                <h2 className="text-xl sm:text-2xl font-serif text-foreground">
                  {politicas.terminos?.titulo || "Términos del Servicio y Envíos"}
                </h2>
                <span className="text-[11px] uppercase tracking-wider text-muted">Reservas, pagos QR y entregas</span>
              </div>
            </div>
            <div className="text-sm text-muted leading-relaxed whitespace-pre-line border-t border-border/50 pt-4">
              {politicas.terminos?.contenido}
            </div>
          </section>

          {/* Privacidad */}
          <section id="privacidad" className="rounded-2xl border border-border bg-white p-6 sm:p-8 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </span>
              <div>
                <h2 className="text-xl sm:text-2xl font-serif text-foreground">
                  {politicas.privacidad?.titulo || "Privacidad y Protección de Datos"}
                </h2>
                <span className="text-[11px] uppercase tracking-wider text-muted">Uso seguro de tu información</span>
              </div>
            </div>
            <div className="text-sm text-muted leading-relaxed whitespace-pre-line border-t border-border/50 pt-4">
              {politicas.privacidad?.contenido}
            </div>
          </section>
        </div>

        <div className="mt-12 text-center pt-8 border-t border-border/60">
          <p className="text-xs text-muted">
            ¿Tienes alguna consulta adicional? Contáctanos por{" "}
            <a
              href="https://wa.me/59167113105"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#25d366] font-medium hover:underline"
            >
              WhatsApp al +591 67113105
            </a>
          </p>
        </div>
      </div>
    </main>
  );
}
