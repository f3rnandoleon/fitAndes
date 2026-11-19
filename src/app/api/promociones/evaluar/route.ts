import { NextResponse, type NextRequest } from "next/server";
import { CENTRAL_API_URL, parseJsonRecord } from "@/lib/central-api";
import { fetchCentralJson } from "@/lib/central-client";
import { getCheckoutAuth } from "@/lib/checkout/auth";
import { extractErrorMessage } from "@/lib/adapters/orders.adapter";
import { getRequestId } from "@/lib/request-context";
import { logger } from "@/lib/logger";
import { normalizePricingSummary } from "@/types/promociones";

interface EvaluateItemInput {
  productoId?: string;
  varianteId?: string | null;
  variantId?: string | null;
  color?: string;
  talla?: string;
  cantidad?: number;
}

interface EvaluateRequestBody {
  items?: EvaluateItemInput[];
  cuponCodigo?: string | null;
  costoEnvio?: number;
  telefonoInvitado?: string | null;
}

export async function POST(request: NextRequest) {
  const requestId = await getRequestId();

  if (!CENTRAL_API_URL) {
    return NextResponse.json({ ok: false, message: "API central no configurada." }, { status: 500 });
  }

  let body: EvaluateRequestBody;
  try {
    body = (await request.json()) as EvaluateRequestBody;
  } catch {
    return NextResponse.json({ ok: false, message: "Datos inválidos." }, { status: 400 });
  }

  const rawItems = Array.isArray(body.items) ? body.items : [];
  const items = rawItems
    .filter((item) => item && typeof item.productoId === "string" && item.productoId.trim())
    .map((item) => ({
      productoId: String(item.productoId).trim(),
      varianteId: (item.varianteId ?? item.variantId ?? undefined) || undefined,
      color: typeof item.color === "string" ? item.color.trim() : "",
      talla: typeof item.talla === "string" ? item.talla.trim() : "",
      cantidad: typeof item.cantidad === "number" && item.cantidad > 0 ? Math.floor(item.cantidad) : 1,
    }));

  if (items.length === 0) {
    return NextResponse.json({ ok: false, message: "Agrega al menos un producto para evaluar." }, { status: 400 });
  }

  const auth = await getCheckoutAuth(request);
  const cuponCodigo = typeof body.cuponCodigo === "string" && body.cuponCodigo.trim()
    ? body.cuponCodigo.trim().toUpperCase()
    : undefined;
  const costoEnvio = typeof body.costoEnvio === "number" && Number.isFinite(body.costoEnvio) && body.costoEnvio >= 0
    ? body.costoEnvio
    : 0;
  const telefonoInvitado =
    !auth && typeof body.telefonoInvitado === "string" && body.telefonoInvitado.trim()
      ? body.telefonoInvitado.replace(/\D/g, "").trim()
      : undefined;

  const centralPayload: Record<string, unknown> = {
    items,
    costoEnvio,
  };
  if (cuponCodigo) centralPayload.cuponCodigo = cuponCodigo;
  if (telefonoInvitado) centralPayload.telefonoInvitado = telefonoInvitado;

  try {
    const result = await fetchCentralJson(
      [
        {
          path: "/public/promociones/evaluar",
          method: "POST",
          body: JSON.stringify(centralPayload),
        },
      ],
      auth?.role === "CLIENTE" ? auth : null,
      { requestId, timeoutMs: 8000 },
    );

    const record = parseJsonRecord(result.data);
    if (!result.response.ok) {
      return NextResponse.json(
        {
          ok: false,
          message: extractErrorMessage(record, "No pude evaluar las promociones en este momento."),
          cuponErrorCodigo: typeof record?.cuponErrorCodigo === "string" ? record.cuponErrorCodigo : typeof record?.code === "string" ? record.code : null,
        },
        { status: result.response.status },
      );
    }

    const resumenPrecios = normalizePricingSummary(result.data);
    return NextResponse.json({
      ok: true,
      resumenPrecios,
      raw: result.data,
    });
  } catch (error) {
    logger.warn("POST /api/promociones/evaluar failed", { error, requestId });
    return NextResponse.json(
      { ok: false, message: "No pude conectar con el sistema central para calcular promociones." },
      { status: 502 },
    );
  }
}
