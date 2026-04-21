import { NextResponse, type NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { getToken } from "next-auth/jwt";
import { authOptions } from "@/lib/auth-options";
import { buildCentralApiHeaders, type CentralApiRole } from "@/lib/central-api";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

type PaymentAuth = {
  id: string;
  role: CentralApiRole;
  accessToken?: string | null;
};

type RouteContext = {
  params: Promise<{ id: string }>;
};

async function getPaymentAuth(request: NextRequest): Promise<PaymentAuth | null> {
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

export async function POST(request: NextRequest, context: RouteContext) {
  const auth = await getPaymentAuth(request);

  if (!auth || auth.role !== "CLIENTE") {
    return NextResponse.json({ message: "Debes iniciar sesion para subir el comprobante." }, { status: 401 });
  }

  if (!API_URL) {
    return NextResponse.json({ message: "La API principal no esta configurada." }, { status: 500 });
  }

  const { id } = await context.params;
  if (!id) {
    return NextResponse.json({ message: "No se encontro la transaccion de pago." }, { status: 400 });
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ message: "No pude leer el archivo enviado." }, { status: 400 });
  }

  try {
    const response = await fetch(`${API_URL}/payments/${id}/upload-comprobante`, {
      method: "POST",
      headers: buildCentralApiHeaders({
        userId: auth.id,
        role: auth.role,
        accessToken: auth.accessToken,
      }),
      body: formData,
      cache: "no-store",
    });

    const data = await response.json().catch(() => null);
    if (!response.ok) {
      const message =
        (data && typeof data === "object" && "message" in data && typeof data.message === "string" && data.message) ||
        "No pude subir el comprobante en este momento.";

      return NextResponse.json({ message }, { status: response.status });
    }

    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ message: "No pude conectar con la API principal para subir el comprobante." }, { status: 502 });
  }
}
