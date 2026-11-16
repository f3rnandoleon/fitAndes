import type { Metadata } from "next";
import Link from "next/link";
import FaqAccordion from "@/components/faq/FaqAccordion";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { DEFAULT_NATIONAL_SHIPPING_FEE, SITE_NAME, SITE_URL, WHATSAPP_DISPLAY, getWhatsAppLink } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Preguntas Frecuentes | FitAndes",
  description:
    "Respuestas a las dudas más comunes sobre envíos nacionales, pagos QR, reservas de stock y sucursales en FitAndes.",
  openGraph: {
    title: "Preguntas Frecuentes - Fit Andes",
    description: "Todo lo que necesitas saber para comprar en Fit Andes.",
    url: `${SITE_URL}/faq`,
    siteName: SITE_NAME,
  },
};

const FAQS = [
  {
    pregunta: "¿Necesito registrarme para comprar?",
    respuesta:
      "No es obligatorio. Puedes realizar tu pedido como invitado ingresando únicamente tu nombre, teléfono y ciudad. Si deseas guardar direcciones y ver el historial de tus pedidos, puedes iniciar sesión con Google en cualquier momento.",
  },
  {
    pregunta: "¿A qué ciudades realizan envíos y cuál es el costo?",
    respuesta: `Realizamos envíos a toda Bolivia (Santa Cruz, Cochabamba, Oruro, Potosí, Chuquisaca, Tarija, Beni y Pando) a través de empresas de transporte terrestre y encomienda express. La tarifa plana de despacho es de Bs. ${DEFAULT_NATIONAL_SHIPPING_FEE}. Para La Paz, puedes recoger gratis en nuestras tiendas físicas.`,
  },
  {
    pregunta: "¿Cuánto tiempo demora en llegar mi pedido?",
    respuesta:
      "En el departamento de La Paz, las entregas y retiros están listos el mismo día o en 24 horas. Para envíos a nivel nacional, los despachos salen en 24 horas hábiles y tardan entre 24 a 48 horas en llegar a tu terminal o sucursal de destino.",
  },
  {
    pregunta: "¿Qué métodos de pago están disponibles?",
    respuesta:
      "Aceptamos pagos mediante código QR Simple (BancoSol, Banco Unión, BCP, BNB, Mercantil Santa Cruz, etc.), transferencias directas y pago en efectivo al retirar tu prenda en nuestras tiendas físicas autorizadas.",
  },
  {
    pregunta: "¿Qué pasa si la talla que elegí no me queda?",
    respuesta:
      "¡No te preocupes! Tienes hasta 7 días corridos desde la recepción de tu prenda para solicitar un cambio de talla o modelo. La prenda debe estar sin uso, limpia y con sus etiquetas originales. Para coordinar el cambio, contáctanos directamente a nuestro WhatsApp oficial.",
  },
  {
    pregunta: "¿Tienen tiendas físicas para probarse las prendas?",
    respuesta:
      "Sí, contamos con sucursales activas en La Paz y El Alto (Tienda Prado en la Av. 16 de Julio y Tienda Tiwanacu). Puedes visitarnos para ver la textura, colores y probarte las tallas antes de comprar.",
  },
];

export default function FaqPage() {
  return (
    <main className="min-h-screen bg-background text-foreground pb-20">
      {/* Hero Header */}
      <section className="py-10 sm:py-16 border-b border-border/40 bg-surface/30">
        <div className="max-w-3xl mx-auto px-5 space-y-5">
          <Breadcrumb items={[{ label: "Inicio", href: "/" }, { label: "Preguntas Frecuentes" }]} />
          <div className="text-center space-y-3.5 pt-2">
            <span className="text-xs uppercase tracking-[0.25em] text-accent font-semibold">
              Centro de Ayuda
            </span>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-serif text-foreground font-normal tracking-tight">
              Preguntas Frecuentes
            </h1>
            <p className="text-sm sm:text-base text-muted max-w-xl mx-auto leading-relaxed">
              Resolvemos tus dudas sobre compras, envíos nacionales a toda Bolivia, formas de pago y tallas.
            </p>
          </div>
        </div>
      </section>

      {/* FAQ Accordion */}
      <section className="max-w-3xl mx-auto px-5 py-12 sm:py-16 space-y-10">
        <FaqAccordion items={FAQS} />

        {/* WhatsApp Assistance Box */}
        <div className="p-8 border border-border bg-white rounded-[var(--radius-lg)] text-center space-y-4 shadow-xs">
          <h3 className="text-xl sm:text-2xl font-serif text-foreground">
            ¿Tienes alguna consulta especial?
          </h3>
          <p className="text-sm text-muted max-w-md mx-auto">
            Nuestro equipo de atención al cliente está disponible en WhatsApp ({WHATSAPP_DISPLAY})
            para ayudarte con medidas exactas, combinaciones de color o envíos express.
          </p>
          <div className="pt-2 flex flex-wrap justify-center gap-3">
            <a
              href={getWhatsAppLink("Hola, tengo una duda antes de realizar mi compra.")}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center rounded-full px-6 py-3 bg-foreground text-background text-[11px] uppercase tracking-[0.16em] font-semibold hover:opacity-90 transition-all shadow-sm"
            >
              Hablar con un asesor
            </a>
            <Link
              href="/ubicaciones"
              className="inline-flex items-center justify-center rounded-full px-6 py-3 border border-border bg-background text-foreground text-[11px] uppercase tracking-[0.16em] font-semibold hover:bg-surface transition-all"
            >
              Ver Sucursales Físicas
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
