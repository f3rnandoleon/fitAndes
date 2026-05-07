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

interface Props {
  producto: CatalogProduct;
  colores: string[];
  tallas: string[];
  colorInicial?: string;
  tallaInicial?: string;
}

function formatPrice(value: number) {
  return `Bs ${new Intl.NumberFormat("es-BO", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value)}`;
}

export default function ProductoDetalleCliente({ producto, colores, colorInicial, tallaInicial }: Props) {
  const { addItem } = useReservationCart();
  const productoDisponible = filterCatalogAvailableVariants(producto);
  const variantesDisponibles = productoDisponible.variantes;
  const primeraVariante =
    (colorInicial || tallaInicial)
      ? (variantesDisponibles.find((v) =>
        (!colorInicial || v.color === colorInicial) &&
        (!tallaInicial || v.talla === tallaInicial)
      ) ?? variantesDisponibles[0])
      : variantesDisponibles[0] ??
      producto.variantes.find((variante) => getCatalogVariantAvailableStock(variante) > 0) ??
      producto.variantes[0] ??
      null;
  const [varianteSeleccionada, setVarianteSeleccionada] = useState<CatalogVariant | null>(primeraVariante);
  const [mensaje, setMensaje] = useState("");
  const [mostrarExito, setMostrarExito] = useState(false);
  const [indiceImagenActual, setIndiceImagenActual] = useState(0);
  const [cantidad, setCantidad] = useState(1);


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

  useEffect(() => {
    if (mensaje) {
      const timer = setTimeout(() => setMensaje(""), 4000);
      return () => clearTimeout(timer);
    }
  }, [mensaje]);

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

  function seleccionarTalla(tallaSeleccionada: string) {
    const siguiente =
      variantesDisponibles.find(
        (variante) => variante.color === colorSeleccionado && variante.colorSecundario === colorSecundarioSeleccionado && variante.talla === tallaSeleccionada,
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

    setMostrarExito(true);
  }

  function moverImagen(paso: number) {
    if (imagenesActivas.length <= 1) return;
    setIndiceImagenActual((actual) => (actual + paso + imagenesActivas.length) % imagenesActivas.length);
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,520px)_minmax(0,1fr)] xl:gap-10">
      <section className="rounded-[var(--radius-lg)] border bg-white p-3 sm:p-4 lg:sticky lg:top-24 lg:self-start border-border shadow-sm">
        <div className="grid gap-3 lg:grid-cols-[84px_minmax(0,1fr)]">
          {imagenesActivas.length > 1 ? (
            <div className="order-2 lg:order-1">
              <div className="flex gap-3 overflow-x-auto pb-1 lg:flex-col lg:overflow-visible">
                {imagenesActivas.map((imagen, index) => {
                  const activa = index === indiceImagenActual;
                  return (
                    <button
                      key={`${imagen}-${index}`}
                      type="button"
                      onClick={() => setIndiceImagenActual(index)}
                      className="relative h-20 w-16 shrink-0 overflow-hidden rounded-[18px] border transition-all sm:h-24 sm:w-20 lg:h-24 lg:w-full"
                      style={{
                        borderColor: activa ? "#101010" : "#e3ddd4",
                        background: "#f7f3ed",
                      }}
                      aria-label={`Ver imagen ${index + 1} de ${producto.nombre}`}
                    >
                      <Image src={imagen} alt={`${producto.nombre} miniatura ${index + 1}`} fill sizes="80px" className="object-contain" />
                    </button>
                  );
                })}
              </div>
            </div>
          ) : null}

          <div className={`order-1 overflow-hidden rounded-[var(--radius-lg)] bg-background ${imagenesActivas.length <= 1 ? "lg:col-span-2" : "lg:order-2"}`}>
            <div className="relative aspect-[4/5] w-full">
              {imagenPrincipal ? (
                <div className="relative h-full w-full">
                  <Image
                    src={imagenPrincipal}
                    alt={producto.nombre}
                    fill
                    priority
                    sizes="(max-width: 1024px) 100vw, 520px"
                    className="object-contain object-center"
                  />

                  {imagenesActivas.length > 1 ? (
                    <>
                      <button
                        type="button"
                        aria-label="Imagen anterior"
                        onClick={() => moverImagen(-1)}
                        className="absolute left-3 top-1/2 z-10 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-border text-sm transition-opacity hover:opacity-85 bg-white/94 text-foreground"
                      >
                        {"\u2039"}
                      </button>
                      <button
                        type="button"
                        aria-label="Imagen siguiente"
                        onClick={() => moverImagen(1)}
                        className="absolute right-3 top-1/2 z-10 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-border text-sm transition-opacity hover:opacity-85 bg-white/94 text-foreground"
                      >
                        {"\u203A"}
                      </button>
                      <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 items-center gap-1.5 rounded-full bg-white/80 px-3 py-2 backdrop-blur-sm">
                        {imagenesActivas.map((_, index) => (
                          <span
                            key={index}
                            className="h-2.5 w-2.5 rounded-full border transition-all duration-300"
                            style={{
                              background: index === indiceImagenActual ? "var(--accent)" : "transparent",
                              borderColor: index === indiceImagenActual ? "var(--accent)" : "var(--border)",
                            }}
                          />
                        ))}
                      </div>
                    </>
                  ) : null}
                </div>
              ) : (
                <div className="flex h-full flex-col items-center justify-center gap-2" style={{ color: "#968d82" }}>
                  <svg className="h-20 w-20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
        </div>
      </section>

      <section className="flex flex-col rounded-[var(--radius-lg)] border bg-white px-5 py-6 sm:px-6 lg:px-7 lg:py-7 border-border shadow-sm">
        <div className="order-1">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-[10px] uppercase tracking-[0.22em] text-subtle">
                {(producto.categoria ?? "Catálogo").toUpperCase()} {producto.nombre ? `· ${producto.nombre.toUpperCase()}` : ""}
              </p>
              <h1 className="mt-3 text-[2.1rem] leading-[1.02] sm:text-[2.7rem] text-foreground" style={{ fontFamily: "Georgia, 'Times New Roman', serif", fontWeight: 400 }}>
                {producto.modelo}
              </h1>
            </div>

            <span
              className="inline-flex w-fit rounded-full border px-4 py-2 text-[10px] uppercase"
              style={{
                letterSpacing: "0.18em",
                color: stockActual > 0 ? "#4f7a57" : "#a54a3f",
                borderColor: stockActual > 0 ? "rgba(79,122,87,0.18)" : "rgba(165,74,63,0.18)",
                background: stockActual > 0 ? "rgba(79,122,87,0.08)" : "rgba(165,74,63,0.08)",
              }}
            >
              {stockActual > 0 ? "Disponible" : "Sin stock"}
            </span>
          </div>



          <div className="mt-6 flex flex-wrap items-end gap-3">
            <p className="text-[1.9rem] leading-none sm:text-[2.2rem] text-foreground" style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}>
              {formatPrice(producto.precioVenta)}
            </p>
            {precioAnterior ? (
              <p className="pb-1 text-sm line-through text-subtle/60">
                {formatPrice(precioAnterior)}
              </p>
            ) : null}
            {descuento > 0 ? (
              <span className="inline-flex rounded-full bg-danger/10 px-3 py-1 text-[10px] uppercase tracking-[0.14em] text-danger">
                Ahorra {descuento}%
              </span>
            ) : null}
          </div>
        </div>

        {descripcionActual ? (
          <div className="order-3 lg:order-2 mt-5">
            <p className="max-w-2xl text-sm leading-7 sm:text-[15px] text-muted">
              {descripcionActual}
            </p>
          </div>
        ) : null}

        <div className="order-2 lg:order-3">
          <div className="mt-8 rounded-[var(--radius-md)] border border-border px-4 py-5 sm:px-5 bg-background">
            <div className="flex items-center justify-between gap-4">
              <p className="text-[10px] uppercase tracking-[0.22em] text-subtle">
                Color actual
              </p>
              <span className="text-xs text-foreground">
                {colorSeleccionado || "-"}{colorSecundarioSeleccionado ? ` / ${colorSecundarioSeleccionado}` : ""}
              </span>
            </div>

            <div className="mt-4 flex flex-wrap gap-3">
              {Array.from(
                new Map(
                  variantesDisponibles.map((v) => [
                    `${v.color}-${v.colorSecundario || ""}`,
                    { color: v.color, colorSecundario: v.colorSecundario },
                  ]),
                ).values(),
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
                    className="flex items-center gap-2 rounded-full border border-border transition-all hover:bg-white active:scale-95"
                    style={{
                      borderColor: activo ? "var(--foreground)" : "var(--border)",
                      background: activo ? "var(--background)" : "transparent",
                    }}
                    aria-label={`Seleccionar color ${color}${colorSecundario ? ` y ${colorSecundario}` : ""}`}
                    aria-pressed={activo}
                    title={`${color}${colorSecundario ? ` / ${colorSecundario}` : ""}`}
                  >
                    <span
                      className="block h-7 w-7 rounded-full border"
                      style={{
                        background: colorSec ? `linear-gradient(135deg, ${colorBase} 50%, ${colorSec} 50%)` : colorBase,
                        borderColor: activo ? "var(--foreground)" : coloresClaros ? "var(--subtle)" : "var(--border)",
                        boxShadow: activo ? "0 0 0 2px rgba(0,0,0,0.08)" : "none",
                      }}
                    />
                    <span className="text-[11px] uppercase tracking-[0.12em] text-muted">
                      {colorSecundario ? `${color} / ${colorSecundario}` : color}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-5 rounded-[var(--radius-md)] border border-border px-4 py-5 sm:px-5 bg-background">
            <div className="flex items-center justify-between gap-4">
              <p className="text-[10px] uppercase tracking-[0.22em] text-subtle">
                Talla
              </p>
              {varianteSeleccionada ? (
                <span className="text-xs text-foreground">
                  {varianteSeleccionada.talla}
                </span>
              ) : null}
            </div>

            <div className="mt-4 flex flex-wrap gap-2.5">
              {Array.from(new Set(tallasDisponibles)).map((tallaDisponible) => {
                const activa = tallaDisponible === varianteSeleccionada?.talla;
                return (
                  <button
                    key={tallaDisponible}
                    type="button"
                    onClick={() => seleccionarTalla(tallaDisponible)}
                    className="min-w-12 rounded-full border px-4 py-2.5 text-sm transition-all active:scale-95"
                    style={{
                      borderColor: activa ? "#111111" : "#e2d8cc",
                      background: activa ? "#111111" : "#ffffff",
                      color: activa ? "#ffffff" : "#4f463d",
                    }}
                  >
                    {tallaDisponible}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="order-4">
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <div className="inline-flex items-center justify-center rounded-full border border-border">
              <button
                type="button"
                onClick={() => setCantidad((actual) => Math.max(1, actual - 1))}
                className="h-12 w-12 text-lg active:scale-90 transition-transform"
                aria-label="Reducir cantidad"
              >
                -
              </button>
              <span className="flex h-12 min-w-12 items-center justify-center text-sm text-foreground font-medium">
                {cantidad}
              </span>
              <button
                type="button"
                onClick={() => setCantidad((actual) => Math.min(stockActual || 1, actual + 1))}
                className="h-12 w-12 text-lg active:scale-90 transition-transform"
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
              className="inline-flex flex-1 items-center justify-center rounded-full px-6 py-4 text-[11px] uppercase bg-foreground text-background transition-all disabled:cursor-not-allowed disabled:opacity-45 hover:opacity-90 active:scale-[0.98]"
            >
              Añadir a reserva
            </button>
          </div>

          <div className="mt-4 flex flex-col gap-2 text-xs sm:flex-row sm:items-center sm:justify-between" style={{ color: "#8f8478" }}>
            <span>{stockActual > 0 ? `${stockActual} unidades disponibles` : "Sin stock"}</span>
            {varianteSeleccionada ? <span>{varianteSeleccionada.color}{varianteSeleccionada.colorSecundario ? ` / ${varianteSeleccionada.colorSecundario}` : ""} / {varianteSeleccionada.talla}</span> : null}
          </div>

          {mensaje ? (
            <p className="mt-4 rounded-[var(--radius-md)] border border-success/20 px-4 py-3 text-sm bg-success/10 text-success">
              {mensaje}
            </p>
          ) : null}


        </div>
      </section>

      {/* Modal de éxito al agregar producto */}
      {mostrarExito && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/30 p-4 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="w-full max-w-sm rounded-[24px] border border-border bg-white p-6 shadow-[0_32px_64px_rgba(0,0,0,0.16)] animate-in zoom-in-95 duration-300">
            <div className="mb-5 flex flex-col items-center text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-success/10 text-success">
                <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-xl font-medium text-foreground" style={{ fontFamily: "Georgia, serif" }}>
                ¡Producto agregado!
              </h3>
              <p className="mt-2 text-sm text-muted leading-relaxed">
                {producto.modelo} ha sido añadido a tu carrito de reserva correctamente.
              </p>
              <div className="mt-2 text-[10px] uppercase tracking-[0.12em] text-subtle">
                {varianteSeleccionada?.color} / {varianteSeleccionada?.talla} · {cantidad} unidad{cantidad !== 1 ? 'es' : ''}
              </div>
            </div>

            <div className="grid gap-3">
              <Link
                href="/checkout"
                className="block w-full text-center rounded-full bg-foreground py-3.5 text-[11px] uppercase tracking-[0.16em] text-background transition-all hover:opacity-90 active:scale-[0.98]"
              >
                Ir al carrito
              </Link>
              <button
                type="button"
                onClick={() => setMostrarExito(false)}
                className="w-full rounded-full border border-border bg-white py-3.5 text-[11px] uppercase tracking-[0.16em] text-foreground transition-all hover:bg-background active:scale-[0.98]"
              >
                Seguir reservando
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
