export interface CatalogVariant {
  variantId?: string | null;
  color: string;
  colorSecundario?: string | null;
  talla: string;
  stock: number;
  reservedStock?: number | null;
  stockDisponible?: number | null;
  descripcion?: string | null;
  imagen?: string | null;
  imagenes?: Array<string | null | undefined> | null;
  codigoBarra?: string | null;
  qrCode?: string | null;
}

export interface CatalogProduct {
  _id: string;
  nombre: string;
  modelo: string;
  categoria?: string | null;
  precioVenta: number;
  sku?: string | null;
  descuento?: number | null;
  createdAt?: string;
  totalVendidos?: number;
  imagen?: string | null;
  imagenes?: Array<string | null | undefined> | null;
  variantes: CatalogVariant[];
}

export interface ProductByCodeResponse {
  _id: string;
  nombre: string;
  modelo: string;
  precioVenta: number;
  variante: CatalogVariant;
}

export function getCatalogVariantAvailableStock(variant: CatalogVariant): number {
  if (typeof variant.stockDisponible === "number" && Number.isFinite(variant.stockDisponible)) {
    return Math.max(0, variant.stockDisponible);
  }

  const stock = typeof variant.stock === "number" && Number.isFinite(variant.stock) ? variant.stock : 0;
  const reserved = typeof variant.reservedStock === "number" && Number.isFinite(variant.reservedStock) ? variant.reservedStock : 0;
  return Math.max(0, stock - reserved);
}

export function getCatalogProductAvailableStock(product: CatalogProduct): number {
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
