import { notFound } from "next/navigation";
import Link from "next/link";
import VarianteSelector from "@/components/catalogo/VarianteSelector";

export async function generateMetadata({ params }: { params: { id: string } }) {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/productos/publicos/${params.id}`,
    { next: { revalidate: 60 } }
  );
  if (!res.ok) return { title: "Producto | ControlVentas" };
  const p = await res.json();
  return { title: `${p.nombre} — ${p.modelo} | ControlVentas` };
}

export default async function ProductoDetallePage({ params }: { params: { id: string } }) {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/productos/publicos/${params.id}`,
    { next: { revalidate: 60 } }
  );
  if (!res.ok) notFound();

  const producto = await res.json();
  const colores = Array.from(new Set(producto.variantes.map((v: any) => v.color))) as string[];
  const tallas = Array.from(new Set(producto.variantes.map((v: any) => v.talla))) as string[];
  const imagen = producto.variantes.find((v: any) => v.imagen)?.imagen;

  return (
    <main className="min-h-screen bg-gray-950 text-gray-100">
      <div className="border-b border-gray-800 bg-gray-950/80 backdrop-blur sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center gap-2 text-amber-400 font-bold text-lg">
            <span className="text-2xl">◈</span>
            <span>ControlVentas</span>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-8">
          <Link href="/catalogo" className="hover:text-amber-400 transition">Catálogo</Link>
          <span>/</span>
          <span className="text-gray-300">{producto.nombre}</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          <div className="bg-gray-900 border border-gray-800 rounded-xl h-80 lg:h-96 flex items-center justify-center overflow-hidden">
            {imagen ? (
              <img src={imagen} alt={producto.nombre} className="w-full h-full object-cover" />
            ) : (
              <div className="text-gray-700 flex flex-col items-center gap-2">
                <svg className="w-20 h-20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <p className="text-sm">Sin imagen</p>
              </div>
            )}
          </div>

          <div className="flex flex-col gap-6">
            <div>
              <p className="text-sm text-gray-500 mb-1">{producto.modelo}</p>
              <h1 className="text-3xl font-extrabold text-white mb-3">{producto.nombre}</h1>
              <p className="text-3xl font-bold text-amber-400">Bs. {producto.precioVenta.toFixed(2)}</p>
            </div>
            <p className="text-xs text-gray-600">SKU: <span className="text-gray-400">{producto.sku ?? "—"}</span></p>

            <VarianteSelector variantes={producto.variantes} colores={colores} tallas={tallas} />

            <Link
              href="/login"
              className="inline-flex items-center justify-center bg-amber-400 hover:bg-amber-300 text-gray-950 font-bold rounded-lg py-3 px-6 text-sm tracking-wide transition"
            >
              Inicia sesión para pedir
            </Link>
            <Link href="/catalogo" className="text-sm text-gray-500 hover:text-amber-400 transition text-center">
              ← Volver al catálogo
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}