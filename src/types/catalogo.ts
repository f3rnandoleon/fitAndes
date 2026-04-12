export interface CatalogVariant {
  variantId?: string | null;
  color: string;
  colorSecundario?: string | null;
  talla: string;
  stock: number;
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
