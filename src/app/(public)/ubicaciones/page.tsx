import type { Metadata } from "next";
import Link from "next/link";
import { SITE_NAME, SITE_URL } from "@/lib/constants";
import SucursalesMapViewer, { UbicacionItem } from "@/components/ubicaciones/SucursalesMapViewer";

export const metadata: Metadata = {
  title: "Nuestras Sucursales y Tiendas | FitAndes",
  description:
    "Visita nuestras tiendas físicas en La Paz y El Alto, Bolivia. Mapa interactivo de Google Maps, horarios de atención y puntos de retiro gratuitos de FitAndes.",
  openGraph: {
    title: "Sucursales y Tiendas - FitAndes",
    description: "Puntos de venta físicos y retiro de prendas con mapa interactivo en Bolivia.",
    url: `${SITE_URL}/ubicaciones`,
    siteName: SITE_NAME,
  },
};

async function getUbicaciones(): Promise<UbicacionItem[]> {
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

  // Fallback garantizado con datos verificados del sistema central
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
        googleMapsUrl: "https://maps.app.goo.gl/mFx6U57tBgDoRW6H9",
        lat: -16.5022,
        lng: -68.1328,
        referencia: "Edificio Avenida 1er Piso subiendo las escaleras",
        horariosTexto: "Lun a Vie 11:00 a 20:00",
      },
    },
    {
      id: "6ade561c49cf4be57295015a",
      nombre: "Tienda Tiwanacu",
      codigo: "TDA-02",
      tipo: "TIENDA_FISICA",
      ciudad: "El Alto",
      direccion: "Av. Tiwanacu",
      telefono: "73725700",
      permiteVentaPOS: true,
      permiteRetiroCliente: true,
      ubicacionMapa: {
        googleMapsUrl: "https://maps.app.goo.gl/pddMFokxQ6afTySL6",
        lat: -16.516887,
        lng: -68.163307,
        referencia: "Anaquel azul en medio de la Avenida",
        horariosTexto: "Mar a Dom 17:00 a 21:00",
      },
    },
  ];
}

export default async function UbicacionesPage() {
  const ubicaciones = await getUbicaciones();

  return (
    <main className="min-h-screen bg-background text-foreground pb-20">
      {/* Hero Header */}
      <section className="py-12 sm:py-16 border-b border-border/40 bg-surface/30">
        <div className="max-w-4xl mx-auto px-5 text-center space-y-3.5">
          <span className="text-xs uppercase tracking-[0.25em] text-accent font-semibold">
            Puntos de Venta & Retiro
          </span>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-serif text-foreground font-normal tracking-tight">
            Nuestras Sucursales Físicas
          </h1>
          <p className="text-sm sm:text-base text-muted max-w-2xl mx-auto leading-relaxed">
            Explora la ubicación exacta en el mapa de Google Maps para visitarnos, probarte nuestras prendas artesanales o retirar tus pedidos web de forma gratuita.
          </p>
        </div>
      </section>

      {/* Mapa Indexado de Google Maps y Selector de Tiendas */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
        <SucursalesMapViewer ubicaciones={ubicaciones} />

        {/* Sección Informativa de Envíos a Nivel Nacional */}
        <div className="mt-14 p-8 border border-border/70 bg-surface/40 rounded-[28px] text-center space-y-4 shadow-xs">
          <h3 className="text-xl sm:text-2xl font-serif text-foreground">
            ¿No estás cerca de nuestras tiendas en La Paz o El Alto?
          </h3>
          <p className="text-sm text-muted max-w-2xl mx-auto leading-relaxed">
            Despachamos diariamente a los 9 departamentos de Bolivia (Santa Cruz, Cochabamba, Oruro, Sucre, Tarija, Potosí, Trinidad y Cobija) por transporte terrestre seguro con tarifa plana de solo <strong>Bs. 20</strong>.
          </p>
          <div className="pt-2 flex flex-wrap justify-center gap-3">
            <Link
              href="/catalogo"
              className="inline-flex items-center justify-center rounded-full px-6 py-3 bg-foreground text-background text-xs uppercase tracking-widest font-semibold hover:bg-foreground/90 transition-all shadow-sm"
            >
              Comprar en Catálogo Online
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
