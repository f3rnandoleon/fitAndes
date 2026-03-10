import Link from "next/link";
import { Suspense } from "react";
import CatalogoGrid from "@/components/catalogo/CatalogoGrid";

export const metadata = {
  title: "Catalogo | ControlVentas",
  description: "Explora nuestros productos disponibles.",
};

export default async function CatalogoPage() {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/productos/publicos`, {
    next: { revalidate: 60 },
  });
  const productos = res.ok ? await res.json() : [];

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
          <div className="flex items-center gap-4">
            <Link href="/" className="text-xs uppercase hover:opacity-55 transition-opacity" style={{ letterSpacing: "0.16em" }}>
              Inicio
            </Link>
            <Link href="/login" className="text-xs uppercase hover:opacity-55 transition-opacity" style={{ letterSpacing: "0.16em" }}>
              Ingresar
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
        <div className="mb-10">
          <p className="text-xs uppercase mb-3" style={{ letterSpacing: "0.22em", color: "var(--subtle)" }}>
            Coleccion disponible
          </p>
          <h1 className="text-4xl sm:text-5xl mb-2" style={{ fontFamily: "Georgia, 'Times New Roman', serif", fontWeight: 400 }}>
            Catalogo
          </h1>
          <p className="text-sm" style={{ color: "var(--muted)" }}>
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
        <div
          key={i}
          className="border overflow-hidden animate-pulse"
          style={{ background: "var(--surface)", borderColor: "var(--border)" }}
        >
          <div className="h-52" style={{ background: "var(--surface-soft)" }} />
          <div className="p-4 flex flex-col gap-2">
            <div className="h-4 rounded w-2/3" style={{ background: "#d3cbc2" }} />
            <div className="h-3 rounded w-1/2" style={{ background: "#d3cbc2" }} />
            <div className="h-5 rounded w-1/3 mt-2" style={{ background: "#d3cbc2" }} />
          </div>
        </div>
      ))}
    </div>
  );
}
