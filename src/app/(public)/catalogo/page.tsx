import Link from "next/link";
import { Suspense } from "react";
import CatalogoGrid from "@/components/catalogo/CatalogoGrid";
import {
  catalogVariantIsAvailable,
  unwrapCatalogProducts,
  unwrapCatalogPagination,
  type CatalogProduct,
  type CatalogPaginationMeta,
} from "@/types/catalogo";

export const metadata = {
  title: "Catálogo de Chompas Andinas y Poleras | FitAndes",
  description: "Descubre nuestra colección exclusiva de chompas andinas tejidas con maestría y poleras modernas. Prendas confeccionadas con materiales nobles en Bolivia.",
};

interface PageProps {
  searchParams?: Promise<{
    q?: string;
    busqueda?: string;
    categoria?: string;
    color?: string;
    talla?: string;
    orden?: string;
    page?: string;
  }>;
}

export default async function CatalogoPage({ searchParams }: PageProps) {
  const resolvedParams = searchParams ? await searchParams : {};
  const queryTerm = resolvedParams.q || resolvedParams.busqueda || "";
  const categoriaParam = resolvedParams.categoria || "";
  const colorParam = resolvedParams.color || "";
  const tallaParam = resolvedParams.talla || "";
  const pageParam = Math.max(1, parseInt(resolvedParams.page || "1", 10) || 1);
  const limitParam = 24;

  let productos: CatalogProduct[] = [];
  let pagination: CatalogPaginationMeta = { total: 0, page: pageParam, limit: limitParam, totalPages: 1 };

  const productosConStock = (items: CatalogProduct[]) =>
    items.filter((producto) => producto.variantes.some(catalogVariantIsAvailable));

  try {
    const rawApiUrl = process.env.NEXT_PUBLIC_API_URL || process.env.API_URL || "https://control-ventas-azure.vercel.app/api";
    const url = new URL(`${rawApiUrl}/productos/publicos`);
    if (queryTerm) url.searchParams.set("q", queryTerm);
    if (categoriaParam && categoriaParam !== "todas") url.searchParams.set("categoria", categoriaParam);
    if (colorParam) url.searchParams.set("color", colorParam);
    if (tallaParam) url.searchParams.set("talla", tallaParam);
    url.searchParams.set("soloDisponible", "true");
    url.searchParams.set("page", String(pageParam));
    url.searchParams.set("limit", String(limitParam));

    const res = await fetch(url.toString(), {
      next: { revalidate: 60 },
      signal: AbortSignal.timeout(10000),
    });
    if (res.ok) {
      const data = await res.json();
      productos = productosConStock(unwrapCatalogProducts(data));
      pagination = unwrapCatalogPagination(data);
    } else {
      productos = [];
    }
  } catch {
    productos = [];
  }

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="max-w-[1240px] mx-auto px-4 sm:px-6 py-5 sm:py-8 lg:py-10">
        <div className="flex flex-wrap items-center gap-2 text-[10px] uppercase mb-6 sm:mb-8 text-subtle tracking-[0.16em]">
          <Link href="/" className="transition-opacity hover:opacity-60">
            Inicio
          </Link>
          <span>&gt;</span>
          <span className="text-foreground font-medium">
            Catálogo Navideño
          </span>
        </div>

        <div className="mb-8 flex flex-col gap-2">
          <div className="inline-flex items-center gap-2 self-start rounded-full bg-[#c41e3a]/10 border border-[#c41e3a]/25 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-[#c41e3a]">
            <span>🎄</span> Especial de Regalos Navideños 2026
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-serif text-foreground font-normal tracking-tight">
            Colección & Regalos Navideños
          </h1>
          <p className="text-xs sm:text-sm text-muted max-w-xl">
            Prendas confeccionadas con fibras nobles y calidez andina. Reserva tus regalos de Navidad con envíos express a toda Bolivia 🎁.
          </p>
        </div>

        <Suspense fallback={<CatalogoSkeleton />}>
          <CatalogoGrid
            productos={productos}
            pagination={pagination}
            filtroInicial={{
              busqueda: queryTerm,
              categoria: categoriaParam,
              color: colorParam,
              talla: tallaParam,
              page: pageParam,
            }}
          />
        </Suspense>
      </div>
    </main>
  );
}

function CatalogoSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[280px_minmax(0,1fr)] lg:gap-10">
      <div className="hidden lg:block rounded-[24px] border border-border bg-white p-6 animate-pulse h-96" />
      <div className="grid grid-cols-2 gap-4 sm:gap-6 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="overflow-hidden rounded-[24px] border border-border bg-white animate-pulse">
            <div className="aspect-[3/4] bg-surface-soft" />
            <div className="p-4 sm:p-5 flex flex-col gap-3">
              <div className="h-4 w-2/3 rounded bg-surface" />
              <div className="h-6 w-1/3 rounded bg-surface" />
              <div className="h-3 w-1/2 rounded bg-surface" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
