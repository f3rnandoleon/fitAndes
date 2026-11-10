import { NextResponse } from "next/server";
import { getSystemHealth } from "@/lib/system-health";

export const dynamic = "force-dynamic";

export async function GET() {
  const health = await getSystemHealth({ timeoutMs: 4000 });
  return NextResponse.json(health, {
    status: health.ok ? 200 : 503,
    headers: {
      "Cache-Control": "public, s-maxage=15, stale-while-revalidate=30",
    },
  });
}

