import Image from "next/image";
import Link from "next/link";
import { BiDevices, BiHistory, BiLogIn } from "react-icons/bi";
import { FaWhatsapp } from "react-icons/fa";
import { GrSecure } from "react-icons/gr";
import CarruselImagenes from "@/components/catalogo/CarruselImagenes";
import { imagenesDeProducto } from "@/lib/catalogo-imagenes";
import { getCatalogProductAvailableStock, type CatalogProduct, type CatalogVariant } from "@/types/catalogo";
import imagen from "../../../public/banner-main.png";

const API_URL =
  process.env.API_URL ??
  process.env.NEXT_PUBLIC_API_URL ??
  (process.env.NEXTAUTH_URL ? `${process.env.NEXTAUTH_URL}/api` : undefined);

const WHATSAPP_NUMBER = process.env.WHATSAPP_NUMBER || "59176574068";
const WHATSAPP_LINK = `https://wa.me/${WHATSAPP_NUMBER}?text=Hola,%20me%20gustaría%20más%20información.`;

type VariantePublica = CatalogVariant;

interface ProductoPublico extends Omit<CatalogProduct, "variantes"> {
  variantes?: VariantePublica[];
}

export const metadata = {
  title: "FitAndes - Nueva Colección",
  description: "Piezas atemporales confeccionadas con materiales nobles, pensadas para descubrirse y comprarse desde el móvil.",
};

