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

export async function GET(request: NextRequest) {
  const requestId = await getRequestId();
  const auth = await getClientAuth(request);

  if (!auth) {
    return NextResponse.json({ message: "Debes iniciar sesion." }, { status: 401 });
  }

  if (!CENTRAL_API_URL) {
    return NextResponse.json({ message: "La API central no esta configurada." }, { status: 500 });
  }

  try {
    const result = await fetchCentralJson(
      [
        { path: "/clientes/me/direcciones", method: "GET" },
        { path: "/customers/me/addresses", method: "GET" },
      ],
      auth,
      { requestId }
    );

    const data = parseJsonRecord(result.data);
    if (!result.response.ok) {
      return NextResponse.json(
        { message: extractErrorMessage(data, "No pude cargar tus direcciones.") },
        { status: result.response.status }
      );
    }

    return NextResponse.json(result.data ?? []);
  } catch (error) {
    logger.error("GET /api/clientes/me/direcciones failed", { error, requestId, userId: auth.userId });
    return NextResponse.json({ message: "No pude conectar con la API central." }, { status: 502 });
  }
}

export async function POST(request: NextRequest) {
  const requestId = await getRequestId();
  const auth = await getClientAuth(request);

  if (!auth) {
    return NextResponse.json({ message: "Debes iniciar sesion." }, { status: 401 });
  }

  if (!CENTRAL_API_URL) {
    return NextResponse.json({ message: "La API central no esta configurada." }, { status: 500 });
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ message: "Datos de direccion invalidos." }, { status: 400 });
  }

  try {
    const result = await fetchCentralJson(
      [
        {
          path: "/clientes/me/direcciones",
          method: "POST",
          body: JSON.stringify(payload),
        },
        {
          path: "/customers/me/addresses",
          method: "POST",
          body: JSON.stringify(payload),
        },
      ],
      auth,
      { requestId }
    );

    const data = parseJsonRecord(result.data);
    if (!result.response.ok) {
      return NextResponse.json(
        { message: extractErrorMessage(data, "No pude guardar la direccion.") },
        { status: result.response.status }
      );
    }

    return NextResponse.json(result.data, { status: 201 });
  } catch (error) {
    logger.error("POST /api/clientes/me/direcciones failed", { error, requestId, userId: auth.userId });
    return NextResponse.json({ message: "No pude conectar con la API central." }, { status: 502 });
  }
}
