"use client";

import Link from "next/link";
import { useState } from "react";
import { FiSliders } from "react-icons/fi";
import CarruselImagenes from "@/components/catalogo/CarruselImagenes";
import { imagenesDeProducto, imagenesDeVariante } from "@/lib/catalogo-imagenes";
import { getProductColorValue, isLightProductColor, sortProductColors } from "@/lib/product-colors";
import { catalogVariantIsAvailable, getCatalogProductAvailableStock, type CatalogProduct } from "@/types/catalogo";

type OrdenKey = "ventas" | "fecha" | "descuento" | "precio-desc" | "precio-asc" | "nombre-asc" | "nombre-desc";

const ORDENES: Array<{ key: OrdenKey; label: string }> = [
  { key: "ventas", label: "Lo mas Popular" },
  { key: "fecha", label: "Lo mas Nuevo" },
  { key: "descuento", label: "Descuento" },
  { key: "precio-desc", label: "Precio: mayor a menor" },
  { key: "precio-asc", label: "Precio: menor a mayor" },
  { key: "nombre-asc", label: "Nombre, ascendente" },
  { key: "nombre-desc", label: "Nombre, descendente" },
];

function formatearPrecio(precio: number): string {
  return `Bs ${new Intl.NumberFormat("es-BO", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(precio)}`;
}

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

