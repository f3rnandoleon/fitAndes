import type { Metadata } from "next";
import AppProviders from "@/components/providers/AppProviders";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "FitAndes | Chompas Andinas y Poleras de Calidad",
    template: "%s | FitAndes"
  },
  description: "Explora nuestra coleccion exclusiva de chompas andinas tejidas con maestria y una amplia variedad de poleras modernas. Calidad boliviana para el mundo.",
  keywords: ["chompas andinas", "poleras", "ropa de bolivia", "moda andina", "camisetas", "ropa artesanal", "fitandes"],
  authors: [{ name: "FitAndes Team" }],
  openGraph: {
    title: "FitAndes - Chompas Andinas y Poleras",
    description: "Lo mejor en chompas andinas y poleras modernas.",
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

