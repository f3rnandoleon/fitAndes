import { NextResponse, type NextRequest } from "next/server";
import { CENTRAL_API_URL, parseJsonRecord } from "@/lib/central-api";
import { fetchCentralJson } from "@/lib/central-client";
import { getCheckoutAuth } from "@/lib/checkout/auth";
import { extractErrorMessage } from "@/lib/adapters/orders.adapter";
import { logger } from "@/lib/logger";
import { getRequestId } from "@/lib/request-context";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(request: NextRequest, context: RouteContext) {
  const requestId = await getRequestId();

  if (!CENTRAL_API_URL) {
    return NextResponse.json({ ok: false, message: "La API principal no está configurada." }, { status: 500 });
  }

  const { id } = await context.params;
  if (!id) {
    return NextResponse.json({ ok: false, message: "Falta el identificador del pedido." }, { status: 400 });
  }

  const auth = await getCheckoutAuth(request);
  const headerToken = request.headers.get("x-reservation-token")?.trim();

  let bodyToken: string | null = null;
  try {
    const body = (await request.json().catch(() => null)) as { token?: unknown } | null;
    if (typeof body?.token === "string" && body.token.trim()) {
      bodyToken = body.token.trim();
    }
  } catch {
    // Cuerpo vacío permitido si llega token por header o sesión
  }

  const reservationToken = bodyToken || headerToken || null;

  if (!reservationToken && !auth) {
    return NextResponse.json(
      { ok: false, message: "No autorizado para liberar esta reserva." },
      { status: 401 }
    );
  }

  try {
    const result = await fetchCentralJson(
      [
        {
          path: `/pedidos/${encodeURIComponent(id)}/expire-reservation`,
          method: "POST",
          body: JSON.stringify(reservationToken ? { token: reservationToken } : {}),
          headers: reservationToken ? { "x-reservation-token": reservationToken } : undefined,
        },
      ],
      auth,
      { requestId, timeoutMs: 8000 }
    );

    const data = parseJsonRecord(result.data);
    if (!result.response.ok) {
      logger.warn("POST /api/orders/[id]/expire-reservation failed", {
        status: result.response.status,
        requestId,
        orderId: id,
        error: data,
      });
      return NextResponse.json(
        {
          ok: false,
          code: typeof data?.code === "string" ? data.code : null,
          message: extractErrorMessage(data, "No pude liberar la reserva."),
        },
        { status: result.response.status }
      );
    }

    return NextResponse.json(result.data, { status: result.response.status });
  } catch (error) {
    logger.error("POST /api/orders/[id]/expire-reservation critical failure", { error, requestId, orderId: id });
    return NextResponse.json(
      { ok: false, message: "No pude conectar con el sistema central para liberar la reserva." },
      { status: 502 }
    );
  }
}