export default function CatalogoGrid({ productos }: { productos: CatalogProduct[] }) {
  const [busqueda, setBusqueda] = useState("");
  const [colorFiltro, setColorFiltro] = useState("");
  const [categoriaFiltro, setCategoriaFiltro] = useState("");
  const [tallaFiltro, setTallaFiltro] = useState("");
  const [orden, setOrden] = useState<OrdenKey>("ventas");
  const [filtrosAbiertos, setFiltrosAbiertos] = useState(false);

  const productosConStock = productos.filter(productoTieneStock);
  const categorias = Array.from(new Set(productosConStock.map((producto) => producto.categoria).filter((value): value is string => Boolean(value)))).sort();
  const categoriaActiva = categoriaFiltro || categorias[0] || "";

  const productosDeCategoria = productosConStock.filter(p => p.categoria === categoriaActiva);

  const colores = sortProductColors(Array.from(new Set(productosDeCategoria.flatMap((producto) => variantesConStock(producto).map((variante) => variante.color)))));
  
  const tallas = Array.from(new Set(productosDeCategoria.flatMap((producto) => variantesConStock(producto).map((variante) => variante.talla)))).sort(
    (a, b) => a.localeCompare(b, "es", { numeric: true, sensitivity: "base" }),
  );

  const termino = busqueda.trim().toLowerCase();
  const filtrados = productosConStock.filter((producto) => {
    const variantesDisponibles = variantesConStock(producto);
    const coincideBusqueda =
      !termino ||
      producto.nombre.toLowerCase().includes(termino) ||
      producto.modelo.toLowerCase().includes(termino) ||
      (producto.categoria ?? "").toLowerCase().includes(termino);

    const coincideColor = !colorFiltro || variantesDisponibles.some((variante) => variante.color === colorFiltro);
    const coincideCategoria = producto.categoria === categoriaActiva;
    const coincideTalla = !tallaFiltro || variantesDisponibles.some((variante) => variante.talla === tallaFiltro);
    return coincideBusqueda && coincideColor && coincideCategoria && coincideTalla;
  });

  const productosVisibles = [...filtrados].sort((a, b) => {
    switch (orden) {
      case "ventas":
        return (b.totalVendidos ?? 0) - (a.totalVendidos ?? 0);
      case "descuento":
        return (b.descuento ?? 0) - (a.descuento ?? 0);
      case "precio-desc":
        return b.precioVenta - a.precioVenta;
      case "precio-asc":
        return a.precioVenta - b.precioVenta;
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

  const filtrosActivos = [termino, colorFiltro, tallaFiltro].filter(Boolean).length;

  function limpiarFiltros() {
    setBusqueda("");
    setColorFiltro("");
    setTallaFiltro("");
  }

  return (
    <div className="flex flex-col gap-6 lg:gap-10">
      {/* Pestañas de categorías obligatorias */}
      {categorias.length > 0 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {categorias.map((categoria) => {
            const activa = categoria === categoriaActiva;
            return (
              <button
                key={categoria}
                type="button"
                onClick={() => setCategoriaFiltro(categoria)}
                className={`whitespace-nowrap rounded-full border px-5 py-2.5 text-[11px] uppercase transition-all tracking-[0.14em] shadow-sm ${activa
                  ? "bg-foreground text-background border-foreground font-semibold"
                  : "bg-white text-muted border-border hover:bg-background"
                  }`}
                aria-pressed={activa}
              >
                {categoria}
              </button>
            );
          })}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[280px_minmax(0,1fr)] lg:gap-10">

        <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
          <div className="hidden lg:block rounded-[var(--radius-lg)] border border-border bg-white px-5 py-5 sm:px-6 shadow-sm">
            <p className="text-[10px] uppercase tracking-[0.2em] text-subtle">
              Vista catálogo
            </p>

            <p className="mt-3 text-sm leading-6 text-subtle">
              {productosConStock.length} producto{productosConStock.length !== 1 ? "s" : ""} disponibles listos para reserva.
            </p>

            <div className="mt-5 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => setFiltrosAbiertos((actual) => !actual)}
                className="inline-flex items-center rounded-full border border-border px-4 py-3 text-[11px] uppercase lg:hidden active:scale-95 bg-background text-foreground tracking-[0.16em]"
              >
                {filtrosAbiertos ? "Ocultar filtros" : `Ver filtros${filtrosActivos ? ` (${filtrosActivos})` : ""}`}
              </button>
              {filtrosActivos > 0 ? (
                <button
                  type="button"
                  onClick={limpiarFiltros}
                  className="inline-flex items-center rounded-full border border-border px-4 py-3 text-[11px] uppercase tracking-[0.16em] text-subtle"
                >
                  Limpiar filtros
                </button>
              ) : null}
            </div>
          </div>

          <div className={`${filtrosAbiertos ? "block" : "hidden"} rounded-[var(--radius-lg)] border border-border bg-white px-5 py-5 sm:px-6 lg:block shadow-sm`}>
            <div>
              <p className="text-[10px] uppercase mb-3 tracking-[0.18em] text-subtle">
                Buscar
              </p>
              <input
                type="text"
                value={busqueda}
                onChange={(event) => setBusqueda(event.target.value)}
                placeholder="Nombre, modelo o categoría"
                className="w-full rounded-[var(--radius-md)] border border-border px-4 py-3 text-sm focus:outline-none bg-background text-foreground placeholder:text-subtle/50 transition-colors focus:border-foreground"
              />
            </div>

            <div className="mt-6">
              <div className="mb-4 flex items-center justify-between gap-3">
                <p className="text-[10px] uppercase tracking-[0.18em] text-subtle">
                  Color
                </p>
                {colorFiltro ? (
                  <button
                    type="button"
                    onClick={() => setColorFiltro("")}
                    className="text-[10px] uppercase tracking-[0.14em] text-subtle"
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
                      onClick={() => setColorFiltro((actual) => (actual === color ? "" : color))}
                      className="h-10 w-10 rounded-full border transition-all hover:scale-110 active:scale-95"
                      style={{
                        ...colorStyle(color),
                        borderColor: activo ? "var(--foreground)" : isLightProductColor(color) ? "var(--subtle)" : "var(--border)",
                        boxShadow: activo ? "0 0 0 3px rgba(0,0,0,0.08)" : "none",
                      }}
                      aria-pressed={activo}
                    />
                  );
                })}
              </div>
            </div>


            <div className="mt-6">
              <div className="mb-4 flex items-center justify-between gap-3">
                <p className="text-[10px] uppercase tracking-[0.18em] text-subtle">
                  Talla
                </p>
                {tallaFiltro ? (
                  <button
                    type="button"
                    onClick={() => setTallaFiltro("")}
                    className="text-[10px] uppercase tracking-[0.14em] text-subtle"
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
                      onClick={() => setTallaFiltro((actual) => (actual === talla ? "" : talla))}
                      className="min-w-11 rounded-full border px-4 py-2.5 text-[11px] uppercase transition-all active:scale-95 tracking-[0.12em]"
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
          </div>
        </aside>

        <section>
          <div className="mb-6 flex flex-col gap-4 rounded-[var(--radius-lg)] border border-border bg-white px-5 py-5 sm:flex-row sm:items-end sm:justify-between sm:px-6 shadow-sm">
            <div className="flex items-center justify-between w-full sm:w-auto">
              <div>
                <p className="text-[10px] uppercase tracking-[0.18em] text-subtle">
                  Resultado actual
                </p>
                <p className="mt-2 text-sm leading-6 text-muted">
                  {productosVisibles.length} resultado{productosVisibles.length !== 1 ? "s" : ""} para explorar.
                </p>
              </div>
              
              <button
                type="button"
                onClick={() => setFiltrosAbiertos((actual) => !actual)}
                className="lg:hidden flex items-center justify-center w-10 h-10 rounded-full border border-border bg-background text-foreground active:scale-90 transition-transform shadow-sm relative"
                aria-label={filtrosAbiertos ? "Cerrar filtros" : "Ver filtros"}
              >
                <FiSliders className="w-4 h-4" />
                {filtrosActivos > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-foreground text-[9px] text-background font-bold">
                    {filtrosActivos}
                  </span>
                )}
              </button>
            </div>

            <div className="w-full sm:w-[280px]">
              <label className="mb-2 block text-[10px] uppercase tracking-[0.18em] text-subtle">
                Ordenar por
              </label>
              <select
                value={orden}
                onChange={(event) => setOrden(event.target.value as OrdenKey)}
                className="w-full rounded-[var(--radius-md)] border border-border px-4 py-3 text-sm focus:outline-none bg-background text-foreground transition-colors focus:border-foreground"
              >
                {ORDENES.map((opcion) => (
                  <option key={opcion.key} value={opcion.key}>
                    {opcion.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {productosVisibles.length === 0 ? (
            <div className="rounded-[var(--radius-lg)] border border-border bg-white px-6 py-16 text-center shadow-sm">
              <p className="text-xl uppercase tracking-[0.18em] text-foreground" style={{ fontFamily: "Georgia, serif" }}>Sin resultados</p>
              <p className="text-sm mt-3 text-subtle">
                Prueba con otro término o limpia los filtros para ver más productos.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:gap-6 xl:grid-cols-3">
              {productosVisibles.map((producto) => (
                <ProductoCard key={producto._id} producto={producto} colorFiltro={colorFiltro} tallaFiltro={tallaFiltro} />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function ProductoCard({ producto, colorFiltro, tallaFiltro }: { producto: CatalogProduct, colorFiltro?: string, tallaFiltro?: string }) {
  const variantesDisponibles = variantesConStock(producto);

  let imagenes = imagenesDeProducto(producto);
  if (colorFiltro || tallaFiltro) {
    const varianteElegida = variantesDisponibles.find(v => 
      (!colorFiltro || v.color === colorFiltro) && (!tallaFiltro || v.talla === tallaFiltro)
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
  const descuento = producto.descuento ?? 0;
  const stock = totalStock(producto);
  const colores = sortProductColors(Array.from(new Set(variantesDisponibles.map((variante) => variante.color))));
  const tallas = Array.from(new Set(variantesDisponibles.map((variante) => variante.talla))).sort((a, b) =>
    a.localeCompare(b, "es", { numeric: true, sensitivity: "base" }),
  );

  return (
    <Link href={href} className="group block">
      <article className="h-full overflow-hidden rounded-[var(--radius-lg)] border border-border bg-white transition-all duration-300 hover:-translate-y-1 active:scale-95 hover:shadow-[0_18px_40px_rgba(17,17,17,0.06)]">
        <div className="relative aspect-[3/4] overflow-hidden bg-background">
          {descuento > 0 && (
            <span className="absolute left-3 top-3 z-10 rounded-full bg-accent px-3 py-1 text-[10px] uppercase text-white tracking-[0.12em]">
              -{descuento}%
            </span>
          )}
          {descuento === 0 && nuevo && (
            <span className="absolute left-3 top-3 z-10 rounded-full bg-accent px-3 py-1 text-[10px] uppercase text-white tracking-[0.12em]">
              Nuevo
            </span>
          )}

          {imagenes.length > 0 ? (
            <CarruselImagenes
              imagenes={imagenes}
              alt={producto.nombre}
              imgClassName="group-hover:scale-105 transition-transform duration-500"
              duracionMs={2800}
              mostrarControles={false}
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
        </div>

        <div className="p-4 sm:p-5">
          <p className="text-[10px] uppercase tracking-[0.14em] text-subtle">
            {(producto.nombre ?? '').toUpperCase()}
          </p>
          <h3 className="mt-2 min-h-[42px] text-sm leading-6 sm:min-h-[50px] sm:text-[0.98rem] text-foreground">
            {producto.modelo}
          </h3>
          <p className="mt-4 text-xl font-semibold sm:text-2xl text-foreground" style={{ fontFamily: "Georgia, serif" }}>
            {formatearPrecio(producto.precioVenta)}
          </p>
          <p className={`mt-2 text-[11px] ${stock > 0 ? "text-subtle" : "text-danger"}`}>
            {stock > 0 ? `${stock} unidades disponibles` : "Sin stock"}
          </p>

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
                />
              ))}
              {colores.length > 4 ? (
                <span className="text-[10px] text-subtle">+{colores.length - 4}</span>
              ) : null}
            </div>
            <span className="text-[10px] uppercase tracking-[0.12em] text-subtle">
              {tallas.length} talla{tallas.length !== 1 ? "s" : ""}
            </span>
          </div>
        </div>
      </article>
    </Link>
  );
}
