import Image from "next/image";
import Link from "next/link";
import { FiMapPin, FiRefreshCw, FiShield, FiTruck } from "react-icons/fi";
import CarruselImagenes from "@/components/catalogo/CarruselImagenes";
import HomeBannerCarousel from "@/components/home/HomeBannerCarousel";
import { imagenesDeProducto } from "@/lib/catalogo-imagenes";
import { DEFAULT_NATIONAL_SHIPPING_FEE, SEASONAL_THEME_ENABLED } from "@/lib/constants";
import { formatPrice } from "@/lib/format";
import {
  catalogProductHasSale,
  getCatalogProductAvailableStock,
  getCatalogProductDiscountPercent,
  getCatalogProductListPriceRange,
  getCatalogProductPriceRange,
  unwrapCatalogProducts,
  type CatalogProduct,
  type CatalogVariant,
  type PublicBanner,
} from "@/types/catalogo";
import imagen from "../../../public/banner-main.png";

const API_URL =
  process.env.API_URL ??
  process.env.NEXT_PUBLIC_API_URL ??
  (process.env.NEXTAUTH_URL ? `${process.env.NEXTAUTH_URL}/api` : undefined);

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
    return unwrapCatalogProducts(data) as ProductoPublico[];
  } catch {
    return [];
  }
}

async function getPublicBanners(): Promise<PublicBanner[]> {
  if (!API_URL) return [];

  try {
    const res = await fetch(`${API_URL}/public/banners`, {
      next: { revalidate: 60 },
      signal: AbortSignal.timeout(6000),
    });

    if (!res.ok) return [];

    const data = await res.json();
    return Array.isArray(data) ? (data as PublicBanner[]) : [];
  } catch {
    return [];
  }
}

