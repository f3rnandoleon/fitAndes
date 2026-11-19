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
  precioLista?: number | null;
  precioVenta?: number | null;
  tieneRebaja?: boolean | null;
  porcentajeDescuento?: number | null;
  precioCosto?: number | null;
  medidas?: CatalogVariantMedidas | null;
}

export interface CatalogProduct {
  _id: string;
  nombre: string;
  modelo: string;
  categoria?: string | null;
  precioLista?: number | null;
  precioVenta: number;
  tieneRebaja?: boolean | null;
  porcentajeDescuentoMaximo?: number | null;
  precioMinimoLista?: number | null;
  precioMaximoLista?: number | null;
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

export function getCatalogVariantListPrice(product: CatalogProduct, variant?: CatalogVariant | null): number | null {
  const effectivePrice = getCatalogVariantPrice(product, variant);

  if (variant && typeof variant.precioLista === "number" && Number.isFinite(variant.precioLista) && variant.precioLista > effectivePrice) {
    return variant.precioLista;
  }

  if (typeof product.precioLista === "number" && Number.isFinite(product.precioLista) && product.precioLista > effectivePrice) {
    return product.precioLista;
  }

  // Fallback legado si el backend no expone precioLista pero sí descuento %
  if (
    variant?.precioLista == null &&
    product.precioLista == null &&
    typeof product.descuento === "number" &&
    Number.isFinite(product.descuento) &&
    product.descuento > 0 &&
    product.descuento < 100 &&
    effectivePrice > 0
  ) {
    return Number((effectivePrice / (1 - product.descuento / 100)).toFixed(2));
  }

  return null;
}

export function getCatalogVariantDiscountPercent(product: CatalogProduct, variant?: CatalogVariant | null): number {
  if (variant && typeof variant.porcentajeDescuento === "number" && Number.isFinite(variant.porcentajeDescuento) && variant.porcentajeDescuento > 0) {
    return Math.round(variant.porcentajeDescuento);
  }

  const effectivePrice = getCatalogVariantPrice(product, variant);
  const listPrice = getCatalogVariantListPrice(product, variant);
  if (listPrice && listPrice > effectivePrice && listPrice > 0) {
    return Math.round(((listPrice - effectivePrice) / listPrice) * 100);
  }

  if (typeof product.porcentajeDescuentoMaximo === "number" && Number.isFinite(product.porcentajeDescuentoMaximo) && product.porcentajeDescuentoMaximo > 0) {
    return Math.round(product.porcentajeDescuentoMaximo);
  }

  if (typeof product.descuento === "number" && Number.isFinite(product.descuento) && product.descuento > 0) {
    return Math.round(product.descuento);
  }

  return 0;
}

export function catalogVariantHasSale(product: CatalogProduct, variant?: CatalogVariant | null): boolean {
  if (variant?.tieneRebaja === true) return true;
  const listPrice = getCatalogVariantListPrice(product, variant);
  const effectivePrice = getCatalogVariantPrice(product, variant);
  return Boolean(listPrice && listPrice > effectivePrice);
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

export function getCatalogProductListPriceRange(product: CatalogProduct): {
  min: number;
  max: number;
  hasRange: boolean;
} | null {
  const effectiveRange = getCatalogProductPriceRange(product);

  if (
    typeof product.precioMinimoLista === "number" &&
    typeof product.precioMaximoLista === "number" &&
    Number.isFinite(product.precioMinimoLista) &&
    Number.isFinite(product.precioMaximoLista) &&
    (product.precioMinimoLista > effectiveRange.min || product.precioMaximoLista > effectiveRange.max)
  ) {
    return {
      min: product.precioMinimoLista,
      max: product.precioMaximoLista,
      hasRange: product.precioMinimoLista !== product.precioMaximoLista,
    };
  }

  const availableVariants = product.variantes?.length ? product.variantes.filter(catalogVariantIsAvailable) : [];
  const variantsToInspect = availableVariants.length > 0 ? availableVariants : (product.variantes || []);
  const variantListPrices = variantsToInspect
    .map((v) => getCatalogVariantListPrice(product, v))
    .filter((value): value is number => typeof value === "number" && Number.isFinite(value) && value > 0);

  if (variantListPrices.length > 0) {
    const min = Math.min(...variantListPrices);
    const max = Math.max(...variantListPrices);
    if (min > effectiveRange.min || max > effectiveRange.max) {
      return { min, max, hasRange: min !== max };
    }
  }

  if (
    typeof product.precioLista === "number" &&
    Number.isFinite(product.precioLista) &&
    product.precioLista > effectiveRange.min
  ) {
    return { min: product.precioLista, max: product.precioLista, hasRange: false };
  }

  return null;
}

export function getCatalogProductDiscountPercent(product: CatalogProduct): number {
  if (
    typeof product.porcentajeDescuentoMaximo === "number" &&
    Number.isFinite(product.porcentajeDescuentoMaximo) &&
    product.porcentajeDescuentoMaximo > 0
  ) {
    return Math.round(product.porcentajeDescuentoMaximo);
  }

  const availableVariants = product.variantes?.length ? product.variantes.filter(catalogVariantIsAvailable) : [];
  const variantsToInspect = availableVariants.length > 0 ? availableVariants : (product.variantes || []);
  let maxPct = 0;

  for (const variant of variantsToInspect) {
    const pct = getCatalogVariantDiscountPercent(product, variant);
    if (pct > maxPct) maxPct = pct;
  }

  if (maxPct > 0) return maxPct;

  const listRange = getCatalogProductListPriceRange(product);
  const priceRange = getCatalogProductPriceRange(product);
  if (listRange && listRange.min > priceRange.min && listRange.min > 0) {
    return Math.round(((listRange.min - priceRange.min) / listRange.min) * 100);
  }

  if (typeof product.descuento === "number" && Number.isFinite(product.descuento) && product.descuento > 0) {
    return Math.round(product.descuento);
  }

  return 0;
}

export function catalogProductHasSale(product: CatalogProduct): boolean {
  if (product.tieneRebaja === true) return true;
  if (getCatalogProductDiscountPercent(product) > 0) return true;
  const listRange = getCatalogProductListPriceRange(product);
  const priceRange = getCatalogProductPriceRange(product);
  return Boolean(listRange && (listRange.min > priceRange.min || listRange.max > priceRange.max));
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


export interface PublicBanner {
  _id: string;
  titulo: string;
  descripcion?: string | null;
  imagenDesktopUrl: string;
  imagenMobileUrl?: string | null;
  tipoAccion?: "WHATSAPP" | "URL" | "CATALOGO" | string;
  whatsappNumero?: string | null;
  whatsappMensaje?: string | null;
  actionUrl?: string | null;
  activo?: boolean;
  orden?: number;
  fechaInicio?: string | null;
  fechaFin?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface CatalogPaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export function unwrapCatalogPagination(data: unknown): CatalogPaginationMeta {
  if (data && typeof data === "object") {
    const record = data as Record<string, unknown>;
    const total = typeof record.total === "number" ? record.total : 0;
    const page = typeof record.page === "number" ? record.page : 1;
    const limit = typeof record.limit === "number" ? record.limit : 24;
    const totalPages =
      typeof record.totalPages === "number"
        ? record.totalPages
        : Math.max(1, Math.ceil(total / (limit || 1)));
    return { total, page, limit, totalPages };
  }
  return { total: 0, page: 1, limit: 24, totalPages: 1 };
}
