import { NextResponse, type NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { getToken } from "next-auth/jwt";
import { authOptions } from "@/lib/auth-options";
import { CENTRAL_API_URL, type CentralApiRole } from "@/lib/central-api";
import { createQrPayment } from "@/lib/checkout/payment";
import { getRequestId } from "@/lib/request-context";
import { logger } from "@/lib/logger";

export async function POST(request: NextRequest) {
  const requestId = await getRequestId();
  const session = await getServerSession(authOptions);
  let userId = session?.user?.id;
  let role = session?.user?.role as CentralApiRole | undefined;
  let accessToken = session?.accessToken ?? null;

  if (!userId || !role) {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    if (token?.id && token?.role) {
      userId = token.id as string;
      role = token.role as CentralApiRole;
      accessToken = typeof token.accessToken === "string" ? token.accessToken : null;
    }
  }

  if (!userId || role !== "CLIENTE") {
    return NextResponse.json({ message: "Debes iniciar sesion." }, { status: 401 });
  }

  if (!CENTRAL_API_URL) {
    return NextResponse.json({ message: "La API central no esta configurada." }, { status: 500 });
  }

  let body: { orderId?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: "Datos invalidos." }, { status: 400 });
  }

  if (!body.orderId) {
    return NextResponse.json({ message: "Falta el identificador del pedido." }, { status: 400 });
  }

  try {
    const paymentResult = await createQrPayment(
      { userId, role, accessToken },
      body.orderId,
      { requestId }
    );

    if (!paymentResult.paymentId) {
      return NextResponse.json(
        { message: paymentResult.warning ?? "No pude generar la transaccion de pago QR." },
        { status: 400 }
      );
    }

    return NextResponse.json({
      ok: true,
      paymentId: paymentResult.paymentId,
      warning: paymentResult.warning,
    });
  } catch (error) {
    logger.error("Create payment route critical failure", { error, requestId, orderId: body.orderId });
    return NextResponse.json({ message: "No pude conectar con el servicio de pagos." }, { status: 502 });
  }
}
