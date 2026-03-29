"use client";

import Link from "next/link";
import { useState } from "react";
import CarruselImagenes from "@/components/catalogo/CarruselImagenes";
import { imagenesDeProducto } from "@/lib/catalogo-imagenes";

interface Variante {
  color: string;
  talla: string;
  stock: number;
  imagen?: string;
  imagenes?: string[];
}

interface Producto {
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
  variantes: Variante[];
}

type OrdenKey = "fecha" | "relevancia" | "ventas" | "descuento" | "precio-desc" | "precio-asc" | "nombre-asc" | "nombre-desc";

const ORDENES: Array<{ key: OrdenKey; label: string }> = [
  { key: "relevancia", label: "Relevancia" },
  { key: "ventas", label: "Ventas" },
  { key: "fecha", label: "Fecha de release" },
  { key: "descuento", label: "Descuento" },
  { key: "precio-desc", label: "Precio: mayor a menor" },
  { key: "precio-asc", label: "Precio: menor a mayor" },
  { key: "nombre-asc", label: "Nombre, ascendente" },
  { key: "nombre-desc", label: "Nombre, descendente" },
];

const COLOR_MAP: Record<string, string> = {
  amarillo: "#fff100",
  azul: "#1f2cff",
  azulmarino: "#1d2c6b",
  beige: "#dcc79a",
  blanco: "#f4f1eb",
  cafe: "#a48262",
  celeste: "#57c1e8",
  crema: "#efe3c7",
  gris: "#c4c6cb",
  lila: "#b79cc8",
  morado: "#3d1687",
  naranja: "#ff860f",
  negro: "#111111",
  plata: "linear-gradient(135deg, #8b8b8b 0%, #ececec 50%, #7f7f7f 100%)",
  rojo: "#ff160f",
  rosado: "#f5b3c1",
  verde: "#7ec34a",
};

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

function totalStock(producto: Producto): number {
  return producto.variantes.reduce((sum, variante) => sum + variante.stock, 0);
}

function colorStyle(color: string) {
  const key = color.toLowerCase().replace(/\s+/g, "");
  const base = COLOR_MAP[key] ?? "#d7ccbf";
  return base.startsWith("linear-gradient") ? { background: base } : { backgroundColor: base };
}

