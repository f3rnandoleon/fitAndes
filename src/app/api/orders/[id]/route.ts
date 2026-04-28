import { NextResponse, type NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { getToken } from "next-auth/jwt";
import { authOptions } from "@/lib/auth-options";
import {
  buildCentralApiHeaders,
  CENTRAL_API_URL,
  fetchCentralApiWithFallback,
  parseJsonRecord,
  readString,
  type CentralApiRole,
} from "@/lib/central-api";
import { firstZodIssueMessage } from "@/lib/schemas/common";
import { orderPatchSchema } from "@/lib/schemas/order.schema";

type OrderAuth = {
  id: string;
  role: CentralApiRole;
  accessToken?: string | null;
};

function extractErrorMessage(data: Record<string, unknown> | null, fallback: string) {
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

function buildCentralDeliveryPayload(source: Record<string, unknown>) {
  const metodo = readString(source, "metodo", "method");
  if (!metodo) return null;

  if (metodo === "PICKUP_POINT") {
    return {
      metodo,
      direccion: readString(source, "direccion", "address", "puntoRecojo"),
      telefono: readString(source, "telefono", "phone"),
      nombreDestinatario: readString(source, "nombreDestinatario", "recipientName"),
      programadoPara: readString(source, "programadoPara", "scheduledAt"),
    };
  }

  if (metodo === "SHIPPING_NATIONAL") {
    return {
      metodo,
      departamento: readString(source, "departamento", "department"),
      ciudad: readString(source, "ciudad", "city"),
      empresaEnvio: readString(source, "empresaEnvio", "shippingCompany"),
      sucursal: readString(source, "sucursal", "branch"),
      nombreDestinatario: readString(source, "nombreDestinatario", "recipientName"),
      nombreRemitente: readString(source, "nombreRemitente", "senderName"),
      ciRemitente: readString(source, "ciRemitente", "senderCI"),
      telefonoRemitente: readString(source, "telefonoRemitente", "senderPhone"),
    };
  }

  return { metodo };
}

function buildCanonicalOrderPatchPayload(payload: unknown) {
  const source = parseJsonRecord(payload);
  if (!source) return null;

  const canonical: Record<string, unknown> = {};
  const estadoPedido = readString(source, "estadoPedido", "orderStatus");
  if (estadoPedido) {
    canonical.estadoPedido = estadoPedido;
  }

  const entregaSource =
    parseJsonRecord(source.entrega) ??
    parseJsonRecord(source.deliverySnapshot) ??
    parseJsonRecord(source.delivery);

  if (entregaSource) {
    const entrega = buildCentralDeliveryPayload(entregaSource);
    if (entrega) {
      canonical.entrega = entrega;
    }
  }

  return Object.keys(canonical).length > 0 ? canonical : source;
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await getOrderAuth(request);
  if (!auth || auth.role !== "CLIENTE") {
    return NextResponse.json({ message: "Debes iniciar sesion para actualizar el pedido." }, { status: 401 });
  }

  if (!CENTRAL_API_URL) {
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

  const parsedPayload = orderPatchSchema.safeParse(payload);
  if (!parsedPayload.success) {
    return NextResponse.json({ message: firstZodIssueMessage(parsedPayload.error) }, { status: 400 });
  }

  const headers = buildCentralApiHeaders(
    { userId: auth.id, role: auth.role, accessToken: auth.accessToken },
    { includeJsonContentType: true },
  );

  const validatedPayload = parsedPayload.data;
  const canonicalPayload = buildCanonicalOrderPatchPayload(validatedPayload);

  try {
    const result = await fetchCentralApiWithFallback([
      {
        path: `/pedidos/${id}`,
        init: {
          method: "PATCH",
          headers,
          body: JSON.stringify(canonicalPayload ?? validatedPayload),
        },
      },
      {
        path: `/pedidos/${id}`,
        init: {
          method: "PATCH",
          headers,
          body: JSON.stringify(validatedPayload),
        },
      },
      {
        path: `/orders/${id}`,
        init: {
          method: "PATCH",
          headers,
          body: JSON.stringify(validatedPayload),
        },
      },
    ]);

    const data = parseJsonRecord(result.data);
    if (!result.response.ok) {
      return NextResponse.json(
        { message: extractErrorMessage(data, "No pude actualizar el pedido.") },
        { status: result.response.status },
      );
    }

    return NextResponse.json(data ?? { ok: true });
  } catch {
    return NextResponse.json({ message: "No pude conectar con la API principal." }, { status: 502 });
  }
}
