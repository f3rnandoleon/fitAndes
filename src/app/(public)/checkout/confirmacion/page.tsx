import Link from "next/link";
import { FaWhatsapp, FaCheckCircle, FaStore, FaTruck, FaRegClock } from "react-icons/fa";
import { Card } from "@/components/ui/Card";
import { getWhatsAppLink, WHATSAPP_DISPLAY } from "@/lib/constants";

interface PageProps {
  searchParams?: Promise<{
    pedido?: string;
    numero?: string;
    orderId?: string;
    orderNumber?: string;
    metodo?: string;
    comprobante?: string;
  }>;
}

export default async function CheckoutConfirmacionPage({ searchParams }: PageProps) {
  const params = searchParams ? await searchParams : {};
  const numeroPedido = params.numero || params.orderNumber || params.pedido || "Pedido Confirmado";
  const metodoEntrega = params.metodo || "";
  const comprobanteSubido = params.comprobante === "1" || params.comprobante === "true";

  const isNational = metodoEntrega.includes("SHIPPING") || metodoEntrega.includes("NATIONAL");
  const isPickup = metodoEntrega.includes("PICKUP");

  const whatsappMessage = `Hola Fit Andes, realicé mi compra como invitado con número de pedido ${numeroPedido}. Quisiera consultar el estado de mi reserva.`;
  const whatsappUrl = getWhatsAppLink(whatsappMessage);

  return (
    <main className="min-h-[calc(100vh-82px)] px-4 sm:px-6 py-12 sm:py-20 bg-[#fbf9f5]">
      <div className="max-w-[720px] mx-auto text-center space-y-8">
        <div className="w-20 h-20 bg-success/10 text-success rounded-full flex items-center justify-center mx-auto shadow-sm">
          <FaCheckCircle className="w-10 h-10" />
        </div>

        <div>
          <span className="text-xs uppercase tracking-[0.25em] text-accent font-semibold">
            Compra Confirmada
          </span>
          <h1 className="text-3xl sm:text-5xl font-serif text-foreground mt-2 font-normal">
            ¡Gracias por tu compra!
          </h1>
          <p className="text-sm sm:text-base text-muted mt-3 max-w-lg mx-auto leading-relaxed">
            Hemos registrado tu pedido en nuestro sistema central. Tus prendas se encuentran reservadas de forma segura.
          </p>
        </div>

        <Card className="p-6 sm:p-8 text-left space-y-6 bg-white border border-border shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-4 pb-5 border-b border-border/70">
            <div>
              <p className="text-[10px] uppercase tracking-wider text-subtle">Número de pedido</p>
              <p className="text-xl sm:text-2xl font-mono font-bold text-foreground mt-0.5">
                {numeroPedido}
              </p>
            </div>
            <div className="text-right">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#e7efe9] text-success text-xs font-semibold rounded-full">
                <FaRegClock className="text-xs" />
                {comprobanteSubido ? "Reserva 48h (Comprobante en verificación)" : "Reserva activa 30 min"}
              </span>
            </div>
          </div>

          <div className="space-y-4 text-sm text-foreground">
            <h2 className="text-base font-serif font-semibold">Siguientes pasos de tu entrega:</h2>

            {isNational && (
              <div className="flex items-start gap-3 p-4 rounded-xl bg-surface/60 border border-border/60">
                <FaTruck className="text-accent text-lg mt-0.5 shrink-0" />
                <div>
                  <p className="font-medium text-foreground">Envío Nacional por Courier / Flota</p>
                  <p className="text-xs text-muted mt-1 leading-relaxed">
                    Una vez verificado tu comprobante bancario, prepararemos el paquete y emitiremos la guía de encomienda para que retires en ventanilla con tu carnet de identidad.
                  </p>
                </div>
              </div>
            )}

            {isPickup && (
              <div className="flex items-start gap-3 p-4 rounded-xl bg-surface/60 border border-border/60">
                <FaStore className="text-accent text-lg mt-0.5 shrink-0" />
                <div>
                  <p className="font-medium text-foreground">Retiro en Punto de Encuentro (La Paz)</p>
                  <p className="text-xs text-muted mt-1 leading-relaxed">
                    Te esperamos en la estación o plaza acordada en el horario seleccionado. Te contactaremos vía WhatsApp antes de la entrega.
                  </p>
                </div>
              </div>
            )}

            {!isNational && !isPickup && (
              <p className="text-xs text-muted leading-relaxed">
                Coordinaremos la entrega y el despacho directamente a tu celular. Guarda tu número de pedido para cualquier consulta.
              </p>
            )}
          </div>

          <div className="pt-4 border-t border-border/70 flex flex-col sm:flex-row gap-3">
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 inline-flex items-center justify-center gap-2.5 rounded-full py-3.5 px-6 text-xs uppercase tracking-wider bg-[#25d366] text-white font-medium hover:bg-[#20b858] transition-transform active:scale-95 shadow-sm text-center"
            >
              <FaWhatsapp className="text-base" />
              Coordinar por WhatsApp (+591 {WHATSAPP_DISPLAY})
            </a>
            <Link
              href="/catalogo"
              className="inline-flex items-center justify-center rounded-full border border-border py-3.5 px-6 text-xs uppercase tracking-wider text-foreground hover:bg-surface transition-colors text-center"
            >
              Seguir explorando
            </Link>
          </div>
        </Card>

        <p className="text-xs text-muted">
          ¿Deseas consultar tu historial en futuras compras?{" "}
          <Link href="/registro" className="text-foreground font-semibold hover:underline">
            Crea una cuenta gratis
          </Link>{" "}
          para tener acceso a tu panel de pedidos.
        </p>
      </div>
    </main>
  );
}
