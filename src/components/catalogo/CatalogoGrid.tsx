"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { FiSearch, FiSliders, FiTag, FiX } from "react-icons/fi";
import CarruselImagenes from "@/components/catalogo/CarruselImagenes";
import { imagenesDeProducto, imagenesDeVariante } from "@/lib/catalogo-imagenes";
import { getProductColorValue, isLightProductColor, sortProductColors } from "@/lib/product-colors";
import { formatPrice } from "@/lib/format";
import {
  catalogProductHasSale,
  catalogVariantIsAvailable,
  getCatalogProductAvailableStock,
  getCatalogProductDiscountPercent,
  getCatalogProductListPriceRange,
  getCatalogProductPriceRange,
  type CatalogProduct,
  type CatalogPaginationMeta,
} from "@/types/catalogo";
import {
  formatPromotionBadgeLabel,
  getPromotionsForProduct,
  type PublicPromotion,
} from "@/types/promociones";

type OrdenKey = "fecha" | "ventas" | "descuento" | "precio-desc" | "precio-asc" | "nombre-asc" | "nombre-desc";

const ORDENES: Array<{ key: OrdenKey; label: string }> = [
  { key: "fecha", label: "Lo más nuevo" },
  { key: "ventas", label: "Lo más popular" },
  { key: "descuento", label: "Mayor descuento" },
  { key: "precio-desc", label: "Precio: mayor a menor" },
  { key: "precio-asc", label: "Precio: menor a mayor" },
  { key: "nombre-asc", label: "Nombre (A-Z)" },
  { key: "nombre-desc", label: "Nombre (Z-A)" },
];

function esNuevo(createdAt?: string): boolean {
  if (!createdAt) return false;
  const timestamp = new Date(createdAt).getTime();
  if (!Number.isFinite(timestamp)) return false;
  return Date.now() - timestamp <= 1000 * 60 * 60 * 24 * 45;
}

function totalStock(producto: CatalogProduct): number {
  return getCatalogProductAvailableStock(producto);
}

function variantesConStock(producto: CatalogProduct) {
  return producto.variantes.filter(catalogVariantIsAvailable);
}

function productoTieneStock(producto: CatalogProduct): boolean {
  return totalStock(producto) > 0;
}

function colorStyle(color: string) {
  const base = getProductColorValue(color);
  return base.startsWith("linear-gradient") ? { background: base } : { backgroundColor: base };
}

interface CatalogoGridProps {
  productos: CatalogProduct[];
  promociones?: PublicPromotion[];
  pagination?: CatalogPaginationMeta;
  filtroInicial?: {
    busqueda?: string;
    categoria?: string;
    color?: string;
    talla?: string;
    orden?: string;
    soloOfertas?: boolean;
    page?: number;
  };
}

