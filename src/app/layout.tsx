import type { Metadata } from "next";
import AppProviders from "@/components/providers/AppProviders";
import "./globals.css";

export const metadata: Metadata = {
  title: "FitAndes",
  description: "Catalogo y portal de clientes de FitAndes.",
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

