import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import OrderActionsSection from "@/components/pedidos/OrderActionsSection";
import OrderDeliveryEditSection from "@/components/pedidos/OrderDeliveryEditSection";
import OrderTrackingSection from "@/components/pedidos/OrderTrackingSection";
import PaymentReceiptSection from "@/components/pedidos/PaymentReceiptSection";
import StockReservationTimer from "@/components/checkout/StockReservationTimer";
import { authOptions } from "@/lib/auth-options";
import { getOrderDetail, getOrderTracking } from "@/services/orders.service";
import {
  getPedidoDelivery,
  getPedidoDescuento,
  getPedidoEstado,
  getPedidoEstadoTone,
  getPedidoItemColor,
  getPedidoItemModelo,
  getPedidoItemNombre,
  getPedidoItemPrecioUnitario,
  getPedidoItemTalla,
  getPedidoItemColorSecundario,
  getPedidoMetodoPago,
  getPedidoNumero,
  getPedidoSubtotal,
  getPedidoTotal,
  type Pedido,
} from "@/types/pedidos";

function formatDelivery(delivery: Pedido["delivery"]) {
  if (!delivery?.method) return "-";

  if (delivery.method === "WHATSAPP") return "WhatsApp";

  if (delivery.method === "PICKUP_LAPAZ") {
    const labels: Record<string, string> = {
      TELEFERICO_MORADO: "Teleferico Morado (Faro Murillo, Obelisco)",
      TELEFERICO_ROJO: "Teleferico Rojo (Estacion Central, 16 de Julio)",
      CORREOS: "Correos",
    };

    return labels[delivery.pickupPoint ?? ""] ?? "Entrega en La Paz";
  }

  if (delivery.method === "PICKUP_POINT") {
    const details = [delivery.recipientName, delivery.address, delivery.scheduledAt].filter(Boolean);
    return details.length > 0 ? details.join(" - ") : "Punto de encuentro";
  }

  if (delivery.method === "SHIPPING_NATIONAL") {
    const destination = [delivery.department, delivery.city].filter(Boolean).join(", ");
    const carrier = [delivery.shippingCompany, delivery.branch].filter(Boolean).join(" - ");
    return [destination, carrier].filter(Boolean).join(" / ") || "Envio nacional";
  }

  return delivery.address ? `Entrega en casa: ${delivery.address}` : "Entrega en casa";
}

