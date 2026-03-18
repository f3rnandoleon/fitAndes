import Link from "next/link";
import { notFound } from "next/navigation";
import ProductoDetalleCliente from "@/components/catalogo/ProductoDetalleCliente";

interface VarianteProducto {
  color: string;
  talla: string;
  stock: number;
  imagen?: string;
  imagenes?: string[];
}

interface ProductoDetalle {
  nombre: string;
  modelo: string;
  precioVenta: number;
  sku?: string;
  imagen?: string;
  imagenes?: string[];
  variantes: VarianteProducto[];
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/productos/publicos/${id}`, {
      next: { revalidate: 60 },
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) return { title: "Producto | ControlVentas" };
    const p = await res.json();
    return { title: `${p.nombre} - ${p.modelo} | ControlVentas` };
  } catch {
    return { title: "Producto | ControlVentas" };
  }
}

export default async function ProductoDetallePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  let res: Response;

  try {
    res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/productos/publicos/${id}`, {
      next: { revalidate: 60 },
      signal: AbortSignal.timeout(10000),
    });
  } catch {
    notFound();
  }

  if (!res.ok) notFound();

  const producto = (await res.json()) as ProductoDetalle;
  const colores = Array.from(new Set(producto.variantes.map((v) => v.color))) as string[];
  const tallas = Array.from(new Set(producto.variantes.map((v) => v.talla))) as string[];

  return (
    <main className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      <div className="border-b sticky top-0 z-10" style={{ borderColor: "var(--border)", background: "rgba(245,242,238,0.92)", backdropFilter: "blur(6px)" }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between gap-4">
          <Link
            href="/"
            className="text-lg sm:text-2xl uppercase font-bold"
            style={{ fontFamily: "Georgia, 'Times New Roman', serif", letterSpacing: "0.2em" }}
          >
            ControlVentas
          </Link>
          <Link href="/catalogo" className="text-xs uppercase hover:opacity-55 transition-opacity" style={{ letterSpacing: "0.16em" }}>
            Catalogo
          </Link>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
        <div className="flex items-center gap-2 text-sm mb-8" style={{ color: "var(--subtle)" }}>
          <Link href="/catalogo" className="hover:opacity-60 transition-opacity" style={{ color: "var(--muted)" }}>
            Catalogo
          </Link>
          <span>/</span>
          <span style={{ color: "var(--foreground)" }}>{producto.nombre}</span>
        </div>
        <ProductoDetalleCliente producto={producto} colores={colores} tallas={tallas} />
      </div>
    </main>
  );
}
