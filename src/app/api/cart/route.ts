import { NextResponse, type NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { getToken } from "next-auth/jwt";
import { authOptions } from "@/lib/auth-options";
import { CENTRAL_API_URL, parseJsonRecord, type CentralApiRole } from "@/lib/central-api";
import { fetchCentralJson } from "@/lib/central-client";
import { getRequestId } from "@/lib/request-context";
import { logger } from "@/lib/logger";

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

export async function GET(request: NextRequest) {
  const requestId = await getRequestId();
  const auth = await getCartAuth(request);

  if (!auth) {
    return NextResponse.json({ items: [], totalItems: 0, subtotal: 0 });
  }

  if (!CENTRAL_API_URL) {
    return NextResponse.json({ message: "API central no configurada." }, { status: 500 });
  }

  try {
    const result = await fetchCentralJson(
      [
        { path: "/carrito", method: "GET" },
        { path: "/cart", method: "GET" },
      ],
      auth,
      { requestId }
    );

    if (result.response.status === 404) {
      return NextResponse.json({ items: [], totalItems: 0, subtotal: 0 });
    }

    if (!result.response.ok) {
      return NextResponse.json(
        { message: "No pude consultar el carrito del servidor." },
        { status: result.response.status }
      );
    }

    const data = parseJsonRecord(result.data);
    const rawItems = Array.isArray(data?.items) ? (data.items as Array<Record<string, unknown>>) : [];

    const mappedItems = rawItems.map((raw) => {
      const variante = (raw.variante as Record<string, unknown>) || {};
      const snapshot = (raw.productoSnapshot as Record<string, unknown>) || {};
      const productoId = String(raw.productoId || "");
      const variantId = variante.varianteId ? String(variante.varianteId) : null;
      const color = String(variante.color || "");
      const colorSecundario = variante.colorSecundario ? String(variante.colorSecundario) : null;
      const talla = String(variante.talla || "");
      const cantidad = typeof raw.cantidad === "number" ? raw.cantidad : 1;
      const precio = typeof raw.precioUnitario === "number" ? raw.precioUnitario : 0;
      const cartItemId = raw._id ? String(raw._id) : undefined;

      return {
        id: `${productoId}-${variantId || color + "-" + talla}`,
        productoId,
        variantId,
        cartItemId,
        nombre: String(snapshot.nombre || "Prenda"),
        modelo: snapshot.modelo ? String(snapshot.modelo) : undefined,
        imagen: snapshot.imagen ? String(snapshot.imagen) : null,
        color,
        colorSecundario,
        talla,
        cantidad,
        precio,
        stockDisponible: 99,
      };
    });

    return NextResponse.json({
      _id: data?._id,
      items: mappedItems,
      totalItems: mappedItems.reduce((acc, i) => acc + i.cantidad, 0),
      subtotal: typeof data?.subtotal === "number" ? data.subtotal : 0,
    });
  } catch (error) {
    logger.error("GET /api/cart failed", { error, requestId });
    return NextResponse.json({ message: "Error al consultar carrito." }, { status: 502 });
  }
}

export async function DELETE(request: NextRequest) {
  const requestId = await getRequestId();
  const auth = await getCartAuth(request);

  if (!auth) {
    return NextResponse.json({ ok: true });
  }

  try {
    const result = await fetchCentralJson(
      [
        { path: "/carrito", method: "DELETE" },
        { path: "/cart", method: "DELETE" },
      ],
      auth,
      { requestId }
    );

    return NextResponse.json({ ok: result.response.ok });
  } catch (error) {
    logger.error("DELETE /api/cart failed", { error, requestId });
    return NextResponse.json({ message: "Error al vaciar carrito." }, { status: 502 });
  }
}

