import { Suspense } from "react";
import CatalogoGrid from "@/components/catalogo/CatalogoGrid";

export const metadata = {
  title: "Catálogo | ControlVentas",
  description: "Explora nuestros productos disponibles.",
};

export default async function CatalogoPage() {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/productos/publicos`,
    { next: { revalidate: 60 } }
  );
  const productos = res.ok ? await res.json() : [];

  return (
    <main className="min-h-screen bg-gray-950 text-gray-100">
      <div className="border-b border-gray-800 bg-gray-950/80 backdrop-blur sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center">
          <div className="flex items-center gap-2 text-amber-400 font-bold text-lg">
            <span className="text-2xl">◈</span>
            <span>ControlVentas</span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
        <div className="mb-8">
          <h1 className="text-4xl font-extrabold text-white mb-2">Catálogo</h1>
          <p className="text-gray-400 text-sm">
            {productos.length} producto{productos.length !== 1 ? "s" : ""} disponible{productos.length !== 1 ? "s" : ""}
          </p>
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
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden animate-pulse">
          <div className="h-52 bg-gray-800" />
          <div className="p-4 flex flex-col gap-2">
            <div className="h-4 bg-gray-800 rounded w-2/3" />
            <div className="h-3 bg-gray-800 rounded w-1/2" />
            <div className="h-5 bg-gray-800 rounded w-1/3 mt-2" />
          </div>
        </div>
      ))}
    </div>
  );
}