export default async function PedidoDetallePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ paymentId?: string }>;
}) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const { id } = await params;
  const { paymentId } = await searchParams;
  const auth = { userId: session.user.id, role: "CLIENTE" as const, accessToken: session.accessToken };

  const [pedido, tracking] = await Promise.all([
    getOrderDetail(auth, id),
    getOrderTracking(auth, id),
  ]);

  if (!pedido) notFound();

  const descuento = getPedidoDescuento(pedido);
  const subtotal = getPedidoSubtotal(pedido);
  const total = getPedidoTotal(pedido);
  const delivery = getPedidoDelivery(pedido);

  const estadoColor: Record<string, React.CSSProperties> = {
    success: { color: "var(--success)", background: "#e7efe9", borderColor: "#c5d8c9" },
    warning: { color: "#6a4f21", background: "#efe5d5", borderColor: "#cfbc98" },
    danger: { color: "var(--danger)", background: "#f3e3e0", borderColor: "#d9b2ac" },
    accent: { color: "#2450a6", background: "#e7eefb", borderColor: "#c4d3f3" },
    neutral: { color: "var(--muted)", background: "#ece7e0", borderColor: "var(--border)" },
  };

  return (
    <div className="space-y-8 max-w-2xl">
      <div className="flex items-center gap-2 text-sm" style={{ color: "var(--subtle)" }}>
        <Link href="/pedidos" className="hover:opacity-60 transition-opacity" style={{ color: "var(--muted)" }}>
          Mis pedidos
        </Link>
        <span>/</span>
        <span style={{ color: "var(--foreground)" }}>{getPedidoNumero(pedido)}</span>
      </div>

      <div className="flex items-start justify-between flex-wrap gap-3 sm:gap-4">
        <div className="min-w-0">
          <h1 className="text-2xl sm:text-4xl break-words" style={{ fontFamily: "var(--font-serif, Georgia, serif)", fontWeight: 400 }}>
            {getPedidoNumero(pedido)}
          </h1>
          <p className="text-xs sm:text-sm mt-1" style={{ color: "var(--muted)" }}>
            {new Date(pedido.createdAt).toLocaleDateString("es-BO", {
              day: "2-digit",
              month: "long",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
        </div>
        <span
          className="text-xs sm:text-sm px-3 py-1.5 border shrink-0"
          style={estadoColor[getPedidoEstadoTone(pedido)]}
        >
          {getPedidoEstado(pedido)}
        </span>
      </div>

      {(pedido.estadoPedido === "PENDING_PAYMENT" || pedido.orderStatus === "PENDING_PAYMENT") && (
        <StockReservationTimer
          expiresAt={pedido.reservaExpiraEn}
          createdAt={pedido.createdAt}
          status={pedido.estadoReservaStock}
        />
      )}

      {/* Seguimiento de Guía y Despacho en tiempo real */}
      <OrderTrackingSection pedido={pedido} tracking={tracking} />

      <div className="border overflow-hidden" style={{ borderColor: "var(--border)", background: "var(--surface)" }}>
        <div className="px-5 py-3 border-b" style={{ borderColor: "var(--border)" }}>
          <p className="text-xs uppercase" style={{ letterSpacing: "0.14em", color: "var(--subtle)" }}>
            Productos
          </p>
        </div>
        <div className="divide-y" style={{ borderColor: "var(--border)" }}>
          {pedido.items?.map((item, index) => {
            const itemNombre = getPedidoItemNombre(item);
            const itemModelo = getPedidoItemModelo(item);
            const itemColor = getPedidoItemColor(item) ?? "-";
            const itemColorSecundario = getPedidoItemColorSecundario(item);
            const itemTalla = getPedidoItemTalla(item) ?? "-";

            return (
              <div key={item._id ?? `${itemNombre}-${index}`} className="px-4 py-4 sm:px-5 flex items-center justify-between gap-3 sm:gap-4">
                <div className="min-w-0">
                  <p className="text-sm font-medium break-words" style={{ color: "var(--foreground)" }}>
                    {itemNombre}
                  </p>
                  {itemModelo ? (
                    <p className="text-xs mt-0.5 break-words" style={{ color: "var(--subtle)" }}>
                      {itemModelo}
                    </p>
                  ) : null}
                  <p className="text-xs mt-0.5" style={{ color: "var(--subtle)" }}>
                    {itemColor}{itemColorSecundario ? ` / ${itemColorSecundario}` : ""} - {itemTalla} - x{item.cantidad}
                  </p>
                </div>
                <p className="text-sm shrink-0 whitespace-nowrap" style={{ fontFamily: "var(--font-serif, Georgia, serif)" }}>
                  Bs. {(getPedidoItemPrecioUnitario(item) * item.cantidad).toFixed(2)}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      <div className="border p-4 sm:p-5 space-y-3" style={{ borderColor: "var(--border)", background: "var(--surface)" }}>
        <p className="text-xs uppercase mb-4" style={{ letterSpacing: "0.14em", color: "var(--subtle)" }}>
          Resumen
        </p>
        <div className="flex items-start justify-between gap-3 text-sm" style={{ color: "var(--muted)" }}>
          <span>Subtotal</span>
          <span className="shrink-0 whitespace-nowrap">Bs. {subtotal.toFixed(2)}</span>
        </div>
        {pedido.cuponCodigo && (
          <div className="flex items-start justify-between gap-3 text-sm" style={{ color: "var(--success)" }}>
            <span>Cupón aplicado</span>
            <span className="shrink-0 font-mono font-semibold uppercase break-all text-right">{pedido.cuponCodigo}</span>
          </div>
        )}
        {Array.isArray(pedido.promocionesAplicadas) && pedido.promocionesAplicadas.length > 0 ? (
          pedido.promocionesAplicadas.map((promo, index) => {
            const promoAmount = promo.descuento ?? promo.montoDescuento ?? 0;
            return (
              <div key={promo.promocionId ?? index} className="flex items-start justify-between gap-3 text-sm" style={{ color: "var(--success)" }}>
                <span className="min-w-0 break-words">{promo.nombre || promo.codigo || promo.cuponCodigo || "Promoción aplicada"}</span>
                <span className="shrink-0 whitespace-nowrap">{promoAmount > 0 ? `- Bs. ${promoAmount.toFixed(2)}` : "Aplicada"}</span>
              </div>
            );
          })
        ) : null}
        {descuento > 0 && (
          <div className="flex items-start justify-between gap-3 text-sm" style={{ color: "var(--success)" }}>
            <span>Descuento total</span>
            <span className="shrink-0 whitespace-nowrap font-medium">- Bs. {descuento.toFixed(2)}</span>
          </div>
        )}
        <div className="flex items-start justify-between gap-3 text-sm" style={{ color: "var(--muted)" }}>
          <span>Metodo de pago</span>
          <span className="shrink-0 text-right">{getPedidoMetodoPago(pedido) ?? "-"}</span>
        </div>
        <div className="flex items-start justify-between gap-3 text-sm" style={{ color: "var(--muted)" }}>
          <span className="shrink-0">Entrega</span>
          <span className="min-w-0 max-w-[65%] text-right break-words">{formatDelivery(delivery)}</span>
        </div>
        {delivery?.phone ? (
          <div className="flex items-start justify-between gap-3 text-sm" style={{ color: "var(--muted)" }}>
            <span>Celular</span>
            <span className="shrink-0 whitespace-nowrap">{delivery.phone}</span>
          </div>
        ) : null}
        {delivery?.senderPhone ? (
          <div className="flex items-start justify-between gap-3 text-sm" style={{ color: "var(--muted)" }}>
            <span>Celular remitente</span>
            <span className="shrink-0 whitespace-nowrap">{delivery.senderPhone}</span>
          </div>
        ) : null}
        <div className="flex items-baseline justify-between gap-3 text-base pt-3 border-t" style={{ borderColor: "var(--border)" }}>
          <span style={{ color: "var(--foreground)" }}>Total</span>
          <span className="shrink-0 whitespace-nowrap" style={{ color: "var(--foreground)", fontFamily: "var(--font-serif, Georgia, serif)" }}>
            Bs. {total.toFixed(2)}
          </span>
        </div>
      </div>

      <PaymentReceiptSection
        pedido={pedido}
        defaultPaymentId={paymentId ?? null}
      />

      <OrderDeliveryEditSection pedido={pedido} />

      <OrderActionsSection pedido={pedido} />

      <Link href="/pedidos" className="text-sm hover:opacity-60 transition-opacity inline-block" style={{ color: "var(--muted)" }}>
        Volver a mis pedidos
      </Link>
    </div>
  );
}
