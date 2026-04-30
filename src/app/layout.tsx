import type { Metadata } from "next";
import AppProviders from "@/components/providers/AppProviders";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "FitAndes | Ropa Deportiva y Estilo de Vida",
    template: "%s | FitAndes"
  },
  description: "Descubre el catalogo exclusivo de FitAndes. Ropa de alta calidad diseñada para tu rendimiento y comodidad.",
  keywords: ["ropa deportiva", "fitandes", "moda bolivia", "entrenamiento", "fitness"],
  authors: [{ name: "FitAndes Team" }],
  openGraph: {
    title: "FitAndes",
    description: "Catalogo exclusivo de ropa deportiva.",
    url: "https://fitandes.com",
    siteName: "FitAndes",
    locale: "es_BO",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className="antialiased">
        <a href="#main-content" className="skip-link">Saltar al contenido principal</a>
        <AppProviders>
          <div id="main-content">
            {children}
          </div>
        </AppProviders>
      </body>
    </html>
  );
}

