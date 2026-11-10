import { NextResponse, type NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { getToken } from "next-auth/jwt";
import { authOptions } from "@/lib/auth-options";
import { parseJsonRecord, type CentralApiRole } from "@/lib/central-api";
import { fetchCentralJson } from "@/lib/central-client";
import { getRequestId } from "@/lib/request-context";
import { extractErrorMessage } from "@/lib/adapters/orders.adapter";
import { logger } from "@/lib/logger";

interface RouteParams {
  params: Promise<{ id: string }>;
}

async function getCartAuth(request: NextRequest) {
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

export async function PUT(request: NextRequest, { params }: RouteParams) {
  const requestId = await getRequestId();
  const auth = await getCartAuth(request);
  const { id } = await params;

  if (!auth) {
    return NextResponse.json({ ok: false, message: "No autenticado" }, { status: 401 });
  }

  let body: { cantidad?: number };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: "Datos inválidos." }, { status: 400 });
  }

  try {
    const result = await fetchCentralJson(
      [
        {
          path: `/carrito/items/${id}`,
          method: "PUT",
          body: JSON.stringify({ cantidad: body.cantidad ?? 1 }),
        },
        {
          path: `/cart/items/${id}`,
          method: "PUT",
          body: JSON.stringify({ cantidad: body.cantidad ?? 1 }),
        },
      ],
      auth,
      { requestId }
    );

    const data = parseJsonRecord(result.data);
    if (!result.response.ok) {
      return NextResponse.json(
        { message: extractErrorMessage(data, "No pude actualizar la cantidad.") },
        { status: result.response.status }
      );
    }

    return NextResponse.json(result.data);
  } catch (error) {
    logger.error("PUT /api/cart/items/[id] failed", { error, requestId, id });
    return NextResponse.json({ message: "Error al actualizar ítem." }, { status: 502 });
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const requestId = await getRequestId();
  const auth = await getCartAuth(request);
  const { id } = await params;

  if (!auth) {
    return NextResponse.json({ ok: false, message: "No autenticado" }, { status: 401 });
  }

  try {
    const result = await fetchCentralJson(
      [
        { path: `/carrito/items/${id}`, method: "DELETE" },
        { path: `/cart/items/${id}`, method: "DELETE" },
      ],
      auth,
      { requestId }
    );

    const data = parseJsonRecord(result.data);
    if (!result.response.ok) {
      return NextResponse.json(
        { message: extractErrorMessage(data, "No pude remover el ítem.") },
        { status: result.response.status }
      );
    }

    return NextResponse.json(result.data);
  } catch (error) {
    logger.error("DELETE /api/cart/items/[id] failed", { error, requestId, id });
    return NextResponse.json({ message: "Error al eliminar ítem." }, { status: 502 });
  }
}