function normalizarNumero(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function totalStock(producto: ProductoPublico): number {
  return getCatalogProductAvailableStock({
    ...producto,
    variantes: producto.variantes ?? [],
  });
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
  const productosDisponibles = productos.filter((producto) => totalStock(producto) > 0);

  const recienLlegados = [...productosDisponibles]
    .sort((a, b) => {
      const dateA = new Date(a.createdAt ?? 0).getTime();
      const dateB = new Date(b.createdAt ?? 0).getTime();
      return dateB - dateA;
    })
    .slice(0, 3);

  const seleccionBase = [...productosDisponibles].sort((a, b) => {
    const vendidosA = normalizarNumero(a.totalVendidos);
    const vendidosB = normalizarNumero(b.totalVendidos);
    if (vendidosA !== vendidosB) return vendidosB - vendidosA;

    return new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime();
  });

  const seleccion = (seleccionBase.length > 0 ? seleccionBase : productos).slice(0, 4);
  /*const categorias = Array.from(new Set(productosDisponibles.map((producto) => producto.categoria).filter(Boolean)));
  const heroStats = [
    { label: "Piezas activas", value: `${productosDisponibles.length}` },
    { label: "Categorías", value: `${categorias.length || 1}` },
    { label: "Compra guiada", value: "WhatsApp + web" },
  ];*/
  const beneficios = [
    { icon: <BiHistory />, title: "Historial de pedidos", desc: "Consulta cada compra desde tu cuenta sin perder el hilo." },
    { icon: <GrSecure />, title: "Cuenta segura", desc: "Sesión protegida y flujo simple para volver a comprar rápido." },
    { icon: <BiLogIn />, title: "Registro en segundos", desc: "Sin formularios largos ni pasos innecesarios." },
    { icon: <BiDevices />, title: "Catalogo actualizado", desc: "Navega el catálogo y reserva tus productos favoritos." },
  ];

  return (
    <main className="min-h-screen" style={{ background: "#f5f2ee", color: "#1a1a1a", fontFamily: "system-ui, sans-serif" }}>
      <section
        id="inicio"
        className="relative isolate overflow-hidden"
        style={{ background: "linear-gradient(140deg, #b8b0a5 0%, #d7d0c6 44%, #e8e2d8 100%)" }}
      >
        <Image
          src={imagen}
          alt="Nueva Colección"
          priority
          fill
          sizes="100vw"
          className="pointer-events-none object-cover object-center  lg:object-right"
        />
        <div className="absolute inset-0 bg-[linear-gradient(120deg,rgba(245,242,238,0.94)_0%,rgba(245,242,238,0.78)_34%,rgba(245,242,238,0.16)_100%)]" />
        <div className="absolute -left-20 top-12 h-56 w-56 rounded-full bg-white/20 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-72 w-72 rounded-full bg-[#b8965a]/12 blur-3xl" />

        <div className="relative z-10 mx-auto grid max-w-[1240px] gap-8 px-5 py-14 sm:px-6 sm:py-18 lg:grid-cols-[minmax(0,1.05fr)_360px] lg:items-end lg:py-24">
          <div className="max-w-2xl">


            <h1
              className="max-w-xl text-[2.9rem] leading-[0.95] sm:text-[4.2rem] lg:text-[5.4rem]"
              style={{ fontFamily: "Georgia, 'Times New Roman', serif", fontWeight: 400 }}
            >
              Tradición
              <br />
              y estilo para
              <br />
              tu dia a dia
            </h1>

            <p className="mt-5 max-w-lg text-base leading-7 sm:text-lg" style={{ color: "#4f463d" }}>
              {productos.length > 0
                ? `Descubre las ${productosDisponibles.length} prendas listas para reserva: chompas y poleras con una experiencia pensada para verse bien.`
                : "Chompas y poleras diseñadas para tu día a día, presentadas como un catálogo simple, claro y fácil de compartir."}
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/catalogo"
                className="inline-flex items-center justify-center gap-3 rounded-full px-6 py-4 text-[11px] uppercase text-white transition-all hover:-translate-y-0.5 active:scale-95"
                style={{ background: "#1a1a1a", letterSpacing: "0.18em" }}
              >
                Explorar catálogo
                <span aria-hidden="true">→</span>
              </Link>
              <Link
                href="/#nuevo"
                className="inline-flex items-center justify-center gap-3 rounded-full border px-6 py-4 text-[11px] uppercase transition-all hover:bg-white active:scale-95"
                style={{ letterSpacing: "0.18em", borderColor: "rgba(26,26,26,0.12)", color: "#1a1a1a", background: "rgba(255,255,255,0.45)" }}
              >
                Ver novedades
              </Link>
            </div>

          </div>


        </div>
      </section>

      <section id="nuevo" className="px-5 py-16 sm:px-6 sm:py-20 lg:py-24" style={{ background: "#f5f2ee" }}>
        <div className="mx-auto max-w-[1240px]">
          <div className="mb-10 flex flex-col gap-4 sm:mb-14 sm:flex-row sm:items-end sm:justify-between">
            <div className="max-w-xl">
              <p className="text-xs uppercase mb-3" style={{ letterSpacing: "0.25em", color: "#9c8f82" }}>
                Lo más nuevo
              </p>
              <h2 className="text-4xl font-normal sm:text-5xl" style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}>
                Recién llegados
              </h2>
            </div>

          </div>

          {recienLlegados.length === 0 ? (
            <p className="text-center text-sm" style={{ color: "#6b6058" }}>
              No hay productos disponibles por el momento.
            </p>
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-3 lg:gap-8">
              {recienLlegados.map((item) => {
                const imagenes = imagenesDeProducto(item);
                const badge = esNuevo(item.createdAt) ? "Nuevo" : "Disponible";

                return (
                  <Link key={item._id} href={`/catalogo/${item._id}`} className="group block">
                    <article className="overflow-hidden rounded-[26px] border bg-white shadow-[0_14px_40px_rgba(17,17,17,0.04)] transition-transform duration-300 hover:-translate-y-1" style={{ borderColor: "#ece6dc" }}>
                      <div className="relative mb-4 overflow-hidden" style={{ background: "#e8e4de", aspectRatio: "3 / 4" }}>
                        <div
                          className="absolute top-3 left-3 z-10 rounded-full px-3 py-1 text-[10px] font-medium uppercase text-white"
                          style={{ background: "#b8965a", letterSpacing: "0.12em" }}
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

                        <div className="absolute inset-x-3 bottom-3 flex justify-center opacity-0 transition-opacity duration-300 md:group-hover:opacity-100">
                          <span className="rounded-full bg-[#1a1a1a] px-4 py-2 text-[10px] uppercase text-white" style={{ letterSpacing: "0.2em" }}>
                            Ver producto
                          </span>
                        </div>
                      </div>
                      <div className="px-4 pb-5 sm:px-5">
                        <h3 className="text-sm font-normal sm:text-base" style={{ color: "#1a1a1a" }}>{item.nombre}</h3>
                        <p className="mt-1 text-[11px] uppercase" style={{ color: "#9c8f82", letterSpacing: "0.12em" }}>{item.modelo}</p>
                        <p className="mt-3 text-sm sm:text-base" style={{ color: "#1a1a1a" }}>{formatearPrecio(item.precioVenta)}</p>
                      </div>
                    </article>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </section>

      <section className="px-5 py-16 sm:px-6 sm:py-18" style={{ background: "#e8e4de" }}>
        <div className="mx-auto grid max-w-[1240px] gap-10 lg:grid-cols-[minmax(0,1fr)_480px] lg:items-start">
          <div className="max-w-xl">
            <p className="text-xs uppercase mb-4" style={{ letterSpacing: "0.25em", color: "#9c8f82" }}>
              Crea tu cuenta
            </p>
            <h2 className="text-4xl font-normal leading-tight sm:text-5xl" style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}>
              Sigue tus pedidos
              <br />
              desde cualquier pantalla
            </h2>
            <p className="mt-5 text-sm leading-7 sm:text-base" style={{ color: "#6b6058" }}>
              Crea tu cuenta gratis y accede al historial completo de tus compras, estado del pedido y reservas guardadas con un flujo más cómodo.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/registro"
                className="inline-flex items-center justify-center rounded-full px-6 py-4 text-[11px] uppercase text-white transition-all hover:opacity-85 active:scale-95"
                style={{ background: "#1a1a1a", letterSpacing: "0.2em" }}
              >
                Crear cuenta
              </Link>
              <Link
                href="/login"
                className="inline-flex items-center justify-center rounded-full border px-6 py-4 text-[11px] uppercase transition-all hover:bg-white active:scale-95"
                style={{ border: "1px solid #1a1a1a", color: "#1a1a1a", letterSpacing: "0.2em" }}
              >
                Ingresar
              </Link>
            </div>
          </div>

          <div className="hidden grid-cols-1 gap-4 sm:grid sm:grid-cols-2">
            {beneficios.map(({ icon, title, desc }) => (
              <div key={title} className="rounded-[24px] border bg-[#f6f2ec] px-5 py-5 shadow-[0_8px_24px_rgba(17,17,17,0.03)]" style={{ borderColor: "#dcd2c6" }}>
                <span className="inline-flex h-11 w-11 items-center justify-center rounded-full border bg-white text-xl" style={{ borderColor: "#ddd2c5", color: "#1a1a1a" }}>
                  {icon}
                </span>
                <div className="mt-4">
                  <p className="text-xs font-semibold uppercase mb-1" style={{ letterSpacing: "0.1em", color: "#1a1a1a" }}>
                    {title}
                  </p>
                  <p className="text-sm leading-6" style={{ color: "#6b6058" }}>{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="seleccion" className="px-5 py-16 sm:px-6 sm:py-20 lg:py-24" style={{ background: "#f5f2ee" }}>
        <div className="mx-auto max-w-[1240px]">
          <div className="mb-10 flex items-end justify-between gap-4">
            <div>
              <p className="text-xs uppercase mb-3" style={{ letterSpacing: "0.22em", color: "#9c8f82" }}>
                Selección destacada
              </p>
              <h2 className="text-3xl font-normal sm:text-4xl" style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}>
                Lo más popular
              </h2>
            </div>
            <Link
              href="/catalogo"
              className="text-xs uppercase flex items-center gap-2 hover:opacity-50 transition-opacity"
              style={{ letterSpacing: "0.2em", color: "#1a1a1a" }}
            >
              Ver todo
              <span aria-hidden="true">→</span>
            </Link>
          </div>

          {seleccion.length === 0 ? (
            <p className="text-center text-sm" style={{ color: "#6b6058" }}>
              Aún no hay productos para mostrar en esta sección.
            </p>
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
              {seleccion.map((item) => {
                const imagenes = imagenesDeProducto(item);
                const descuento = normalizarNumero(item.descuento);
                const tag = descuento > 0 ? null : esNuevo(item.createdAt) ? "Nuevo" : null;

                return (
                  <Link key={item._id} href={`/catalogo/${item._id}`} className="group block">
                    <article className="overflow-hidden rounded-[24px] border bg-white transition-transform duration-300 hover:-translate-y-1" style={{ borderColor: "#ece6dc" }}>
                      <div className="relative overflow-hidden" style={{ background: "#e8e4de", aspectRatio: "3/4" }}>
                        {tag && (
                          <div className="absolute top-3 left-3 z-10 rounded-full px-3 py-1 text-[10px] font-medium uppercase text-white" style={{ background: "#b8965a", letterSpacing: "0.12em" }}>
                            {tag}
                          </div>
                        )}
                        {descuento > 0 && (
                          <div className="absolute top-3 left-3 z-10 rounded-full px-3 py-1 text-[10px] font-medium uppercase text-white" style={{ background: "#c0392b", letterSpacing: "0.12em" }}>
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

                        <div className="absolute inset-x-3 bottom-3 flex justify-center opacity-0 transition-opacity duration-300 md:group-hover:opacity-100">
                          <span className="rounded-full bg-[#1a1a1a] px-4 py-2 text-[10px] uppercase text-white" style={{ letterSpacing: "0.15em" }}>
                            Ver
                          </span>
                        </div>
                      </div>
                      <div className="px-4 py-4 sm:px-5 sm:py-5">
                        <p className="text-sm font-semibold leading-6" style={{ color: "#1a1a1a" }}>{item.nombre}</p>
                        <p className="text-sm font-normal leading-6" style={{ color: "#6e6c6cff" }}>{item.modelo}</p>
                        <p className="mt-1 text-sm" style={{ color: "#1a1a1a" }}>{formatearPrecio(item.precioVenta)}</p>
                      </div>
                    </article>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </section>

      <footer style={{ background: "#1a1a1a", color: "#f5f2ee" }}>
        <div className="mx-auto grid max-w-[1240px] grid-cols-1 gap-10 px-5 py-14 sm:grid-cols-2 sm:px-6 lg:grid-cols-4 lg:py-16">
          <div>
            <p
              className="text-xl font-bold uppercase mb-4"
              style={{ fontFamily: "Georgia, 'Times New Roman', serif", letterSpacing: "0.3em" }}
            >
              FitAndes
            </p>
            <p className="text-sm leading-7" style={{ color: "#b9aea1" }}>
              Moda de alta calidad con un catálogo visual, claro y fácil de usar.
            </p>
          </div>

          <div>
            <p className="text-xs uppercase font-semibold mb-5" style={{ letterSpacing: "0.2em", color: "#9c8f82" }}>
              Comprar
            </p>
            <div className="flex flex-col gap-3">
              {["Nueva colección", "Catálogo completo"].map((item) => (
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
                { label: "Mis pedidos", href: "/pedidos" },
              ].map((item) => (
                <Link key={item.label} href={item.href} className="text-sm hover:opacity-50 transition-opacity" style={{ color: "#f5f2ee" }}>
                  {item.label}
                </Link>
              ))}
            </div>
          </div>

          <div>
            <p className="text-xs uppercase font-semibold mb-5" style={{ letterSpacing: "0.2em", color: "#9c8f82" }}>
              Contacto
            </p>
            <div className="flex flex-col gap-3">
              <a
                href={WHATSAPP_LINK}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm hover:opacity-50 transition-opacity"
                style={{ color: "#f5f2ee" }}
              >
                <FaWhatsapp className="text-lg text-green-500" />
                WhatsApp
              </a>
            </div>
          </div>

          {/*
          <div>
            <p className="text-xs uppercase font-semibold mb-5" style={{ letterSpacing: "0.2em", color: "#9c8f82" }}>
              Atención al cliente
            </p>
            <div className="flex flex-col gap-3">
              {["Catálogo por móvil", "Reservas guiadas", "Seguimiento de pedidos"].map((item) => (
                <span key={item} className="text-sm" style={{ color: "#b9aea1" }}>{item}</span>
              ))}
            </div>
          </div>
            */}
        </div>

        <div className="border-t px-5 py-5 text-center sm:px-6" style={{ borderColor: "#2e2e2e" }}>
          <p className="text-xs" style={{ color: "#6b6058" }}>
            {`© ${new Date().getFullYear()} FitAndes. Todos los derechos reservados.`}
          </p>
        </div>
      </footer>

      {/* Botón flotante de WhatsApp */}
      <a
        href={WHATSAPP_LINK}
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg transition-transform hover:scale-110 active:scale-95"
        aria-label="Contactar por WhatsApp"
      >
        <FaWhatsapp size={30} />
      </a>
    </main>
  );
}
