import { NextResponse, type NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { getToken } from "next-auth/jwt";
import { authOptions } from "@/lib/auth-options";
import {
  CENTRAL_API_URL,
  parseJsonRecord,
  type CentralApiRole,
} from "@/lib/central-api";
import { fetchCentralJson } from "@/lib/central-client";
import { extractErrorMessage } from "@/lib/adapters/orders.adapter";

type PaymentAuth = {
  userId: string;
  role: CentralApiRole;
  accessToken?: string | null;
};

type RouteContext = {
  params: Promise<{ id: string }>;
};

const MAX_RECEIPT_SIZE_BYTES = 5 * 1024 * 1024;

function cloneFormData(source: FormData) {
  const cloned = new FormData();

  for (const [key, value] of source.entries()) {
    cloned.append(key, value);
  }

  return cloned;
}

async function getPaymentAuth(request: NextRequest): Promise<PaymentAuth | null> {
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

export async function POST(request: NextRequest, context: RouteContext) {
  const auth = await getPaymentAuth(request);

  if (!auth || auth.role !== "CLIENTE") {
    return NextResponse.json({ message: "Debes iniciar sesion para subir el comprobante." }, { status: 401 });
  }

  if (!CENTRAL_API_URL) {
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

  const file = formData.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ message: "Debes adjuntar una imagen de comprobante." }, { status: 400 });
  }

  if (!file.type.startsWith("image/")) {
    return NextResponse.json({ message: "Solo se permiten imagenes como comprobante." }, { status: 400 });
  }

  if (file.size > MAX_RECEIPT_SIZE_BYTES) {
    return NextResponse.json({ message: "El comprobante no puede superar los 5 MB." }, { status: 400 });
  }

  try {
    const result = await fetchCentralJson([
      {
        path: `/pagos/${id}/upload-comprobante`,
        method: "POST",
        body: cloneFormData(formData),
      },
      {
        path: `/payments/${id}/upload-comprobante`,
        method: "POST",
        body: cloneFormData(formData),
      },
    ], auth);

    const data = parseJsonRecord(result.data);
    if (!result.response.ok) {
      return NextResponse.json(
        { message: extractErrorMessage(data, "No pude subir el comprobante en este momento.") }, 
        { status: result.response.status }
      );
    }

    return NextResponse.json(result.data);
  } catch {
    return NextResponse.json({ message: "No pude conectar con la API principal para subir el comprobante." }, { status: 502 });
  }
}
