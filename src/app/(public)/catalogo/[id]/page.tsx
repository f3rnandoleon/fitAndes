import Link from "next/link";
import { notFound } from "next/navigation";
import ProductoDetalleCliente from "@/components/catalogo/ProductoDetalleCliente";
import { filterCatalogAvailableVariants, type CatalogProduct } from "@/types/catalogo";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/productos/publicos/${id}`, {
      next: { revalidate: 60 },
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) return { title: "Producto | FitAndes" };
    const p = (await res.json()) as CatalogProduct;
    return { title: `${p.nombre} - ${p.modelo} | FitAndes` };
  } catch {
    return { title: "Producto | FitAndes" };
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

  const producto = filterCatalogAvailableVariants((await res.json()) as CatalogProduct);
  const colores = Array.from(new Set(producto.variantes.map((v) => v.color))) as string[];
  const tallas = Array.from(new Set(producto.variantes.map((v) => v.talla))) as string[];

  return (
    <main className="min-h-screen bg-[#fbf9f5] text-[#111111]">
      <div className="max-w-[1240px] mx-auto px-4 sm:px-6 py-6 sm:py-10">
        <div className="flex items-center gap-2 text-[11px] uppercase mb-8" style={{ letterSpacing: "0.16em", color: "#8f8478" }}>
          <Link href="/" className="transition-opacity hover:opacity-60">
            Home
          </Link>
          <span>{">"}</span>
          <Link href="/catalogo" className="transition-opacity hover:opacity-60">
            Catalogo
          </Link>
          <span>{">"}</span>
          <span style={{ color: "#d04d37" }}>{producto.nombre}</span>
        </div>

        <ProductoDetalleCliente producto={producto} colores={colores} tallas={tallas} />
      </div>
    </main>
  );
}