export default function CatalogoGrid({ productos }: { productos: Producto[] }) {
  const [busqueda, setBusqueda] = useState("");
  const [colorFiltro, setColorFiltro] = useState("");
  const [categoriaFiltro, setCategoriaFiltro] = useState("");
  const [tallaFiltro, setTallaFiltro] = useState("");
  const [orden, setOrden] = useState<OrdenKey>("fecha");
  const [ordenAbierto, setOrdenAbierto] = useState(false);

  const colores = Array.from(new Set(productos.flatMap((producto) => producto.variantes.map((variante) => variante.color)))).sort();
  const categorias = Array.from(new Set(productos.map((producto) => producto.categoria).filter(Boolean))).sort();
  const tallas = Array.from(new Set(productos.flatMap((producto) => producto.variantes.map((variante) => variante.talla)))).sort(
    (a, b) => a.localeCompare(b, "es", { numeric: true, sensitivity: "base" }),
  );
  const categoriaPrincipal = categorias.length === 1 ? categorias[0]?.toUpperCase() : productos[0]?.categoria?.toUpperCase() ?? "CATALOGO";

  const termino = busqueda.trim().toLowerCase();
  const filtrados = productos.filter((producto) => {
    const coincideBusqueda =
      !termino ||
      producto.nombre.toLowerCase().includes(termino) ||
      producto.modelo.toLowerCase().includes(termino) ||
      (producto.categoria ?? "").toLowerCase().includes(termino);

    const coincideColor = !colorFiltro || producto.variantes.some((variante) => variante.color === colorFiltro);
    const coincideCategoria = !categoriaFiltro || producto.categoria === categoriaFiltro;
    const coincideTalla = !tallaFiltro || producto.variantes.some((variante) => variante.talla === tallaFiltro);
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

  const ordenSeleccionado = ORDENES.find((item) => item.key === orden)?.label ?? "Fecha de release";

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[220px_minmax(0,1fr)] gap-10 lg:gap-12">
      <aside className="lg:sticky lg:top-28 self-start">
        <div className="mb-10">
          <h1 className="text-3xl sm:text-4xl uppercase" style={{ fontFamily: "Helvetica, Arial, sans-serif", fontWeight: 700, letterSpacing: "-0.04em" }}>
            {categoriaPrincipal}
          </h1>
          <p className="text-sm mt-3" style={{ color: "#a49a8f" }}>
            {productos.length} productos
          </p>
        </div>

        <div className="border-t pt-8" style={{ borderColor: "#ece6dc" }}>
          <div>
            <p className="text-xs uppercase mb-4" style={{ letterSpacing: "0.16em", color: "#111111" }}>
              Buscar
            </p>
            <input
              type="text"
              value={busqueda}
              onChange={(event) => setBusqueda(event.target.value)}
              placeholder="Nombre, modelo..."
              className="w-full border px-4 py-3 text-sm focus:outline-none"
              style={{ borderColor: "#ece6dc", background: "white" }}
            />
          </div>
          <p className="text-[11px] uppercase mb-8 mt-8" style={{ letterSpacing: "0.18em", color: "#111111" }}>
            Filtrado por
          </p>

          <div className="mb-10">
            <p className="text-xs uppercase mb-4" style={{ letterSpacing: "0.16em", color: "#111111" }}>
              Color
            </p>
            <div className="grid grid-cols-4 gap-3">
              {colores.map((color) => {
                const activo = colorFiltro === color;
                return (
                  <button
                    key={color}
                    type="button"
                    title={color}
                    onClick={() => setColorFiltro((actual) => (actual === color ? "" : color))}
                    className="h-8 w-8 border transition-transform hover:scale-105"
                    style={{
                      ...colorStyle(color),
                      borderColor: activo ? "#111111" : "#ddd5cb",
                      boxShadow: activo ? "0 0 0 2px rgba(17,17,17,0.12)" : "none",
                    }}
                  />
                );
              })}
            </div>
            {colorFiltro && (
              <button
                type="button"
                onClick={() => setColorFiltro("")}
                className="mt-4 text-[11px] uppercase transition-opacity hover:opacity-60"
                style={{ letterSpacing: "0.16em", color: "#8f8478" }}
              >
                Limpiar color
              </button>
            )}
          </div>

          <div className="mb-10">
            <p className="text-xs uppercase mb-4" style={{ letterSpacing: "0.16em", color: "#111111" }}>
              Categoria
            </p>
            <select
              value={categoriaFiltro}
              onChange={(event) => setCategoriaFiltro(event.target.value)}
              className="w-full border px-4 py-3 text-sm focus:outline-none"
              style={{ borderColor: "#ece6dc", background: "white" }}
            >
              <option value="">Todas</option>
              {categorias.map((categoria) => (
                <option key={categoria} value={categoria}>
                  {categoria}
                </option>
              ))}
            </select>
            {categoriaFiltro && (
              <button
                type="button"
                onClick={() => setCategoriaFiltro("")}
                className="mt-4 text-[11px] uppercase transition-opacity hover:opacity-60"
                style={{ letterSpacing: "0.16em", color: "#8f8478" }}
              >
                Limpiar categoria
              </button>
            )}
          </div>

          <div className="mb-10">
            <p className="text-xs uppercase mb-4" style={{ letterSpacing: "0.16em", color: "#111111" }}>
              Talla
            </p>
            <div className="flex flex-wrap gap-2">
              {tallas.map((talla) => {
                const activa = tallaFiltro === talla;
                return (
                  <button
                    key={talla}
                    type="button"
                    onClick={() => setTallaFiltro((actual) => (actual === talla ? "" : talla))}
                    className="min-w-10 border px-3 py-2 text-xs uppercase transition-colors hover:bg-[#f2eee8]"
                    style={{
                      letterSpacing: "0.12em",
                      borderColor: activa ? "#111111" : "#ddd5cb",
                      background: activa ? "#111111" : "white",
                      color: activa ? "#ffffff" : "#5f564e",
                    }}
                  >
                    {talla}
                  </button>
                );
              })}
            </div>
            {tallaFiltro && (
              <button
                type="button"
                onClick={() => setTallaFiltro("")}
                className="mt-4 text-[11px] uppercase transition-opacity hover:opacity-60"
                style={{ letterSpacing: "0.16em", color: "#8f8478" }}
              >
                Limpiar talla
              </button>
            )}
          </div>

          
        </div>
      </aside>

      <section>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <p className="text-sm" style={{ color: "#8f8478" }}>
            {productosVisibles.length} resultado{productosVisibles.length !== 1 ? "s" : ""}
          </p>

          <div className="relative self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setOrdenAbierto((actual) => !actual)}
              className="text-xs uppercase border px-5 py-4 min-w-[260px] text-left flex items-center justify-between"
              style={{ letterSpacing: "0.14em", borderColor: "#ece6dc", background: "white", color: "#4d433b" }}
            >
              <span>
                Ordenar por <strong>{ordenSeleccionado}</strong>
              </span>
              <span>{ordenAbierto ? "^" : "v"}</span>
            </button>

            {ordenAbierto && (
              <div className="absolute right-0 mt-1 w-full border bg-white z-20" style={{ borderColor: "#ece6dc" }}>
                {ORDENES.map((opcion) => (
                  <button
                    key={opcion.key}
                    type="button"
                    onClick={() => {
                      setOrden(opcion.key);
                      setOrdenAbierto(false);
                    }}
                    className="w-full text-left px-4 py-3 text-xs uppercase transition-colors hover:bg-[#f2eee8]"
                    style={{
                      letterSpacing: "0.08em",
                      background: orden === opcion.key ? "#f0ece6" : "white",
                      color: "#4d433b",
                    }}
                  >
                    {opcion.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {productosVisibles.length === 0 ? (
          <div className="border bg-white px-8 py-20 text-center" style={{ borderColor: "#ece6dc" }}>
            <p className="text-xl uppercase" style={{ letterSpacing: "0.18em", color: "#111111" }}>Sin resultados</p>
            <p className="text-sm mt-3" style={{ color: "#8f8478" }}>
              Prueba con otro termino o selecciona un color diferente.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
            {productosVisibles.map((producto) => (
              <ProductoCard key={producto._id} producto={producto} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function ProductoCard({ producto }: { producto: Producto }) {
  const imagenes = imagenesDeProducto(producto);
  const nuevo = esNuevo(producto.createdAt);
  const descuento = producto.descuento ?? 0;
  const stock = totalStock(producto);

  return (
    <Link href={`/catalogo/${producto._id}`} className="group block">
      <article className="border bg-white h-full transition-transform duration-300 hover:-translate-y-1" style={{ borderColor: "#ece6dc" }}>
        <div className="relative aspect-[3/4] overflow-hidden" style={{ background: "#fbf8f3" }}>
          {descuento > 0 && (
            <span className="absolute left-4 top-4 z-10 bg-[#f0ece6] px-2.5 py-1 text-[11px] uppercase" style={{ letterSpacing: "0.1em" }}>
              -{descuento}%
            </span>
          )}
          {descuento === 0 && nuevo && (
            <span className="absolute left-4 top-4 z-10 bg-[#f0ece6] px-2.5 py-1 text-[11px] uppercase" style={{ letterSpacing: "0.1em" }}>
              Novedades
            </span>
          )}
          <span className="absolute right-4 top-4 z-10 text-2xl" style={{ color: "#92887d" }}>
            ?
          </span>

          {imagenes.length > 0 ? (
            <CarruselImagenes
              imagenes={imagenes}
              alt={producto.nombre}
              imgClassName="group-hover:scale-105 transition-transform duration-500"
              duracionMs={2800}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center" style={{ color: "#bbb0a2" }}>
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

        <div className="p-5">
          <h3 className="text-[0.98rem] leading-snug uppercase min-h-[52px]" style={{ color: "#111111" }}>
            {producto.nombre}
          </h3>
          <p className="mt-5 text-3xl font-semibold" style={{ color: "#111111" }}>
            {formatearPrecio(producto.precioVenta)}
          </p>
          <p className="text-[11px] uppercase mt-2" style={{ letterSpacing: "0.08em", color: "#8f8478" }}>
            {(producto.categoria ?? producto.modelo).toUpperCase()}
          </p>
          <p className="text-[11px] uppercase mt-1" style={{ letterSpacing: "0.08em", color: stock > 0 ? "#8f8478" : "#b14f43" }}>
            {stock > 0 ? `${stock} unidades disponibles` : "Sin stock"}
          </p>
        </div>
      </article>
    </Link>
  );
}
