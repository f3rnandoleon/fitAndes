import { formatPrice } from "@/lib/format";
import type { CatalogProduct } from "@/types/catalogo";

export type CouponErrorCode =
  | "CUPON_INVALIDO"
  | "CUPON_EXPIRADO"
  | "CUPON_LIMITE_ALCANZADO"
  | "SOLO_PRIMERA_COMPRA"
  | "MONTO_MINIMO_NO_ALCANZADO"
  | "CANTIDAD_MINIMA_NO_ALCANZADA"
  | "NO_APLICA_A_PRODUCTOS"
  | "NO_ACUMULABLE";

export const COUPON_ERROR_MESSAGES: Record<CouponErrorCode, string> = {
  CUPON_INVALIDO: "El código de cupón no es válido o no existe.",
  CUPON_EXPIRADO: "Este cupón ha expirado o aún no está vigente.",
  CUPON_LIMITE_ALCANZADO: "Este cupón ya alcanzó su límite de usos permitidos.",
  SOLO_PRIMERA_COMPRA: "Este cupón es exclusivo para tu primera compra.",
  MONTO_MINIMO_NO_ALCANZADO: "Tu pedido aún no alcanza el monto mínimo requerido por este cupón.",
  CANTIDAD_MINIMA_NO_ALCANZADA: "Necesitas agregar más prendas para usar este cupón.",
  NO_APLICA_A_PRODUCTOS: "Este cupón no aplica a las prendas seleccionadas en tu carrito.",
  NO_ACUMULABLE: "Este cupón no es acumulable con las promociones o rebajas ya aplicadas.",
};

export interface PromotionReglaNxM {
  lleva?: number | null;
  paga?: number | null;
  compra?: number | null;
  cantidadLleva?: number | null;
  cantidadPaga?: number | null;
  cantidadRequerida?: number | null;
  cantidadPagar?: number | null;
  n?: number | null;
  m?: number | null;
}

export interface PromotionCondiciones {
  montoMinimo?: number | null;
  cantidadMinima?: number | null;
  soloPrimeraCompra?: boolean | null;
  [key: string]: unknown;
}

export interface PublicPromotion {
  _id?: string;
  id?: string;
  nombre: string;
  descripcion?: string | null;
  tipo: string;
  valor?: number | null;
  reglaNxM?: PromotionReglaNxM | null;
  descuentoMaximo?: number | null;
  alcance?: string | null;
  categoriasIncluidas?: string[] | null;
  productosIncluidos?: Array<string | { _id?: string; id?: string }> | null;
  condiciones?: PromotionCondiciones | null;
  acumulable?: boolean | null;
  acumulableConRebajasCatalogo?: boolean | null;
  fechaInicio?: string | null;
  fechaFin?: string | null;
}

export interface AppliedPromotionItem {
  promocionId?: string | null;
  nombre: string;
  tipo?: string | null;
  codigo?: string | null;
  esCupon?: boolean;
  descuento: number;
  descripcion?: string | null;
}

export interface EvaluatedLineItem {
  productoId?: string;
  varianteId?: string | null;
  color?: string;
  talla?: string;
  cantidad?: number;
  precioLista?: number;
  precioUnitario?: number;
  subtotalLista?: number;
  subtotalPostCatalogo?: number;
  descuentoCatalogo?: number;
  descuentoPromociones?: number;
  totalLinea?: number;
}

export interface PricingSummary {
  subtotalLista: number;
  subtotalPostCatalogo: number;
  descuentoCatalogo: number;
  descuentoPromociones: number;
  descuentoEnvio: number;
  descuentoTotal: number;
  totalFinal: number;
  costoEnvio?: number;
  promocionesAplicadas: AppliedPromotionItem[];
  cuponCodigo?: string | null;
  cuponValido?: boolean | null;
  cuponErrorCodigo?: string | null;
  cuponErrorMensaje?: string | null;
  items?: EvaluatedLineItem[];
}

function toFiniteNumber(value: unknown, fallback = 0): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function toRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

