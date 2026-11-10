import type { Metadata } from "next";
import Link from "next/link";
import { SITE_NAME, SITE_URL, getWhatsAppLink } from "@/lib/constants";
import { FaMapMarkerAlt, FaStore, FaWhatsapp, FaDirections } from "react-icons/fa";

export const metadata: Metadata = {
  title: "Nuestras Sucursales y Tiendas | FitAndes",
  description:
    "Visita nuestras tiendas físicas en La Paz, Bolivia. Conoce direcciones, teléfonos y puntos de retiro gratuitos de FitAndes.",
  openGraph: {
    title: "Sucursales y Tiendas - FitAndes",
    description: "Puntos de venta físicos y retiro de prendas en La Paz, Bolivia.",
    url: `${SITE_URL}/ubicaciones`,
    siteName: SITE_NAME,
  },
};

interface Ubicacion {
  id: string;
  nombre: string;
  codigo: string;
  tipo: string;
  ciudad: string;
  direccion: string;
  telefono: string;
  permiteVentaPOS: boolean;
  permiteRetiroCliente: boolean;
  ubicacionMapa?: {
    googleMapsUrl?: string;
    lat?: number | null;
    lng?: number | null;
    referencia?: string;
    horariosTexto?: string;
  };
}

async function getUbicaciones(): Promise<Ubicacion[]> {
  const apiUrl =
    process.env.NEXT_PUBLIC_API_URL ||
    process.env.API_URL ||
    "https://control-ventas-azure.vercel.app/api";

  try {
    const res = await fetch(`${apiUrl}/ubicaciones`, {
      next: { revalidate: 3600 },
      signal: AbortSignal.timeout(5000),
    });

    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data?.ubicaciones)) {
        return data.ubicaciones;
      }
      if (Array.isArray(data)) {
        return data;
      }
    }
  } catch {
    // Fallback silencioso
  }

  // Fallback garantizado con datos verificado del sistema central
  return [
    {
      id: "6ad8e4dab4fda345721ebb4e",
      nombre: "Tienda Prado",
      codigo: "TDA-01",
      tipo: "TIENDA_FISICA",
      ciudad: "La Paz",
      direccion: "Sucursal Prado Av. 16 de Julio",
      telefono: "67113105",
      permiteVentaPOS: true,
      permiteRetiroCliente: true,
      ubicacionMapa: {
        referencia: "Edificio Alameda / Zona Central",
        horariosTexto: "Lunes a Sábado: 10:00 - 19:30",
      },
    },
    {
      id: "6ade561c49cf4be57295015a",
      nombre: "Tienda Tiwanacu",
      codigo: "TDA-02",
      tipo: "TIENDA_FISICA",
      ciudad: "La Paz",
      direccion: "Av. Tiwanacu",
      telefono: "73725700",
      permiteVentaPOS: true,
      permiteRetiroCliente: true,
      ubicacionMapa: {
        referencia: "Zona Central, calle Tiwanacu",
        horariosTexto: "Lunes a Sábado: 10:30 - 19:00",
      },
    },
  ];
}

