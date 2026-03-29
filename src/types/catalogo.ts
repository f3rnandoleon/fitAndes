export interface CatalogVariant {
  color: string;
  talla: string;
  stock: number;
  descripcion?: string | null;
  imagen?: string | null;
  imagenes?: Array<string | null | undefined> | null;
}

export interface CatalogProduct {
  _id: string;
  nombre: string;
  modelo: string;
  categoria?: string | null;
  precioVenta: number;
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
  variante: CatalogVariant & {
    codigoBarra?: string | null;
    qrCode?: string | null;
  };
}