export function getCouponErrorMessage(code?: string | null, serverMessage?: string | null): string {
  if (serverMessage && serverMessage.trim()) return serverMessage.trim();
  if (code && code in COUPON_ERROR_MESSAGES) {
    return COUPON_ERROR_MESSAGES[code as CouponErrorCode];
  }
  return "No se pudo aplicar el cupón. Verifica el código e intenta nuevamente.";
}

export function unwrapPublicPromotions(data: unknown): PublicPromotion[] {
  if (!data) return [];
  if (Array.isArray(data)) return data as PublicPromotion[];
  const record = toRecord(data);
  if (!record) return [];
  if (Array.isArray(record.data)) return record.data as PublicPromotion[];
  if (Array.isArray(record.promociones)) return record.promociones as PublicPromotion[];
  if (Array.isArray(record.promotions)) return record.promotions as PublicPromotion[];
  return [];
}

function normalizeAppliedPromotion(raw: unknown): AppliedPromotionItem | null {
  const rec = toRecord(raw);
  if (!rec) return null;

  const nombre =
    (typeof rec.nombre === "string" && rec.nombre.trim()) ||
    (typeof rec.titulo === "string" && rec.titulo.trim()) ||
    (typeof rec.codigo === "string" && `Cupón ${rec.codigo}`) ||
    (typeof rec.cuponCodigo === "string" && `Cupón ${rec.cuponCodigo}`) ||
    "Promoción aplicada";

  const codigo =
    (typeof rec.codigo === "string" && rec.codigo.trim()) ||
    (typeof rec.cuponCodigo === "string" && rec.cuponCodigo.trim()) ||
    null;

  const descuento = toFiniteNumber(
    rec.descuento ?? rec.montoDescuento ?? rec.ahorro ?? rec.monto ?? 0,
    0,
  );

  return {
    promocionId: typeof rec.promocionId === "string" ? rec.promocionId : typeof rec._id === "string" ? rec._id : null,
    nombre,
    tipo: typeof rec.tipo === "string" ? rec.tipo : null,
    codigo,
    esCupon: Boolean(rec.esCupon || codigo || (typeof rec.origen === "string" && rec.origen.toUpperCase().includes("CUPON"))),
    descuento,
    descripcion: typeof rec.descripcion === "string" ? rec.descripcion : null,
  };
}

function normalizeEvaluatedLineItem(raw: unknown): EvaluatedLineItem | null {
  const rec = toRecord(raw);
  if (!rec) return null;

  return {
    productoId: typeof rec.productoId === "string" ? rec.productoId : undefined,
    varianteId:
      typeof rec.varianteId === "string"
        ? rec.varianteId
        : typeof rec.variantId === "string"
          ? rec.variantId
          : null,
    color: typeof rec.color === "string" ? rec.color : undefined,
    talla: typeof rec.talla === "string" ? rec.talla : undefined,
    cantidad: typeof rec.cantidad === "number" ? rec.cantidad : undefined,
    precioLista:
      rec.precioLista != null
        ? toFiniteNumber(rec.precioLista)
        : rec.precioUnitarioLista != null
          ? toFiniteNumber(rec.precioUnitarioLista)
          : undefined,
    precioUnitario:
      rec.precioUnitario != null
        ? toFiniteNumber(rec.precioUnitario)
        : rec.precioWebEfectivo != null
          ? toFiniteNumber(rec.precioWebEfectivo)
          : rec.precioVenta != null
            ? toFiniteNumber(rec.precioVenta)
            : undefined,
    subtotalLista: rec.subtotalLista != null ? toFiniteNumber(rec.subtotalLista) : undefined,
    subtotalPostCatalogo: rec.subtotalPostCatalogo != null ? toFiniteNumber(rec.subtotalPostCatalogo) : undefined,
    descuentoCatalogo: rec.descuentoCatalogo != null ? toFiniteNumber(rec.descuentoCatalogo) : undefined,
    descuentoPromociones:
      rec.descuentoPromociones != null
        ? toFiniteNumber(rec.descuentoPromociones)
        : rec.descuentoProrrateado != null
          ? toFiniteNumber(rec.descuentoProrrateado)
          : rec.descuento != null
            ? toFiniteNumber(rec.descuento)
            : undefined,
    totalLinea:
      rec.totalLinea != null
        ? toFiniteNumber(rec.totalLinea)
        : rec.totalLineaNeto != null
          ? toFiniteNumber(rec.totalLineaNeto)
          : rec.subtotalFinal != null
            ? toFiniteNumber(rec.subtotalFinal)
            : undefined,
  };
}

