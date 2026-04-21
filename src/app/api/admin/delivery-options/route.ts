import { NextResponse, type NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { getToken } from "next-auth/jwt";
import { authOptions } from "@/lib/auth-options";
import { buildCentralApiHeaders, type CentralApiRole } from "@/lib/central-api";
import type { DeliveryOptionsConfig } from "@/types/checkout";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? process.env.API_URL;

type DeliveryAdminAuth = {
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

async function getAdminAuth(request: NextRequest): Promise<DeliveryAdminAuth | null> {
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

export async function GET(request: NextRequest) {
  const auth = await getAdminAuth(request);
  if (!auth || auth.role !== "ADMIN") {
    return NextResponse.json({ message: "No tienes permisos para ver esta configuracion." }, { status: 403 });
  }

  if (!API_URL) {
    return NextResponse.json({ message: "La API principal no esta configurada." }, { status: 500 });
  }

  try {
    const response = await fetch(`${API_URL}/delivery-options`, {
      headers: buildCentralApiHeaders({ userId: auth.id, role: auth.role, accessToken: auth.accessToken }),
      cache: "no-store",
      signal: AbortSignal.timeout(10000),
    });
    const data = await response.json().catch(() => null);
    const parsed = parseJsonRecord(data);

    if (!response.ok) {
      return NextResponse.json(
        { message: extractErrorMessage(parsed, "No pude cargar la configuracion de entregas.") },
        { status: response.status },
      );
    }

    return NextResponse.json((data as DeliveryOptionsConfig | null) ?? null);
  } catch {
    return NextResponse.json({ message: "No pude consultar la configuracion de entregas." }, { status: 502 });
  }
}

export async function PATCH(request: NextRequest) {
  const auth = await getAdminAuth(request);
  if (!auth || auth.role !== "ADMIN") {
    return NextResponse.json({ message: "No tienes permisos para actualizar esta configuracion." }, { status: 403 });
  }

  if (!API_URL) {
    return NextResponse.json({ message: "La API principal no esta configurada." }, { status: 500 });
  }

  let payload: DeliveryOptionsConfig;
  try {
    payload = (await request.json()) as DeliveryOptionsConfig;
  } catch {
    return NextResponse.json({ message: "No pude leer la configuracion enviada." }, { status: 400 });
  }

  try {
    const response = await fetch(`${API_URL}/admin/delivery-options`, {
      method: "PATCH",
      headers: buildCentralApiHeaders({ userId: auth.id, role: auth.role, accessToken: auth.accessToken }, { includeJsonContentType: true }),
      body: JSON.stringify(payload),
      cache: "no-store",
    });
    const data = await response.json().catch(() => null);
    const parsed = parseJsonRecord(data);

    if (!response.ok) {
      return NextResponse.json(
        { message: extractErrorMessage(parsed, "No pude guardar la configuracion de entregas.") },
        { status: response.status },
      );
    }

    return NextResponse.json((data as DeliveryOptionsConfig | null) ?? payload);
  } catch {
    return NextResponse.json({ message: "No pude conectar con la API principal." }, { status: 502 });
  }
}
