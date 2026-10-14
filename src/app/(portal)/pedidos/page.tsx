import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { getOrders } from "@/services/orders.service";
import PedidosListClient from "@/components/pedidos/PedidosListClient";

export default async function PedidosPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const pedidos = (await getOrders({ userId: session.user.id, role: "CLIENTE", accessToken: session.accessToken })) ?? [];

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

      <PedidosListClient pedidos={pedidos} />
    </div>
  );
}
