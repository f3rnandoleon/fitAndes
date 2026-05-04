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
      <div className="max-w-[1240px] mx-auto px-4 sm:px-6 py-5 sm:py-8 lg:py-10">
        <div className="mb-6 flex flex-wrap items-center gap-2 text-[10px] uppercase sm:mb-8" style={{ letterSpacing: "0.16em", color: "#8f8478" }}>
          <Link href="/" className="transition-opacity hover:opacity-60">
            Inicio
          </Link>
          <span>{">"}</span>
          <Link href="/catalogo" className="transition-opacity hover:opacity-60">
            Catálogo
          </Link>
          <span>{">"}</span>
          <span className="max-w-[14rem] truncate sm:max-w-none" style={{ color: "#d04d37" }}>{producto.nombre}</span>
        </div>

        <section className="mb-8 rounded-[28px] border px-5 py-5 sm:px-6 sm:py-6" style={{ borderColor: "#ece6dc", background: "linear-gradient(135deg, #f9f5ef 0%, #f4ede3 100%)" }}>
          <p className="text-[10px] uppercase mb-3" style={{ letterSpacing: "0.22em", color: "#8f8478" }}>
            Detalle de producto
          </p>
          <h1 className="text-2xl leading-tight sm:text-3xl" style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}>
            Mira la prenda, elige variante y reserva.
          </h1>
        </section>

        <ProductoDetalleCliente producto={producto} colores={colores} tallas={tallas} />
      </div>
    </main>
  );
}
