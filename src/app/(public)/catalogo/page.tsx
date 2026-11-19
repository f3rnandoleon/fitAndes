import { Suspense } from "react";
import CatalogoGrid from "@/components/catalogo/CatalogoGrid";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { getPublicPromotions } from "@/lib/promociones-server";
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
    soloOfertas?: string;
    page?: string;
  }>;
}

export default async function CatalogoPage({ searchParams }: PageProps) {
  const resolvedParams = searchParams ? await searchParams : {};
  const queryTerm = resolvedParams.q || resolvedParams.busqueda || "";
  const categoriaParam = resolvedParams.categoria || "";
  const colorParam = resolvedParams.color || "";
  const tallaParam = resolvedParams.talla || "";
  const ordenParam = resolvedParams.orden || "";
  const soloOfertasParam = resolvedParams.soloOfertas === "true" || resolvedParams.soloOfertas === "1";
  const pageParam = Math.max(1, parseInt(resolvedParams.page || "1", 10) || 1);
  const limitParam = 24;

  let productos: CatalogProduct[] = [];
  let pagination: CatalogPaginationMeta = { total: 0, page: pageParam, limit: limitParam, totalPages: 1 };

  const productosConStock = (items: CatalogProduct[]) =>
    items.filter((producto) => producto.variantes.some(catalogVariantIsAvailable));

  const rawApiUrl = process.env.NEXT_PUBLIC_API_URL || process.env.API_URL || "https://control-ventas-azure.vercel.app/api";
  const url = new URL(`${rawApiUrl}/productos/publicos`);
  if (queryTerm) url.searchParams.set("q", queryTerm);
  if (categoriaParam && categoriaParam !== "todas") url.searchParams.set("categoria", categoriaParam);
  if (colorParam) url.searchParams.set("color", colorParam);
  if (tallaParam) url.searchParams.set("talla", tallaParam);
  if (soloOfertasParam) url.searchParams.set("soloOfertas", "true");
  url.searchParams.set("soloDisponible", "true");
  url.searchParams.set("page", String(pageParam));
  url.searchParams.set("limit", String(limitParam));

  const [catalogResult, promociones] = await Promise.all([
    fetch(url.toString(), {
      next: { revalidate: 60 },
      signal: AbortSignal.timeout(10000),
    })
      .then(async (res) => (res.ok ? res.json() : null))
      .catch(() => null),
    getPublicPromotions(),
  ]);

  if (catalogResult) {
    productos = productosConStock(unwrapCatalogProducts(catalogResult));
    pagination = unwrapCatalogPagination(catalogResult);
  }

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="max-w-[1240px] mx-auto px-4 sm:px-6 py-5 sm:py-8 lg:py-10">
        <Breadcrumb
          items={
            categoriaParam && categoriaParam !== "todas"
              ? [
                  { label: "Inicio", href: "/" },
                  { label: "Catálogo", href: "/catalogo" },
                  { label: categoriaParam },
                ]
              : soloOfertasParam
                ? [
                    { label: "Inicio", href: "/" },
                    { label: "Catálogo", href: "/catalogo" },
                    { label: "Ofertas" },
                  ]
                : [{ label: "Inicio", href: "/" }, { label: "Catálogo" }]
          }
          className="mb-6 sm:mb-8"
        />

        <Suspense fallback={<CatalogoSkeleton />}>
          <CatalogoGrid
            productos={productos}
            promociones={promociones}
            pagination={pagination}
            filtroInicial={{
              busqueda: queryTerm,
              categoria: categoriaParam,
              color: colorParam,
              talla: tallaParam,
              orden: ordenParam,
              soloOfertas: soloOfertasParam,
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
