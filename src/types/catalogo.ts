export interface CatalogVariantMedidas {
  anchoPecho?: number | null;
  anchoHombros?: number | null;
  largoTotal?: number | null;
  largoMangaAxila?: number | null;
  largoMangaHombro?: number | null;
}

export interface CatalogVariant {
  variantId?: string | null;
  varianteId?: string | null;
  color: string;
  colorSecundario?: string | null;
  talla: string;
  stock: number;
  reservedStock?: number | null;
  stockReservado?: number | null;
  stockDisponible?: number | null;
  descripcion?: string | null;
  imagen?: string | null;
  imagenes?: Array<string | null | undefined> | null;
  codigoBarra?: string | null;
  qrCode?: string | null;
  precioVenta?: number | null;
  precioCosto?: number | null;
  medidas?: CatalogVariantMedidas | null;
}

export interface CatalogProduct {
  _id: string;
  nombre: string;
  modelo: string;
  categoria?: string | null;
  precioVenta: number;
  precioMinimo?: number | null;
  precioMaximo?: number | null;
  tieneRangoPrecios?: boolean | null;
  precioDisplay?: string | null;
  sku?: string | null;
  descuento?: number | null;
  createdAt?: string;
  totalVendidos?: number;
  stockTotal?: number;
  stockReservadoTotal?: number | null;
  stockDisponible?: number | null;
  estado?: string | null;
  imagen?: string | null;
  imagenes?: Array<string | null | undefined> | null;
  variantes: CatalogVariant[];
}

export interface ProductByCodeResponse {
  _id: string;
  nombre: string;
  modelo: string;
  precioVenta: number;
  sku?: string | null;
  descripcion?: string | null;
  categoria?: string | null;
  variante: CatalogVariant;
}

export function getCatalogVariantId(variant: CatalogVariant): string | null {
  return variant.variantId ?? variant.varianteId ?? null;
}

export function getCatalogVariantAvailableStock(variant: CatalogVariant): number {
  if (typeof variant.stockDisponible === "number" && Number.isFinite(variant.stockDisponible)) {
    return Math.max(0, variant.stockDisponible);
  }

  const stock = typeof variant.stock === "number" && Number.isFinite(variant.stock) ? variant.stock : 0;
  const reservedBase = variant.reservedStock ?? variant.stockReservado;
  const reserved = typeof reservedBase === "number" && Number.isFinite(reservedBase) ? reservedBase : 0;
  return Math.max(0, stock - reserved);
}

export function getCatalogProductAvailableStock(product: CatalogProduct): number {
  if (typeof product.stockDisponible === "number" && Number.isFinite(product.stockDisponible)) {
    return Math.max(0, product.stockDisponible);
  }
  return product.variantes.reduce((sum, variant) => sum + getCatalogVariantAvailableStock(variant), 0);
}

export function catalogVariantIsAvailable(variant: CatalogVariant): boolean {
  return getCatalogVariantAvailableStock(variant) > 0;
}

export function filterCatalogAvailableVariants(product: CatalogProduct): CatalogProduct {
  return {
    ...product,
    variantes: product.variantes.filter(catalogVariantIsAvailable),
  };
}

export function getCatalogVariantPrice(product: CatalogProduct, variant?: CatalogVariant | null): number {
  if (variant && typeof variant.precioVenta === "number" && Number.isFinite(variant.precioVenta) && variant.precioVenta > 0) {
    return variant.precioVenta;
  }
  return typeof product.precioVenta === "number" && Number.isFinite(product.precioVenta) ? product.precioVenta : 0;
}

export function getCatalogProductPriceRange(product: CatalogProduct): {
  min: number;
  max: number;
  hasRange: boolean;
  display?: string | null;
} {
  if (
    typeof product.precioMinimo === "number" &&
    typeof product.precioMaximo === "number" &&
    Number.isFinite(product.precioMinimo) &&
    Number.isFinite(product.precioMaximo)
  ) {
    return {
      min: product.precioMinimo,
      max: product.precioMaximo,
      hasRange: product.tieneRangoPrecios ?? product.precioMinimo !== product.precioMaximo,
      display: product.precioDisplay ?? null,
    };
  }

  const basePrice = typeof product.precioVenta === "number" && Number.isFinite(product.precioVenta) ? product.precioVenta : 0;
  const availableVariants = product.variantes?.length ? product.variantes.filter(catalogVariantIsAvailable) : [];
  const variantsToInspect = availableVariants.length > 0 ? availableVariants : (product.variantes || []);

  if (variantsToInspect.length === 0) {
    return { min: basePrice, max: basePrice, hasRange: false };
  }

  const prices = variantsToInspect.map((v) => getCatalogVariantPrice(product, v));
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  return { min, max, hasRange: min !== max };
}

export function unwrapCatalogProducts(data: unknown): CatalogProduct[] {
  if (!data) return [];
  if (Array.isArray(data)) return data as CatalogProduct[];
  if (typeof data === "object" && data !== null) {
    const record = data as Record<string, unknown>;
    if (Array.isArray(record.data)) return record.data as CatalogProduct[];
    if (Array.isArray(record.productos)) return record.productos as CatalogProduct[];
    if (Array.isArray(record.products)) return record.products as CatalogProduct[];
  }
  return [];
}

