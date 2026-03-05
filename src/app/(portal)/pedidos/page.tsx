
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import Link from "next/link";

async function getMisPedidos(userId: string) {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/mis-pedidos`,
    { headers: { "x-user-id": userId }, next: { revalidate: 0 } }
  );
  return res.ok ? await res.json() : [];
}

export default async function PedidosPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const pedidos = await getMisPedidos(session.user.id);

  const estadoColor: Record<string, string> = {
    PAGADA: "text-green-400 bg-green-400/10 border-green-400/20",
    PENDIENTE: "text-amber-400 bg-amber-400/10 border-amber-400/20",
    CANCELADA: "text-red-400 bg-red-400/10 border-red-400/20",
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold text-white">Mis pedidos</h1>
        <p className="text-gray-400 text-sm mt-1">{pedidos.length} pedido{pedidos.length !== 1 ? "s" : ""} en total</p>
      </div>

      {pedidos.length === 0 ? (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-16 text-center text-gray-500">
          <p className="text-4xl mb-3">◈</p>
          <p className="text-base font-medium text-gray-400">No tienes pedidos aún</p>
          <Link href="/catalogo" className="mt-4 inline-block bg-amber-400 hover:bg-amber-300 text-gray-950 font-bold rounded-lg px-5 py-2.5 text-sm transition">
            Ver catálogo
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {pedidos.map((pedido: any) => (
            <Link key={pedido._id} href={`/portal/pedidos/${pedido._id}`}>
              <div className="bg-gray-900 border border-gray-800 hover:border-gray-700 rounded-xl px-5 py-4 transition">
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div>
                    <p className="text-sm font-semibold text-gray-100">{pedido.numeroVenta}</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {new Date(pedido.createdAt).toLocaleDateString("es-BO", {
                        day: "2-digit", month: "long", year: "numeric",
                      })}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-xs text-gray-500">
                      {pedido.items?.length ?? 0} ítem{pedido.items?.length !== 1 ? "s" : ""}
                    </span>
                    <span className={`text-xs px-2.5 py-1 rounded-full border ${estadoColor[pedido.estado] ?? "text-gray-400 bg-gray-800 border-gray-700"}`}>
                      {pedido.estado}
                    </span>
                    <p className="text-sm font-bold text-amber-400">Bs. {pedido.total?.toFixed(2)}</p>
                    <span className="text-gray-600 text-xs">→</span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}