export function normalizePricingSummary(data: unknown): PricingSummary | null {
  const root = toRecord(data);
  if (!root) return null;

  const candidate =
    toRecord(root.resumenPrecios) ??
    toRecord(root.resumen) ??
    toRecord(root.data) ??
    root;

  if (
    candidate.totalFinal === undefined &&
    candidate.subtotalPostCatalogo === undefined &&
    candidate.subtotalLista === undefined &&
    candidate.descuentoTotal === undefined
  ) {
    return null;
  }

  const subtotalPostCatalogo = toFiniteNumber(candidate.subtotalPostCatalogo ?? candidate.subtotal ?? 0);
  const subtotalLista = toFiniteNumber(candidate.subtotalLista ?? subtotalPostCatalogo);
  const descuentoCatalogo = toFiniteNumber(
    candidate.descuentoCatalogo ?? Math.max(0, subtotalLista - subtotalPostCatalogo),
  );
  const descuentoPromociones = toFiniteNumber(candidate.descuentoPromociones ?? 0);
  const descuentoEnvio = toFiniteNumber(candidate.descuentoEnvio ?? 0);
  const descuentoTotal = toFiniteNumber(
    candidate.descuentoTotal ?? descuentoCatalogo + descuentoPromociones + descuentoEnvio,
  );
  const costoEnvio = candidate.costoEnvio != null ? toFiniteNumber(candidate.costoEnvio) : undefined;
  const totalFinal = toFiniteNumber(
    candidate.totalFinal ??
      Math.max(0, subtotalPostCatalogo - descuentoPromociones) + Math.max(0, (costoEnvio ?? 0) - descuentoEnvio),
  );

  const rawPromos = Array.isArray(candidate.promocionesAplicadas)
    ? candidate.promocionesAplicadas
    : Array.isArray(root.promocionesAplicadas)
      ? root.promocionesAplicadas
      : [];

  const promocionesAplicadas = rawPromos
    .map(normalizeAppliedPromotion)
    .filter((p): p is AppliedPromotionItem => p !== null);

  const rawItems = Array.isArray(candidate.items) ? candidate.items : undefined;
  const items = rawItems
    ?.map(normalizeEvaluatedLineItem)
    .filter((item): item is EvaluatedLineItem => item !== null);

  const cuponCodigo =
    (typeof candidate.cuponCodigo === "string" && candidate.cuponCodigo.trim()) ||
    (typeof root.cuponCodigo === "string" && root.cuponCodigo.trim()) ||
    null;

  const cuponValido =
    typeof candidate.cuponValido === "boolean"
      ? candidate.cuponValido
      : typeof root.cuponValido === "boolean"
        ? root.cuponValido
        : null;

  const cuponErrorCodigo =
    (typeof candidate.cuponErrorCodigo === "string" && candidate.cuponErrorCodigo.trim()) ||
    (typeof root.cuponErrorCodigo === "string" && root.cuponErrorCodigo.trim()) ||
    null;

  const cuponErrorMensaje =
    (typeof candidate.cuponErrorMensaje === "string" && candidate.cuponErrorMensaje.trim()) ||
    (typeof root.cuponErrorMensaje === "string" && root.cuponErrorMensaje.trim()) ||
    null;

  return {
    subtotalLista,
    subtotalPostCatalogo,
    descuentoCatalogo,
    descuentoPromociones,
    descuentoEnvio,
    descuentoTotal,
    totalFinal,
    costoEnvio,
    promocionesAplicadas,
    cuponCodigo,
    cuponValido,
    cuponErrorCodigo,
    cuponErrorMensaje,
    items,
  };
}

