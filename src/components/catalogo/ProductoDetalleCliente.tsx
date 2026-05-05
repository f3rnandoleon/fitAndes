"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
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
}

function formatPrice(value: number) {
  return `Bs ${new Intl.NumberFormat("es-BO", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value)}`;
}

export default function ProductoDetalleCliente({ producto, colores, tallas }: Props) {
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
  const resumenRapido = [
    { label: "Colores", value: `${new Set(variantesDisponibles.map((variante) => variante.color)).size}` },
    { label: "Tallas", value: `${new Set([...tallas, ...tallasDisponibles]).size}` },
    { label: "Stock", value: stockActual > 0 ? `${stockActual}` : "Agotado" },
  ];

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

    setMensaje("Producto agregado a tu reserva.");
  }

  function moverImagen(paso: number) {
    if (imagenesActivas.length <= 1) return;
    setIndiceImagenActual((actual) => (actual + paso + imagenesActivas.length) % imagenesActivas.length);
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,520px)_minmax(0,1fr)] xl:gap-10">
      <section className="rounded-[30px] border bg-white p-3 sm:p-4 lg:sticky lg:top-24 lg:self-start" style={{ borderColor: "#ece6dc" }}>
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

          <div className={`order-1 overflow-hidden rounded-[26px] ${imagenesActivas.length <= 1 ? "lg:col-span-2" : "lg:order-2"}`} style={{ background: "#f8f4ee" }}>
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
                        className="absolute left-3 top-1/2 z-10 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border text-sm transition-opacity hover:opacity-85"
                        style={{ background: "rgba(255,255,255,0.94)", borderColor: "#ddd4c9", color: "#111111" }}
                      >
                        {"\u2039"}
                      </button>
                      <button
                        type="button"
                        aria-label="Imagen siguiente"
                        onClick={() => moverImagen(1)}
                        className="absolute right-3 top-1/2 z-10 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border text-sm transition-opacity hover:opacity-85"
                        style={{ background: "rgba(255,255,255,0.94)", borderColor: "#ddd4c9", color: "#111111" }}
                      >
                        {"\u203A"}
                      </button>
                      <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 items-center gap-1.5 rounded-full bg-white/80 px-3 py-2 backdrop-blur-sm">
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

      <section className="rounded-[30px] border bg-white px-5 py-6 sm:px-6 lg:px-7 lg:py-7" style={{ borderColor: "#ece6dc" }}>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-[10px] uppercase" style={{ letterSpacing: "0.22em", color: "#9a8f82" }}>
              {(producto.categoria ?? "Catálogo").toUpperCase()} {producto.nombre ? `· ${producto.nombre.toUpperCase()}` : ""}
            </p>
            <h1 className="mt-3 text-[2.1rem] leading-[1.02] sm:text-[2.7rem]" style={{ fontFamily: "Georgia, 'Times New Roman', serif", fontWeight: 400, color: "#201a16" }}>
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

        <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
          {resumenRapido.map((item) => (
            <div key={item.label} className="rounded-[22px] border px-4 py-4" style={{ borderColor: "#eee5da", background: "#fbf8f3" }}>
              <p className="text-[10px] uppercase" style={{ letterSpacing: "0.16em", color: "#8f8478" }}>
                {item.label}
              </p>
              <p className="mt-2 text-lg" style={{ color: "#201a16", fontFamily: "Georgia, 'Times New Roman', serif" }}>
                {item.value}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-6 flex flex-wrap items-end gap-3">
          <p className="text-[1.9rem] leading-none sm:text-[2.2rem]" style={{ color: "#201a16", fontFamily: "Georgia, 'Times New Roman', serif" }}>
            {formatPrice(producto.precioVenta)}
          </p>
          {precioAnterior ? (
            <p className="pb-1 text-sm line-through" style={{ color: "#a79b8c" }}>
              {formatPrice(precioAnterior)}
            </p>
          ) : null}
          {descuento > 0 ? (
            <span className="inline-flex rounded-full bg-[#f6ebe8] px-3 py-1 text-[10px] uppercase" style={{ letterSpacing: "0.14em", color: "#b14f43" }}>
              Ahorra {descuento}%
            </span>
          ) : null}
        </div>

        {descripcionActual ? (
          <p className="mt-5 max-w-2xl text-sm leading-7 sm:text-[15px]" style={{ color: "#6b6258" }}>
            {descripcionActual}
          </p>
        ) : null}

        <div className="mt-8 rounded-[26px] border px-4 py-5 sm:px-5" style={{ borderColor: "#eee5da", background: "#fbf8f3" }}>
          <div className="flex items-center justify-between gap-4">
            <p className="text-[10px] uppercase" style={{ letterSpacing: "0.22em", color: "#9a8f82" }}>
              Color actual
            </p>
            <span className="text-xs" style={{ color: "#201a16" }}>
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
                  className="flex items-center gap-2 rounded-full border px-3 py-2 transition-all hover:bg-white active:scale-95"
                  style={{
                    borderColor: activo ? "#111111" : "#e2d8cc",
                    background: activo ? "#ffffff" : "transparent",
                  }}
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
                  <span className="text-[11px] uppercase" style={{ letterSpacing: "0.12em", color: "#5f564e" }}>
                    {colorSecundario ? `${color} / ${colorSecundario}` : color}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-5 rounded-[26px] border px-4 py-5 sm:px-5" style={{ borderColor: "#eee5da", background: "#fbf8f3" }}>
          <div className="flex items-center justify-between gap-4">
            <p className="text-[10px] uppercase" style={{ letterSpacing: "0.22em", color: "#9a8f82" }}>
              Talla
            </p>
            {varianteSeleccionada ? (
              <span className="text-xs" style={{ color: "#201a16" }}>
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

        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <div className="inline-flex items-center justify-center rounded-full border" style={{ borderColor: "#ddd4c9" }}>
            <button
              type="button"
              onClick={() => setCantidad((actual) => Math.max(1, actual - 1))}
              className="h-12 w-12 text-lg active:scale-90 transition-transform"
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
            className="inline-flex flex-1 items-center justify-center rounded-full px-6 py-4 text-[11px] uppercase text-white transition-all disabled:cursor-not-allowed disabled:opacity-45 hover:opacity-88 active:scale-[0.98]"
            style={{ background: "#1a1a1a", letterSpacing: "0.24em" }}
          >
            Añadir a reserva
          </button>
        </div>

        <div className="mt-4 flex flex-col gap-2 text-xs sm:flex-row sm:items-center sm:justify-between" style={{ color: "#8f8478" }}>
          <span>{stockActual > 0 ? `${stockActual} unidades disponibles` : "Sin stock"}</span>
          {varianteSeleccionada ? <span>{varianteSeleccionada.color}{varianteSeleccionada.colorSecundario ? ` / ${varianteSeleccionada.colorSecundario}` : ""} / {varianteSeleccionada.talla}</span> : null}
        </div>

        {mensaje ? (
          <p className="mt-4 rounded-[20px] border px-4 py-3 text-sm" style={{ borderColor: "#d8cdc0", background: "#f6f1ea", color: "#6b6058" }}>
            {mensaje}
          </p>
        ) : null}

        <div className="mt-8 grid gap-3 sm:grid-cols-2">
          {!authenticated ? (
            <Link
              href="/login"
              className="rounded-[22px] border px-4 py-4 text-sm transition-all hover:bg-[#f8f4ee] active:scale-[0.98]"
              style={{ borderColor: "#ece6dc", color: "var(--muted)" }}
            >
              Inicia sesión para guardar tu reserva y seguir tus pedidos.
            </Link>
          ) : (
            <div className="rounded-[22px] border px-4 py-4 text-sm" style={{ borderColor: "#ece6dc", color: "var(--muted)", background: "#fbf8f3" }}>
              Tu reserva quedará disponible en tu cuenta para completar la compra cuando quieras.
            </div>
          )}

          <Link
            href="/catalogo"
            className="rounded-[22px] border px-4 py-4 text-sm transition-all hover:bg-[#f8f4ee] active:scale-[0.98]"
            style={{ borderColor: "#ece6dc", color: "var(--muted)" }}
          >
            Volver al catálogo.
          </Link>
        </div>
      </section>
    </div>
  );
}
