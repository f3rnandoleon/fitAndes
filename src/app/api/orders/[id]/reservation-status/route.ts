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

export async function GET(request: NextRequest, context: RouteContext) {
  const requestId = await getRequestId();

  if (!CENTRAL_API_URL) {
    return NextResponse.json({ ok: false, message: "La API principal no está configurada." }, { status: 500 });
  }

  const { id } = await context.params;
  if (!id) {
    return NextResponse.json({ ok: false, message: "Falta el identificador del pedido." }, { status: 400 });
  }

  const auth = await getCheckoutAuth(request);
  const queryToken = request.nextUrl.searchParams.get("token")?.trim();
  const headerToken = request.headers.get("x-reservation-token")?.trim();
  const reservationToken = queryToken || headerToken || null;

  if (!reservationToken && !auth) {
    return NextResponse.json(
      { ok: false, valid: false, expired: true, message: "No autorizado para consultar esta reserva." },
      { status: 401, headers: { "Cache-Control": "no-store" } }
    );
  }

  const path = reservationToken
    ? `/pedidos/${encodeURIComponent(id)}/reservation-status?token=${encodeURIComponent(reservationToken)}`
    : `/pedidos/${encodeURIComponent(id)}/reservation-status`;

  try {
    const result = await fetchCentralJson(
      [
        {
          path,
          method: "GET",
          headers: reservationToken ? { "x-reservation-token": reservationToken } : undefined,
        },
      ],
      auth,
      { requestId, timeoutMs: 8000 }
    );

    const data = parseJsonRecord(result.data);
    if (!result.response.ok) {
      return NextResponse.json(
        {
          ok: false,
          valid: false,
          expired: result.response.status === 410 || result.response.status === 404,
          code: typeof data?.code === "string" ? data.code : null,
          message: extractErrorMessage(data, "No pude verificar el estado de tu reserva."),
        },
        { status: result.response.status, headers: { "Cache-Control": "no-store" } }
      );
    }

    return NextResponse.json(result.data, {
      status: result.response.status,
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    logger.error("GET /api/orders/[id]/reservation-status failed", { error, requestId, orderId: id });
    return NextResponse.json(
      { ok: false, message: "No pude conectar con el sistema central para validar tu reserva." },
      { status: 502, headers: { "Cache-Control": "no-store" } }
    );
  }
}
