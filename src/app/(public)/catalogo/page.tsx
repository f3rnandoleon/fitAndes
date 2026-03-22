import Link from "next/link";
import { Suspense } from "react";
import CatalogoGrid from "@/components/catalogo/CatalogoGrid";

interface VarianteCatalogo {
  color: string;
  talla: string;
  stock: number;
  imagen?: string;
  imagenes?: string[];
}

interface ProductoCatalogo {
  _id: string;
  nombre: string;
  modelo: string;
  categoria?: string;
  precioVenta: number;
  descuento?: number;
  createdAt?: string;
  totalVendidos?: number;
  imagen?: string;
  imagenes?: string[];
  variantes: VarianteCatalogo[];
}

export const metadata = {
  title: "Catalogo | FitAndes",
  description: "Explora nuestros productos disponibles.",
};

export default async function CatalogoPage() {
  let productos: ProductoCatalogo[] = [];

  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/productos/publicos`, {
      next: { revalidate: 60 },
      signal: AbortSignal.timeout(10000),
    });
    productos = res.ok ? ((await res.json()) as ProductoCatalogo[]) : [];
  } catch {
    productos = [];
  }

  return (
    <main className="min-h-screen bg-[#fbf9f5] text-[#111111]">
      <div className="max-w-[1240px] mx-auto px-4 sm:px-6 py-6 sm:py-10">
        <div className="flex items-center gap-2 text-[11px] uppercase mb-8 sm:mb-10" style={{ letterSpacing: "0.16em", color: "#8f8478" }}>
          <span>Menu</span>
          <span>{">"}</span>
          <Link href="/" className="transition-opacity hover:opacity-60" style={{ color: "#d04d37" }}>
            Home
          </Link>
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
    <div className="grid grid-cols-1 lg:grid-cols-[220px_minmax(0,1fr)] gap-10">
      <div className="hidden lg:block" />
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="border bg-white animate-pulse" style={{ borderColor: "#ece6dc" }}>
            <div className="aspect-[3/4]" style={{ background: "#f2ede6" }} />
            <div className="p-5 flex flex-col gap-3">
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
