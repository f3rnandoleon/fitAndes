import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { getOrders } from "@/services/orders.service";
import { getPedidoEstado, getPedidoEstadoTone, getPedidoNumero, getPedidoTotal, type Pedido } from "@/types/pedidos";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const pedidos = (await getOrders({ userId: session.user.id, role: "CLIENTE", accessToken: session.accessToken })) ?? [];

  const recientes = pedidos.slice(0, 5);
  const totalGastado = pedidos.reduce((sum, pedido) => sum + getPedidoTotal(pedido), 0);
  const totalPedidos = pedidos.length;

  return (
    <div id="perfil" className="space-y-8">
      <div>
        <p className="text-xs uppercase mb-2" style={{ letterSpacing: "0.22em", color: "var(--subtle)" }}>
          Panel de cliente
        </p>
        <h1 className="text-4xl" style={{ fontFamily: "Georgia, 'Times New Roman', serif", fontWeight: 400, color: "var(--foreground)" }}>
          Hola, {session.user.fullname.split(" ")[0]}
        </h1>
        <p className="text-sm mt-1" style={{ color: "var(--muted)" }}>
          Aquí tienes un resumen de tu actividad.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard label="Total pedidos" value={totalPedidos.toString()} icon={<BoxIcon />} />
        <StatCard label="Total gastado" value={`Bs. ${totalGastado.toFixed(2)}`} icon={<CashIcon />} />
        <StatCard
          label="Último pedido"
          value={recientes[0] ? new Date(recientes[0].createdAt).toLocaleDateString("es-BO") : "-"}
          icon={<ClockIcon />}
        />
      </div>

      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl" style={{ fontFamily: "Georgia, 'Times New Roman', serif", fontWeight: 400 }}>
            Pedidos recientes
          </h2>
          <Link href="/pedidos" className="text-xs uppercase hover:opacity-60 transition-opacity" style={{ letterSpacing: "0.16em" }}>
            Ver todos
          </Link>
        </div>

        {recientes.length === 0 ? (
          <div className="border border-border p-10 text-center rounded-[var(--radius-lg)] bg-white">
            <p className="text-3xl mb-2 text-subtle">◈</p>
            <p className="text-sm" style={{ color: "var(--muted)" }}>
              Aún no tienes pedidos.
            </p>
            <Link href="/catalogo" className="mt-3 inline-block text-sm hover:opacity-60 transition-opacity font-medium" style={{ color: "var(--foreground)" }}>
              Explorar catálogo
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {recientes.map((pedido) => (
              <PedidoRow key={pedido._id} pedido={pedido} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  return (
    <div className="border border-border p-5 flex items-center gap-4 rounded-[var(--radius-md)] bg-white shadow-sm">
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-background text-foreground border border-border">
        {icon}
      </span>
      <div>
        <p className="text-xs uppercase mb-0.5" style={{ letterSpacing: "0.14em", color: "var(--subtle)" }}>
          {label}
        </p>
        <p className="text-xl" style={{ fontFamily: "Georgia, 'Times New Roman', serif", fontWeight: 400, color: "var(--foreground)" }}>
          {value}
        </p>
      </div>
    </div>
  );
}

function BoxIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
      <path d="m3.3 7 8.7 5 8.7-5" />
      <path d="M12 22V12" />
    </svg>
  );
}

function CashIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="1" x2="12" y2="23" />
      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

function PedidoRow({ pedido }: { pedido: Pedido }) {
  const estadoColor: Record<string, React.CSSProperties> = {
    success: { color: "var(--success)", background: "#e7efe9", borderColor: "#c5d8c9" },
    warning: { color: "#6a4f21", background: "#efe5d5", borderColor: "#cfbc98" },
    danger: { color: "var(--danger)", background: "#f3e3e0", borderColor: "#d9b2ac" },
    accent: { color: "#2450a6", background: "#e7eefb", borderColor: "#c4d3f3" },
    neutral: { color: "var(--muted)", background: "#ece7e0", borderColor: "var(--border)" },
  };
  const statusTone = getPedidoEstadoTone(pedido);
  const statusLabel = getPedidoEstado(pedido);

  return (
    <Link href={`/pedidos/${pedido._id}`}>
      <div className="flex items-center justify-between border border-border px-5 py-4 transition-all hover:translate-x-1 bg-white rounded-[var(--radius-md)] shadow-sm hover:shadow-md">
        <div>
          <p className="text-sm font-medium" style={{ color: "var(--foreground)" }}>{getPedidoNumero(pedido)}</p>
          <p className="text-xs mt-0.5" style={{ color: "var(--subtle)" }}>
            {new Date(pedido.createdAt).toLocaleDateString("es-BO", {
              day: "2-digit",
              month: "short",
              year: "numeric",
            })}
          </p>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-[10px] uppercase px-3 py-1 border rounded-full font-medium" style={estadoColor[statusTone]}>
            {statusLabel}
          </span>
          <p className="text-sm" style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}>
            Bs. {getPedidoTotal(pedido).toFixed(2)}
          </p>
          <span className="text-xs" style={{ color: "var(--subtle)" }}>{"\u2192"}</span>
        </div>
      </div>
    </Link>
  );
}
