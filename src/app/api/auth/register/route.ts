import { NextResponse, type NextRequest } from "next/server";
import { CENTRAL_API_URL, parseJsonRecord } from "@/lib/central-api";
import { extractErrorMessage } from "@/lib/adapters/orders.adapter";
import { logger } from "@/lib/logger";
import { getRequestId } from "@/lib/request-context";

interface RegisterBody {
  nombreCompleto?: string;
  fullname?: string;
  email?: string;
  password?: string;
}

export async function POST(request: NextRequest) {
  const requestId = await getRequestId();

  if (!CENTRAL_API_URL) {
    return NextResponse.json({ message: "La API principal no está configurada." }, { status: 500 });
  }

  let body: RegisterBody;
  try {
    body = (await request.json()) as RegisterBody;
  } catch {
    return NextResponse.json({ message: "Formato de datos no válido." }, { status: 400 });
  }

  const nombreCompleto = (body.nombreCompleto ?? body.fullname ?? "").trim();
  const email = (body.email ?? "").trim().toLowerCase();
  const password = body.password ?? "";

  if (!nombreCompleto || !email || !password) {
    return NextResponse.json({ message: "Todos los campos son obligatorios." }, { status: 400 });
  }

  if (password.length < 6) {
    return NextResponse.json({ message: "La contraseña debe tener al menos 6 caracteres." }, { status: 400 });
  }

  try {
    const res = await fetch(`${CENTRAL_API_URL}/auth/signup`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-request-id": requestId,
      },
      cache: "no-store",
      body: JSON.stringify({
        nombreCompleto,
        email,
        password,
      }),
      signal: AbortSignal.timeout(10000),
    });

    const data = parseJsonRecord(await res.json().catch(() => null));

    if (res.status === 409) {
      return NextResponse.json(
        { message: extractErrorMessage(data, "Este correo ya está registrado.") },
        { status: 409 }
      );
    }

    if (!res.ok) {
      return NextResponse.json(
        { message: extractErrorMessage(data, "No pudimos crear tu cuenta.") },
        { status: res.status }
      );
    }

    return NextResponse.json(data ?? { message: "Usuario creado exitosamente" }, { status: 201 });
  } catch (error) {
    logger.error("POST /api/auth/register failed", { error, requestId, email });
    return NextResponse.json({ message: "No pudimos conectar con el servidor central." }, { status: 502 });
  }
}
