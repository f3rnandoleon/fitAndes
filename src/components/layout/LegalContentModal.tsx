"use client";

import { useEffect, useState } from "react";
import { FaTimes, FaWhatsapp, FaFileContract, FaUserShield, FaCookieBite, FaQuestionCircle, FaChevronDown } from "react-icons/fa";
import { getWhatsAppLink, WHATSAPP_DISPLAY } from "@/lib/constants";

export type LegalModalSection = "terminos" | "privacidad" | "cookies" | "faq";

interface Props {
  isOpen: boolean;
  initialSection?: LegalModalSection;
  onClose: () => void;
}

interface FaqItem {
  q: string;
  a: string;
}

const FAQS_DATA: FaqItem[] = [
  {
    q: "¿Necesito registrarme para comprar?",
    a: "No es obligatorio. Puedes realizar tu pedido como invitado ingresando únicamente tu nombre y número de celular para coordinar la entrega. Si deseas guardar tus direcciones y ver el historial completo de tus compras, puedes registrarte o iniciar sesión con Google en cualquier momento.",
  },
  {
    q: "¿A qué ciudades realizan envíos y cuál es el costo?",
    a: "Realizamos envíos a toda Bolivia (Santa Cruz, Cochabamba, Oruro, Potosí, Chuquisaca, Tarija, Beni y Pando) a través de empresas de encomienda terrestre y flotas autorizadas. La tarifa plana de despacho nacional es de Bs. 10. En la ciudad de La Paz, el retiro en nuestros puntos de encuentro y tiendas es completamente gratuito.",
  },
  {
    q: "¿Cuánto tiempo demora en llegar mi encomienda?",
    a: "En La Paz, las entregas y retiros están disponibles el mismo día o en un máximo de 24 horas. Para envíos nacionales, los despachos salen dentro de las 24 horas hábiles posteriores a la verificación de tu pago y demoran entre 24 a 48 horas en llegar a la terminal o sucursal de destino.",
  },
  {
    q: "¿Cómo funciona la reserva de stock de 30 minutos?",
    a: "Al iniciar tu compra en la web, el sistema bloquea y aparta de inmediato las prendas seleccionadas en nuestro inventario durante 30 minutos. De esta forma, nadie más puede comprar tu talla mientras realizas la transferencia QR. Al subir tu comprobante bancario, la reserva se extiende a 48 horas mientras el equipo verifica el abono.",
  },
  {
    q: "¿Qué métodos de pago están disponibles?",
    a: "Aceptamos transferencias mediante código QR Simple interbancario (BancoSol, Banco Unión, BCP, BNB, Mercantil Santa Cruz, etc.) y pago en efectivo al retirar tu prenda en nuestras tiendas físicas y puntos de encuentro autorizados.",
  },
  {
    q: "¿Qué pasa si la talla que elegí no me queda?",
    a: "Dispones de 7 días calendario a partir de la recepción o retiro de tu prenda para solicitar un cambio de talla o modelo. La prenda debe estar sin uso, limpia y con sus etiquetas originales intactas. En La Paz el cambio es directo; para otros departamentos, coordinamos el retorno vía transporte terrestre.",
  },
  {
    q: "¿Tienen tiendas físicas para probarse las prendas?",
    a: "Sí, disponemos de sucursales activas en La Paz (Tienda Prado en la Av. 16 de Julio y Tienda Tiwanacu). Te invitamos a visitarnos para conocer la calidad de las fibras, variedad de modelos y probarte las tallas.",
  },
];

