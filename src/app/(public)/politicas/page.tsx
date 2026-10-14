import Link from "next/link";
import { Metadata } from "next";
import PoliticasView, { PoliticasData } from "@/components/politicas/PoliticasView";

export const metadata: Metadata = {
  title: "Políticas y Términos Legales | Fit Andes",
  description: "Conoce nuestras políticas de devolución, cambios de prenda, envíos y términos de servicio en Bolivia.",
};

const DEFAULT_POLITICAS: PoliticasData = {
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

async function getPoliticas(): Promise<PoliticasData> {
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

        <header className="mb-10 border-b border-border/60 pb-8">
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

        <PoliticasView politicas={politicas} />

        <div className="mt-14 text-center pt-8 border-t border-border/60">
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