export default async function HomePage() {
  const [productos, banners] = await Promise.all([
    getProductosPublicos(),
    getPublicBanners(),
  ]);

  const productosDisponibles = productos.filter((producto) => totalStock(producto) > 0);

  const recienLlegados = [...productosDisponibles]
    .sort((a, b) => {
      const dateA = new Date(a.createdAt ?? 0).getTime();
      const dateB = new Date(b.createdAt ?? 0).getTime();
      return dateB - dateA;
    })
    .slice(0, 3);

  const recienLlegadosIds = new Set(recienLlegados.map((p) => p._id));
  const seleccionBase = [...productosDisponibles]
    .filter((p) => !recienLlegadosIds.has(p._id))
    .sort((a, b) => {
      const vendidosA = normalizarNumero(a.totalVendidos);
      const vendidosB = normalizarNumero(b.totalVendidos);
      if (vendidosA !== vendidosB) return vendidosB - vendidosA;

      return new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime();
    });

  const seleccion = (seleccionBase.length > 0 ? seleccionBase : productos.filter((p) => !recienLlegadosIds.has(p._id))).slice(0, 4);

  const categoriasDisponibles = Array.from(
    new Set(
      productosDisponibles
        .map((p) => p.categoria?.trim())
        .filter((cat): cat is string => Boolean(cat)),
    ),
  ).sort((a, b) => a.localeCompare(b, "es", { sensitivity: "base" }));

  const hayOfertas = productosDisponibles.some((p) => catalogProductHasSale(p as unknown as CatalogProduct));

  return (
    <main className="min-h-screen bg-background text-foreground font-sans">
      {/* Carrusel de Banners Dinámicos del Sistema Central o Fallback Hero */}
      {banners.length > 0 ? (
        <HomeBannerCarousel banners={banners} />
      ) : (
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
            className="pointer-events-none object-cover object-center lg:object-right"
          />
          <div className="absolute inset-0 bg-[linear-gradient(120deg,rgba(245,242,238,0.94)_0%,rgba(245,242,238,0.78)_34%,rgba(245,242,238,0.16)_100%)]" />
          <div className="absolute -left-20 top-12 h-56 w-56 rounded-full bg-white/20 blur-3xl" />
          <div className="absolute bottom-0 right-0 h-72 w-72 rounded-full bg-[#b8965a]/12 blur-3xl" />

          <div className="relative z-10 mx-auto grid max-w-[1240px] gap-8 px-5 py-14 sm:px-6 sm:py-18 lg:grid-cols-[minmax(0,1.05fr)_360px] lg:items-end lg:py-24">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-accent/10 border border-accent/25 text-accent text-xs font-semibold uppercase tracking-widest mb-4">
                {SEASONAL_THEME_ENABLED ? "🎄 Colección Especial de Navidad" : "Nueva Colección FitAndes"}
              </div>

              <h1 className="max-w-xl font-serif text-[2.9rem] font-normal leading-[0.95] sm:text-[4.2rem] lg:text-[5.4rem]">
                Tradición
                <br />
                y estilo para
                <br />
                tu día a día
              </h1>

              <p className="mt-5 max-w-lg text-base leading-7 sm:text-lg text-muted">
                Descubre prendas listas para reserva: chompas y poleras diseñadas con una experiencia pensada para verse bien y sentirse cómodo en cualquier ocasión.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/catalogo"
                  className="inline-flex items-center justify-center gap-3 rounded-full px-6 py-4 text-[11px] uppercase tracking-[0.18em] bg-accent text-white shadow-md hover:bg-accent-hover transition-all hover:translate-y-[-2px] active:scale-95"
                >
                  Explorar catálogo
                  <span aria-hidden="true">→</span>
                </Link>
                <Link
                  href="/#nuevo"
                  className="inline-flex items-center justify-center gap-3 rounded-full border border-border px-6 py-4 text-[11px] uppercase tracking-[0.18em] transition-all hover:bg-white active:scale-95 bg-white/60 text-foreground"
                >
                  Ver novedades
                </Link>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Franja de Propuesta de Valor y Confianza */}
      <section aria-label="Beneficios de compra" className="border-b border-border bg-white/80">
        <div className="mx-auto grid max-w-[1240px] grid-cols-2 gap-4 px-5 py-6 sm:px-6 lg:grid-cols-4 lg:gap-6">
          {[
            {
              icon: FiTruck,
              title: "Envíos a toda Bolivia",
              desc: `Tarifa plana nacional desde Bs. ${DEFAULT_NATIONAL_SHIPPING_FEE}`,
            },
            {
              icon: FiMapPin,
              title: "Retiro gratis en tienda",
              desc: "Puntos en La Paz y El Alto",
            },
            {
              icon: FiShield,
              title: "Pago QR o efectivo",
              desc: "Reserva de stock inmediata",
            },
            {
              icon: FiRefreshCw,
              title: "Cambios hasta 7 días",
              desc: "Cambio fácil de talla o modelo",
            },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.title} className="flex items-start gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-border bg-surface text-foreground">
                  <Icon className="h-4 w-4" aria-hidden="true" />
                </span>
                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-[0.1em] text-foreground">
                    {item.title}
                  </p>
                  <p className="mt-0.5 text-xs text-muted leading-snug">{item.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Accesos rápidos por categoría */}
      {categoriasDisponibles.length > 0 && (
        <section aria-label="Explorar por categoría" className="border-b border-border/60 bg-background">
          <div className="mx-auto flex max-w-[1240px] items-center justify-between gap-4 px-5 py-5 sm:px-6">
            <span className="hidden sm:inline-block shrink-0 text-[10px] uppercase tracking-[0.2em] text-subtle">
              Categorías
            </span>
            <div className="flex flex-1 items-center gap-2 overflow-x-auto no-scrollbar">
              <Link
                href="/catalogo"
                className="whitespace-nowrap rounded-full border border-foreground bg-foreground px-4 py-2 text-[11px] uppercase tracking-[0.14em] text-background transition-opacity hover:opacity-90"
              >
                Todo el catálogo
              </Link>
              {hayOfertas && (
                <Link
                  href="/catalogo?soloOfertas=true"
                  className="whitespace-nowrap rounded-full border border-danger/30 bg-danger/10 px-4 py-2 text-[11px] uppercase tracking-[0.14em] text-danger font-semibold transition-colors hover:bg-danger hover:text-white"
                >
                  Ofertas
                </Link>
              )}
              {categoriasDisponibles.map((categoria) => (
                <Link
                  key={categoria}
                  href={`/catalogo?categoria=${encodeURIComponent(categoria)}`}
                  className="whitespace-nowrap rounded-full border border-border bg-white px-4 py-2 text-[11px] uppercase tracking-[0.14em] text-muted transition-colors hover:border-foreground hover:text-foreground"
                >
                  {categoria}
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Sección Recién Llegados */}
      <section id="nuevo" className="px-5 py-16 sm:px-6 sm:py-20 lg:py-24 bg-surface/50">
        <div className="mx-auto max-w-[1240px]">
          <div className="mb-10 flex flex-col gap-4 sm:mb-14 sm:flex-row sm:items-end sm:justify-between">
            <div className="max-w-xl">
              <p className="text-xs uppercase mb-3 tracking-[0.25em] text-subtle">
                Lo más nuevo
              </p>
              <h2 className="font-serif text-4xl font-normal sm:text-5xl">
                Recién llegados
              </h2>
            </div>
            <Link
              href="/catalogo"
              className="text-xs uppercase tracking-[0.18em] text-foreground hover:opacity-70 transition-opacity font-medium"
            >
              Ver novedades →
            </Link>
          </div>

          {recienLlegados.length === 0 ? (
            <p className="text-center text-sm text-muted">
              No hay productos disponibles por el momento.
            </p>
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-3 lg:gap-8">
              {recienLlegados.map((item) => {
                const catalogItem = item as unknown as CatalogProduct;
                const imagenes = imagenesDeProducto(item);
                const badge = esNuevo(item.createdAt) ? "Nuevo" : "Disponible";
                const descuento = getCatalogProductDiscountPercent(catalogItem);
                const tieneRebaja = catalogProductHasSale(catalogItem);
                const priceRange = getCatalogProductPriceRange(catalogItem);
                const listPriceRange = tieneRebaja ? getCatalogProductListPriceRange(catalogItem) : null;

                return (
                  <Link key={item._id} href={`/catalogo/${item._id}`} className="group block">
                    <article className="overflow-hidden rounded-[var(--radius-lg)] border bg-white shadow-[0_14px_40px_rgba(17,17,17,0.04)] transition-transform duration-300 hover:-translate-y-1 active:scale-95 border-border">
                      <div className="relative mb-4 overflow-hidden bg-surface-soft aspect-[3/4]">
                        <div className={`absolute top-3 left-3 z-10 rounded-full px-3 py-1 text-[10px] font-medium uppercase tracking-[0.12em] text-white ${descuento > 0 ? "bg-danger" : "bg-accent"}`}>
                          {descuento > 0 ? `-${descuento}%` : badge}
                        </div>

                        {imagenes.length > 0 ? (
                          <CarruselImagenes
                            imagenes={imagenes}
                            alt={item.nombre}
                            imgClassName="group-hover:scale-105 transition-transform duration-500"
                            mostrarControles={true}
                            autoPlay={true}
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
                          <span className="rounded-full bg-foreground px-4 py-2 text-[10px] uppercase tracking-[0.2em] text-white">
                            Ver producto
                          </span>
                        </div>
                      </div>
                      <div className="px-4 pb-5 sm:px-5">
                        <h3 className="text-sm font-normal sm:text-base text-foreground">{item.nombre}</h3>
                        <p className="mt-1 text-[11px] uppercase tracking-[0.12em] text-subtle">{item.modelo}</p>
                        <div className="mt-3 flex flex-wrap items-baseline gap-2">
                          <p className={`text-sm sm:text-base font-medium ${tieneRebaja ? "text-danger" : "text-foreground"}`}>
                            {priceRange.hasRange
                              ? `${formatPrice(priceRange.min)} - ${formatPrice(priceRange.max)}`
                              : formatPrice(priceRange.min)}
                          </p>
                          {listPriceRange ? (
                            <span className="text-xs line-through text-subtle">
                              {listPriceRange.hasRange
                                ? `${formatPrice(listPriceRange.min)} - ${formatPrice(listPriceRange.max)}`
                                : formatPrice(listPriceRange.min)}
                            </span>
                          ) : null}
                        </div>
                      </div>
                    </article>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* Sección Selección Destacada */}
      <section className="px-5 py-16 sm:px-6 sm:py-20 lg:py-24 bg-surface/30 border-t border-border/50">
        <div className="mx-auto max-w-[1240px]">
          <div className="mb-10 flex flex-col gap-4 sm:mb-14 sm:flex-row sm:items-end sm:justify-between">
            <div className="max-w-xl">
              <p className="text-xs uppercase mb-3 tracking-[0.25em] text-subtle">
                Selección especial
              </p>
              <h2 className="font-serif text-4xl font-normal sm:text-5xl">
                Prendas destacadas
              </h2>
            </div>
            <Link
              href="/catalogo"
              className="text-xs uppercase tracking-[0.18em] text-foreground hover:opacity-70 transition-opacity font-medium"
            >
              Ver catálogo completo →
            </Link>
          </div>

          {seleccion.length === 0 ? (
            <p className="text-center text-sm text-muted">
              No hay productos destacados por el momento.
            </p>
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4 lg:gap-6">
              {seleccion.map((item) => {
                const catalogItem = item as unknown as CatalogProduct;
                const imagenes = imagenesDeProducto(item);
                const descuento = getCatalogProductDiscountPercent(catalogItem);
                const tieneRebaja = catalogProductHasSale(catalogItem);
                const priceRange = getCatalogProductPriceRange(catalogItem);
                const listPriceRange = tieneRebaja ? getCatalogProductListPriceRange(catalogItem) : null;

                return (
                  <Link key={item._id} href={`/catalogo/${item._id}`} className="group block">
                    <article className="overflow-hidden rounded-[var(--radius-lg)] border bg-white shadow-[0_10px_30px_rgba(17,17,17,0.03)] transition-transform duration-300 hover:-translate-y-1 active:scale-95 border-border">
                      <div className="relative mb-3 overflow-hidden bg-surface-soft aspect-[3/4]">
                        {descuento > 0 && (
                          <div className="absolute top-3 left-3 z-10 rounded-full px-3 py-1 text-[10px] font-medium uppercase tracking-[0.12em] text-white bg-danger">
                            -{descuento}%
                          </div>
                        )}

                        {imagenes.length > 0 ? (
                          <CarruselImagenes
                            imagenes={imagenes}
                            alt={item.nombre}
                            imgClassName="group-hover:scale-105 transition-transform duration-500"
                            mostrarControles={true}
                            autoPlay={true}
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
                          <span className="rounded-full bg-foreground px-4 py-2 text-[10px] uppercase tracking-[0.15em] text-white">
                            Ver
                          </span>
                        </div>
                      </div>
                      <div className="px-4 py-4 sm:px-5 sm:py-5">
                        <p className="text-sm font-semibold leading-6 text-foreground">{item.nombre}</p>
                        <p className="text-sm font-normal leading-6 text-muted/80">{item.modelo}</p>
                        <div className="mt-1 flex flex-wrap items-baseline gap-2">
                          <p className={`text-sm font-medium ${tieneRebaja ? "text-danger" : "text-foreground"}`}>
                            {priceRange.hasRange
                              ? `${formatPrice(priceRange.min)} - ${formatPrice(priceRange.max)}`
                              : formatPrice(priceRange.min)}
                          </p>
                          {listPriceRange ? (
                            <span className="text-xs line-through text-subtle">
                              {listPriceRange.hasRange
                                ? `${formatPrice(listPriceRange.min)} - ${formatPrice(listPriceRange.max)}`
                                : formatPrice(listPriceRange.min)}
                            </span>
                          ) : null}
                        </div>
                      </div>
                    </article>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* Bloque Sucursales & Marca */}
      <section className="border-t border-border bg-white px-5 py-14 sm:px-6 sm:py-20">
        <div className="mx-auto grid max-w-[1240px] gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-center rounded-[var(--radius-lg)] border border-border bg-surface/50 p-6 sm:p-10">
          <div className="space-y-3">
            <p className="text-[10px] uppercase tracking-[0.22em] text-accent font-semibold">
              Tiendas físicas & Atención directa
            </p>
            <h2 className="font-serif text-3xl sm:text-4xl font-normal text-foreground">
              Visítanos en La Paz y El Alto
            </h2>
            <p className="max-w-xl text-sm sm:text-base leading-relaxed text-muted">
              Prueba nuestras chompas y poleras en persona o retira tus reservas web sin costo adicional en nuestras sucursales de Prado y Tiwanacu.
            </p>
          </div>
          <div className="flex flex-wrap gap-3 lg:justify-end">
            <Link
              href="/ubicaciones"
              className="inline-flex items-center justify-center rounded-full bg-foreground px-6 py-3.5 text-[11px] uppercase tracking-[0.16em] text-background font-medium transition-opacity hover:opacity-90"
            >
              Ver mapa de sucursales
            </Link>
            <Link
              href="/nosotros"
              className="inline-flex items-center justify-center rounded-full border border-border bg-white px-6 py-3.5 text-[11px] uppercase tracking-[0.16em] text-foreground font-medium transition-colors hover:bg-surface"
            >
              Conoce nuestra historia
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
