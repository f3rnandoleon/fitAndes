import Link from "next/link";
import { Metadata } from "next";
import PoliticasView, { PoliticasData } from "@/components/politicas/PoliticasView";
import { getWhatsAppLink, WHATSAPP_DISPLAY } from "@/lib/constants";

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
      signal: AbortSignal.timeout(5000),
    });

    if (!res.ok) return DEFAULT_POLITICAS;
    const data = await res.json();
    return {
      devoluciones: data.devoluciones || DEFAULT_POLITICAS.devoluciones,
      privacidad: data.privacidad || DEFAULT_POLITICAS.privacidad,
      terminos: data.terminos || DEFAULT_POLITICAS.terminos,
    };
  } catch {
    return DEFAULT_POLITICAS;
  }
}

export default async function PoliticasPage() {
  const politicas = await getPoliticas();

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="max-w-[1240px] mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <div className="flex flex-wrap items-center gap-2 text-[10px] uppercase mb-8 text-subtle tracking-[0.16em]">
          <Link href="/" className="hover:opacity-60 transition-opacity">
            Inicio
          </Link>
          <span>&gt;</span>
          <span className="text-foreground font-medium">Políticas y Términos</span>
        </div>

        <header className="mb-10 max-w-2xl">
          <p className="text-[10px] uppercase tracking-[0.2em] text-subtle mb-3">
            Transparencia y Garantía
          </p>
          <h1 className="text-3xl sm:text-4xl text-foreground font-serif leading-tight">
            Políticas de compra, cambios y devoluciones
          </h1>
          <p className="mt-3 text-sm text-muted leading-relaxed">
            Tu confianza y comodidad son lo primero. Conoce nuestras condiciones de servicio, garantías y políticas claras de envíos para toda Bolivia.
          </p>
        </header>

        <PoliticasView politicas={politicas} />

        <div className="mt-14 text-center pt-8 border-t border-border/60">
          <p className="text-xs text-muted">
            ¿Tienes alguna consulta adicional? Contáctanos por{" "}
            <a
              href={getWhatsAppLink("Hola, tengo una consulta sobre las políticas de compra y cambios.")}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#25d366] font-medium hover:underline"
            >
              WhatsApp al {WHATSAPP_DISPLAY}
            </a>
          </p>
        </div>
      </div>
    </main>
  );
}