function normalizeText(value?: string | null): string {
  return (value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

export function isPromotionCurrentlyActive(promo: PublicPromotion, now = Date.now()): boolean {
  if (promo.fechaInicio) {
    const start = new Date(promo.fechaInicio).getTime();
    if (Number.isFinite(start) && now < start) return false;
  }
  if (promo.fechaFin) {
    const end = new Date(promo.fechaFin).getTime();
    if (Number.isFinite(end) && now > end) return false;
  }
  return true;
}

export function getPromotionsForProduct(
  promociones: PublicPromotion[],
  product: Pick<CatalogProduct, "_id" | "categoria">,
): PublicPromotion[] {
  if (!Array.isArray(promociones) || promociones.length === 0) return [];

  const productId = String(product._id ?? "").trim();
  const productCategory = normalizeText(product.categoria);

  return promociones.filter((promo) => {
    if (!isPromotionCurrentlyActive(promo)) return false;

    const alcance = (promo.alcance ?? "").toUpperCase().trim();
    const categorias = Array.isArray(promo.categoriasIncluidas) ? promo.categoriasIncluidas : [];
    const productos = Array.isArray(promo.productosIncluidos) ? promo.productosIncluidos : [];

    const matchesCategory =
      categorias.length > 0 &&
      Boolean(productCategory) &&
      categorias.some((cat) => normalizeText(cat) === productCategory);

    const matchesProduct =
      productos.length > 0 &&
      Boolean(productId) &&
      productos.some((entry) => {
        if (typeof entry === "string") return entry.trim() === productId;
        if (entry && typeof entry === "object") {
          const entryId = String(entry._id ?? entry.id ?? "").trim();
          return entryId === productId;
        }
        return false;
      });

    if (alcance.includes("PRODUCT")) return matchesProduct;
    if (alcance.includes("CATEG")) return matchesCategory;
    if (alcance === "TODO" || alcance === "GLOBAL" || alcance === "TIENDA" || alcance === "CATALOGO" || alcance === "ALL") {
      return true;
    }

    // Fallback si alcance viene vacío o mixto
    if (productos.length > 0 || categorias.length > 0) {
      return matchesProduct || matchesCategory;
    }

    return true;
  });
}

function resolveNxM(regla?: PromotionReglaNxM | null): { lleva: number; paga: number } | null {
  if (!regla) return null;
  const lleva = toFiniteNumber(regla.lleva ?? regla.compra ?? regla.cantidadLleva ?? regla.cantidadRequerida ?? regla.n, 0);
  const paga = toFiniteNumber(regla.paga ?? regla.cantidadPaga ?? regla.cantidadPagar ?? regla.m, 0);
  if (lleva > 0 && paga > 0) {
    return { lleva, paga };
  }
  return null;
}

export function formatPromotionBadgeLabel(promo: PublicPromotion): string {
  const tipo = (promo.tipo ?? "").toUpperCase().trim();
  const valor = toFiniteNumber(promo.valor, 0);

  if (tipo.includes("NXM") || tipo.includes("2X1") || tipo.includes("3X2") || promo.reglaNxM) {
    const nxm = resolveNxM(promo.reglaNxM);
    if (nxm) return `${nxm.lleva}x${nxm.paga}`;
  }

  if (tipo.includes("ENVIO") || tipo.includes("SHIPPING")) {
    return "Envío gratis";
  }

  if (tipo.includes("PORCENT") || tipo === "PERCENTAGE") {
    if (valor > 0) return `Promo -${Math.round(valor)}%`;
  }

  if (tipo.includes("MONTO") || tipo.includes("FIJO") || tipo === "FIXED") {
    if (valor > 0) return `-${formatPrice(valor)}`;
  }

  const shortName = promo.nombre?.trim() || "Promoción";
  return shortName.length > 22 ? `${shortName.slice(0, 20).trim()}…` : shortName;
}

export function formatPromotionConditionsHint(promo: PublicPromotion): string | null {
  const parts: string[] = [];
  const cond = promo.condiciones;

  if (cond) {
    const montoMin = toFiniteNumber(cond.montoMinimo, 0);
    if (montoMin > 0) parts.push(`Compra mínima ${formatPrice(montoMin)}`);

    const cantMin = toFiniteNumber(cond.cantidadMinima, 0);
    if (cantMin > 1) parts.push(`Desde ${cantMin} prendas`);

    if (cond.soloPrimeraCompra) parts.push("Solo 1ra compra");
  }

  const nxm = resolveNxM(promo.reglaNxM);
  if (nxm) {
    parts.push(`Lleva ${nxm.lleva}, paga ${nxm.paga}`);
  }

  const maxDesc = toFiniteNumber(promo.descuentoMaximo, 0);
  if (maxDesc > 0) {
    parts.push(`Tope ${formatPrice(maxDesc)}`);
  }

  if (promo.acumulableConRebajasCatalogo === false) {
    parts.push("No acumulable con ofertas");
  }

  return parts.length > 0 ? parts.join(" · ") : null;
}

export function formatPromotionBenefitDescription(promo: PublicPromotion): string {
  const tipo = (promo.tipo ?? "").toUpperCase().trim();
  const valor = toFiniteNumber(promo.valor, 0);
  const nxm = resolveNxM(promo.reglaNxM);

  if (nxm) {
    return `Lleva ${nxm.lleva} prendas y paga solo ${nxm.paga} automáticamente al pasar por caja.`;
  }

  if (tipo.includes("ENVIO") || tipo.includes("SHIPPING")) {
    return "Envío gratuito aplicado automáticamente en tu pedido.";
  }

  if ((tipo.includes("PORCENT") || tipo === "PERCENTAGE") && valor > 0) {
    return `${Math.round(valor)}% de descuento automático sobre las prendas participantes.`;
  }

  if ((tipo.includes("MONTO") || tipo.includes("FIJO") || tipo === "FIXED") && valor > 0) {
    return `${formatPrice(valor)} de descuento directo aplicado automáticamente en tu compra.`;
  }

  return "Descuento automático aplicado directamente en el resumen de tu compra.";
}

export function formatPromotionScopeLabel(promo: PublicPromotion): string {
  const alcance = (promo.alcance ?? "").toUpperCase().trim();
  const categorias = Array.isArray(promo.categoriasIncluidas)
    ? promo.categoriasIncluidas.filter((c): c is string => typeof c === "string" && Boolean(c.trim()))
    : [];
  const productos = Array.isArray(promo.productosIncluidos) ? promo.productosIncluidos : [];

  if (alcance.includes("CATEG") || (categorias.length > 0 && !alcance.includes("TODO") && !alcance.includes("GLOBAL"))) {
    if (categorias.length > 0) return `Categorías: ${categorias.join(", ")}`;
    return "Categorías seleccionadas";
  }

  if (alcance.includes("PRODUCT") || (productos.length > 0 && !alcance.includes("TODO") && !alcance.includes("GLOBAL"))) {
    return productos.length === 1 ? "1 prenda seleccionada" : `${productos.length} prendas seleccionadas`;
  }

  return "Todo el catálogo web";
}

export function formatPromotionValidityLabel(promo: PublicPromotion): string | null {
  const formatDate = (iso?: string | null) => {
    if (!iso) return null;
    const date = new Date(iso);
    if (!Number.isFinite(date.getTime())) return null;
    return date.toLocaleDateString("es-BO", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  };

  const endStr = formatDate(promo.fechaFin);
  if (endStr) return `Válido hasta el ${endStr}`;

  const startStr = formatDate(promo.fechaInicio);
  if (startStr) return `Vigente desde el ${startStr}`;

  return null;
}
