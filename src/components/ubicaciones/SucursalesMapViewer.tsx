"use client";

import Link from "next/link";
import { useState } from "react";
import {
  FaMapMarkerAlt,
  FaStore,
  FaWhatsapp,
  FaDirections,
  FaClock,
  FaPhoneAlt,
  FaCheckCircle,
  FaExternalLinkAlt,
} from "react-icons/fa";
import { getWhatsAppLink } from "@/lib/constants";

export interface UbicacionMapa {
  googleMapsUrl?: string;
  embedUrl?: string;
  lat?: number | null;
  lng?: number | null;
  referencia?: string;
  horariosTexto?: string;
}

export interface UbicacionItem {
  id: string;
  nombre: string;
  codigo: string;
  tipo: string;
  ciudad: string;
  direccion: string;
  telefono: string;
  permiteVentaPOS: boolean;
  permiteRetiroCliente: boolean;
  ubicacionMapa?: UbicacionMapa;
}

interface Props {
  ubicaciones: UbicacionItem[];
}

function buildEmbedUrl(tienda: UbicacionItem | null): string {
  if (!tienda) {
    // Vista general de La Paz y El Alto
    return "https://maps.google.com/maps?q=-16.5095,-68.1480&hl=es&z=13&output=embed";
  }

  // Si el backend envió una URL de embed directa
  if (tienda.ubicacionMapa?.embedUrl?.trim()) {
    return tienda.ubicacionMapa.embedUrl.trim();
  }

  // Si tiene coordenadas latitud y longitud
  if (tienda.ubicacionMapa?.lat != null && tienda.ubicacionMapa?.lng != null) {
    const lat = tienda.ubicacionMapa.lat;
    const lng = tienda.ubicacionMapa.lng;
    return `https://maps.google.com/maps?q=${lat},${lng}&hl=es&z=17&output=embed`;
  }

  // Fallback por nombre y dirección específica
  if (tienda.nombre.toLowerCase().includes("prado")) {
    return "https://maps.google.com/maps?q=-16.5022,-68.1328&hl=es&z=17&output=embed";
  }

  const query = `${tienda.nombre}, ${tienda.direccion}, ${tienda.ciudad}, Bolivia`;
  return `https://maps.google.com/maps?q=${encodeURIComponent(query)}&hl=es&z=16&output=embed`;
}

