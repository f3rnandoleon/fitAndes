import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ControlVentas",
  description: "Catalogo y portal de clientes de ControlVentas.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
