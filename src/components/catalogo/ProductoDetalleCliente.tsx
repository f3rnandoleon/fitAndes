"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useReservationCart } from "@/components/providers/ReservationCartProvider";
import { imagenesDeProducto, imagenesDeVariante } from "@/lib/catalogo-imagenes";
import { getProductColorValue, isLightProductColor } from "@/lib/product-colors";
import {
  filterCatalogAvailableVariants,
  getCatalogVariantAvailableStock,
  getCatalogVariantId,
  type CatalogProduct,
  type CatalogVariant,
} from "@/types/catalogo";
import { useSession } from "next-auth/react";

interface Props {
  producto: CatalogProduct;
  colores: string[];
  tallas: string[];
}

function formatPrice(value: number) {
  return `Bs ${new Intl.NumberFormat("es-BO", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value)}`;
}

export default function ProductoDetalleCliente({ producto, colores }: Props) {
  const { addItem } = useReservationCart();
  const productoDisponible = filterCatalogAvailableVariants(producto);
  const variantesDisponibles = productoDisponible.variantes;
  const primeraVariante =
    variantesDisponibles[0] ??
    producto.variantes.find((variante) => getCatalogVariantAvailableStock(variante) > 0) ??
    producto.variantes[0] ??
    null;
  const [varianteSeleccionada, setVarianteSeleccionada] = useState<CatalogVariant | null>(primeraVariante);
  const [mensaje, setMensaje] = useState("");
  const [indiceImagenActual, setIndiceImagenActual] = useState(0);
  const [cantidad, setCantidad] = useState(1);
  const { data: session, status } = useSession();

  const authenticated = status === "authenticated" && session?.user?.role === "CLIENTE";

  const colorSeleccionado = varianteSeleccionada?.color ?? primeraVariante?.color ?? colores[0] ?? "";
  const colorSecundarioSeleccionado = varianteSeleccionada?.colorSecundario ?? primeraVariante?.colorSecundario;

  const variantesDelColor = variantesDisponibles.filter(
    (variante) => variante.color === colorSeleccionado && variante.colorSecundario === colorSecundarioSeleccionado,
  );
  const tallasDisponibles = variantesDelColor.map((variante) => variante.talla);

  const imagenes = imagenesDeVariante(varianteSeleccionada);
  const imagenesActivas = imagenes.length > 0 ? imagenes : imagenesDeProducto(producto);
  const stockActual = varianteSeleccionada ? getCatalogVariantAvailableStock(varianteSeleccionada) : 0;
  const descripcionActual =
    varianteSeleccionada?.descripcion?.trim() ??
    producto.variantes.find((variante) => variante.descripcion?.trim())?.descripcion?.trim() ??
    "";
  const descuento = producto.descuento ?? 0;
  const precioAnterior = descuento > 0 ? producto.precioVenta / (1 - descuento / 100) : null;
  const imagenPrincipal = imagenesActivas[indiceImagenActual] ?? null;
  const imagenesActivasKey = imagenesActivas.join("|");

  useEffect(() => {
    setIndiceImagenActual(0);
  }, [imagenesActivasKey]);

  useEffect(() => {
    const cantidadMaxima = Math.max(1, stockActual);
    setCantidad((actual) => Math.min(actual, cantidadMaxima));
  }, [stockActual]);

  function seleccionarColor(color: string, colorSecundario?: string | null) {
    const siguiente =
      variantesDisponibles.find(
        (variante) =>
          variante.color === color &&
          variante.colorSecundario === colorSecundario &&
          variante.talla === varianteSeleccionada?.talla,
      ) ??
      variantesDisponibles.find(
        (variante) =>
          variante.color === color &&
          variante.colorSecundario === colorSecundario,
      ) ??
      null;

    setVarianteSeleccionada(siguiente);
    setMensaje("");
  }

  function seleccionarTalla(talla: string) {
    const siguiente =
      variantesDisponibles.find(
        (variante) => variante.color === colorSeleccionado && variante.colorSecundario === colorSecundarioSeleccionado && variante.talla === talla,
      ) ?? null;

    setVarianteSeleccionada(siguiente);
    setMensaje("");
  }

  function reservarSeleccion() {
    if (!varianteSeleccionada || stockActual <= 0) {
      setMensaje("Selecciona una variante disponible para reservar.");
      return;
    }

    const imagen = imagenesActivas[0] ?? null;
    const variantId = getCatalogVariantId(varianteSeleccionada);
    const variantKey = variantId ?? `${varianteSeleccionada.color}-${varianteSeleccionada.talla}`;
    const id = `${producto._id ?? producto.sku ?? producto.nombre}-${variantKey}`;

    addItem({
      id,
      productoId: producto._id,
      variantId,
      nombre: producto.nombre,
      modelo: producto.modelo,
      imagen,
      color: varianteSeleccionada.color,
      colorSecundario: varianteSeleccionada.colorSecundario,
      talla: varianteSeleccionada.talla,
      cantidad,
      precio: producto.precioVenta,
      stockDisponible: stockActual,
    });

    setMensaje("Producto agregado a tu reserva.");
  }

  function moverImagen(paso: number) {
    if (imagenesActivas.length <= 1) return;
    setIndiceImagenActual((actual) => (actual + paso + imagenesActivas.length) % imagenesActivas.length);
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,460px)_minmax(520px,1fr)] gap-8 lg:gap-8 items-start ">
      <section className="grid gap-4 md:grid-cols-[68px_minmax(0,1fr)] lg:grid-cols-[70px_minmax(0,1fr)]">
        {imagenesActivas.length > 1 ? (
          <div className="order-2 md:order-1">
            <div className="flex md:flex-col gap-3 overflow-x-auto md:overflow-visible pb-1">
              {imagenesActivas.map((imagen, index) => {
                const activa = index === indiceImagenActual;
                return (
                  <button
                    key={`${imagen}-${index}`}
                    type="button"
                    onClick={() => setIndiceImagenActual(index)}
                    className="relative h-24 w-[3.7rem] md:h-24 md:w-full shrink-0 overflow-hidden border transition-all"
                    style={{
                      borderColor: activa ? "#101010" : "#e3ddd4",
                      background: "#f7f3ed",
                    }}
                    aria-label={`Ver imagen ${index + 1} de ${producto.nombre}`}
                  >
                    <Image src={imagen} alt={`${producto.nombre} miniatura ${index + 1}`} fill unoptimized sizes="80px" className="object-contain" />
                  </button>
                );
              })}
            </div>
          </div>
        ) : null}

        <div className={`order-1 md:order-2 overflow-hidden relative ${imagenesActivas.length <= 1 ? "md:col-span-2" : ""}`}>
          <div className="relative w-full aspect-[2/3]">
            {imagenPrincipal ? (
              <div className="relative h-full w-full ">
                <Image
                  src={imagenPrincipal}
                  alt={producto.nombre}
                  fill
                  unoptimized
                  priority
                  sizes="(max-width: 1024px) 100vw, 420px"
                  className="object-contain object-center"
                />

                {imagenesActivas.length > 1 ? (
                  <>
                    <button
                      type="button"
                      aria-label="Imagen anterior"
                      onClick={() => moverImagen(-1)}
                      className="absolute left-2 top-1/2 z-10 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full border text-sm transition-opacity hover:opacity-85"
                      style={{ background: "rgba(255,255,255,0.94)", borderColor: "#ddd4c9", color: "#111111" }}
                    >
                      {"\u2039"}
                    </button>
                    <button
                      type="button"
                      aria-label="Imagen siguiente"
                      onClick={() => moverImagen(1)}
                      className="absolute right-2 top-1/2 z-10 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full border text-sm transition-opacity hover:opacity-85"
                      style={{ background: "rgba(255,255,255,0.94)", borderColor: "#ddd4c9", color: "#111111" }}
                    >
                      {"\u203A"}
                    </button>
                    <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 items-center gap-1.5">
                      {imagenesActivas.map((_, index) => (
                        <span
                          key={index}
                          className="h-2.5 w-2.5 rounded-full border transition-all duration-300"
                          style={{
                            background: index === indiceImagenActual ? "#e45754" : "transparent",
                            borderColor: index === indiceImagenActual ? "#e45754" : "#d3c8bc",
                          }}
                        />
                      ))}
                    </div>
                  </>
                ) : null}
              </div>
            ) : (
              <div className="flex h-full flex-col items-center justify-center gap-2" style={{ color: "#968d82" }}>
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
        </div>
      </section>

      <section className="px-2 py-2 sm:px-3 lg:px-2 ">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[11px] uppercase mb-2" style={{ letterSpacing: "0.22em", color: "#9a8f82" }}>
              {(producto.categoria ?? "Catalogo").toUpperCase()} {producto.modelo ? `- ${producto.modelo.toUpperCase()}` : ""}
            </p>
            <h1 className="text-[2.05rem] leading-[1.08]" style={{ fontFamily: "Georgia, 'Times New Roman', serif", fontWeight: 400, color: "#201a16" }}>
              {producto.nombre}
            </h1>
          </div>
          
        </div>

        <div className="mt-4 flex items-end gap-3">
          <p className="text-[1.85rem] leading-none" style={{ color: "#201a16", fontFamily: "Georgia, 'Times New Roman', serif" }}>
            {formatPrice(producto.precioVenta)}
          </p>
          {precioAnterior ? (
            <p className="pb-1 text-sm line-through" style={{ color: "#a79b8c" }}>
              {formatPrice(precioAnterior)}
            </p>
          ) : null}
        </div>

        {descripcionActual ? (
          <p className="mt-5 text-[14px] leading-7" style={{ color: "#6b6258" }}>
            {descripcionActual}
          </p>
        ) : null}

        <div className="mt-7">
          <p className="text-[11px] uppercase mb-3" style={{ letterSpacing: "0.22em", color: "#9a8f82" }}>
            Color - <span style={{ color: "#201a16" }}>{colorSeleccionado || "-"}{colorSecundarioSeleccionado ? ` / ${colorSecundarioSeleccionado}` : ""}</span>
          </p>
        <div className="flex flex-wrap gap-3">
          {Array.from(
            new Map(
                variantesDisponibles.map((v) => [
                  `${v.color}-${v.colorSecundario || ""}`,
                  { color: v.color, colorSecundario: v.colorSecundario },
                ]),
              ).values()
            ).map(({ color, colorSecundario }) => {
              const activo = color === colorSeleccionado && colorSecundario === colorSecundarioSeleccionado;
              const colorBase = getProductColorValue(color);
              const colorSec = colorSecundario ? getProductColorValue(colorSecundario) : null;
              const coloresClaros = isLightProductColor(color) && (!colorSecundario || isLightProductColor(colorSecundario));
              
              return (
                <button
                  key={`${color}-${colorSecundario || ""}`}
                  type="button"
                  onClick={() => seleccionarColor(color, colorSecundario)}
                  className="flex items-center gap-2"
                  aria-label={`Seleccionar color ${color}${colorSecundario ? ` y ${colorSecundario}` : ""}`}
                  title={`${color}${colorSecundario ? ` / ${colorSecundario}` : ""}`}
                >
                  <span
                    className="block h-7 w-7 rounded-full border"
                    style={{
                      background: colorSec ? `linear-gradient(135deg, ${colorBase} 50%, ${colorSec} 50%)` : colorBase,
                      borderColor: activo ? "#111111" : coloresClaros ? "#b8afa2" : "#d7cec3",
                      boxShadow: activo ? "0 0 0 2px rgba(17,17,17,0.08)" : "none",
                    }}
                  />
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-6">
          <div className="flex items-center justify-between gap-4 mb-3">
            <p className="text-[11px] uppercase" style={{ letterSpacing: "0.22em", color: "#9a8f82" }}>
              Talla
            </p>
            
          </div>
          <div className="flex flex-wrap gap-2.5">
            {Array.from(new Set(tallasDisponibles)).map((talla) => {
              const activa = talla === varianteSeleccionada?.talla;
              return (
                <button
                  key={talla}
                  type="button"
                  onClick={() => seleccionarTalla(talla)}
                  className="min-w-11 border px-4 py-2.5 text-sm transition-colors"
                  style={{
                    borderColor: activa ? "#111111" : "#e2d8cc",
                    background: activa ? "#111111" : "#ffffff",
                    color: activa ? "#ffffff" : "#4f463d",
                  }}
                >
                  {talla}
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-7 flex gap-3">
          <div className="inline-flex items-center border" style={{ borderColor: "#ddd4c9" }}>
            <button
              type="button"
              onClick={() => setCantidad((actual) => Math.max(1, actual - 1))}
              className="h-12 w-12 text-lg"
              aria-label="Reducir cantidad"
            >
              -
            </button>
            <span className="flex h-12 min-w-12 items-center justify-center text-sm" style={{ color: "#201a16" }}>
              {cantidad}
            </span>
            <button
              type="button"
              onClick={() => setCantidad((actual) => Math.min(stockActual || 1, actual + 1))}
              className="h-12 w-12 text-lg"
              aria-label="Aumentar cantidad"
              disabled={stockActual <= 0}
            >
              +
            </button>
          </div>

          <button
            type="button"
            onClick={reservarSeleccion}
            disabled={!varianteSeleccionada || stockActual <= 0}
            className="flex-1 inline-flex items-center justify-center text-[11px] uppercase text-white px-6 transition-opacity disabled:opacity-45 disabled:cursor-not-allowed hover:opacity-88"
            style={{ background: "#1a1a1a", letterSpacing: "0.24em" }}
          >
            Anadir al carrito
          </button>
        </div>

        <div className="mt-4 flex items-center justify-between text-xs" style={{ color: "#8f8478" }}>
          <span>{stockActual > 0 ? `${stockActual} unidades disponibles` : "Sin stock"}</span>
          {varianteSeleccionada ? <span>{varianteSeleccionada.color}{varianteSeleccionada.colorSecundario ? ` / ${varianteSeleccionada.colorSecundario}` : ""} / {varianteSeleccionada.talla}</span> : null}
        </div>

        {mensaje ? (
          <p className="mt-4 border px-4 py-3 text-sm" style={{ borderColor: "#d8cdc0", background: "#f6f1ea", color: "#6b6058" }}>
            {mensaje}
          </p>
        ) : null}

        
          <div className="mt-6 border-t " style={{ borderColor: "#efe7dd" }}>
            
          </div>

        <div className="mt-6 flex flex-col gap-3">
          {authenticated ? (
              <>
              </>
            ) : (
              <>
                <Link href="/login" className="text-sm hover:opacity-60 transition-opacity" style={{ color: "var(--muted)" }}>
                  Inicia sesion para guardar tu reserva y seguir tus pedidos
                </Link>
              </>
            )}
          
          <Link href="/catalogo" className="text-sm hover:opacity-60 transition-opacity" style={{ color: "var(--muted)" }}>
            Volver al catalogo
          </Link>
        </div>
      </section>
    </div>
  );
}
