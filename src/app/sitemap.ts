import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/constants";
import { unwrapCatalogProducts } from "@/types/catalogo";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: SITE_URL,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: `${SITE_URL}/catalogo`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/ubicaciones`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${SITE_URL}/nosotros`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${SITE_URL}/faq`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${SITE_URL}/politicas`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.5,
    },
  ];

  try {
    const apiUrl =
      process.env.NEXT_PUBLIC_API_URL ||
      process.env.API_URL ||
      "https://control-ventas-azure.vercel.app/api";

    const res = await fetch(`${apiUrl}/productos/publicos?soloDisponible=true&limit=100`, {
      next: { revalidate: 3600 },
      signal: AbortSignal.timeout(12000),
    });

    if (!res.ok) {
      return staticRoutes;
    }

    const json = await res.json();
    const productos = unwrapCatalogProducts(json);

    const productRoutes: MetadataRoute.Sitemap = productos.map((p) => ({
      url: `${SITE_URL}/catalogo/${p._id}`,
      lastModified: p.createdAt ? new Date(p.createdAt) : new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    }));

    return [...staticRoutes, ...productRoutes];
  } catch {
    return staticRoutes;
  }
}