export default async function UbicacionesPage() {
  const ubicaciones = await getUbicaciones();
  // Filtrar o priorizar tiendas abiertas a público
  const tiendasFisicas = ubicaciones.filter(
    (u) => u.permiteRetiroCliente || u.tipo === "TIENDA_FISICA"
  );

  return (
    <main className="min-h-screen bg-background text-foreground pb-20">
      {/* Hero Header */}
      <section className="py-14 sm:py-20 border-b border-border/40 bg-surface/30">
        <div className="max-w-3xl mx-auto px-5 text-center space-y-4">
          <span className="text-xs uppercase tracking-[0.25em] text-accent font-semibold">
            Puntos de Encuentro & Venta
          </span>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-serif text-foreground font-normal tracking-tight">
            Nuestras Tiendas Físicas
          </h1>
          <p className="text-sm sm:text-base text-muted max-w-xl mx-auto leading-relaxed">
            Visítanos para probarte nuestras prendas, sentir las fibras textiles o retirar tu pedido
            comprado en línea sin ningún costo de envío.
          </p>
        </div>
      </section>

      {/* Grid of Stores */}
      <section className="max-w-4xl mx-auto px-5 py-12 sm:py-16 space-y-10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
          {tiendasFisicas.map((tienda) => {
            const mapsQuery = encodeURIComponent(
              `${tienda.nombre}, ${tienda.direccion}, ${tienda.ciudad}, Bolivia`
            );
            const mapsUrl =
              tienda.ubicacionMapa?.googleMapsUrl ||
              `https://www.google.com/maps/search/?api=1&query=${mapsQuery}`;

            return (
              <div
                key={tienda.id}
                className="bg-surface/50 border border-border/70 rounded-2xl p-6 sm:p-8 flex flex-col justify-between space-y-6 hover:border-accent/50 transition-colors shadow-sm"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-surface-soft text-[11px] font-semibold uppercase tracking-wider rounded-full text-foreground/80">
                      <FaStore className="text-accent text-xs" />
                      {tienda.ciudad}
                    </span>
                    {tienda.permiteRetiroCliente && (
                      <span className="text-[11px] font-medium text-success bg-success/10 px-2.5 py-1 rounded-full">
                        Retiro gratuito disponible
                      </span>
                    )}
                  </div>

                  <h2 className="text-2xl font-serif text-foreground font-normal">
                    {tienda.nombre}
                  </h2>

                  <div className="space-y-2 text-sm text-muted">
                    <p className="flex items-start gap-2.5">
                      <FaMapMarkerAlt className="text-accent mt-1 shrink-0 text-base" />
                      <span>{tienda.direccion}</span>
                    </p>
                    {tienda.ubicacionMapa?.referencia && (
                      <p className="text-xs text-subtle pl-6">
                        Ref: {tienda.ubicacionMapa.referencia}
                      </p>
                    )}
                    {tienda.telefono && tienda.telefono !== "S/N" && (
                      <p className="text-xs text-foreground/80 pl-6">
                        Contacto directo: +591 {tienda.telefono}
                      </p>
                    )}
                    {tienda.ubicacionMapa?.horariosTexto && (
                      <p className="text-xs text-foreground/80 pl-6">
                        Horarios: {tienda.ubicacionMapa.horariosTexto}
                      </p>
                    )}
                  </div>
                </div>

                <div className="pt-4 border-t border-border/50 flex flex-wrap gap-3">
                  <a
                    href={mapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-foreground text-background text-xs uppercase tracking-wider font-semibold hover:bg-foreground/90 transition-all rounded-sm shadow-sm"
                  >
                    <FaDirections className="text-xs" />
                    <span>Cómo llegar</span>
                  </a>
                  <a
                    href={getWhatsAppLink(
                      `Hola, quisiera información sobre la sucursal ${tienda.nombre} (${tienda.direccion}).`
                    )}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-2 px-4 py-2.5 border border-border bg-background text-foreground text-xs uppercase tracking-wider font-semibold hover:bg-surface transition-all rounded-sm"
                  >
                    <FaWhatsapp className="text-sm text-[#25d366]" />
                    <span>WhatsApp</span>
                  </a>
                </div>
              </div>
            );
          })}
        </div>

        {/* National Deliveries Callout */}
        <div className="p-8 border border-border/60 bg-surface/30 rounded-2xl text-center space-y-4">
          <h3 className="text-xl sm:text-2xl font-serif text-foreground">
            ¿Vives en otra ciudad o departamento?
          </h3>
          <p className="text-sm text-muted max-w-xl mx-auto leading-relaxed">
            Hacemos despachos diarios a Santa Cruz, Cochabamba, Sucre, Oruro, Tarija, Potosí, Trinidad y Cobija
            por flota o courier nacional. La tarifa plana de envío es de solo <strong>Bs. 10</strong>.
          </p>
          <div className="pt-2 flex flex-wrap justify-center gap-4">
            <Link
              href="/catalogo"
              className="px-6 py-3 bg-foreground text-background text-xs uppercase tracking-widest font-semibold hover:bg-foreground/90 transition-all rounded-sm"
            >
              Comprar en Línea
            </Link>
            <Link
              href="/faq"
              className="px-6 py-3 border border-border bg-background text-foreground text-xs uppercase tracking-widest font-semibold hover:bg-surface transition-all rounded-sm"
            >
              Ver Tiempos de Entrega
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
