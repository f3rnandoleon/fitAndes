import { NextResponse, type NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { getToken } from "next-auth/jwt";
import { authOptions } from "@/lib/auth-options";
import { buildCentralApiHeaders, type CentralApiRole } from "@/lib/central-api";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? process.env.API_URL;

type OrderAuth = {
  id: string;
  role: CentralApiRole;
  accessToken?: string | null;
};

type JsonRecord = Record<string, unknown>;

function parseJsonRecord(data: unknown): JsonRecord | null {
  return data && typeof data === "object" ? (data as JsonRecord) : null;
}

function extractErrorMessage(data: JsonRecord | null, fallback: string) {
  const errors = data?.errors;
  if (Array.isArray(errors)) {
    const firstError = errors.find((error) => error && typeof error === "object") as { message?: unknown } | undefined;
    if (typeof firstError?.message === "string") return firstError.message;
  }

  if (typeof data?.message === "string") return data.message;
  if (typeof data?.error === "string") return data.error;
  return fallback;
}

async function getOrderAuth(request: NextRequest): Promise<OrderAuth | null> {
  const session = await getServerSession(authOptions);

  if (session?.user?.id && session.user.role) {
    return {
      id: session.user.id,
      role: session.user.role,
      accessToken: session.accessToken ?? null,
    };
  }

  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
  if (!token || typeof token.id !== "string" || typeof token.role !== "string") {
    return null;
  }

  return {
    id: token.id,
    role: token.role as CentralApiRole,
    accessToken: typeof token.accessToken === "string" ? token.accessToken : null,
  };
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await getOrderAuth(request);
  if (!auth || auth.role !== "CLIENTE") {
    return NextResponse.json({ message: "Debes iniciar sesion para actualizar el pedido." }, { status: 401 });
  }

  if (!API_URL) {
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

  try {
    const response = await fetch(`${API_URL}/orders/${id}`, {
      method: "PATCH",
      headers: buildCentralApiHeaders(
        { userId: auth.id, role: auth.role, accessToken: auth.accessToken },
        { includeJsonContentType: true },
      ),
      body: JSON.stringify(payload),
      cache: "no-store",
    });

    const data = parseJsonRecord(await response.json().catch(() => null));
    if (!response.ok) {
      return NextResponse.json(
        { message: extractErrorMessage(data, "No pude actualizar el pedido.") },
        { status: response.status },
      );
    }

    return NextResponse.json(data ?? { ok: true });
  } catch {
    return NextResponse.json({ message: "No pude conectar con la API principal." }, { status: 502 });
  }
}
