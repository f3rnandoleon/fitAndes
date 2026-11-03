import type { Metadata } from "next";
import Link from "next/link";
import { SITE_NAME, SITE_URL, WHATSAPP_DISPLAY, getWhatsAppLink } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Preguntas Frecuentes | FitAndes",
  description:
    "Respuestas a las dudas más comunes sobre envíos nacionales, pagos QR, reservas de stock y sucursales en FitAndes.",
  openGraph: {
    title: "Preguntas Frecuentes - FitAndes",
    description: "Todo lo que necesitas saber para comprar en FitAndes Bolivia.",
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
    respuesta:
      "Realizamos envíos a toda Bolivia (Santa Cruz, Cochabamba, Oruro, Potosí, Chuquisaca, Tarija, Beni y Pando) a través de empresas de transporte terrestre y encomienda express. La tarifa plana de despacho es de Bs. 10. Para La Paz, puedes recoger gratis en nuestras tiendas físicas.",
  },
  {
    pregunta: "¿Cuánto tiempo demora en llegar mi pedido?",
    respuesta:
      "En el departamento de La Paz, las entregas y retiros están listos el mismo día o en 24 horas. Para envíos a nivel nacional, los despachos salen en 24 horas hábiles y tardan entre 24 a 48 horas en llegar a tu terminal o sucursal de destino.",
  },
  {
    pregunta: "¿Qué métodos de pago están disponibles?",
    respuesta:
      "Aceptamos pagos mediante código QR Simple (Banco Unión, BCP, BNB, Mercantil, Fassil/BancoSol, etc.), transferencias directas y pago en efectivo al retirar tu prenda en nuestras tiendas físicas autorizadas.",
  },
  {
    pregunta: "¿Cómo funciona la reserva de stock de 30 minutos?",
    respuesta:
      "Cuando añades prendas a tu carrito y comienzas el proceso de compra, el sistema aparta automáticamente las unidades en nuestro inventario central durante 30 minutos. Así nadie más puede comprar tu talla mientras completas tus datos de entrega o tu pago.",
  },
  {
    pregunta: "¿Qué pasa si la talla que elegí no me queda?",
    respuesta:
      "¡No te preocupes! Tienes hasta 7 días corridos desde la recepción de tu prenda para solicitar un cambio de talla o modelo. La prenda debe estar sin uso, limpia y con sus etiquetas originales. Para coordinar el cambio, contáctanos directamente a nuestro WhatsApp oficial.",
  },
  {
    pregunta: "¿Tienen tiendas físicas para probarse las prendas?",
    respuesta:
      "Sí, contamos con sucursales activas en La Paz (Tienda Prado en la Av. 16 de Julio y Tienda Tiwanacu). Puedes visitarnos para ver la textura, colores y probarte las tallas antes de comprar.",
  },
];

export default function FaqPage() {
  return (
    <main className="min-h-screen bg-background text-foreground pb-20">
      {/* Hero Header */}
      <section className="py-14 sm:py-20 border-b border-border/40 bg-surface/30">
        <div className="max-w-3xl mx-auto px-5 text-center space-y-4">
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
      </section>

      {/* FAQ Accordion / List */}
      <section className="max-w-3xl mx-auto px-5 py-12 sm:py-16 space-y-6">
        <div className="divide-y divide-border/60">
          {FAQS.map((faq, index) => (
            <div key={index} className="py-6 space-y-2.5">
              <h2 className="text-base sm:text-lg font-medium text-foreground">
                {faq.pregunta}
              </h2>
              <p className="text-sm sm:text-base text-muted leading-relaxed">
                {faq.respuesta}
              </p>
            </div>
          ))}
        </div>

        {/* WhatsApp Assistance Box */}
        <div className="mt-12 p-8 border border-accent/20 bg-accent/5 rounded-2xl text-center space-y-4">
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
              className="px-6 py-3 bg-foreground text-background text-xs uppercase tracking-widest font-semibold hover:bg-foreground/90 transition-all rounded-sm shadow-sm"
            >
              Hablar con un asesor
            </a>
            <Link
              href="/ubicaciones"
              className="px-6 py-3 border border-border bg-background text-foreground text-xs uppercase tracking-widest font-semibold hover:bg-surface transition-all rounded-sm"
            >
              Ver Sucursales Físicas
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}

