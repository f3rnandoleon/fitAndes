import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

async function getPedido(pedidoId: string, userId: string) {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/mis-pedidos/${pedidoId}`, {
    headers: { "x-user-id": userId },
    next: { revalidate: 0 },
  });
  if (res.status === 404) return null;
  return res.ok ? await res.json() : null;
}

export default async function PedidoDetallePage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const { id } = await params;
  const pedido = await getPedido(id, session.user.id);
  if (!pedido) notFound();

  const estadoColor: Record<string, React.CSSProperties> = {
    PAGADA: { color: "var(--success)", background: "#e7efe9", borderColor: "#c5d8c9" },
    PENDIENTE: { color: "#6a4f21", background: "#efe5d5", borderColor: "#cfbc98" },
    CANCELADA: { color: "var(--danger)", background: "#f3e3e0", borderColor: "#d9b2ac" },
  };

  return (
    <div className="space-y-8 max-w-2xl">
      <div className="flex items-center gap-2 text-sm" style={{ color: "var(--subtle)" }}>
        <Link href="/portal/pedidos" className="hover:opacity-60 transition-opacity" style={{ color: "var(--muted)" }}>
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
          {pedido.items?.map((item: any, i: number) => (
            <div key={i} className="px-5 py-4 flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium" style={{ color: "var(--foreground)" }}>
                  {item.nombre ?? "Producto"}
                </p>
                <p className="text-xs mt-0.5" style={{ color: "var(--subtle)" }}>
                  {item.color} - {item.talla} - x{item.cantidad}
                </p>
              </div>
              <p className="text-sm" style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}>
                Bs. {(item.precioVenta * item.cantidad).toFixed(2)}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div className="border p-5 space-y-3" style={{ borderColor: "var(--border)", background: "var(--surface)" }}>
        <p className="text-xs uppercase mb-4" style={{ letterSpacing: "0.14em", color: "var(--subtle)" }}>
          Resumen
        </p>
        <div className="flex justify-between text-sm" style={{ color: "var(--muted)" }}>
          <span>Subtotal</span>
          <span>Bs. {pedido.subtotal?.toFixed(2)}</span>
        </div>
        {pedido.descuento > 0 && (
          <div className="flex justify-between text-sm" style={{ color: "var(--success)" }}>
            <span>Descuento</span>
            <span>- Bs. {pedido.descuento?.toFixed(2)}</span>
          </div>
        )}
        <div className="flex justify-between text-sm" style={{ color: "var(--muted)" }}>
          <span>Metodo de pago</span>
          <span>{pedido.metodoPago}</span>
        </div>
        <div className="flex justify-between text-base pt-3 border-t" style={{ borderColor: "var(--border)" }}>
          <span style={{ color: "var(--foreground)" }}>Total</span>
          <span style={{ color: "var(--foreground)", fontFamily: "Georgia, 'Times New Roman', serif" }}>
            Bs. {pedido.total?.toFixed(2)}
          </span>
        </div>
      </div>

      <Link href="/portal/pedidos" className="text-sm hover:opacity-60 transition-opacity inline-block" style={{ color: "var(--muted)" }}>
        Volver a mis pedidos
      </Link>
    </div>
  );
}
