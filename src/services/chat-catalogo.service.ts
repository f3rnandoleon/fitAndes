import { primeraImagenDeProducto } from "@/lib/catalogo-imagenes";
import type { SearchProductsParams } from "@/lib/chat/types";
import { catalogVariantIsAvailable, type CatalogProduct, type CatalogVariant, type ProductByCodeResponse } from "@/types/catalogo";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? process.env.API_URL ?? "";

function normalizeText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function toNumber(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function matchVariant(variant: CatalogVariant, color?: string | null, talla?: string | null): boolean {
  const normalizedColor = color ? normalizeText(color) : null;
  const normalizedTalla = talla ? normalizeText(talla) : null;

  if (normalizedColor && normalizeText(variant.color) !== normalizedColor) return false;
  if (normalizedTalla && normalizeText(variant.talla) !== normalizedTalla) return false;
  return true;
}

function productSearchText(product: CatalogProduct): string {
  const variantText = product.variantes
    .map((variant) => [variant.color, variant.talla, variant.descripcion ?? ""].join(" "))
    .join(" ");

  return normalizeText([product.nombre, product.modelo, product.categoria ?? "", variantText].join(" "));
}

function isRecentQuery(query: string | null): boolean {
  if (!query) return false;
  return /\b(nuevo|nueva|nuevas|novedad|novedades|reciente|recientes|ultimo|ultimos|ultima|ultimas)\b/i.test(normalizeText(query));
}

function scoreProduct(product: CatalogProduct, query: string | null): number {
  if (!query) return 0;

  const haystack = productSearchText(product);
  const terms = normalizeText(query)
    .split(/\s+/)
    .filter(Boolean);

  let score = 0;
  for (const term of terms) {
    if (normalizeText(product.nombre).includes(term)) score += 5;
    if (normalizeText(product.modelo).includes(term)) score += 4;
    if (normalizeText(product.categoria ?? "").includes(term)) score += 2;
    if (haystack.includes(term)) score += 1;
  }
  return score;
}

async function fetchJson<T>(path: string, init?: RequestInit): Promise<T | null> {
  if (!API_URL) return null;

  try {
    const res = await fetch(`${API_URL}${path}`, {
      ...init,
      cache: "no-store",
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

export async function getPublicProducts(): Promise<CatalogProduct[] | null> {
  const data = await fetchJson<CatalogProduct[]>("/productos/publicos");
  return Array.isArray(data) ? data : data === null ? null : [];
}

export async function getProductDetail(productId: string): Promise<CatalogProduct | null | undefined> {
  if (!productId) return null;

  try {
    const res = await fetch(`${API_URL}/productos/publicos/${productId}`, {
      cache: "no-store",
      signal: AbortSignal.timeout(10000),
    });
    if (res.status === 404) return null;
    if (!res.ok) return undefined;
    return (await res.json()) as CatalogProduct;
  } catch {
    return undefined;
  }
}

export async function getProductByCode(code: string): Promise<ProductByCodeResponse | null | undefined> {
  if (!code) return null;

  try {
    const res = await fetch(`${API_URL}/productos/by-code/${encodeURIComponent(code)}`, {
      cache: "no-store",
      signal: AbortSignal.timeout(10000),
    });
    if (res.status === 404 || res.status === 400) return null;
    if (!res.ok) return undefined;
    return (await res.json()) as ProductByCodeResponse;
  } catch {
    return undefined;
  }
}

export async function searchProducts(params: SearchProductsParams): Promise<CatalogProduct[] | null> {
  const products = await getPublicProducts();
  if (products === null) return null;

  const query = params.query?.trim() ?? null;
  const color = params.color?.trim() ?? null;
  const talla = params.talla?.trim() ?? null;
  const recentQuery = isRecentQuery(query);

  const filtered = products.filter((product) => {
    if (!product.variantes.some(catalogVariantIsAvailable)) {
      return false;
    }

    const byColorOrSize =
      !color && !talla
        ? true
        : product.variantes.some((variant) => matchVariant(variant, color, talla) && catalogVariantIsAvailable(variant));

    if (!byColorOrSize) return false;

    const price = toNumber(product.precioVenta);
    if (params.minPrice !== null && params.minPrice !== undefined && price < params.minPrice) return false;
    if (params.maxPrice !== null && params.maxPrice !== undefined && price > params.maxPrice) return false;

    if (!query || recentQuery) return true;
    return scoreProduct(product, query) > 0;
  });

  filtered.sort((a, b) => {
    if (recentQuery) {
      return new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime();
    }

    const scoreDiff = scoreProduct(b, query) - scoreProduct(a, query);
    if (scoreDiff !== 0) return scoreDiff;

    const soldDiff = toNumber(b.totalVendidos) - toNumber(a.totalVendidos);
    if (soldDiff !== 0) return soldDiff;

    return new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime();
  });

  return filtered.slice(0, params.limit ?? 4);
}

export async function findSimilarProducts(reference: CatalogProduct, preferredColor?: string | null, limit = 4): Promise<CatalogProduct[] | null> {
  const products = await getPublicProducts();
  if (products === null) return null;

  const baseName = normalizeText(reference.nombre);
  const baseModel = normalizeText(reference.modelo);
  const baseCategory = normalizeText(reference.categoria ?? "");
  const basePrice = toNumber(reference.precioVenta);
  const wantedColor = preferredColor ? normalizeText(preferredColor) : null;

  return products
    .filter((product) => product._id !== reference._id && product.variantes.some(catalogVariantIsAvailable))
    .map((product) => {
      let score = 0;
      const name = normalizeText(product.nombre);
      const model = normalizeText(product.modelo);
      const category = normalizeText(product.categoria ?? "");
      const colors = product.variantes.filter(catalogVariantIsAvailable).map((variant) => normalizeText(variant.color));

      if (name === baseName || name.includes(baseName) || baseName.includes(name)) score += 4;
      if (model && model === baseModel) score += 3;
      if (baseCategory && category === baseCategory) score += 2;
      if (wantedColor && colors.includes(wantedColor)) score += 2;
      if (Math.abs(toNumber(product.precioVenta) - basePrice) <= Math.max(basePrice * 0.2, 30)) score += 2;
      score += Math.min(toNumber(product.totalVendidos) / 10, 2);

      return { product, score };
    })
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((entry) => entry.product);
}

export function resolveVariant(product: CatalogProduct, color?: string | null, talla?: string | null): CatalogVariant | null {
  const available = product.variantes.filter(catalogVariantIsAvailable);
  if (available.length === 0) return product.variantes[0] ?? null;

  const exact = available.find((variant) => matchVariant(variant, color, talla));
  if (exact) return exact;

  if (color) {
    const byColor = available.find((variant) => matchVariant(variant, color, null));
    if (byColor) return byColor;
  }

  if (talla) {
    const bySize = available.find((variant) => matchVariant(variant, null, talla));
    if (bySize) return bySize;
  }

  return available[0] ?? null;
}

export function listAvailableColors(product: CatalogProduct): string[] {
  return Array.from(new Set(product.variantes.filter(catalogVariantIsAvailable).map((variant) => variant.color)));
}

export function listAvailableSizes(product: CatalogProduct): string[] {
  return Array.from(new Set(product.variantes.filter(catalogVariantIsAvailable).map((variant) => variant.talla)));
}

export function selectProductImage(product: CatalogProduct): string | null {
  return primeraImagenDeProducto(product);
}
