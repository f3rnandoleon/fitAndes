import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

async function getMisPedidos(userId: string) {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/mis-pedidos`, {
    headers: { "x-user-id": userId },
    next: { revalidate: 0 },
  });
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
      <div>
        <p className="text-xs uppercase mb-2" style={{ letterSpacing: "0.22em", color: "var(--subtle)" }}>
          Panel de cliente
        </p>
        <h1 className="text-4xl" style={{ fontFamily: "Georgia, 'Times New Roman', serif", fontWeight: 400 }}>
          Hola, {session.user.fullname.split(" ")[0]}
        </h1>
        <p className="text-sm mt-1" style={{ color: "var(--muted)" }}>
          Aqui tienes un resumen de tu actividad.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard label="Total pedidos" value={totalPedidos.toString()} icon="📦" />
        <StatCard label="Total gastado" value={`Bs. ${totalGastado.toFixed(2)}`} icon="💰" />
        <StatCard
          label="Ultimo pedido"
          value={recientes[0] ? new Date(recientes[0].createdAt).toLocaleDateString("es-BO") : "-"}
          icon="🕐"
        />
      </div>

      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl" style={{ fontFamily: "Georgia, 'Times New Roman', serif", fontWeight: 400 }}>
            Pedidos recientes
          </h2>
          <Link href="/portal/pedidos" className="text-xs uppercase hover:opacity-60 transition-opacity" style={{ letterSpacing: "0.16em" }}>
            Ver todos
          </Link>
        </div>

        {recientes.length === 0 ? (
          <div className="border p-10 text-center" style={{ borderColor: "var(--border)", background: "var(--surface)" }}>
            <p className="text-3xl mb-2">◈</p>
            <p className="text-sm" style={{ color: "var(--muted)" }}>
              Aun no tienes pedidos.
            </p>
            <Link href="/catalogo" className="mt-3 inline-block text-sm hover:opacity-60 transition-opacity">
              Explorar catalogo
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
    <div className="border p-5 flex items-center gap-4" style={{ borderColor: "var(--border)", background: "var(--surface)" }}>
      <span className="text-3xl" style={{ color: "var(--subtle)" }}>{icon}</span>
      <div>
        <p className="text-xs uppercase mb-0.5" style={{ letterSpacing: "0.14em", color: "var(--subtle)" }}>
          {label}
        </p>
        <p className="text-xl" style={{ fontFamily: "Georgia, 'Times New Roman', serif", fontWeight: 400 }}>
          {value}
        </p>
      </div>
    </div>
  );
}

function PedidoRow({ pedido }: { pedido: any }) {
  const estadoColor: Record<string, React.CSSProperties> = {
    PAGADA: { color: "var(--success)", background: "#e7efe9", borderColor: "#c5d8c9" },
    PENDIENTE: { color: "#6a4f21", background: "#efe5d5", borderColor: "#cfbc98" },
    CANCELADA: { color: "var(--danger)", background: "#f3e3e0", borderColor: "#d9b2ac" },
  };

  return (
    <Link href={`/portal/pedidos/${pedido._id}`}>
      <div className="flex items-center justify-between border px-5 py-4 transition-opacity hover:opacity-85" style={{ borderColor: "var(--border)", background: "var(--surface)" }}>
        <div>
          <p className="text-sm font-medium" style={{ color: "var(--foreground)" }}>{pedido.numeroVenta}</p>
          <p className="text-xs mt-0.5" style={{ color: "var(--subtle)" }}>
            {new Date(pedido.createdAt).toLocaleDateString("es-BO", {
              day: "2-digit",
              month: "short",
              year: "numeric",
            })}
          </p>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-xs px-2.5 py-1 border" style={estadoColor[pedido.estado] ?? { color: "var(--muted)", background: "#ece7e0", borderColor: "var(--border)" }}>
            {pedido.estado}
          </span>
          <p className="text-sm" style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}>
            Bs. {pedido.total?.toFixed(2)}
          </p>
          <span className="text-xs" style={{ color: "var(--subtle)" }}>{"\u2192"}</span>
        </div>
      </div>
    </Link>
  );
}
