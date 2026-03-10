"use client";

import { useState } from "react";
import Link from "next/link";

interface Variante {
  color: string;
  talla: string;
  stock: number;
  imagen?: string;
}

interface Producto {
  _id: string;
  nombre: string;
  modelo: string;
  precioVenta: number;
  variantes: Variante[];
}

export default function CatalogoGrid({ productos }: { productos: Producto[] }) {
  const [busqueda, setBusqueda] = useState("");
  const [colorFiltro, setColorFiltro] = useState("");

  const colores = Array.from(new Set(productos.flatMap((p) => p.variantes.map((v) => v.color)))).sort();

  const filtrados = productos.filter((p) => {
    const matchBusqueda =
      p.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
      p.modelo.toLowerCase().includes(busqueda.toLowerCase());
    const matchColor = !colorFiltro || p.variantes.some((v) => v.color === colorFiltro);
    return matchBusqueda && matchColor;
  });

  return (
    <div>
      <div className="flex flex-col sm:flex-row gap-3 mb-8">
        <input
          type="text"
          placeholder="Buscar producto..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          className="flex-1 border px-4 py-2.5 text-sm placeholder:text-[#8f8377] focus:outline-none focus:ring-0"
          style={{ background: "var(--surface)", borderColor: "var(--border)" }}
        />
        <select
          value={colorFiltro}
          onChange={(e) => setColorFiltro(e.target.value)}
          className="border px-4 py-2.5 text-sm focus:outline-none focus:ring-0"
          style={{ background: "var(--surface)", borderColor: "var(--border)" }}
        >
          <option value="">Todos los colores</option>
          {colores.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      {filtrados.length === 0 ? (
        <div className="text-center py-20" style={{ color: "var(--muted)" }}>
          <p className="text-4xl mb-3">◈</p>
          <p className="text-lg" style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}>
            Sin resultados
          </p>
          <p className="text-sm mt-1">Intenta con otro termino o filtro.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {filtrados.map((producto) => (
            <ProductoCard key={producto._id} producto={producto} />
          ))}
        </div>
      )}
    </div>
  );
}

function ProductoCard({ producto }: { producto: Producto }) {
  const imagen = producto.variantes.find((v) => v.imagen)?.imagen;
  const totalStock = producto.variantes.reduce((sum, v) => sum + v.stock, 0);
  const tallas = Array.from(new Set(producto.variantes.map((v) => v.talla)));
  const colores = Array.from(new Set(producto.variantes.map((v) => v.color)));

  return (
    <Link href={`/catalogo/${producto._id}`}>
      <div
        className="group border overflow-hidden transition-all duration-200 hover:-translate-y-0.5 cursor-pointer"
        style={{ background: "var(--surface)", borderColor: "var(--border)" }}
      >
        <div className="relative h-52 overflow-hidden" style={{ background: "var(--surface-soft)" }}>
          {imagen ? (
            <img
              src={imagen}
              alt={producto.nombre}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center" style={{ color: "#9c8f82" }}>
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
          {totalStock === 0 && (
            <div className="absolute top-2 right-2 text-xs px-2 py-0.5 border" style={{ color: "var(--muted)", borderColor: "var(--border)", background: "rgba(245,242,238,0.9)" }}>
              Sin stock
            </div>
          )}
          {totalStock > 0 && totalStock <= 5 && (
            <div className="absolute top-2 right-2 text-xs px-2 py-0.5 border" style={{ color: "#6a4f21", borderColor: "#cfbc98", background: "#efe5d5" }}>
              Ultimas unidades
            </div>
          )}
        </div>

        <div className="p-4">
          <p className="text-xs mb-0.5" style={{ color: "var(--subtle)" }}>
            {producto.modelo}
          </p>
          <h3 className="font-medium text-sm mb-3 line-clamp-1" style={{ color: "var(--foreground)" }}>
            {producto.nombre}
          </h3>
          <div className="flex flex-wrap gap-1 mb-3">
            {tallas.slice(0, 4).map((t) => (
              <span key={t} className="text-xs px-2 py-0.5" style={{ background: "#ddd9d3", color: "var(--muted)" }}>
                {t}
              </span>
            ))}
            {tallas.length > 4 && (
              <span className="text-xs" style={{ color: "var(--subtle)" }}>
                +{tallas.length - 4}
              </span>
            )}
          </div>
          <div className="flex items-center justify-between">
            <span className="text-lg" style={{ color: "var(--foreground)", fontFamily: "Georgia, 'Times New Roman', serif" }}>
              Bs. {producto.precioVenta.toFixed(2)}
            </span>
            <span className="text-xs" style={{ color: "var(--subtle)" }}>
              {colores.length} color{colores.length !== 1 ? "es" : ""}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
