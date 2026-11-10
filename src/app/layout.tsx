import type { Metadata } from "next";
import { Playfair_Display, Inter } from "next/font/google";
import AppProviders from "@/components/providers/AppProviders";
import "./globals.css";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { SITE_NAME, SITE_URL } from "@/lib/constants";

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "FitAndes | Chompas Andinas y Poleras de Calidad",
    template: "%s | FitAndes",
  },
  description:
    "Explora nuestra colección exclusiva de chompas andinas tejidas con maestría y una amplia variedad de poleras modernas. Calidad boliviana.",
  keywords: [
    "chompas andinas",
    "poleras",
    "ropa de bolivia",
    "moda andina",
    "camisetas",
    "ropa artesanal",
    "fitandes",
  ],
  authors: [{ name: "FitAndes Team" }],
  openGraph: {
    title: "FitAndes - Chompas Andinas y Poleras",
    description: "Lo mejor en chompas andinas y poleras modernas con identidad boliviana.",
    url: SITE_URL,
    siteName: SITE_NAME,
    locale: "es_BO",
    type: "website",
  },
  alternates: {
    canonical: SITE_URL,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={`${inter.variable} ${playfair.variable}`}>
      <body className="antialiased">
        <a href="#main-content" className="skip-link">
          Saltar al contenido principal
        </a>
        <AppProviders>
          <div id="main-content">{children}</div>
        </AppProviders>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