function buildDirectMapsUrl(tienda: UbicacionItem): string {
  if (tienda.ubicacionMapa?.googleMapsUrl) {
    return tienda.ubicacionMapa.googleMapsUrl;
  }
  if (tienda.ubicacionMapa?.lat != null && tienda.ubicacionMapa?.lng != null) {
    return `https://www.google.com/maps/search/?api=1&query=${tienda.ubicacionMapa.lat},${tienda.ubicacionMapa.lng}`;
  }
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    `${tienda.nombre}, ${tienda.direccion}, ${tienda.ciudad}, Bolivia`
  )}`;
}

export default function SucursalesMapViewer({ ubicaciones }: Props) {
  const tiendas = ubicaciones.filter(
    (u) => u.permiteRetiroCliente || u.tipo === "TIENDA_FISICA"
  );

  const [selectedId, setSelectedId] = useState<string>(
    tiendas[0]?.id ?? "all"
  );

  const selectedTienda = tiendas.find((t) => t.id === selectedId) ?? null;
  const embedUrl = buildEmbedUrl(selectedTienda);

  return (
    <div className="space-y-6">
      {/* Selector de Sucursales / Pestañas */}
      <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5">
        {tiendas.map((tienda) => {
          const isSelected = selectedId === tienda.id;
          return (
            <button
              key={tienda.id}
              type="button"
              onClick={() => setSelectedId(tienda.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-full text-xs uppercase tracking-wider font-semibold transition-all cursor-pointer ${isSelected
                  ? "bg-foreground text-background shadow-md scale-[1.02]"
                  : "bg-white text-muted border border-border hover:text-foreground hover:bg-surface-soft"
                }`}
            >
              <FaStore className={isSelected ? "text-accent" : "text-subtle"} />
              <span>
                {tienda.nombre} ({tienda.ciudad})
              </span>
            </button>
          );
        })}

        <button
          type="button"
          onClick={() => setSelectedId("all")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-full text-xs uppercase tracking-wider font-semibold transition-all cursor-pointer ${selectedId === "all"
              ? "bg-foreground text-background shadow-md scale-[1.02]"
              : "bg-white text-muted border border-border hover:text-foreground hover:bg-surface-soft"
            }`}
        >
          <FaMapMarkerAlt className={selectedId === "all" ? "text-accent" : "text-subtle"} />
          <span>Vista General (La Paz / El Alto)</span>
        </button>
      </div>

      {/* Contenedor Principal: Mapa y Tarjeta de Información */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] xl:grid-cols-[1fr_420px] gap-6 items-stretch">
        {/* Mapa de Google Maps Indexado / Embebido */}
        <div className="relative rounded-[28px] overflow-hidden border border-border bg-[#ece8e1] shadow-lg min-h-[460px] sm:min-h-[540px] lg:min-h-[580px] flex flex-col">
          <iframe
            key={embedUrl}
            src={embedUrl}
            title={selectedTienda ? `Mapa de ${selectedTienda.nombre}` : "Mapa de sucursales Fit Andes"}
            width="100%"
            height="100%"
            style={{ border: 0 }}
            allowFullScreen
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            className="flex-1 w-full h-full min-h-[460px]"
          />

          {/* Botón flotante para abrir en la app de Google Maps */}
          {selectedTienda && (
            <div className="absolute top-4 right-4 z-10">
              <a
                href={buildDirectMapsUrl(selectedTienda)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-full bg-white/95 text-foreground text-xs font-semibold shadow-md border border-border/60 hover:bg-white hover:scale-105 transition-all backdrop-blur-xs"
              >
                <span>Abrir en Google Maps</span>
                <FaExternalLinkAlt className="text-[10px] text-accent" />
              </a>
            </div>
          )}
        </div>

        {/* Panel lateral con datos de la sucursal seleccionada */}
        <div className="flex flex-col justify-between gap-6">
          {selectedTienda ? (
            <div className="rounded-[28px] border border-border bg-white p-6 sm:p-7 shadow-sm space-y-6 flex-1 flex flex-col justify-between">
              <div className="space-y-5">
                {/* Cabecera de la sucursal */}
                <div className="flex items-center justify-between gap-3 border-b border-border/60 pb-4">
                  <div>
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-surface-soft text-[10px] font-semibold uppercase tracking-wider rounded-full text-foreground/80 mb-2">
                      <FaStore className="text-accent text-xs" />
                      {selectedTienda.ciudad}
                    </span>
                    <h2 className="text-2xl sm:text-3xl font-serif text-foreground font-normal">
                      {selectedTienda.nombre}
                    </h2>
                  </div>

                  {selectedTienda.permiteRetiroCliente && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-success bg-[#e7efe9] px-3 py-1 rounded-full">
                      <FaCheckCircle className="text-xs" />
                      Retiro gratis
                    </span>
                  )}
                </div>

                {/* Detalles de ubicación y horarios */}
                <div className="space-y-3.5 text-xs sm:text-sm text-muted">
                  <div className="flex items-start gap-3">
                    <FaMapMarkerAlt className="text-accent mt-1 shrink-0 text-base" />
                    <div>
                      <p className="font-medium text-foreground">Dirección:</p>
                      <p className="text-muted leading-relaxed">{selectedTienda.direccion}</p>
                      {selectedTienda.ubicacionMapa?.referencia && (
                        <p className="text-xs text-subtle mt-1 font-normal italic">
                          Ref: {selectedTienda.ubicacionMapa.referencia}
                        </p>
                      )}
                    </div>
                  </div>

                  {selectedTienda.ubicacionMapa?.horariosTexto && (
                    <div className="flex items-start gap-3">
                      <FaClock className="text-accent mt-1 shrink-0 text-base" />
                      <div>
                        <p className="font-medium text-foreground">Horarios de Atención:</p>
                        <p className="text-muted leading-relaxed">{selectedTienda.ubicacionMapa.horariosTexto}</p>
                      </div>
                    </div>
                  )}

                  {selectedTienda.telefono && selectedTienda.telefono !== "S/N" && (
                    <div className="flex items-start gap-3">
                      <FaPhoneAlt className="text-accent mt-1 shrink-0 text-sm" />
                      <div>
                        <p className="font-medium text-foreground">Teléfono / Contacto:</p>
                        <p className="text-muted">+591 {selectedTienda.telefono}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Botones de acción directa */}
              <div className="space-y-2.5 pt-4 border-t border-border/60">
                <a
                  href={buildDirectMapsUrl(selectedTienda)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-full bg-foreground text-background text-xs uppercase tracking-wider font-semibold hover:bg-foreground/90 transition-transform active:scale-95 shadow-sm text-center"
                >
                  <FaDirections className="text-sm" />
                  <span>Cómo llegar con GPS</span>
                </a>

                <a
                  href={getWhatsAppLink(
                    `Hola Fit Andes, quisiera hacer una consulta sobre la sucursal ${selectedTienda.nombre} en ${selectedTienda.ciudad}.`
                  )}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-full bg-[#25d366] text-white text-xs uppercase tracking-wider font-semibold hover:bg-[#20b858] transition-transform active:scale-95 shadow-sm text-center"
                >
                  <FaWhatsapp className="text-base" />
                  <span>Consultar por WhatsApp</span>
                </a>
              </div>
            </div>
          ) : (
            <div className="rounded-[28px] border border-border bg-white p-6 sm:p-7 shadow-sm space-y-4">
              <h3 className="text-lg font-serif font-semibold text-foreground">
                Sucursales en La Paz y El Alto
              </h3>
              <p className="text-xs text-muted leading-relaxed">
                Selecciona una de nuestras tiendas físicas en los botones superiores para ver el mapa detallado con su dirección exacta, horarios de atención y punto de retiro de pedidos.
              </p>
              <div className="space-y-3 pt-2">
                {tiendas.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setSelectedId(t.id)}
                    className="w-full text-left p-3.5 rounded-2xl border border-border/80 hover:bg-surface-soft transition-colors cursor-pointer"
                  >
                    <p className="font-medium text-xs text-foreground">{t.nombre} ({t.ciudad})</p>
                    <p className="text-[11px] text-muted mt-0.5">{t.direccion}</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Tarjeta de envíos nacionales */}
          <div className="rounded-[24px] border border-accent/20 bg-accent/5 p-5 text-center space-y-2.5">
            <p className="text-xs font-semibold text-foreground uppercase tracking-wider">
              ¿Estás en otro departamento?
            </p>
            <p className="text-xs text-muted leading-relaxed">
              Enviamos a los 9 departamentos de Bolivia mediante transporte terrestre por <strong>Bs. 20</strong>.
            </p>
            <Link
              href="/catalogo"
              className="inline-block text-[11px] font-semibold text-accent underline underline-offset-4 hover:text-foreground transition-colors"
            >
              Explorar prendas para envío nacional →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