export default function CatalogoGrid({ productos, promociones = [], pagination, filtroInicial }: CatalogoGridProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const [busqueda, setBusqueda] = useState(filtroInicial?.busqueda ?? searchParams?.get("q") ?? "");
  const [colorFiltro, setColorFiltro] = useState(filtroInicial?.color ?? searchParams?.get("color") ?? "");
  const [categoriaFiltro, setCategoriaFiltro] = useState(filtroInicial?.categoria ?? searchParams?.get("categoria") ?? "");
  const [tallaFiltro, setTallaFiltro] = useState(filtroInicial?.talla ?? searchParams?.get("talla") ?? "");
  const [soloOfertas, setSoloOfertas] = useState<boolean>(
    filtroInicial?.soloOfertas ?? (searchParams?.get("soloOfertas") === "true" || searchParams?.get("soloOfertas") === "1"),
  );
  const [orden, setOrden] = useState<OrdenKey>(
    ((filtroInicial?.orden || searchParams?.get("orden")) as OrdenKey) || "fecha",
  );
  const [filtrosAbiertos, setFiltrosAbiertos] = useState(false);

  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastParamsStringRef = useRef<string>(searchParams?.toString() ?? "");

  // Sincronizar estado solo cuando la URL cambia externamente (atrás/adelante o breadcrumb)
  useEffect(() => {
    const currentStr = searchParams?.toString() ?? "";
    if (currentStr === lastParamsStringRef.current) return;
    lastParamsStringRef.current = currentStr;

    const qParam = searchParams?.get("q") ?? searchParams?.get("busqueda") ?? "";
    const catParam = searchParams?.get("categoria") ?? "";
    const colParam = searchParams?.get("color") ?? "";
    const talParam = searchParams?.get("talla") ?? "";
    const ofertasParam = searchParams?.get("soloOfertas") === "true" || searchParams?.get("soloOfertas") === "1";
    const ordParam = (searchParams?.get("orden") as OrdenKey) || "fecha";

    if (!searchDebounceRef.current) {
      setBusqueda(qParam);
    }
    setCategoriaFiltro(catParam);
    setColorFiltro(colParam);
    setTallaFiltro(talParam);
    setSoloOfertas(ofertasParam);
    setOrden(ordParam);
  }, [searchParams]);

  useEffect(() => {
    return () => {
      if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    };
  }, []);

  // Bloquear scroll del body cuando el drawer móvil está abierto
  useEffect(() => {
    if (!filtrosAbiertos) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [filtrosAbiertos]);

  const productosConStock = productos.filter(productoTieneStock);

  const categorias = Array.from(
    new Set(productosConStock.map((producto) => producto.categoria).filter((value): value is string => Boolean(value))),
  ).sort();

  const productosBaseFiltro =
    categoriaFiltro && categoriaFiltro !== "todas"
      ? productosConStock.filter((p) => p.categoria?.toLowerCase() === categoriaFiltro.toLowerCase())
      : productosConStock;

  const colores = sortProductColors(
    Array.from(new Set(productosBaseFiltro.flatMap((producto) => variantesConStock(producto).map((variante) => variante.color)))),
  );

  const tallas = Array.from(
    new Set(productosBaseFiltro.flatMap((producto) => variantesConStock(producto).map((variante) => variante.talla))),
  ).sort((a, b) => a.localeCompare(b, "es", { numeric: true, sensitivity: "base" }));

  const buildUrl = useCallback(
    (overrides?: {
      q?: string;
      categoria?: string;
      color?: string;
      talla?: string;
      soloOfertas?: boolean;
      orden?: OrdenKey;
      page?: number;
    }) => {
      const qVal = overrides?.q !== undefined ? overrides.q : busqueda;
      const catVal = overrides?.categoria !== undefined ? overrides.categoria : categoriaFiltro;
      const colVal = overrides?.color !== undefined ? overrides.color : colorFiltro;
      const talVal = overrides?.talla !== undefined ? overrides.talla : tallaFiltro;
      const ofertasVal = overrides?.soloOfertas !== undefined ? overrides.soloOfertas : soloOfertas;
      const ordVal = overrides?.orden !== undefined ? overrides.orden : orden;
      const pageVal = overrides?.page !== undefined ? overrides.page : pagination?.page ?? 1;

      const params = new URLSearchParams();
      if (qVal.trim()) params.set("q", qVal.trim());
      if (catVal && catVal !== "todas") params.set("categoria", catVal);
      if (colVal) params.set("color", colVal);
      if (talVal) params.set("talla", talVal);
      if (ofertasVal) params.set("soloOfertas", "true");
      if (ordVal && ordVal !== "fecha") params.set("orden", ordVal);
      if (pageVal > 1) params.set("page", String(pageVal));
      const qs = params.toString();
      return qs ? `/catalogo?${qs}` : "/catalogo";
    },
    [busqueda, categoriaFiltro, colorFiltro, tallaFiltro, soloOfertas, orden, pagination?.page],
  );

  function syncUrl(overrides: Parameters<typeof buildUrl>[0]) {
    const targetUrl = buildUrl({ ...overrides, page: overrides?.page ?? 1 });
    lastParamsStringRef.current = targetUrl.includes("?") ? targetUrl.split("?")[1] : "";
    startTransition(() => {
      router.replace(targetUrl, { scroll: false });
    });
  }

  function handleSearchChange(nextValue: string) {
    setBusqueda(nextValue);
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    searchDebounceRef.current = setTimeout(() => {
      searchDebounceRef.current = null;
      syncUrl({ q: nextValue, page: 1 });
    }, 350);
  }

  function handleCategoriaChange(nextCategoria: string) {
    setCategoriaFiltro(nextCategoria);
    syncUrl({ categoria: nextCategoria, page: 1 });
  }

  function handleColorChange(nextColor: string) {
    const resolved = colorFiltro === nextColor ? "" : nextColor;
    setColorFiltro(resolved);
    syncUrl({ color: resolved, page: 1 });
  }

  function handleTallaChange(nextTalla: string) {
    const resolved = tallaFiltro === nextTalla ? "" : nextTalla;
    setTallaFiltro(resolved);
    syncUrl({ talla: resolved, page: 1 });
  }

  function handleSoloOfertasChange(nextValue: boolean) {
    setSoloOfertas(nextValue);
    syncUrl({ soloOfertas: nextValue, page: 1 });
  }

  function handleOrdenChange(nextOrden: OrdenKey) {
    setOrden(nextOrden);
    const targetUrl = buildUrl({ orden: nextOrden, page: pagination?.page ?? 1 });
    window.history.replaceState(null, "", targetUrl);
  }

  function limpiarFiltros() {
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    setBusqueda("");
    setColorFiltro("");
    setTallaFiltro("");
    setCategoriaFiltro("");
    setSoloOfertas(false);
    syncUrl({ q: "", color: "", talla: "", categoria: "", soloOfertas: false, page: 1 });
  }

  const termino = busqueda.trim().toLowerCase();
  const filtrados = productosConStock.filter((producto) => {
    const variantesDisponibles = variantesConStock(producto);
    const coincideBusqueda =
      !termino ||
      producto.nombre.toLowerCase().includes(termino) ||
      producto.modelo.toLowerCase().includes(termino) ||
      (producto.categoria ?? "").toLowerCase().includes(termino);

    const coincideColor = !colorFiltro || variantesDisponibles.some((variante) => variante.color === colorFiltro);
    const coincideCategoria =
      !categoriaFiltro ||
      categoriaFiltro === "todas" ||
      producto.categoria?.toLowerCase() === categoriaFiltro.toLowerCase();
    const coincideTalla = !tallaFiltro || variantesDisponibles.some((variante) => variante.talla === tallaFiltro);
    const coincideOferta = !soloOfertas || catalogProductHasSale(producto);

    return coincideBusqueda && coincideColor && coincideCategoria && coincideTalla && coincideOferta;
  });

  const productosVisibles = [...filtrados].sort((a, b) => {
    switch (orden) {
      case "ventas":
        return (b.totalVendidos ?? 0) - (a.totalVendidos ?? 0);
      case "descuento":
        return getCatalogProductDiscountPercent(b) - getCatalogProductDiscountPercent(a);
      case "precio-desc": {
        const pA = getCatalogProductPriceRange(a).max;
        const pB = getCatalogProductPriceRange(b).max;
        return pB - pA;
      }
      case "precio-asc": {
        const pA = getCatalogProductPriceRange(a).min;
        const pB = getCatalogProductPriceRange(b).min;
        return pA - pB;
      }
      case "nombre-asc":
        return a.nombre.localeCompare(b.nombre, "es", { sensitivity: "base" });
      case "nombre-desc":
        return b.nombre.localeCompare(a.nombre, "es", { sensitivity: "base" });
      case "fecha":
        return new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime();
      default:
        return (b.totalVendidos ?? 0) - (a.totalVendidos ?? 0);
    }
  });

  const filtrosActivos = [
    termino,
    colorFiltro,
    tallaFiltro,
    categoriaFiltro && categoriaFiltro !== "todas" ? categoriaFiltro : "",
    soloOfertas ? "ofertas" : "",
  ].filter(Boolean).length;

  const filterFormContent = (
    <div className="space-y-6">
      <div>
        <p className="block text-[10px] uppercase mb-3 tracking-[0.18em] text-subtle">
          Ofertas y rebajas
        </p>
        <button
          type="button"
          onClick={() => handleSoloOfertasChange(!soloOfertas)}
          aria-pressed={soloOfertas}
          className={`flex w-full items-center justify-between rounded-[var(--radius-md)] border px-4 py-3 text-left transition-all cursor-pointer ${
            soloOfertas
              ? "border-danger bg-danger/10 text-danger font-medium"
              : "border-border bg-background text-foreground hover:border-foreground/50"
          }`}
        >
          <span className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.12em]">
            <FiTag className="h-3.5 w-3.5" aria-hidden="true" />
            Solo ofertas
          </span>
          <span
            className={`inline-flex h-5 w-9 items-center rounded-full p-0.5 transition-colors ${
              soloOfertas ? "bg-danger justify-end" : "bg-border justify-start"
            }`}
          >
            <span className="h-4 w-4 rounded-full bg-white shadow-2xs" />
          </span>
        </button>
      </div>

      <div>
        <label htmlFor="catalog-search" className="block text-[10px] uppercase mb-3 tracking-[0.18em] text-subtle">
          Buscar en catálogo
        </label>
        <div className="relative">
          <FiSearch className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-subtle" />
          <input
            id="catalog-search"
            type="text"
            value={busqueda}
            onChange={(event) => handleSearchChange(event.target.value)}
            placeholder="Nombre, modelo o categoría"
            className="w-full rounded-[var(--radius-md)] border border-border pl-10 pr-9 py-3 text-sm focus:outline-none bg-background text-foreground placeholder:text-subtle/50 transition-colors focus:border-foreground"
          />
          {busqueda && (
            <button
              type="button"
              onClick={() => {
                setBusqueda("");
                syncUrl({ q: "", page: 1 });
              }}
              aria-label="Limpiar búsqueda"
              className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-full p-1 text-subtle hover:text-foreground"
            >
              <FiX className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {colores.length > 0 && (
        <div>
          <div className="mb-4 flex items-center justify-between gap-3">
            <p className="text-[10px] uppercase tracking-[0.18em] text-subtle">Color</p>
            {colorFiltro ? (
              <button
                type="button"
                onClick={() => {
                  setColorFiltro("");
                  syncUrl({ color: "", page: 1 });
                }}
                className="text-[10px] uppercase tracking-[0.14em] text-subtle hover:underline"
              >
                Limpiar
              </button>
            ) : null}
          </div>
          <div className="grid grid-cols-5 gap-3">
            {colores.map((color) => {
              const activo = colorFiltro === color;
              return (
                <button
                  key={color}
                  type="button"
                  title={color}
                  aria-label={`Filtrar por color ${color}`}
                  onClick={() => handleColorChange(color)}
                  className="h-10 w-10 rounded-full border transition-all hover:scale-110 active:scale-95 cursor-pointer"
                  style={{
                    ...colorStyle(color),
                    borderColor: activo
                      ? "var(--foreground)"
                      : isLightProductColor(color)
                        ? "var(--subtle)"
                        : "var(--border)",
                    boxShadow: activo ? "0 0 0 3px rgba(0,0,0,0.15)" : "none",
                  }}
                  aria-pressed={activo}
                />
              );
            })}
          </div>
        </div>
      )}

      {tallas.length > 0 && (
        <div>
          <div className="mb-4 flex items-center justify-between gap-3">
            <p className="text-[10px] uppercase tracking-[0.18em] text-subtle">Talla</p>
            {tallaFiltro ? (
              <button
                type="button"
                onClick={() => {
                  setTallaFiltro("");
                  syncUrl({ talla: "", page: 1 });
                }}
                className="text-[10px] uppercase tracking-[0.14em] text-subtle hover:underline"
              >
                Limpiar
              </button>
            ) : null}
          </div>
          <div className="flex flex-wrap gap-2">
            {tallas.map((talla) => {
              const activa = tallaFiltro === talla;
              return (
                <button
                  key={talla}
                  type="button"
                  onClick={() => handleTallaChange(talla)}
                  className="min-w-11 rounded-full border px-4 py-2.5 text-[11px] uppercase transition-all active:scale-95 tracking-[0.12em] cursor-pointer"
                  style={{
                    borderColor: activa ? "var(--foreground)" : "var(--border)",
                    background: activa ? "var(--foreground)" : "var(--background)",
                    color: activa ? "var(--background)" : "var(--muted)",
                  }}
                  aria-pressed={activa}
                >
                  {talla}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="flex flex-col gap-6 lg:gap-8">
      {/* Pestañas de categorías + acceso rápido Solo Ofertas */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar" role="tablist" aria-label="Categorías de prendas">
        <button
          type="button"
          onClick={() => handleCategoriaChange("")}
          className={`whitespace-nowrap rounded-full border px-5 py-2.5 text-[11px] uppercase transition-all tracking-[0.14em] shadow-sm cursor-pointer ${!categoriaFiltro || categoriaFiltro === "todas"
            ? "bg-foreground text-background border-foreground font-semibold"
            : "bg-white text-muted border-border hover:bg-surface"
            }`}
          aria-pressed={!categoriaFiltro || categoriaFiltro === "todas"}
        >
          Todas las prendas
        </button>
        <button
          type="button"
          onClick={() => handleSoloOfertasChange(!soloOfertas)}
          className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-5 py-2.5 text-[11px] uppercase transition-all tracking-[0.14em] shadow-sm cursor-pointer ${
            soloOfertas
              ? "bg-danger text-white border-danger font-semibold"
              : "bg-white text-danger border-danger/35 hover:bg-danger/5"
          }`}
          aria-pressed={soloOfertas}
        >
          <FiTag className="h-3 w-3" aria-hidden="true" />
          Solo ofertas
        </button>
        {categorias.map((categoria) => {
          const activa = categoriaFiltro.toLowerCase() === categoria.toLowerCase();
          return (
            <button
              key={categoria}
              type="button"
              onClick={() => handleCategoriaChange(categoria)}
              className={`whitespace-nowrap rounded-full border px-5 py-2.5 text-[11px] uppercase transition-all tracking-[0.14em] shadow-sm cursor-pointer ${activa
                ? "bg-foreground text-background border-foreground font-semibold"
                : "bg-white text-muted border-border hover:bg-surface"
                }`}
              aria-pressed={activa}
            >
              {categoria}
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[280px_minmax(0,1fr)] lg:gap-10">
        {/* Sidebar Desktop */}
        <aside className="hidden lg:block space-y-4 lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-[var(--radius-lg)] border border-border bg-white px-6 py-5 shadow-sm">
            <p className="text-[10px] uppercase tracking-[0.2em] text-subtle">Vista catálogo</p>
            <p className="mt-3 text-sm leading-6 text-muted">
              {pagination?.total ? `${pagination.total} prendas en total` : `${productosConStock.length} productos disponibles`}.
            </p>
            {filtrosActivos > 0 && (
              <button
                type="button"
                onClick={limpiarFiltros}
                className="mt-4 inline-flex items-center gap-1.5 rounded-full border border-border px-4 py-2 text-[11px] uppercase tracking-[0.14em] text-muted hover:text-foreground hover:border-foreground transition-colors cursor-pointer"
              >
                <FiX className="h-3.5 w-3.5" />
                Limpiar filtros ({filtrosActivos})
              </button>
            )}
          </div>

          <div className="rounded-[var(--radius-lg)] border border-border bg-white px-6 py-6 shadow-sm">
            {filterFormContent}
          </div>
        </aside>

        <section>
          {/* Barra de resultados + orden + botón filtros móvil */}
          <div className="mb-5 flex flex-col gap-4 rounded-[var(--radius-lg)] border border-border bg-white px-5 py-5 sm:flex-row sm:items-end sm:justify-between sm:px-6 shadow-sm">
            <div className="flex items-center justify-between gap-3 w-full sm:w-auto">
              <div>
                <p className="text-[10px] uppercase tracking-[0.18em] text-subtle">Resultado actual</p>
                <p className="mt-1.5 text-sm leading-6 text-muted">
                  {productosVisibles.length} prenda{productosVisibles.length !== 1 ? "s" : ""} visible{productosVisibles.length !== 1 ? "s" : ""}
                  {pagination?.total ? ` (de ${pagination.total} totales)` : ""}.
                  {isPending ? " Actualizando..." : ""}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setFiltrosAbiertos(true)}
                className="lg:hidden inline-flex items-center gap-2 rounded-full border border-border bg-background px-4 py-2.5 text-[11px] uppercase tracking-[0.14em] text-foreground active:scale-95 transition-transform shadow-xs relative shrink-0"
                aria-label="Abrir filtros"
              >
                <FiSliders className="w-4 h-4" />
                <span>Filtros</span>
                {filtrosActivos > 0 && (
                  <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-accent px-1 text-[10px] text-white font-bold">
                    {filtrosActivos}
                  </span>
                )}
              </button>
            </div>

            <div className="w-full sm:w-[260px]">
              <label htmlFor="catalog-sort" className="mb-1.5 block text-[10px] uppercase tracking-[0.18em] text-subtle">
                Ordenar por
              </label>
              <select
                id="catalog-sort"
                value={orden}
                onChange={(event) => handleOrdenChange(event.target.value as OrdenKey)}
                className="w-full rounded-[var(--radius-md)] border border-border px-4 py-2.5 text-sm focus:outline-none bg-background text-foreground transition-colors focus:border-foreground"
              >
                {ORDENES.map((opcion) => (
                  <option key={opcion.key} value={opcion.key}>
                    {opcion.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Chips de filtros activos removibles */}
          {filtrosActivos > 0 && (
            <div className="mb-6 flex flex-wrap items-center gap-2">
              {soloOfertas && (
                <FilterChip
                  label="Solo ofertas"
                  onRemove={() => handleSoloOfertasChange(false)}
                />
              )}
              {termino && (
                <FilterChip
                  label={`Búsqueda: "${busqueda.trim()}"`}
                  onRemove={() => {
                    setBusqueda("");
                    syncUrl({ q: "", page: 1 });
                  }}
                />
              )}
              {categoriaFiltro && categoriaFiltro !== "todas" && (
                <FilterChip
                  label={`Categoría: ${categoriaFiltro}`}
                  onRemove={() => handleCategoriaChange("")}
                />
              )}
              {colorFiltro && (
                <FilterChip
                  label={`Color: ${colorFiltro}`}
                  onRemove={() => {
                    setColorFiltro("");
                    syncUrl({ color: "", page: 1 });
                  }}
                />
              )}
              {tallaFiltro && (
                <FilterChip
                  label={`Talla: ${tallaFiltro}`}
                  onRemove={() => {
                    setTallaFiltro("");
                    syncUrl({ talla: "", page: 1 });
                  }}
                />
              )}
              <button
                type="button"
                onClick={limpiarFiltros}
                className="text-[11px] uppercase tracking-[0.12em] text-subtle hover:text-foreground underline underline-offset-4 px-2 py-1 cursor-pointer"
              >
                Limpiar todo
              </button>
            </div>
          )}

          {productosVisibles.length === 0 ? (
            <div className="rounded-[var(--radius-lg)] border border-border bg-white px-6 py-16 text-center shadow-sm">
              <p className="font-serif text-2xl text-foreground">Sin resultados</p>
              <p className="text-sm mt-3 text-muted max-w-md mx-auto">
                No encontramos prendas con los filtros actuales. Prueba limpiando los filtros para explorar todo el catálogo.
              </p>
              {filtrosActivos > 0 && (
                <button
                  type="button"
                  onClick={limpiarFiltros}
                  className="mt-5 inline-flex items-center rounded-full border border-foreground bg-foreground text-background px-6 py-3 text-[11px] uppercase tracking-[0.16em] active:scale-95 transition-transform cursor-pointer"
                >
                  Ver todo el catálogo
                </button>
              )}
            </div>
          ) : (
            <div className={`grid grid-cols-2 gap-4 sm:gap-6 xl:grid-cols-3 transition-opacity ${isPending ? "opacity-60" : "opacity-100"}`}>
              {productosVisibles.map((producto) => (
                <ProductoCard
                  key={producto._id}
                  producto={producto}
                  promociones={getPromotionsForProduct(promociones, producto)}
                  colorFiltro={colorFiltro}
                  tallaFiltro={tallaFiltro}
                />
              ))}
            </div>
          )}

          {/* Barra de paginación del servidor */}
          {pagination && pagination.totalPages > 1 && (
            <nav
              aria-label="Paginación del catálogo"
              className="mt-12 flex flex-wrap items-center justify-center gap-2 pt-8 border-t border-border"
            >
              {pagination.page > 1 && (
                <Link
                  href={buildUrl({ page: pagination.page - 1 })}
                  className="inline-flex items-center justify-center px-4 py-2 rounded-full border border-border text-xs uppercase tracking-wider text-foreground hover:bg-surface-soft transition-colors active:scale-95"
                >
                  ← Anterior
                </Link>
              )}

              {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((p) => {
                const isCurrent = p === pagination.page;
                return (
                  <Link
                    key={p}
                    href={buildUrl({ page: p })}
                    aria-current={isCurrent ? "page" : undefined}
                    className={`inline-flex items-center justify-center h-9 w-9 rounded-full text-xs font-medium transition-colors ${isCurrent
                      ? "bg-foreground text-background font-semibold"
                      : "border border-border text-foreground hover:bg-surface-soft"
                      }`}
                  >
                    {p}
                  </Link>
                );
              })}

              {pagination.page < pagination.totalPages && (
                <Link
                  href={buildUrl({ page: pagination.page + 1 })}
                  className="inline-flex items-center justify-center px-4 py-2 rounded-full border border-border text-xs uppercase tracking-wider text-foreground hover:bg-surface-soft transition-colors active:scale-95"
                >
                  Siguiente →
                </Link>
              )}
            </nav>
          )}
        </section>
      </div>

      {/* Drawer / Bottom Sheet de filtros en móvil */}
      {filtrosAbiertos && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Filtros del catálogo"
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-xs lg:hidden"
          onClick={() => setFiltrosAbiertos(false)}
        >
          <div
            className="w-full max-h-[85vh] sm:max-w-md flex flex-col rounded-t-[28px] sm:rounded-[28px] bg-white border border-border shadow-2xl overflow-hidden animate-slide-in-right"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-border px-5 py-4 bg-background">
              <div>
                <p className="text-[10px] uppercase tracking-[0.18em] text-subtle">Refinar búsqueda</p>
                <h2 className="font-serif text-lg text-foreground">Filtros</h2>
              </div>
              <button
                type="button"
                onClick={() => setFiltrosAbiertos(false)}
                aria-label="Cerrar filtros"
                className="flex h-9 w-9 items-center justify-center rounded-full border border-border text-foreground hover:bg-surface"
              >
                <FiX className="h-4 w-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-5">{filterFormContent}</div>

            <div className="flex items-center gap-3 border-t border-border px-5 py-4 bg-background mobile-safe-bottom">
              {filtrosActivos > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    limpiarFiltros();
                    setFiltrosAbiertos(false);
                  }}
                  className="rounded-full border border-border bg-white px-5 py-3 text-[11px] uppercase tracking-[0.14em] text-muted"
                >
                  Limpiar
                </button>
              )}
              <button
                type="button"
                onClick={() => setFiltrosAbiertos(false)}
                className="flex-1 rounded-full bg-foreground px-6 py-3 text-[11px] uppercase tracking-[0.16em] text-background font-medium"
              >
                Ver {productosVisibles.length} prenda{productosVisibles.length !== 1 ? "s" : ""}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function FilterChip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <button
      type="button"
      onClick={onRemove}
      className="inline-flex items-center gap-1.5 rounded-full border border-border bg-white px-3.5 py-1.5 text-[11px] text-foreground hover:border-foreground transition-colors cursor-pointer"
    >
      <span>{label}</span>
      <FiX className="h-3 w-3 text-subtle" aria-hidden="true" />
    </button>
  );
}

function ProductoCard({
  producto,
  promociones = [],
  colorFiltro,
  tallaFiltro,
}: {
  producto: CatalogProduct;
  promociones?: PublicPromotion[];
  colorFiltro?: string;
  tallaFiltro?: string;
}) {
  const variantesDisponibles = variantesConStock(producto);

  let imagenes = imagenesDeProducto(producto);
  if (colorFiltro || tallaFiltro) {
    const varianteElegida = variantesDisponibles.find(
      (v) => (!colorFiltro || v.color === colorFiltro) && (!tallaFiltro || v.talla === tallaFiltro),
    );
    if (varianteElegida) {
      const imagenesVariante = imagenesDeVariante(varianteElegida);
      if (imagenesVariante.length > 0) {
        imagenes = imagenesVariante;
      }
    }
  }

  const queryParams = new URLSearchParams();
  if (colorFiltro) queryParams.set("color", colorFiltro);
  if (tallaFiltro) queryParams.set("talla", tallaFiltro);
  const queryString = queryParams.toString() ? `?${queryParams.toString()}` : "";
  const href = `/catalogo/${producto._id}${queryString}`;

  const nuevo = esNuevo(producto.createdAt);
  const descuento = getCatalogProductDiscountPercent(producto);
  const tieneRebaja = catalogProductHasSale(producto);
  const stock = totalStock(producto);
  const colores = sortProductColors(Array.from(new Set(variantesDisponibles.map((variante) => variante.color))));
  const tallas = Array.from(new Set(variantesDisponibles.map((variante) => variante.talla))).sort((a, b) =>
    a.localeCompare(b, "es", { numeric: true, sensitivity: "base" }),
  );
  const priceRange = getCatalogProductPriceRange(producto);
  const listPriceRange = tieneRebaja ? getCatalogProductListPriceRange(producto) : null;
  const promoBadges = promociones.slice(0, 2);

  return (
    <Link href={href} className="group block">
      <article className="h-full overflow-hidden rounded-[var(--radius-lg)] border border-border bg-white transition-all duration-300 hover:-translate-y-1 active:scale-[0.98] hover:shadow-[0_18px_40px_rgba(17,17,17,0.06)]">
        <div className="relative aspect-[3/4] overflow-hidden bg-surface-soft">
          <div className="absolute left-3 top-3 z-10 flex flex-col items-start gap-1.5 max-w-[calc(100%-1.5rem)]">
            {descuento > 0 && (
              <span className="rounded-full bg-danger px-3 py-1 text-[10px] font-semibold uppercase text-white tracking-[0.12em] shadow-xs">
                -{descuento}%
              </span>
            )}
            {descuento === 0 && nuevo && (
              <span className="rounded-full bg-accent px-3 py-1 text-[10px] uppercase text-white tracking-[0.12em] shadow-xs">
                Nuevo
              </span>
            )}
            {promoBadges.map((promo, idx) => (
              <span
                key={promo._id ?? promo.id ?? `${promo.nombre}-${idx}`}
                title={promo.descripcion || promo.nombre}
                className="inline-flex items-center gap-1 rounded-full border border-emerald-700/20 bg-emerald-950/88 backdrop-blur-xs px-2.5 py-1 text-[9px] sm:text-[10px] font-semibold uppercase text-emerald-50 tracking-[0.1em] shadow-xs truncate max-w-full"
              >
                <FiTag className="h-2.5 w-2.5 shrink-0" aria-hidden="true" />
                <span className="truncate">{formatPromotionBadgeLabel(promo)}</span>
              </span>
            ))}
          </div>

          {imagenes.length > 0 ? (
            <CarruselImagenes
              imagenes={imagenes}
              alt={producto.nombre}
              imgClassName="group-hover:scale-105 transition-transform duration-500"
              mostrarControles={true}
              autoPlay={true}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-subtle/40">
              <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            </div>
          )}

          <div className="absolute inset-x-3 bottom-3 flex justify-center opacity-0 transition-opacity duration-300 md:group-hover:opacity-100 pointer-events-none">
            <span className="rounded-full bg-foreground/90 backdrop-blur-xs px-4 py-1.5 text-[10px] uppercase tracking-[0.18em] text-white">
              Ver prenda
            </span>
          </div>
        </div>

        <div className="p-4 sm:p-5">
          <p className="text-[10px] uppercase tracking-[0.14em] text-subtle">
            {(producto.nombre ?? "").toUpperCase()}
          </p>
          <h3 className="mt-2 min-h-[42px] text-sm leading-6 sm:min-h-[50px] sm:text-[0.98rem] text-foreground font-medium">
            {producto.modelo}
          </h3>
          <div className="mt-3 flex flex-wrap items-baseline gap-2">
            <p className={`text-lg font-semibold sm:text-xl font-serif ${tieneRebaja ? "text-danger" : "text-foreground"}`}>
              {priceRange.hasRange
                ? `${formatPrice(priceRange.min)} - ${formatPrice(priceRange.max)}`
                : formatPrice(priceRange.min)}
            </p>
            {listPriceRange && (
              <span className="text-xs line-through text-subtle">
                {listPriceRange.hasRange
                  ? `${formatPrice(listPriceRange.min)} - ${formatPrice(listPriceRange.max)}`
                  : formatPrice(listPriceRange.min)}
              </span>
            )}
          </div>
          <p className={`mt-2 text-[11px] ${stock > 0 ? "text-subtle" : "text-danger"}`}>
            Ver colores y tallas disponibles
          </p>
          {/*}
          <div className="mt-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-1.5">
              {colores.slice(0, 4).map((color) => (
                <span
                  key={color}
                  className="block h-4 w-4 rounded-full border"
                  style={{
                    ...colorStyle(color),
                    borderColor: isLightProductColor(color) ? "var(--subtle)" : "var(--border)",
                  }}
                  title={color}
                />
              ))}
              {colores.length > 4 ? (
                <span className="text-[10px] text-subtle">+{colores.length - 4}</span>
              ) : null}
            </div>
            <span className="text-[10px] uppercase tracking-[0.12em] text-subtle">
              {tallas.length} talla{tallas.length !== 1 ? "s" : ""}
            </span>
          </div>*/}
        </div>
      </article>
    </Link>
  );
}
