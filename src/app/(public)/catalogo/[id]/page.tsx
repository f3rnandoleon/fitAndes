import Link from "next/link";
import { notFound } from "next/navigation";
import VarianteSelector from "@/components/catalogo/VarianteSelector";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/productos/publicos/${id}`, {
    next: { revalidate: 60 },
  });
  if (!res.ok) return { title: "Producto | ControlVentas" };
  const p = await res.json();
  return { title: `${p.nombre} - ${p.modelo} | ControlVentas` };
}

export default async function ProductoDetallePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/productos/publicos/${id}`, {
    next: { revalidate: 60 },
  });
  if (!res.ok) notFound();

  const producto = await res.json();
  const colores = Array.from(new Set(producto.variantes.map((v: any) => v.color))) as string[];
  const tallas = Array.from(new Set(producto.variantes.map((v: any) => v.talla))) as string[];
  const imagen = producto.variantes.find((v: any) => v.imagen)?.imagen;

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

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          <div
            className="border h-80 lg:h-96 flex items-center justify-center overflow-hidden"
            style={{ background: "var(--surface)", borderColor: "var(--border)" }}
          >
            {imagen ? (
              <img src={imagen} alt={producto.nombre} className="w-full h-full object-cover" />
            ) : (
              <div className="flex flex-col items-center gap-2" style={{ color: "var(--subtle)" }}>
                <svg className="w-20 h-20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1}
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
                <p className="text-sm">Sin imagen</p>
              </div>
            )}
          </div>

          <div className="flex flex-col gap-6">
            <div>
              <p className="text-sm mb-1" style={{ color: "var(--subtle)" }}>
                {producto.modelo}
              </p>
              <h1 className="text-4xl mb-3" style={{ fontFamily: "Georgia, 'Times New Roman', serif", fontWeight: 400 }}>
                {producto.nombre}
              </h1>
              <p className="text-3xl" style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}>
                Bs. {producto.precioVenta.toFixed(2)}
              </p>
            </div>

            <p className="text-xs" style={{ color: "var(--subtle)" }}>
              SKU: <span style={{ color: "var(--muted)" }}>{producto.sku ?? "-"}</span>
            </p>

            <VarianteSelector variantes={producto.variantes} colores={colores} tallas={tallas} />

            <Link
              href="/login"
              className="inline-flex items-center justify-center text-xs uppercase text-white py-3.5 px-6 transition-opacity hover:opacity-85"
              style={{ background: "#1a1a1a", letterSpacing: "0.18em" }}
            >
              Inicia sesion para pedir
            </Link>
            <Link href="/catalogo" className="text-sm hover:opacity-60 transition-opacity text-center" style={{ color: "var(--muted)" }}>
              Volver al catalogo
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
