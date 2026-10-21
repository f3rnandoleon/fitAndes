import { NextResponse, type NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { getToken } from "next-auth/jwt";
import { authOptions } from "@/lib/auth-options";
import { CENTRAL_API_URL, parseJsonRecord, type CentralApiRole } from "@/lib/central-api";
import { fetchCentralJson } from "@/lib/central-client";
import { getRequestId } from "@/lib/request-context";
import { logger } from "@/lib/logger";

interface RouteParams {
  params: Promise<{ id: string }>;
}

async function getClientAuth(request: NextRequest) {
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

  if (!userId || role !== "CLIENTE") return null;
  return { userId, role, accessToken };
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  const requestId = await getRequestId();
  const auth = await getClientAuth(request);

  if (!auth) {
    return NextResponse.json({ message: "Debes iniciar sesión para consultar el seguimiento." }, { status: 401 });
  }

  if (!CENTRAL_API_URL) {
    return NextResponse.json({ message: "La API central no está configurada." }, { status: 500 });
  }

  const { id } = await params;
  if (!id) {
    return NextResponse.json({ message: "Identificador de pedido requerido." }, { status: 400 });
  }

  try {
    const result = await fetchCentralJson(
      [
        { path: `/entregas/${id}`, method: "GET" },
        { path: `/deliveries/${id}`, method: "GET" },
      ],
      auth,
      { requestId }
    );

    const data = parseJsonRecord(result.data);

    if (result.response.status === 404) {
      return NextResponse.json({ message: "No hay información logística asignada aún." }, { status: 404 });
    }

    if (!result.response.ok) {
      return NextResponse.json(
        { message: (typeof data?.message === "string" ? data.message : "No pudimos consultar el seguimiento.") },
        { status: result.response.status }
      );
    }

    return NextResponse.json(result.data);
  } catch (error) {
    logger.error("GET /api/orders/[id]/tracking failed", { error, requestId, orderId: id });
    return NextResponse.json({ message: "Error al consultar el seguimiento logístico." }, { status: 502 });
  }
}
