import { unwrapPublicPromotions, type PublicPromotion } from "@/types/promociones";

const FALLBACK_API_URL = "https://control-ventas-azure.vercel.app/api";

export async function getPublicPromotions(): Promise<PublicPromotion[]> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || process.env.API_URL || FALLBACK_API_URL;
  if (!apiUrl) return [];

  try {
    const res = await fetch(`${apiUrl}/public/promociones`, {
      next: { revalidate: 60 },
      signal: AbortSignal.timeout(6000),
      headers: { Accept: "application/json" },
    });

    if (!res.ok) return [];
    const data = await res.json();
    return unwrapPublicPromotions(data);
  } catch {
    return [];
  }
}
