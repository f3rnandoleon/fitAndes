import { NextResponse, type NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { getToken } from "next-auth/jwt";
import { authOptions } from "@/lib/auth-options";
import { CENTRAL_API_URL, parseJsonRecord, type CentralApiRole } from "@/lib/central-api";
import { fetchCentralJson } from "@/lib/central-client";
import { extractErrorMessage } from "@/lib/adapters/orders.adapter";
import { getRequestId } from "@/lib/request-context";
import { logger } from "@/lib/logger";

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

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const requestId = await getRequestId();
  const auth = await getClientAuth(request);

  if (!auth) {
    return NextResponse.json({ message: "Debes iniciar sesion." }, { status: 401 });
  }

  const { id } = await params;
  if (!id) {
    return NextResponse.json({ message: "Identificador de direccion requerido." }, { status: 400 });
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ message: "Datos invalidos." }, { status: 400 });
  }

  try {
    const result = await fetchCentralJson(
      [
        {
          path: `/clientes/me/direcciones/${id}`,
          method: "PATCH",
          body: JSON.stringify(payload),
        },
        {
          path: `/clientes/me/direcciones/${id}`,
          method: "PUT",
          body: JSON.stringify(payload),
        },
      ],
      auth,
      { requestId }
    );

    const data = parseJsonRecord(result.data);
    if (!result.response.ok) {
      return NextResponse.json(
        { message: extractErrorMessage(data, "No pude actualizar la direccion.") },
        { status: result.response.status }
      );
    }

    return NextResponse.json(result.data);
  } catch (error) {
    logger.error("PATCH /api/clientes/me/direcciones/:id failed", { error, requestId, id });
    return NextResponse.json({ message: "No pude conectar con la API central." }, { status: 502 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const requestId = await getRequestId();
  const auth = await getClientAuth(request);

  if (!auth) {
    return NextResponse.json({ message: "Debes iniciar sesion." }, { status: 401 });
  }

  const { id } = await params;
  if (!id) {
    return NextResponse.json({ message: "Identificador de direccion requerido." }, { status: 400 });
  }

  try {
    const result = await fetchCentralJson(
      [
        {
          path: `/clientes/me/direcciones/${id}`,
          method: "DELETE",
        },
      ],
      auth,
      { requestId }
    );

    const data = parseJsonRecord(result.data);
    if (!result.response.ok) {
      return NextResponse.json(
        { message: extractErrorMessage(data, "No pude eliminar la direccion.") },
        { status: result.response.status }
      );
    }

    return NextResponse.json({ ok: true, message: "Direccion eliminada correctamente." });
  } catch (error) {
    logger.error("DELETE /api/clientes/me/direcciones/:id failed", { error, requestId, id });
    return NextResponse.json({ message: "No pude conectar con la API central." }, { status: 502 });
  }
}
