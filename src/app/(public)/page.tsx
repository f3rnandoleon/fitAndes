import Link from "next/link";
import CarruselImagenes from "@/components/catalogo/CarruselImagenes";
import { imagenesDeProducto } from "@/lib/catalogo-imagenes";
const API_URL =
  process.env.API_URL ??
  process.env.NEXT_PUBLIC_API_URL ??
  (process.env.NEXTAUTH_URL ? `${process.env.NEXTAUTH_URL}/api` : undefined);

interface VariantePublica {
  color: string;
  talla: string;
  stock: number;
  imagen?: string;
  imagenes?: string[];
}

interface ProductoPublico {
  _id: string;
  nombre: string;
  modelo: string;
  precioVenta: number;
  descuento?: number;
  createdAt?: string;
  totalVendidos?: number;
  imagenes?: string[];
  variantes?: VariantePublica[];
}

export const metadata = {
  title: "ControlVentas - Nueva Coleccion",
  description: "Piezas atemporales confeccionadas con los materiales mas nobles. Disenadas para perdurar.",
};

function normalizarNumero(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function totalStock(producto: ProductoPublico): number {
  return (producto.variantes ?? []).reduce((acc, item) => acc + normalizarNumero(item.stock), 0);
}

function formatearPrecio(precio: number): string {
  return `Bs. ${new Intl.NumberFormat("es-BO", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(precio)}`;
}

function esNuevo(createdAt?: string): boolean {
  if (!createdAt) return false;
  const created = new Date(createdAt).getTime();
  if (!Number.isFinite(created)) return false;

  const hoy = Date.now();
  const diffDias = (hoy - created) / (1000 * 60 * 60 * 24);
  return diffDias <= 45;
}

async function getProductosPublicos(): Promise<ProductoPublico[]> {
  if (!API_URL) return [];

  try {
    const res = await fetch(`${API_URL}/productos/publicos`, {
      next: { revalidate: 60 },
      signal: AbortSignal.timeout(10000),
    });

    if (!res.ok) return [];

    const data = await res.json();
    return Array.isArray(data) ? (data as ProductoPublico[]) : [];
  } catch {
    return [];
  }
}

export default async function HomePage() {
  const productos = await getProductosPublicos();

  const recienLlegados = [...productos]
    .sort((a, b) => {
      const dateA = new Date(a.createdAt ?? 0).getTime();
      const dateB = new Date(b.createdAt ?? 0).getTime();
      return dateB - dateA;
    })
    .slice(0, 3);

  const seleccionBase = [...productos]
    .filter((producto) => totalStock(producto) > 0)
    .sort((a, b) => {
      const vendidosA = normalizarNumero(a.totalVendidos);
      const vendidosB = normalizarNumero(b.totalVendidos);
      if (vendidosA !== vendidosB) return vendidosB - vendidosA;

      return new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime();
    });

  const seleccion = (seleccionBase.length > 0 ? seleccionBase : productos).slice(0, 4);

  return (
    <main className="min-h-screen" style={{ background: "#f5f2ee", color: "#1a1a1a", fontFamily: "system-ui, sans-serif" }}>
      <nav className="sticky top-0 z-20 border-b" style={{ background: "#f5f2ee", borderColor: "#e0dbd4" }}>
        <div className="max-w-7xl mx-auto px-6 py-4 grid grid-cols-3 items-center">
          <div className="flex items-center gap-8">
            {[
              { label: "Coleccion", href: "#" },
              { label: "Catalogo", href: "/catalogo" },
              { label: "Novedades", href: "#" },
            ].map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className="text-xs uppercase opacity-80 hover:opacity-40 transition-opacity"
                style={{ letterSpacing: "0.15em", color: "#1a1a1a" }}
              >
                {item.label}
              </Link>
            ))}
          </div>

          <div className="flex justify-center">
            <Link
              href="/"
              className="text-2xl uppercase font-bold"
              style={{ fontFamily: "Georgia, 'Times New Roman', serif", letterSpacing: "0.25em", color: "#1a1a1a" }}
            >
              ControlVentas
            </Link>
          </div>

          <div className="flex items-center justify-end gap-5">
            <Link
              href="/login"
              className="text-xs uppercase opacity-80 hover:opacity-40 transition-opacity"
              style={{ letterSpacing: "0.15em", color: "#1a1a1a" }}
            >
              Ingresar
            </Link>
            <Link
              href="/registro"
              className="text-xs uppercase px-4 py-2 border hover:opacity-60 transition-opacity"
              style={{ letterSpacing: "0.15em", border: "1px solid #1a1a1a", color: "#1a1a1a" }}
            >
              Registro
            </Link>
          </div>
        </div>
      </nav>

      <section
        className="relative flex items-end overflow-hidden"
        style={{ minHeight: "88vh", background: "linear-gradient(135deg, #b8b0a5 0%, #cdc8c0 40%, #ddd9d3 100%)" }}
      >
        <div className="relative z-10 px-16 pb-20 max-w-xl">
          <p className="text-xs uppercase mb-5 opacity-70 text-white" style={{ letterSpacing: "0.25em" }}>
            Nueva Coleccion 2026
          </p>
          <h1
            className="text-6xl text-white mb-6"
            style={{ fontFamily: "Georgia, 'Times New Roman', serif", fontWeight: 400, lineHeight: 1.05 }}
          >
            Elegancia sin
            <br />
            esfuerzo
          </h1>
          <p className="text-sm leading-relaxed mb-10 opacity-80 text-white max-w-xs">
            {productos.length > 0
              ? `${productos.length} productos activos listos para tu nueva seleccion.`
              : "Piezas atemporales confeccionadas con los materiales mas nobles. Disenadas para perdurar."}
          </p>
          <Link
            href="/catalogo"
            className="inline-flex items-center gap-3 px-7 py-3.5 text-xs uppercase border border-white text-white hover:bg-white hover:text-stone-900 transition-colors"
            style={{ letterSpacing: "0.2em" }}
          >
            Explorar Coleccion {"->"}
          </Link>
        </div>

        <div className="absolute right-0 top-0 h-full w-1/2 flex items-center justify-center pointer-events-none">
          <div className="absolute w-96 h-96 rounded-full border border-white/10" />
          <div className="absolute w-[560px] h-[560px] rounded-full border border-white/5" />
        </div>
      </section>

      <section className="py-24 px-6" style={{ background: "#f5f2ee" }}>
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-xs uppercase mb-3" style={{ letterSpacing: "0.25em", color: "#9c8f82" }}>
              Lo mas nuevo
            </p>
            <h2 className="text-4xl font-normal" style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}>
              Recien Llegados
            </h2>
          </div>

          {recienLlegados.length === 0 ? (
            <p className="text-center text-sm" style={{ color: "#6b6058" }}>
              No hay productos disponibles por el momento.
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {recienLlegados.map((item) => {
                const imagenes = imagenesDeProducto(item);
                const badge = esNuevo(item.createdAt) ? "NUEVO" : "DISPONIBLE";

                return (
                  <Link key={item._id} href={`/catalogo/${item._id}`} className="group block">
                    <div className="relative overflow-hidden mb-4" style={{ background: "#e8e4de", aspectRatio: "3/4" }}>
                      <div
                        className="absolute top-3 left-3 px-2.5 py-1 text-xs font-medium text-white"
                        style={{ background: "#b8965a", letterSpacing: "0.08em" }}
                      >
                        {badge}
                      </div>

                      {imagenes.length > 0 ? (
                        <CarruselImagenes
                          imagenes={imagenes}
                          alt={item.nombre}
                          imgClassName="group-hover:scale-105 transition-transform duration-500"
                          duracionMs={2600}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <svg className="w-20 h-20 opacity-20" fill="none" stroke="#9c8f82" viewBox="0 0 24 24">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={0.8}
                              d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                            />
                          </svg>
                        </div>
                      )}

                      <div
                        className="absolute inset-0 flex items-end justify-center pb-6 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                        style={{ background: "rgba(26,26,26,0.08)" }}
                      >
                        <span className="text-xs uppercase px-5 py-2.5 text-white" style={{ background: "#1a1a1a", letterSpacing: "0.2em" }}>
                          Ver producto
                        </span>
                      </div>
                    </div>
                    <h3 className="text-sm font-normal mb-0.5" style={{ color: "#1a1a1a" }}>{item.nombre}</h3>
                    <p className="text-xs mb-1" style={{ color: "#9c8f82" }}>{item.modelo}</p>
                    <p className="text-sm" style={{ color: "#1a1a1a" }}>{formatearPrecio(item.precioVenta)}</p>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </section>

      <section className="py-20 px-6" style={{ background: "#e8e4de" }}>
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center justify-between gap-14">
          <div className="max-w-lg">
            <p className="text-xs uppercase mb-4" style={{ letterSpacing: "0.25em", color: "#9c8f82" }}>
              Tu cuenta de cliente
            </p>
            <h2 className="text-4xl font-normal mb-6 leading-tight" style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}>
              Sigue tus pedidos
              <br />
              en tiempo real
            </h2>
            <p className="text-sm leading-relaxed mb-8" style={{ color: "#6b6058" }}>
              Crea tu cuenta gratis y accede al historial completo de tus compras y el estado de cada pedido desde tu
              portal personal.
            </p>
            <div className="flex gap-4 flex-wrap">
              <Link
                href="/registro"
                className="px-7 py-3 text-xs uppercase text-white hover:opacity-80 transition-opacity"
                style={{ background: "#1a1a1a", letterSpacing: "0.2em" }}
              >
                Crear cuenta
              </Link>
              <Link
                href="/login"
                className="px-7 py-3 text-xs uppercase border hover:opacity-60 transition-opacity"
                style={{ border: "1px solid #1a1a1a", color: "#1a1a1a", letterSpacing: "0.2em" }}
              >
                Ingresar
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-md w-full">
            {[
              { icon: "📦", title: "Historial de pedidos", desc: "Todas tus compras con detalle completo." },
              { icon: "🔒", title: "Cuenta segura", desc: "Sesion protegida con JWT cifrado." },
              { icon: "⚡", title: "Registro en segundos", desc: "Sin formularios largos. Acceso inmediato." },
              { icon: "📱", title: "Cualquier dispositivo", desc: "Funciona igual en movil y desktop." },
            ].map(({ icon, title, desc }) => (
              <div key={title} className="flex gap-3">
                <span className="text-xl mt-0.5 shrink-0">{icon}</span>
                <div>
                  <p className="text-xs font-semibold uppercase mb-1" style={{ letterSpacing: "0.08em", color: "#1a1a1a" }}>
                    {title}
                  </p>
                  <p className="text-xs leading-relaxed" style={{ color: "#6b6058" }}>{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-24 px-6" style={{ background: "#f5f2ee" }}>
        <div className="max-w-7xl mx-auto">
          <div className="flex items-end justify-between mb-10">
            <h2 className="text-3xl font-normal" style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}>
              Seleccion
            </h2>
            <Link
              href="/catalogo"
              className="text-xs uppercase flex items-center gap-2 hover:opacity-50 transition-opacity"
              style={{ letterSpacing: "0.2em", color: "#1a1a1a" }}
            >
              Ver todo {"->"}
            </Link>
          </div>

          {seleccion.length === 0 ? (
            <p className="text-center text-sm" style={{ color: "#6b6058" }}>
              Aun no hay productos para mostrar en esta seccion.
            </p>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
              {seleccion.map((item) => {
                const imagenes = imagenesDeProducto(item);
                const descuento = normalizarNumero(item.descuento);
                const tag = descuento > 0 ? null : esNuevo(item.createdAt) ? "NUEVO" : null;

                return (
                  <Link key={item._id} href={`/catalogo/${item._id}`} className="group block">
                    <div className="relative overflow-hidden mb-3" style={{ background: "#e8e4de", aspectRatio: "3/4" }}>
                      {tag && (
                        <div className="absolute top-3 left-3 px-2 py-0.5 text-xs font-medium text-white" style={{ background: "#b8965a" }}>
                          {tag}
                        </div>
                      )}
                      {descuento > 0 && (
                        <div className="absolute top-3 left-3 px-2 py-0.5 text-xs font-medium text-white" style={{ background: "#c0392b" }}>
                          -{descuento}%
                        </div>
                      )}

                      {imagenes.length > 0 ? (
                        <CarruselImagenes
                          imagenes={imagenes}
                          alt={item.nombre}
                          imgClassName="group-hover:scale-105 transition-transform duration-500"
                          duracionMs={2600}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <svg className="w-16 h-16 opacity-20" fill="none" stroke="#9c8f82" viewBox="0 0 24 24">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={0.8}
                              d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                            />
                          </svg>
                        </div>
                      )}

                      <div
                        className="absolute inset-0 flex items-end justify-center pb-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                        style={{ background: "rgba(26,26,26,0.06)" }}
                      >
                        <span className="text-xs uppercase px-4 py-2 text-white" style={{ background: "#1a1a1a", letterSpacing: "0.15em" }}>
                          Ver
                        </span>
                      </div>
                    </div>
                    <p className="text-sm font-normal" style={{ color: "#1a1a1a" }}>{item.nombre}</p>
                    <p className="text-sm mt-0.5" style={{ color: "#1a1a1a" }}>{formatearPrecio(item.precioVenta)}</p>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </section>

      <footer style={{ background: "#1a1a1a", color: "#f5f2ee" }}>
        <div className="max-w-7xl mx-auto px-6 py-16 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
          <div>
            <p
              className="text-xl font-bold uppercase mb-4"
              style={{ fontFamily: "Georgia, 'Times New Roman', serif", letterSpacing: "0.3em" }}
            >
              ControlVentas
            </p>
            <p className="text-xs leading-relaxed" style={{ color: "#9c8f82" }}>
              Moda de alta calidad con un compromiso inquebrantable por el diseno atemporal.
            </p>
          </div>

          <div>
            <p className="text-xs uppercase font-semibold mb-5" style={{ letterSpacing: "0.2em", color: "#9c8f82" }}>
              Comprar
            </p>
            <div className="flex flex-col gap-3">
              {["Nueva Coleccion", "Catalogo completo"].map((item) => (
                <Link key={item} href="/catalogo" className="text-sm hover:opacity-50 transition-opacity" style={{ color: "#f5f2ee" }}>
                  {item}
                </Link>
              ))}
            </div>
          </div>

          <div>
            <p className="text-xs uppercase font-semibold mb-5" style={{ letterSpacing: "0.2em", color: "#9c8f82" }}>
              Mi cuenta
            </p>
            <div className="flex flex-col gap-3">
              {[
                { label: "Ingresar", href: "/login" },
                { label: "Crear cuenta", href: "/registro" },
                { label: "Mis pedidos", href: "/portal/pedidos" },
              ].map((item) => (
                <Link key={item.label} href={item.href} className="text-sm hover:opacity-50 transition-opacity" style={{ color: "#f5f2ee" }}>
                  {item.label}
                </Link>
              ))}
            </div>
          </div>

          <div>
            <p className="text-xs uppercase font-semibold mb-5" style={{ letterSpacing: "0.2em", color: "#9c8f82" }}>
              Atencion al cliente
            </p>
            <div className="flex flex-col gap-3">
              {["Contacto", "FAQ", "Politica de privacidad"].map((item) => (
                <span key={item} className="text-sm" style={{ color: "#9c8f82" }}>{item}</span>
              ))}
            </div>
          </div>
        </div>

        <div className="border-t px-6 py-5 text-center" style={{ borderColor: "#2e2e2e" }}>
          <p className="text-xs" style={{ color: "#6b6058" }}>
            {`© ${new Date().getFullYear()} ControlVentas. Todos los derechos reservados.`}
          </p>
        </div>
      </footer>
    </main>
  );
}




