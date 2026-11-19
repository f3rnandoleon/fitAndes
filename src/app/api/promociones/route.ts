import { NextResponse } from "next/server";
import { CENTRAL_API_URL } from "@/lib/central-api";
import { fetchCentralJson } from "@/lib/central-client";
import { getRequestId } from "@/lib/request-context";
import { logger } from "@/lib/logger";
import { unwrapPublicPromotions } from "@/types/promociones";

export async function GET() {
  const requestId = await getRequestId();

  if (!CENTRAL_API_URL) {
    return NextResponse.json({ promociones: [] });
  }

  try {
    const result = await fetchCentralJson(
      [{ path: "/public/promociones", method: "GET" }],
      null,
      { requestId, timeoutMs: 6000 },
    );

    if (!result.response.ok) {
      return NextResponse.json({ promociones: [] });
    }

    const promociones = unwrapPublicPromotions(result.data);
    return NextResponse.json({ promociones });
  } catch (error) {
    logger.warn("GET /api/promociones failed", { error, requestId });
    return NextResponse.json({ promociones: [] });
  }
}
