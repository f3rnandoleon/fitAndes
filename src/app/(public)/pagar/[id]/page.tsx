import { Suspense } from "react";
import { notFound, redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { getOrderDetail } from "@/services/orders.service";
import QRPaymentClient from "@/components/checkout/QRPaymentClient";
import { CentralApiRole } from "@/lib/central-api";

interface PageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ orderId?: string }>;
}

export default async function PagarPage(props: PageProps) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    redirect("/login?callbackUrl=/checkout");
  }

  const { id: paymentId } = await props.params;
  const { orderId } = await props.searchParams;

  if (!paymentId || !orderId) {
    notFound();
  }

  const order = await getOrderDetail(
    { userId: session.user.id, role: session.user.role as CentralApiRole, accessToken: session.accessToken },
    orderId
  );

  if (!order) {
    notFound();
  }

  // Si el pedido ya esta pagado, redirigir al detalle
  if (order.pago?.estado === "PAID") {
    redirect(`/pedidos/${order._id}`);
  }

  return (
    <main className="min-h-[calc(100vh-82px)] px-4 sm:px-6 py-10 sm:py-16 bg-[#fbf9f5]">
      <div className="max-w-[1240px] mx-auto">
        <header className="text-center mb-12 sm:mb-16">
          <p className="text-[10px] uppercase tracking-[0.2em] text-subtle mb-3">Paso Final</p>
          <h1 className="text-4xl sm:text-5xl font-serif text-foreground">Completa tu pago</h1>
          <p className="mt-4 text-sm text-muted max-w-lg mx-auto leading-relaxed">
            Hemos reservado tus productos. Para confirmar definitivamente tu pedido #{order.numeroPedido || order._id.slice(-6)}, realiza la transferencia QR.
          </p>
        </header>

        <Suspense fallback={<div className="text-center py-20 text-subtle animate-pulse">Cargando detalles de pago...</div>}>
          <QRPaymentClient paymentId={paymentId} order={order} />
        </Suspense>
      </div>
    </main>
  );
}
