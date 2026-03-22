"use client";

import Link from "next/link";
import { useState } from "react";
import CarruselImagenes from "@/components/catalogo/CarruselImagenes";
import { useReservationCart } from "@/components/providers/ReservationCartProvider";
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
  _id?: string;
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
  const { addItem } = useReservationCart();
  const [varianteSeleccionada, setVarianteSeleccionada] = useState<Variante | null>(producto.variantes[0] ?? null);
  const [mensaje, setMensaje] = useState("");
  const imagenes = imagenesDeVariante(varianteSeleccionada);
  const imagenesActivas = imagenes.length > 0 ? imagenes : imagenesDeProducto(producto);
  const stockActual = varianteSeleccionada?.stock ?? 0;

  function reservarSeleccion() {
    if (!varianteSeleccionada || stockActual <= 0) {
      setMensaje("Selecciona una variante disponible para reservar.");
      return;
    }

    const imagen = imagenesActivas[0] ?? null;
    const id = `${producto._id ?? producto.sku ?? producto.nombre}-${varianteSeleccionada.color}-${varianteSeleccionada.talla}`;

    addItem({
      id,
      productoId: producto._id,
      nombre: producto.nombre,
      modelo: producto.modelo,
      imagen,
      color: varianteSeleccionada.color,
      talla: varianteSeleccionada.talla,
      cantidad: 1,
      precio: producto.precioVenta,
      stockDisponible: stockActual,
    });

    setMensaje("Producto agregado a tu reserva.");
  }

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

        <button
          type="button"
          onClick={reservarSeleccion}
          disabled={!varianteSeleccionada || stockActual <= 0}
          className="inline-flex items-center justify-center text-xs uppercase text-white py-3.5 px-6 transition-opacity disabled:opacity-45 disabled:cursor-not-allowed hover:opacity-85"
          style={{ background: "#1a1a1a", letterSpacing: "0.18em" }}
        >
          Agregar a reserva
        </button>
        {mensaje && (
          <p className="text-sm" style={{ color: "#6b6058" }}>
            {mensaje}
          </p>
        )}
        <Link href="/login" className="text-sm hover:opacity-60 transition-opacity" style={{ color: "var(--muted)" }}>
          Inicia sesion para guardar tu reserva y seguir tus pedidos
        </Link>
        <Link href="/catalogo" className="text-sm hover:opacity-60 transition-opacity text-center" style={{ color: "var(--muted)" }}>
          Volver al catalogo
        </Link>
      </div>
    </div>
  );
}
