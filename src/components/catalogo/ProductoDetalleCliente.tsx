"use client";

import Link from "next/link";
import { useState } from "react";
import CarruselImagenes from "@/components/catalogo/CarruselImagenes";
import VarianteSelector from "@/components/catalogo/VarianteSelector";
import { imagenesDeProducto, imagenesDeVariante } from "@/lib/catalogo-imagenes";

interface Variante {
  color: string;
  talla: string;
  stock: number;
  imagen?: string;
  imagenes?: string[];
}

interface Producto {
  nombre: string;
  modelo: string;
  precioVenta: number;
  sku?: string;
  imagen?: string;
  imagenes?: string[];
  variantes: Variante[];
}

interface Props {
  producto: Producto;
  colores: string[];
  tallas: string[];
}

export default function ProductoDetalleCliente({ producto, colores, tallas }: Props) {
  const [varianteSeleccionada, setVarianteSeleccionada] = useState<Variante | null>(producto.variantes[0] ?? null);
  const imagenes = imagenesDeVariante(varianteSeleccionada);
  const imagenesActivas = imagenes.length > 0 ? imagenes : imagenesDeProducto(producto);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
      <div
        className="border h-80 lg:h-96 flex items-center justify-center overflow-hidden"
        style={{ background: "var(--surface)", borderColor: "var(--border)" }}
      >
        {imagenesActivas.length > 0 ? (
          <CarruselImagenes imagenes={imagenesActivas} alt={producto.nombre} duracionMs={3200} />
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

        <VarianteSelector
          variantes={producto.variantes}
          colores={colores}
          tallas={tallas}
          onVarianteChange={setVarianteSeleccionada}
        />

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
  );
}
