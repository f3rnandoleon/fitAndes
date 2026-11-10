import { NextResponse, type NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { getToken } from "next-auth/jwt";
import { authOptions } from "@/lib/auth-options";
import { CENTRAL_API_URL, parseJsonRecord, type CentralApiRole } from "@/lib/central-api";
import { fetchCentralJson } from "@/lib/central-client";
import { getRequestId } from "@/lib/request-context";
import { extractErrorMessage } from "@/lib/adapters/orders.adapter";
import { logger } from "@/lib/logger";

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

export async function POST(request: NextRequest) {
  const requestId = await getRequestId();
  const auth = await getCartAuth(request);

  if (!auth) {
    return NextResponse.json({ ok: false, message: "No autenticado" }, { status: 401 });
  }

  if (!CENTRAL_API_URL) {
    return NextResponse.json({ message: "API central no configurada." }, { status: 500 });
  }

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ message: "Datos inválidos." }, { status: 400 });
  }

  const payload = {
    productoId: body.productoId,
    varianteId: body.variantId || body.varianteId,
    color: body.color,
    colorSecundario: body.colorSecundario || undefined,
    talla: body.talla,
    cantidad: body.cantidad || 1,
  };

  try {
    const result = await fetchCentralJson(
      [
        { path: "/carrito/items", method: "POST", body: JSON.stringify(payload) },
        { path: "/cart/items", method: "POST", body: JSON.stringify(payload) },
      ],
      auth,
      { requestId }
    );

    const data = parseJsonRecord(result.data);
    if (!result.response.ok) {
      return NextResponse.json(
        { message: extractErrorMessage(data, "No pude agregar la prenda al carrito.") },
        { status: result.response.status }
      );
    }

    return NextResponse.json(result.data);
  } catch (error) {
    logger.error("POST /api/cart/items failed", { error, requestId });
    return NextResponse.json({ message: "Error al comunicar con el servidor." }, { status: 502 });
  }
}

