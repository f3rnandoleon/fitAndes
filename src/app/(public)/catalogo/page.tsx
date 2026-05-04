import Link from "next/link";
import { Suspense } from "react";
import CatalogoGrid from "@/components/catalogo/CatalogoGrid";
import { catalogVariantIsAvailable, type CatalogProduct } from "@/types/catalogo";

export const metadata = {
  title: "Catálogo de Chompas Andinas y Poleras",
  description: "Descubre nuestra colección de chompas andinas tejidas y poleras exclusivas con una experiencia optimizada para móvil.",
};

export default async function CatalogoPage() {
  let productos: CatalogProduct[] = [];

  const productosConStock = (items: CatalogProduct[]) =>
    items.filter((producto) => producto.variantes.some(catalogVariantIsAvailable));

  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/productos/publicos`, {
      next: { revalidate: 60 },
      signal: AbortSignal.timeout(10000),
    });
    productos = res.ok ? productosConStock((await res.json()) as CatalogProduct[]) : [];
  } catch {
    productos = [];
  }

  return (
    <main className="min-h-screen bg-[#fbf9f5] text-[#111111]">
      <div className="max-w-[1240px] mx-auto px-4 sm:px-6 py-5 sm:py-8 lg:py-10">
        <div className="flex flex-wrap items-center gap-2 text-[10px] uppercase mb-6 sm:mb-8" style={{ letterSpacing: "0.16em", color: "#8f8478" }}>
          <Link href="/" className="transition-opacity hover:opacity-60">
            Inicio
          </Link>
          <span>{">"}</span>
          <span style={{ color: "#d04d37" }}>
            Catálogo
          </span>
        </div>


        <Suspense fallback={<CatalogoSkeleton />}>
          <CatalogoGrid productos={productos} />
        </Suspense>
      </div>
    </main>
  );
}

function CatalogoSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[280px_minmax(0,1fr)] lg:gap-10">
      <div className="hidden lg:block" />
      <div className="grid grid-cols-2 gap-4 sm:gap-6 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="overflow-hidden rounded-[24px] border bg-white animate-pulse" style={{ borderColor: "#ece6dc" }}>
            <div className="aspect-[3/4]" style={{ background: "#f2ede6" }} />
            <div className="p-4 sm:p-5 flex flex-col gap-3">
              <div className="h-4 w-2/3 rounded" style={{ background: "#e7ded2" }} />
              <div className="h-8 w-1/3 rounded" style={{ background: "#e7ded2" }} />
              <div className="h-3 w-1/2 rounded" style={{ background: "#e7ded2" }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
