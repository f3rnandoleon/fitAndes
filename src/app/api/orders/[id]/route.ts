import { NextResponse, type NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { getToken } from "next-auth/jwt";
import { authOptions } from "@/lib/auth-options";
import { CENTRAL_API_URL, parseJsonRecord, type CentralApiRole } from "@/lib/central-api";
import { fetchCentralJson } from "@/lib/central-client";
import { extractErrorMessage, buildCanonicalOrderPatchPayload } from "@/lib/adapters/orders.adapter";
import { firstZodIssueMessage } from "@/lib/schemas/common";
import { orderPatchSchema } from "@/lib/schemas/order.schema";
import { logger } from "@/lib/logger";
import { getRequestId } from "@/lib/request-context";

type OrderAuth = {
  userId: string;
  role: CentralApiRole;
  accessToken?: string | null;
};

async function getOrderAuth(request: NextRequest): Promise<OrderAuth | null> {
  const session = await getServerSession(authOptions);

  if (session?.user?.id && session.user.role) {
    return {
      userId: session.user.id,
      role: session.user.role,
      accessToken: session.accessToken ?? null,
    };
  }

  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
  if (!token || typeof token.id !== "string" || typeof token.role !== "string") {
    return null;
  }

  return {
    userId: token.id,
    role: token.role as CentralApiRole,
    accessToken: typeof token.accessToken === "string" ? token.accessToken : null,
  };
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const requestId = await getRequestId();
  const auth = await getOrderAuth(request);
  if (!auth || auth.role !== "CLIENTE") {
    return NextResponse.json({ message: "Debes iniciar sesion para actualizar el pedido." }, { status: 401 });
  }

  if (!CENTRAL_API_URL) {
    return NextResponse.json({ message: "La API principal no esta configurada." }, { status: 500 });
  }

  const { id } = await params;
  if (!id) {
    return NextResponse.json({ message: "Falta el identificador del pedido." }, { status: 400 });
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ message: "No pude leer la actualizacion del pedido." }, { status: 400 });
  }

  const parsedPayload = orderPatchSchema.safeParse(payload);
  if (!parsedPayload.success) {
    logger.warn("Order PATCH validation failed", { error: parsedPayload.error.format(), requestId, orderId: id });
    return NextResponse.json({ message: firstZodIssueMessage(parsedPayload.error) }, { status: 400 });
  }

  const validatedPayload = parsedPayload.data;
  const canonicalPayload = buildCanonicalOrderPatchPayload(validatedPayload);

  try {
    const result = await fetchCentralJson([
      {
        path: `/pedidos/${id}`,
        method: "PATCH",
        body: JSON.stringify(canonicalPayload ?? validatedPayload),
      },
      {
        path: `/pedidos/${id}`,
        method: "PATCH",
        body: JSON.stringify(validatedPayload),
      },
      {
        path: `/orders/${id}`,
        method: "PATCH",
        body: JSON.stringify(validatedPayload),
      },
    ], auth, { requestId });

    const data = parseJsonRecord(result.data);
    if (!result.response.ok) {
      logger.error("Order PATCH API failed", { status: result.response.status, requestId, orderId: id, error: data });
      return NextResponse.json(
        { message: extractErrorMessage(data, "No pude actualizar el pedido.") },
        { status: result.response.status },
      );
    }

    logger.info("Order PATCH successful", { requestId, orderId: id });

    return NextResponse.json(data ?? { ok: true });
  } catch (error) {
    logger.error("Order PATCH critical failure", { error, requestId, orderId: id });
    return NextResponse.json({ message: "No pude conectar con la API principal." }, { status: 502 });
  }
}
