import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import OrderActionsSection from "@/components/pedidos/OrderActionsSection";
import OrderDeliveryEditSection from "@/components/pedidos/OrderDeliveryEditSection";
import PaymentReceiptSection from "@/components/pedidos/PaymentReceiptSection";
import { authOptions } from "@/lib/auth-options";
import { getOrderDetail } from "@/services/orders.service";
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
  const pedido = await getOrderDetail({ userId: session.user.id, role: "CLIENTE", accessToken: session.accessToken }, id);
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

      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-4xl" style={{ fontFamily: "Georgia, 'Times New Roman', serif", fontWeight: 400 }}>
            {getPedidoNumero(pedido)}
          </h1>
          <p className="text-sm mt-1" style={{ color: "var(--muted)" }}>
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
          className="text-sm px-3 py-1.5 border"
          style={estadoColor[getPedidoEstadoTone(pedido)]}
        >
          {getPedidoEstado(pedido)}
        </span>
      </div>

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
              <div key={item._id ?? `${itemNombre}-${index}`} className="px-5 py-4 flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-medium" style={{ color: "var(--foreground)" }}>
                    {itemNombre}
                  </p>
                  {itemModelo ? (
                    <p className="text-xs mt-0.5" style={{ color: "var(--subtle)" }}>
                      {itemModelo}
                    </p>
                  ) : null}
                  <p className="text-xs mt-0.5" style={{ color: "var(--subtle)" }}>
                    {itemColor}{itemColorSecundario ? ` / ${itemColorSecundario}` : ""} - {itemTalla} - x{item.cantidad}
                  </p>
                </div>
                <p className="text-sm" style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}>
                  Bs. {(getPedidoItemPrecioUnitario(item) * item.cantidad).toFixed(2)}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      <div className="border p-5 space-y-3" style={{ borderColor: "var(--border)", background: "var(--surface)" }}>
        <p className="text-xs uppercase mb-4" style={{ letterSpacing: "0.14em", color: "var(--subtle)" }}>
          Resumen
        </p>
        <div className="flex justify-between text-sm" style={{ color: "var(--muted)" }}>
          <span>Subtotal</span>
          <span>Bs. {subtotal.toFixed(2)}</span>
        </div>
        {descuento > 0 && (
          <div className="flex justify-between text-sm" style={{ color: "var(--success)" }}>
            <span>Descuento</span>
            <span>- Bs. {descuento.toFixed(2)}</span>
          </div>
        )}
        <div className="flex justify-between text-sm" style={{ color: "var(--muted)" }}>
          <span>Metodo de pago</span>
          <span>{getPedidoMetodoPago(pedido) ?? "-"}</span>
        </div>
        <div className="flex justify-between text-sm" style={{ color: "var(--muted)" }}>
          <span>Entrega</span>
          <span className="max-w-[60%] text-right">{formatDelivery(delivery)}</span>
        </div>
        {delivery?.phone ? (
          <div className="flex justify-between text-sm" style={{ color: "var(--muted)" }}>
            <span>Celular</span>
            <span>{delivery.phone}</span>
          </div>
        ) : null}
        {delivery?.senderPhone ? (
          <div className="flex justify-between text-sm" style={{ color: "var(--muted)" }}>
            <span>Celular remitente</span>
            <span>{delivery.senderPhone}</span>
          </div>
        ) : null}
        <div className="flex justify-between text-base pt-3 border-t" style={{ borderColor: "var(--border)" }}>
          <span style={{ color: "var(--foreground)" }}>Total</span>
          <span style={{ color: "var(--foreground)", fontFamily: "Georgia, 'Times New Roman', serif" }}>
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
