import { NextResponse, type NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { getToken } from "next-auth/jwt";
import { authOptions } from "@/lib/auth-options";
import { CENTRAL_API_URL, parseJsonRecord, type CentralApiRole } from "@/lib/central-api";
import { fetchCentralJson } from "@/lib/central-client";
import { extractErrorMessage } from "@/lib/adapters/orders.adapter";
import { getRequestId } from "@/lib/request-context";
import { logger } from "@/lib/logger";
import { getCouponErrorMessage, normalizePricingSummary } from "@/types/promociones";

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
    return NextResponse.json({ ok: false, message: "API central no configurada." }, { status: 500 });
  }

  let body: { codigo?: string };
  try {
    body = (await request.json()) as { codigo?: string };
  } catch {
    return NextResponse.json({ ok: false, message: "Datos inválidos." }, { status: 400 });
  }

  const codigo = typeof body.codigo === "string" ? body.codigo.trim().toUpperCase() : "";
  if (!codigo) {
    return NextResponse.json({ ok: false, message: "Ingresa un código de cupón válido." }, { status: 400 });
  }

  try {
    const result = await fetchCentralJson(
      [
        {
          path: "/carrito/cupon",
          method: "POST",
          body: JSON.stringify({ codigo }),
        },
      ],
      auth,
      { requestId, timeoutMs: 8000 },
    );

    const record = parseJsonRecord(result.data);
    const cartRecord = parseJsonRecord(record?.cart) ?? parseJsonRecord(record?.carrito);
    const resumenPrecios =
      normalizePricingSummary(cartRecord?.resumenPrecios ?? cartRecord ?? record?.resumenPrecios ?? record);

    if (!result.response.ok) {
      const errorCode =
        (typeof record?.cuponErrorCodigo === "string" && record.cuponErrorCodigo) ||
        (typeof record?.code === "string" && record.code) ||
        resumenPrecios?.cuponErrorCodigo ||
        null;
      const serverMsg = extractErrorMessage(record, "");
      return NextResponse.json(
        {
          ok: false,
          cuponErrorCodigo: errorCode,
          message: getCouponErrorMessage(errorCode, serverMsg || resumenPrecios?.cuponErrorMensaje),
          resumenPrecios,
        },
        { status: result.response.status },
      );
    }

    if (resumenPrecios?.cuponValido === false) {
      return NextResponse.json(
        {
          ok: false,
          cuponErrorCodigo: resumenPrecios.cuponErrorCodigo ?? null,
          message: getCouponErrorMessage(resumenPrecios.cuponErrorCodigo, resumenPrecios.cuponErrorMensaje),
          resumenPrecios,
        },
        { status: 400 },
      );
    }

    const appliedCode =
      (typeof cartRecord?.cuponCodigo === "string" && cartRecord.cuponCodigo.trim()) ||
      resumenPrecios?.cuponCodigo ||
      codigo;

    return NextResponse.json({
      ok: true,
      message: typeof record?.message === "string" ? record.message : "Cupón aplicado correctamente.",
      cuponCodigo: appliedCode,
      resumenPrecios,
    });
  } catch (error) {
    logger.error("POST /api/cart/cupon failed", { error, requestId });
    return NextResponse.json({ ok: false, message: "Error al validar el cupón." }, { status: 502 });
  }
}

export async function DELETE(request: NextRequest) {
  const requestId = await getRequestId();
  const auth = await getCartAuth(request);

  if (!auth) {
    return NextResponse.json({ ok: false, message: "No autenticado" }, { status: 401 });
  }

  if (!CENTRAL_API_URL) {
    return NextResponse.json({ ok: false, message: "API central no configurada." }, { status: 500 });
  }

  try {
    const result = await fetchCentralJson(
      [{ path: "/carrito/cupon", method: "DELETE" }],
      auth,
      { requestId, timeoutMs: 8000 },
    );

    const record = parseJsonRecord(result.data);
    const cartRecord = parseJsonRecord(record?.cart) ?? parseJsonRecord(record?.carrito);
    const resumenPrecios =
      normalizePricingSummary(cartRecord?.resumenPrecios ?? cartRecord ?? record?.resumenPrecios ?? record);

    if (!result.response.ok && result.response.status !== 404) {
      return NextResponse.json(
        { ok: false, message: extractErrorMessage(record, "No pude quitar el cupón del carrito.") },
        { status: result.response.status },
      );
    }

    return NextResponse.json({
      ok: true,
      message: typeof record?.message === "string" ? record.message : "Cupón removido.",
      cuponCodigo: null,
      resumenPrecios,
    });
  } catch (error) {
    logger.error("DELETE /api/cart/cupon failed", { error, requestId });
    return NextResponse.json({ ok: false, message: "Error al quitar el cupón." }, { status: 502 });
  }
}
