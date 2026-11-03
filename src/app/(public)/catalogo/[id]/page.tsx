import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import ProductoDetalleCliente from "@/components/catalogo/ProductoDetalleCliente";
import { imagenesDeProducto } from "@/lib/catalogo-imagenes";
import { formatPrice } from "@/lib/format";
import { SITE_URL } from "@/lib/constants";
import {
  filterCatalogAvailableVariants,
  unwrapCatalogProducts,
  type CatalogProduct,
} from "@/types/catalogo";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || process.env.API_URL || "https://control-ventas-azure.vercel.app/api";
  try {
    const res = await fetch(`${baseUrl}/productos/publicos/${id}`, {
      next: { revalidate: 60 },
      signal: AbortSignal.timeout(6000),
    });
    if (!res.ok) return { title: "Prenda de Calidad | FitAndes" };
    const p = (await res.json()) as CatalogProduct;
    const fotos = imagenesDeProducto(p);
    const title = `${p.nombre} - ${p.modelo} | FitAndes`;
    const description = `${p.modelo} de FitAndes. Calidad boliviana garantizada con materiales nobles. Disponible para entrega inmediata y despacho nacional.`;

    return {
      title,
      description,
      openGraph: {
        title,
        description,
        url: `${SITE_URL}/catalogo/${id}`,
        images: fotos.length > 0 ? [{ url: fotos[0], width: 800, height: 1000, alt: p.nombre }] : [],
      },
      twitter: {
        card: "summary_large_image",
        title,
        description,
        images: fotos.length > 0 ? [fotos[0]] : [],
      },
    };
  } catch {
    return { title: "Prenda de Calidad | FitAndes" };
  }
}

async function getProductosRelacionados(id: string, categoria?: string | null): Promise<CatalogProduct[]> {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || process.env.API_URL || "https://control-ventas-azure.vercel.app/api";

  // 1. Intentar endpoint oficial de prendas relacionadas
  try {
    const res = await fetch(`${baseUrl}/productos/publicos/${id}/relacionados`, {
      next: { revalidate: 120 },
      signal: AbortSignal.timeout(5000),
    });
    if (res.ok) {
      const data = await res.json();
      const items = Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : [];
      if (items.length > 0) return items.slice(0, 4);
    }
  } catch {
    // Fallback silencioso
  }

  // 2. Fallback: buscar prendas de la misma categoría
  if (!categoria) return [];
  try {
    const res = await fetch(
      `${baseUrl}/productos/publicos?categoria=${encodeURIComponent(categoria)}&soloDisponible=true&limit=6`,
      {
        next: { revalidate: 120 },
        signal: AbortSignal.timeout(5000),
      }
    );
    if (res.ok) {
      const data = await res.json();
      const items = unwrapCatalogProducts(data);
      return items.filter((p) => p._id !== id).slice(0, 4);
    }
  } catch {
    return [];
  }
  return [];
}

export default async function ProductoDetallePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { id } = await params;
  const { color, talla } = await searchParams;
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || process.env.API_URL || "https://control-ventas-azure.vercel.app/api";
  let res: Response;

  try {
    res = await fetch(`${baseUrl}/productos/publicos/${id}`, {
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
  const fotos = imagenesDeProducto(producto);

  // Obtener productos relacionados
  const relacionados = await getProductosRelacionados(producto._id, producto.categoria);

  // Datos estructurados JSON-LD para motores de búsqueda
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: `${producto.nombre} - ${producto.modelo}`,
    image: fotos[0] || undefined,
    description: `${producto.nombre} - ${producto.modelo}. Calidad boliviana garantizada por FitAndes.`,
    brand: {
      "@type": "Brand",
      name: "FitAndes",
    },
    offers: {
      "@type": "Offer",
      priceCurrency: "BOB",
      price: producto.precioVenta,
      availability: "https://schema.org/InStock",
      url: `${SITE_URL}/catalogo/${producto._id}`,
    },
  };

  return (
    <main className="min-h-screen bg-background text-foreground pb-16">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <div className="max-w-[1240px] mx-auto px-4 sm:px-6 py-5 sm:py-8 lg:py-10">
        <nav aria-label="Miga de pan" className="mb-6 flex flex-wrap items-center gap-2 text-[10px] uppercase sm:mb-8 text-subtle tracking-[0.16em]">
          <Link href="/" className="transition-opacity hover:opacity-60">
            Inicio
          </Link>
          <span>&gt;</span>
          <Link href="/catalogo" className="transition-opacity hover:opacity-60">
            Catálogo
          </Link>
          <span>&gt;</span>
          {producto.categoria ? (
            <>
              <Link href={`/catalogo?categoria=${encodeURIComponent(producto.categoria)}`} className="transition-opacity hover:opacity-60">
                {producto.categoria}
              </Link>
              <span>&gt;</span>
            </>
          ) : null}
          <span className="text-foreground font-medium truncate max-w-[14rem] sm:max-w-none">{producto.nombre}</span>
        </nav>

        <ProductoDetalleCliente
          producto={producto}
          colores={colores}
          tallas={tallas}
          colorInicial={typeof color === "string" ? color : undefined}
          tallaInicial={typeof talla === "string" ? talla : undefined}
        />

        {/* Sección de Productos Relacionados */}
        {relacionados.length > 0 && (
          <section className="mt-16 sm:mt-24 pt-10 border-t border-border">
            <div className="flex items-end justify-between mb-8">
              <div>
                <p className="text-[10px] uppercase tracking-[0.2em] text-subtle mb-2">
                  Recomendaciones
                </p>
                <h2 className="text-2xl sm:text-3xl font-serif text-foreground">
                  También te podría gustar
                </h2>
              </div>
              <Link
                href="/catalogo"
                className="text-xs uppercase tracking-[0.14em] text-muted hover:text-foreground transition-colors hidden sm:block"
              >
                Ver todo el catálogo →
              </Link>
            </div>

            <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
              {relacionados.map((item) => {
                const itemFotos = imagenesDeProducto(item);
                return (
                  <Link key={item._id} href={`/catalogo/${item._id}`} className="group block">
                    <article className="overflow-hidden rounded-[var(--radius-lg)] border border-border bg-white transition-all duration-300 hover:-translate-y-1 active:scale-[0.98] hover:shadow-[0_14px_30px_rgba(0,0,0,0.06)]">
                      <div className="relative aspect-[3/4] overflow-hidden bg-background">
                        {itemFotos.length > 0 ? (
                          <Image
                            src={itemFotos[0]}
                            alt={item.nombre}
                            fill
                            sizes="(max-width: 768px) 50vw, 25vw"
                            className="object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-subtle/30">
                            Prenda
                          </div>
                        )}
                      </div>
                      <div className="p-4">
                        <p className="text-[10px] uppercase tracking-[0.12em] text-subtle truncate">
                          {item.nombre}
                        </p>
                        <h3 className="mt-1 text-sm font-medium text-foreground truncate">
                          {item.modelo}
                        </h3>
                        <p className="mt-2 text-base font-serif font-semibold text-foreground">
                          {formatPrice(item.precioVenta)}
                        </p>
                      </div>
                    </article>
                  </Link>
                );
              })}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