export default function LegalContentModal({ isOpen, initialSection = "terminos", onClose }: Props) {
  const [activeSection, setActiveSection] = useState<LegalModalSection>(initialSection);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  // Sincronizar sección activa al abrir
  useEffect(() => {
    if (isOpen) {
      setActiveSection(initialSection);
    }
  }, [isOpen, initialSection]);

  // Manejar tecla Escape y bloqueo de scroll
  useEffect(() => {
    if (!isOpen) return;

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="legal-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-[780px] max-h-[90vh] flex flex-col rounded-[28px] border border-border bg-white text-foreground shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabecera del Modal */}
        <div className="flex items-center justify-between border-b border-border/80 px-6 py-5 bg-[#faf8f5]">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#c41e3a]/10 text-[#c41e3a] font-semibold text-base">
              🎄
            </span>
            <div>
              <p className="text-[10px] uppercase tracking-[0.2em] text-[#c41e3a] font-semibold">
                Información Legal y Ayuda · Especial Navideño
              </p>
              <h2 id="legal-modal-title" className="text-xl sm:text-2xl font-serif text-foreground font-normal">
                {activeSection === "terminos" && "Términos y Condiciones"}
                {activeSection === "privacidad" && "Privacidad de Datos"}
                {activeSection === "cookies" && "Política de Cookies"}
                {activeSection === "faq" && "Preguntas Frecuentes (FAQ)"}
              </h2>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar ventana"
            className="flex h-9 w-9 items-center justify-center rounded-full text-muted hover:text-foreground hover:bg-black/5 transition-colors"
          >
            <FaTimes className="text-base" />
          </button>
        </div>

        {/* Pestañas de navegación rápida */}
        <div className="flex items-center gap-1.5 border-b border-border/70 px-4 py-2.5 bg-white overflow-x-auto scrollbar-hide text-xs">
          <button
            type="button"
            onClick={() => setActiveSection("terminos")}
            className={`flex items-center gap-2 whitespace-nowrap rounded-full px-3.5 py-1.5 font-medium transition-all ${activeSection === "terminos"
                ? "bg-foreground text-background shadow-xs"
                : "text-muted hover:text-foreground hover:bg-surface-soft"
              }`}
          >
            <FaFileContract className="text-xs" />
            <span>Términos y Condiciones</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSection("privacidad")}
            className={`flex items-center gap-2 whitespace-nowrap rounded-full px-3.5 py-1.5 font-medium transition-all ${activeSection === "privacidad"
                ? "bg-foreground text-background shadow-xs"
                : "text-muted hover:text-foreground hover:bg-surface-soft"
              }`}
          >
            <FaUserShield className="text-xs" />
            <span>Privacidad de Datos</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSection("cookies")}
            className={`flex items-center gap-2 whitespace-nowrap rounded-full px-3.5 py-1.5 font-medium transition-all ${activeSection === "cookies"
                ? "bg-foreground text-background shadow-xs"
                : "text-muted hover:text-foreground hover:bg-surface-soft"
              }`}
          >
            <FaCookieBite className="text-xs" />
            <span>Política de Cookies</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSection("faq")}
            className={`flex items-center gap-2 whitespace-nowrap rounded-full px-3.5 py-1.5 font-medium transition-all ${activeSection === "faq"
                ? "bg-foreground text-background shadow-xs"
                : "text-muted hover:text-foreground hover:bg-surface-soft"
              }`}
          >
            <FaQuestionCircle className="text-xs" />
            <span>FAQ</span>
          </button>
        </div>

        {/* Contenido desplazable */}
        <div className="flex-1 overflow-y-auto px-6 py-6 sm:px-8 space-y-6 text-sm leading-relaxed text-muted">
          {/* SECCIÓN: TÉRMINOS Y CONDICIONES */}
          {activeSection === "terminos" && (
            <div className="space-y-5 animate-in fade-in duration-150">
              <div className="rounded-2xl bg-amber-50/70 border border-amber-200/80 p-4 text-amber-950 text-xs sm:text-sm">
                <p className="font-semibold mb-1">✨ Compromiso de Calidad Fit Andes</p>
                <p>
                  Al operar en nuestra tienda web aceptas las siguientes condiciones de compra.
                </p>
              </div>

              <div>
                <h3 className="text-base font-serif font-semibold text-foreground mb-1.5">
                  1. Reservas de Stock y Tiempos de Pago
                </h3>
                <p>
                  Al generar una orden en la web, el sistema bloquea y aparta tus prendas en inventario central durante <strong>30 minutos</strong>. Si abonas por código QR BancoSol y subes tu comprobante dentro de este período, la reserva se mantiene activa por <strong>48 horas adicionales</strong> hasta la validación de tesorería. Si el tiempo expira sin comprobante, el stock se libera automáticamente.
                </p>
              </div>

              <div>
                <h3 className="text-base font-serif font-semibold text-foreground mb-1.5">
                  2. Modalidades de Entrega y Cobertura
                </h3>
                <ul className="list-disc pl-5 space-y-1.5">
                  <li>
                    <strong>Retiro en Punto de Encuentro (La Paz):</strong> Servicio gratuito en estaciones y plazas acordadas en el horario seleccionado.
                  </li>
                  <li>
                    <strong>Envío Nacional por Encomienda:</strong> Despacho a los 9 departamentos de Bolivia mediante transporte terrestre / flota con tarifa plana de <strong>Bs. 10</strong>. El comprador recoge en la terminal o sucursal de encomienda portando su C.I.
                  </li>
                </ul>
              </div>

              <div>
                <h3 className="text-base font-serif font-semibold text-foreground mb-1.5">
                  3. Políticas de Cambio de Talla
                </h3>
                <p>
                  Dispones de hasta <strong>7 días calendario</strong> desde la entrega o retiro para solicitar un cambio de talla o modelo. La prenda debe encontrarse limpia, sin uso, en su bolsa y con las etiquetas originales.
                </p>
              </div>

              <div>
                <h3 className="text-base font-serif font-semibold text-foreground mb-1.5">
                  4. Precios y Moneda
                </h3>
                <p>
                  Todos los precios publicados en la tienda web están expresados en <strong>Bolivianos (BOB / Bs.)</strong> e incluyen los impuestos de ley según la normativa vigente en el Estado Plurinacional de Bolivia.
                </p>
              </div>
            </div>
          )}

          {/* SECCIÓN: PRIVACIDAD DE DATOS */}
          {activeSection === "privacidad" && (
            <div className="space-y-5 animate-in fade-in duration-150">
              <div className="rounded-2xl bg-emerald-50/70 border border-emerald-200/80 p-4 text-emerald-950 text-xs sm:text-sm">
                <p className="font-semibold mb-1">🔒 Seguridad y Confidencialidad</p>
                <p>
                  En Fit Andes respetamos profundamente tu privacidad. La información que nos compartes se utiliza de forma responsable y exclusivamente para la gestión de tus pedidos.
                </p>
              </div>

              <div>
                <h3 className="text-base font-serif font-semibold text-foreground mb-1.5">
                  1. Información Recopilada
                </h3>
                <p>
                  Recopilamos únicamente los datos necesarios para concretar tu compra:
                </p>
                <ul className="list-disc pl-5 mt-1.5 space-y-1">
                  <li>Nombre completo y número de celular (para coordinación logística y avisos de despacho).</li>
                  <li>Departamento, ciudad y empresa de encomienda de tu preferencia.</li>
                  <li>Número de Cédula de Identidad (solicitado obligatoriamente por las empresas de transporte interdepartamental para rotular el paquete y autorizar el retiro en destino).</li>
                  <li>Comprobante de transferencia bancaria (para la confirmación del pago QR).</li>
                </ul>
              </div>

              <div>
                <h3 className="text-base font-serif font-semibold text-foreground mb-1.5">
                  2. Uso y Destino de los Datos
                </h3>
                <p>
                  Tus datos nunca son compartidos, vendidos ni cedidos a terceras empresas con propósitos comerciales ni publicitarios. La información de entrega solo se comunica al operador de transporte terrestre contratado para el traslado físico del paquete.
                </p>
              </div>

              <div>
                <h3 className="text-base font-serif font-semibold text-foreground mb-1.5">
                  3. Derechos del Cliente
                </h3>
                <p>
                  Puedes solicitar en cualquier momento la verificación, rectificación o eliminación de tus datos de nuestros registros escribiéndonos directamente a nuestro WhatsApp oficial de atención.
                </p>
              </div>
            </div>
          )}

          {/* SECCIÓN: POLÍTICA DE COOKIES */}
          {activeSection === "cookies" && (
            <div className="space-y-5 animate-in fade-in duration-150">
              <div className="rounded-2xl bg-amber-50/70 border border-amber-200/80 p-4 text-amber-950 text-xs sm:text-sm">
                <p className="font-semibold mb-1">🍪 Almacenamiento Técnico y Transparente</p>
                <p>
                  Nuestra tienda web utiliza cookies esenciales y almacenamiento local en tu navegador exclusivamente para que tu experiencia de compra sea rápida, segura y funcional.
                </p>
              </div>

              <div>
                <h3 className="text-base font-serif font-semibold text-foreground mb-1.5">
                  1. ¿Qué almacenamos en tu navegador?
                </h3>
                <ul className="list-disc pl-5 space-y-2">
                  <li>
                    <strong>Almacenamiento Local del Carrito (`localStorage`):</strong> Mantiene guardadas temporalmente las prendas que agregas al carrito mientras navegas entre colecciones o completas tu pedido.
                  </li>
                  <li>
                    <strong>Cookies de Sesión Segura (NextAuth):</strong> Si inicias sesión con tu cuenta de cliente o Google, una cookie cifrada mantiene activa tu sesión sin almacenar contraseñas en texto plano.
                  </li>
                  <li>
                    <strong>Identificadores de Pago Temporal:</strong> Guardan el código de transacción temporalmente para permitirte subir tu comprobante bancario sin demoras.
                  </li>
                </ul>
              </div>

              <div>
                <h3 className="text-base font-serif font-semibold text-foreground mb-1.5">
                  2. Cero Rastreadores Invasivos
                </h3>
                <p>
                  Fit Andes no emplea cookies de terceros para elaborar perfiles publicitarios ni vende historiales de navegación a redes publicitarias externas.
                </p>
              </div>

              <div>
                <h3 className="text-base font-serif font-semibold text-foreground mb-1.5">
                  3. Control en tu Navegador
                </h3>
                <p>
                  Puedes limpiar o bloquear las cookies y el almacenamiento local en cualquier momento desde las opciones de configuración y privacidad de tu navegador web.
                </p>
              </div>
            </div>
          )}

          {/* SECCIÓN: FAQ (PREGUNTAS FRECUENTES) */}
          {activeSection === "faq" && (
            <div className="space-y-3 animate-in fade-in duration-150">
              <p className="text-xs text-muted mb-2">
                Consulta las respuestas a las preguntas más frecuentes de nuestra comunidad de clientes:
              </p>

              <div className="divide-y divide-border/70 border border-border/70 rounded-2xl overflow-hidden bg-white">
                {FAQS_DATA.map((faq, index) => {
                  const isOpen = openFaqIndex === index;
                  return (
                    <div key={index} className="transition-colors hover:bg-surface/20">
                      <button
                        type="button"
                        onClick={() => setOpenFaqIndex(isOpen ? null : index)}
                        className="w-full flex items-center justify-between text-left p-4 sm:p-5 text-sm font-medium text-foreground gap-3"
                      >
                        <span>{faq.q}</span>
                        <FaChevronDown
                          className={`text-xs text-muted shrink-0 transition-transform duration-200 ${isOpen ? "rotate-180 text-accent" : ""
                            }`}
                        />
                      </button>
                      {isOpen && (
                        <div className="px-4 pb-4 sm:px-5 sm:pb-5 text-xs sm:text-sm text-muted leading-relaxed border-t border-border/40 pt-3 bg-surface/10">
                          {faq.a}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Pie del Modal con Acciones */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-border/80 px-6 py-4 bg-[#faf8f5]">
          <a
            href={getWhatsAppLink("Hola Fit Andes, tengo una consulta sobre las políticas de la tienda.")}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-full px-4 py-2 text-xs font-medium text-white bg-[#25d366] hover:bg-[#20b858] transition-colors shadow-xs"
          >
            <FaWhatsapp className="text-sm" />
            <span>Consultar por WhatsApp (+591 {WHATSAPP_DISPLAY})</span>
          </a>

          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto rounded-full border border-border px-5 py-2 text-xs font-medium text-foreground hover:bg-white transition-colors"
          >
            Cerrar ventana
          </button>
        </div>
      </div>
    </div>
  );
}

