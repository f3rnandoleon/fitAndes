import { NextResponse } from "next/server";
import type { DeliveryOptionsConfig } from "@/types/checkout";
import { EMPTY_DELIVERY_OPTIONS } from "@/lib/delivery-options";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? process.env.API_URL;

export async function GET() {
  if (!API_URL) {
    return NextResponse.json({ message: "La API principal no esta configurada." }, { status: 500 });
  }

  try {
    const response = await fetch(`${API_URL}/delivery-options`, {
      cache: "no-store",
      signal: AbortSignal.timeout(10000),
    });

    const data = (await response.json().catch(() => null)) as DeliveryOptionsConfig | { message?: string } | null;
    if (!response.ok) {
      return NextResponse.json(
        { message: (data && "message" in data && data.message) || "No pude cargar las opciones de entrega." },
        { status: response.status },
      );
    }

    return NextResponse.json((data as DeliveryOptionsConfig) ?? EMPTY_DELIVERY_OPTIONS);
  } catch {
    return NextResponse.json({ message: "No pude consultar las opciones de entrega." }, { status: 502 });
  }
}
