import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import Link from "next/link";

async function getMisPedidos(userId: string) {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/mis-pedidos`,
    {
      headers: { "x-user-id": userId },
      next: { revalidate: 0 },
    }
  );
  return res.ok ? await res.json() : [];
}

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const pedidos = await getMisPedidos(session.user.id);

  const recientes = pedidos.slice(0, 5);
  const totalGastado = pedidos.reduce((sum: number, p: any) => sum + (p.total ?? 0), 0);
  const totalPedidos = pedidos.length;

  return (
    <div className="space-y-8">
      {/* Saludo */}
      <div>
        <h1 className="text-3xl font-extrabold text-white">
          Hola, {session.user.fullname.split(" ")[0]} 👋
        </h1>
        <p className="text-gray-400 text-sm mt-1">Aquí tienes un resumen de tu actividad.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard label="Total pedidos" value={totalPedidos.toString()} icon="📦" />
        <StatCard label="Total gastado" value={`Bs. ${totalGastado.toFixed(2)}`} icon="💰" />
        <StatCard
          label="Último pedido"
          value={recientes[0] ? new Date(recientes[0].createdAt).toLocaleDateString("es-BO") : "—"}
          icon="🕐"
        />
      </div>

      {/* Pedidos recientes */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-white">Pedidos recientes</h2>
          <Link href="/portal/pedidos" className="text-sm text-amber-400 hover:underline">
            Ver todos →
          </Link>
        </div>

        {recientes.length === 0 ? (
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-10 text-center text-gray-500">
            <p className="text-3xl mb-2">◈</p>
            <p className="text-sm">Aún no tienes pedidos.</p>
            <Link href="/catalogo" className="mt-3 inline-block text-amber-400 text-sm hover:underline">
              Explorar catálogo
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {recientes.map((pedido: any) => (
              <PedidoRow key={pedido._id} pedido={pedido} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value, icon }: { label: string; value: string; icon: string }) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 flex items-center gap-4">
      <span className="text-3xl">{icon}</span>
      <div>
        <p className="text-xs text-gray-500 uppercase tracking-widest mb-0.5">{label}</p>
        <p className="text-xl font-bold text-white">{value}</p>
      </div>
    </div>
  );
}

function PedidoRow({ pedido }: { pedido: any }) {
  const estadoColor: Record<string, string> = {
    PAGADA: "text-green-400 bg-green-400/10 border-green-400/20",
    PENDIENTE: "text-amber-400 bg-amber-400/10 border-amber-400/20",
    CANCELADA: "text-red-400 bg-red-400/10 border-red-400/20",
  };

  return (
    <Link href={`/portal/pedidos/${pedido._id}`}>
      <div className="flex items-center justify-between bg-gray-900 border border-gray-800 hover:border-gray-700 rounded-xl px-5 py-4 transition">
        <div>
          <p className="text-sm font-semibold text-gray-100">{pedido.numeroVenta}</p>
          <p className="text-xs text-gray-500 mt-0.5">
            {new Date(pedido.createdAt).toLocaleDateString("es-BO", {
              day: "2-digit", month: "short", year: "numeric",
            })}
          </p>
        </div>
        <div className="flex items-center gap-4">
          <span className={`text-xs px-2.5 py-1 rounded-full border ${estadoColor[pedido.estado] ?? "text-gray-400 bg-gray-800 border-gray-700"}`}>
            {pedido.estado}
          </span>
          <p className="text-sm font-bold text-amber-400">Bs. {pedido.total?.toFixed(2)}</p>
          <span className="text-gray-600 text-xs">→</span>
        </div>
      </div>
    </Link>
  );
}