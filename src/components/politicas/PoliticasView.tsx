"use client";

import { useState } from "react";

export interface PoliticaItem {
  titulo?: string;
  contenido?: string;
  diasLimiteDevolucion?: number;
  version?: string;
  activo?: boolean;
}

export interface PoliticasData {
  devoluciones?: PoliticaItem;
  privacidad?: PoliticaItem;
  terminos?: PoliticaItem;
  cookies?: PoliticaItem;
}

const FAQS = [
  {
    q: "¿Cuánto tiempo dura la reserva de stock al pagar con QR?",
    a: "Al generar tu pedido con QR en la web, el sistema bloquea y reserva tus prendas durante 30 minutos. Si subes tu comprobante dentro de ese lapso, la reserva se mantiene activa hasta la verificación del administrador.",
  },
  {
    q: "¿Cómo sé si mi pago fue verificado?",
    a: "Cuando el administrador revisa tu comprobante, el estado de tu pedido cambiará automáticamente a 'CONFIRMADO'. Puedes revisarlo en tiempo real desde la sección 'Mis Pedidos' de tu cuenta.",
  },
  {
    q: "¿Cuál es el procedimiento para cambios de talla?",
    a: "Dispones de 7 días calendario para solicitar un cambio de talla o modelo. La prenda debe estar limpia, sin uso y con sus etiquetas originales. En La Paz el cambio es directo en nuestros puntos de encuentro; para otros departamentos, se coordina por transporte terrestre.",
  },
  {
    q: "¿A qué departamentos de Bolivia realizan envíos?",
    a: "Despachamos diariamente a los 9 departamentos de Bolivia mediante empresas de transporte confiables (Bolivar Cargo, Trans Copacabana, etc.) hacia las terminales o sucursales de encomienda seleccionadas.",
  },
];

export default function PoliticasView({ politicas }: { politicas: PoliticasData }) {
  const [activeTab, setActiveTab] = useState<"devoluciones" | "terminos" | "privacidad" | "faqs">("devoluciones");
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  return (
    <div className="space-y-8">
      {/* Pestañas de Navegación */}
      <div className="flex flex-wrap gap-2 border-b border-border/80 pb-3">
        {[
          { key: "devoluciones", label: "Devoluciones y Cambios", icon: "🔄" },
          { key: "terminos", label: "Envíos y Reservas", icon: "📦" },
          { key: "privacidad", label: "Privacidad de Datos", icon: "🔒" },
          { key: "faqs", label: "Preguntas Frecuentes", icon: "❓" },
        ].map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key as typeof activeTab)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-full text-xs uppercase tracking-wider font-medium transition-all ${
                isActive
                  ? "bg-foreground text-background shadow-xs"
                  : "bg-white text-muted border border-border hover:text-foreground hover:bg-background"
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Contenido por Pestaña */}
      <div>
        {activeTab === "devoluciones" && (
          <section className="rounded-2xl border border-border bg-white p-6 sm:p-8 shadow-sm space-y-4">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-50 text-amber-800 border border-amber-200">
                🔄
              </span>
              <div>
                <h2 className="text-xl sm:text-2xl font-serif text-foreground">
                  {politicas.devoluciones?.titulo || "Cambios y Devoluciones"}
                </h2>
                {politicas.devoluciones?.diasLimiteDevolucion ? (
                  <span className="text-[11px] uppercase tracking-wider text-muted">
                    Plazo oficial: {politicas.devoluciones.diasLimiteDevolucion} días calendario
                  </span>
                ) : null}
              </div>
            </div>
            <div className="text-sm text-muted leading-relaxed whitespace-pre-line border-t border-border/50 pt-4">
              {politicas.devoluciones?.contenido}
            </div>
          </section>
        )}

        {activeTab === "terminos" && (
          <section className="rounded-2xl border border-border bg-white p-6 sm:p-8 shadow-sm space-y-4">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-50 text-blue-800 border border-blue-200">
                📦
              </span>
              <div>
                <h2 className="text-xl sm:text-2xl font-serif text-foreground">
                  {politicas.terminos?.titulo || "Términos del Servicio, Reservas y Envíos"}
                </h2>
                <span className="text-[11px] uppercase tracking-wider text-muted">Condiciones de compra segura</span>
              </div>
            </div>
            <div className="text-sm text-muted leading-relaxed whitespace-pre-line border-t border-border/50 pt-4">
              {politicas.terminos?.contenido}
            </div>
          </section>
        )}

        {activeTab === "privacidad" && (
          <section className="rounded-2xl border border-border bg-white p-6 sm:p-8 shadow-sm space-y-4">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                🔒
              </span>
              <div>
                <h2 className="text-xl sm:text-2xl font-serif text-foreground">
                  {politicas.privacidad?.titulo || "Privacidad y Tratamiento de Información"}
                </h2>
                <span className="text-[11px] uppercase tracking-wider text-muted">Compromiso con tu seguridad</span>
              </div>
            </div>
            <div className="text-sm text-muted leading-relaxed whitespace-pre-line border-t border-border/50 pt-4">
              {politicas.privacidad?.contenido}
            </div>
          </section>
        )}

        {activeTab === "faqs" && (
          <section className="rounded-2xl border border-border bg-white p-6 sm:p-8 shadow-sm space-y-4">
            <div className="flex items-center gap-3 mb-2">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-50 text-purple-800 border border-purple-200">
                ❓
              </span>
              <div>
                <h2 className="text-xl sm:text-2xl font-serif text-foreground">
                  Preguntas Frecuentes
                </h2>
                <span className="text-[11px] uppercase tracking-wider text-muted">Dudas comunes antes y después de comprar</span>
              </div>
            </div>

            <div className="divide-y divide-border/60 border-t border-border/50 pt-2">
              {FAQS.map((faq, index) => {
                const isOpen = openFaq === index;
                return (
                  <div key={index} className="py-4">
                    <button
                      type="button"
                      onClick={() => setOpenFaq(isOpen ? null : index)}
                      className="w-full flex items-center justify-between text-left text-sm font-medium text-foreground hover:opacity-75 transition-opacity"
                    >
                      <span>{faq.q}</span>
                      <span className="text-muted ml-4 text-base font-bold">{isOpen ? "−" : "+"}</span>
                    </button>
                    {isOpen && (
                      <p className="mt-2.5 text-xs text-muted leading-relaxed pr-6">
                        {faq.a}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
