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

export default async function PedidosPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const pedidos = await getMisPedidos(session.user.id);

  const estadoColor: Record<string, React.CSSProperties> = {
    PAGADA: { color: "var(--success)", background: "#e7efe9", borderColor: "#c5d8c9" },
    PENDIENTE: { color: "#6a4f21", background: "#efe5d5", borderColor: "#cfbc98" },
    CANCELADA: { color: "var(--danger)", background: "#f3e3e0", borderColor: "#d9b2ac" },
  };

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs uppercase mb-2" style={{ letterSpacing: "0.22em", color: "var(--subtle)" }}>
          Historial
        </p>
        <h1 className="text-4xl" style={{ fontFamily: "Georgia, 'Times New Roman', serif", fontWeight: 400 }}>
          Mis pedidos
        </h1>
        <p className="text-sm mt-1" style={{ color: "var(--muted)" }}>
          {pedidos.length} pedido{pedidos.length !== 1 ? "s" : ""} en total
        </p>
      </div>

      {pedidos.length === 0 ? (
        <div className="border p-16 text-center" style={{ borderColor: "var(--border)", background: "var(--surface)" }}>
          <p className="text-4xl mb-3">◈</p>
          <p className="text-base" style={{ color: "var(--muted)" }}>
            No tienes pedidos aun
          </p>
          <Link
            href="/catalogo"
            className="mt-4 inline-block text-xs uppercase text-white px-5 py-2.5 hover:opacity-85 transition-opacity"
            style={{ letterSpacing: "0.16em", background: "#1a1a1a" }}
          >
            Ver catalogo
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {pedidos.map((pedido: any) => (
            <Link key={pedido._id} href={`/portal/pedidos/${pedido._id}`}>
              <div className="border px-5 py-4 transition-opacity hover:opacity-85" style={{ borderColor: "var(--border)", background: "var(--surface)" }}>
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div>
                    <p className="text-sm font-medium" style={{ color: "var(--foreground)" }}>{pedido.numeroVenta}</p>
                    <p className="text-xs mt-0.5" style={{ color: "var(--subtle)" }}>
                      {new Date(pedido.createdAt).toLocaleDateString("es-BO", {
                        day: "2-digit",
                        month: "long",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-xs" style={{ color: "var(--subtle)" }}>
                      {pedido.items?.length ?? 0} item{pedido.items?.length !== 1 ? "s" : ""}
                    </span>
                    <span
                      className="text-xs px-2.5 py-1 border"
                      style={estadoColor[pedido.estado] ?? { color: "var(--muted)", background: "#ece7e0", borderColor: "var(--border)" }}
                    >
                      {pedido.estado}
                    </span>
                    <p className="text-sm" style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}>
                      Bs. {pedido.total?.toFixed(2)}
                    </p>
                    <span className="text-xs" style={{ color: "var(--subtle)" }}>{"\u2192"}</span>
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
