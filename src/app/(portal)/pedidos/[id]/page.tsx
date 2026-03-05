import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";

async function getPedido(pedidoId: string, userId: string) {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/mis-pedidos/${pedidoId}`,
    { headers: { "x-user-id": userId }, next: { revalidate: 0 } }
  );
  if (res.status === 404) return null;
  return res.ok ? await res.json() : null;
}

export default async function PedidoDetallePage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const pedido = await getPedido(params.id, session.user.id);
  if (!pedido) notFound();

  const estadoColor: Record<string, string> = {
    PAGADA: "text-green-400 bg-green-400/10 border-green-400/20",
    PENDIENTE: "text-amber-400 bg-amber-400/10 border-amber-400/20",
    CANCELADA: "text-red-400 bg-red-400/10 border-red-400/20",
  };

  return (
    <div className="space-y-8 max-w-2xl">
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <Link href="/portal/pedidos" className="hover:text-amber-400 transition">Mis pedidos</Link>
        <span>/</span>
        <span className="text-gray-300">{pedido.numeroVenta}</span>
      </div>

      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white">{pedido.numeroVenta}</h1>
          <p className="text-gray-400 text-sm mt-1">
            {new Date(pedido.createdAt).toLocaleDateString("es-BO", {
              day: "2-digit", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit",
            })}
          </p>
        </div>
        <span className={`text-sm px-3 py-1.5 rounded-full border font-medium ${estadoColor[pedido.estado] ?? "text-gray-400 bg-gray-800 border-gray-700"}`}>
          {pedido.estado}
        </span>
      </div>

      {/* Items */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-800">
          <p className="text-xs font-medium text-gray-400 uppercase tracking-widest">Productos</p>
        </div>
        <div className="divide-y divide-gray-800">
          {pedido.items?.map((item: any, i: number) => (
            <div key={i} className="px-5 py-4 flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-gray-100">{item.nombre ?? "Producto"}</p>
                <p className="text-xs text-gray-500 mt-0.5">
                  {item.color} · {item.talla} · x{item.cantidad}
                </p>
              </div>
              <p className="text-sm font-bold text-gray-200">
                Bs. {(item.precioVenta * item.cantidad).toFixed(2)}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Resumen */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 space-y-3">
        <p className="text-xs font-medium text-gray-400 uppercase tracking-widest mb-4">Resumen</p>
        <div className="flex justify-between text-sm text-gray-400">
          <span>Subtotal</span>
          <span>Bs. {pedido.subtotal?.toFixed(2)}</span>
        </div>
        {pedido.descuento > 0 && (
          <div className="flex justify-between text-sm text-green-400">
            <span>Descuento</span>
            <span>- Bs. {pedido.descuento?.toFixed(2)}</span>
          </div>
        )}
        <div className="flex justify-between text-sm text-gray-400">
          <span>Método de pago</span>
          <span>{pedido.metodoPago}</span>
        </div>
        <div className="flex justify-between text-base font-bold text-white border-t border-gray-800 pt-3">
          <span>Total</span>
          <span className="text-amber-400">Bs. {pedido.total?.toFixed(2)}</span>
        </div>
      </div>

      <Link href="/portal/pedidos" className="text-sm text-gray-500 hover:text-amber-400 transition inline-block">
        ← Volver a mis pedidos
      </Link>
    </div>
  );
}