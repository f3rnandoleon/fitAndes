import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { buildCentralApiHeaders } from "@/lib/central-api";
import {
  getPedidoDescuento,
  getPedidoItemColor,
  getPedidoItemModelo,
  getPedidoItemNombre,
  getPedidoItemTalla,
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

  return delivery.address ? `Entrega en casa: ${delivery.address}` : "Entrega en casa";
}

async function getPedido(pedidoId: string, userId: string, accessToken?: string | null): Promise<Pedido | null> {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/mis-pedidos/${pedidoId}`, {
    headers: buildCentralApiHeaders({ userId, role: "CLIENTE", accessToken }),
    next: { revalidate: 0 },
  });

  if (res.status === 404) return null;
  if (!res.ok) return null;

  return (await res.json()) as Pedido;
}

export default async function PedidoDetallePage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const { id } = await params;
  const pedido = await getPedido(id, session.user.id, session.accessToken);
  if (!pedido) notFound();

  const descuento = getPedidoDescuento(pedido);
  const subtotal = getPedidoSubtotal(pedido);
  const total = getPedidoTotal(pedido);

  const estadoColor: Record<string, React.CSSProperties> = {
    PAGADA: { color: "var(--success)", background: "#e7efe9", borderColor: "#c5d8c9" },
    PENDIENTE: { color: "#6a4f21", background: "#efe5d5", borderColor: "#cfbc98" },
    CANCELADA: { color: "var(--danger)", background: "#f3e3e0", borderColor: "#d9b2ac" },
  };

  return (
    <div className="space-y-8 max-w-2xl">
      <div className="flex items-center gap-2 text-sm" style={{ color: "var(--subtle)" }}>
        <Link href="/pedidos" className="hover:opacity-60 transition-opacity" style={{ color: "var(--muted)" }}>
          Mis pedidos
        </Link>
        <span>/</span>
        <span style={{ color: "var(--foreground)" }}>{pedido.numeroVenta}</span>
      </div>

      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-4xl" style={{ fontFamily: "Georgia, 'Times New Roman', serif", fontWeight: 400 }}>
            {pedido.numeroVenta}
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
          style={estadoColor[pedido.estado] ?? { color: "var(--muted)", background: "#ece7e0", borderColor: "var(--border)" }}
        >
          {pedido.estado}
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
                    {itemColor} - {itemTalla} - x{item.cantidad}
                  </p>
                </div>
                <p className="text-sm" style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}>
                  Bs. {(item.precioVenta * item.cantidad).toFixed(2)}
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
          <span>{pedido.metodoPago ?? "-"}</span>
        </div>
        <div className="flex justify-between text-sm" style={{ color: "var(--muted)" }}>
          <span>Entrega</span>
          <span className="max-w-[60%] text-right">{formatDelivery(pedido.delivery)}</span>
        </div>
        {pedido.delivery?.phone ? (
          <div className="flex justify-between text-sm" style={{ color: "var(--muted)" }}>
            <span>Celular</span>
            <span>{pedido.delivery.phone}</span>
          </div>
        ) : null}
        <div className="flex justify-between text-base pt-3 border-t" style={{ borderColor: "var(--border)" }}>
          <span style={{ color: "var(--foreground)" }}>Total</span>
          <span style={{ color: "var(--foreground)", fontFamily: "Georgia, 'Times New Roman', serif" }}>
            Bs. {total.toFixed(2)}
          </span>
        </div>
      </div>

      <Link href="/pedidos" className="text-sm hover:opacity-60 transition-opacity inline-block" style={{ color: "var(--muted)" }}>
        Volver a mis pedidos
      </Link>
    </div>
  );
}
