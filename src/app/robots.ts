import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/constants";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/catalogo", "/nosotros", "/faq", "/ubicaciones", "/politicas"],
        disallow: [
          "/api/",
          "/dashboard/",
          "/pedidos/",
          "/direcciones/",
          "/perfil/",
          "/pagar/",
          "/checkout",
        ],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}

