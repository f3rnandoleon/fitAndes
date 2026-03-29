import type { CatalogVariant } from "@/types/catalogo";

export type ChatIntent =
  | "buscar_producto"
  | "ver_detalle"
  | "ver_similares"
  | "agregar_carrito"
  | "ver_pedidos"
  | "ver_pedido"
  | "buscar_por_codigo"
  | "ayuda"
  | "fallback";

export type ChatSourceMode = "ai" | "rules";

export interface ChatAttachment {
  name?: string;
  mimeType: string;
  data: string;
}

export interface ChatAttachmentPreview {
  name?: string;
  mimeType: string;
  previewUrl?: string;
}

export interface ChatFilters {
  query: string | null;
  color: string | null;
  talla: string | null;
  minPrice: number | null;
  maxPrice: number | null;
}

export interface ChatMemory {
  lastIntent: ChatIntent | null;
  lastProductIds: string[];
  lastOrderIds: string[];
  selectedProductId: string | null;
  selectedOrderId: string | null;
  filters: ChatFilters;
  pendingAction: "agregar_carrito" | null;
  pendingProductId: string | null;
  preferredColor: string | null;
  preferredTalla: string | null;
  preferredQuantity: number | null;
  userAuthenticated: boolean;
}

export interface ChatEntities {
  query: string | null;
  keywords: string[];
  color: string | null;
  talla: string | null;
  quantity: number | null;
  minPrice: number | null;
  maxPrice: number | null;
  code: string | null;
  productId: string | null;
  orderId: string | null;
  ordinalIndex: number | null;
}

export interface ChatInterpretation {
  intent: ChatIntent;
  entities: ChatEntities;
  confidence: number;
}

export type ChatActionType = "view_detail" | "show_similar" | "open_catalog" | "open_login" | "show_order";

export interface ChatAction {
  type: ChatActionType;
  label: string;
  productId?: string;
  orderId?: string;
  href?: string;
}

export interface ProductCardData {
  type: "product";
  id: string;
  title: string;
  model: string;
  subtitle: string;
  price: number;
  image: string | null;
  description: string | null;
  detailHref: string;
  variants: CatalogVariant[];
  preferredColor?: string | null;
  preferredTalla?: string | null;
  preferredQuantity?: number | null;
  actions?: ChatAction[];
}

export interface OrderCardItem {
  nombre: string;
  cantidad: number;
  color?: string | null;
  talla?: string | null;
}

export interface OrderCardData {
  type: "order";
  id: string;
  title: string;
  subtitle: string;
  status: string;
  total: number;
  detailHref: string;
  items: OrderCardItem[];
  actions?: ChatAction[];
}

export type ChatCard = ProductCardData | OrderCardData;

export interface ChatRequest {
  message: string;
  sessionId?: string;
  memory?: ChatMemory | null;
  attachments?: ChatAttachment[];
}

export interface ChatResponse {
  reply: string;
  intent: ChatIntent;
  cards?: ChatCard[];
  actions?: ChatAction[];
  suggestions?: string[];
  memory: ChatMemory;
  sourceMode: ChatSourceMode;
}

export interface TranscriptMessage {
  id: string;
  role: "assistant" | "user";
  text: string;
  cards?: ChatCard[];
  actions?: ChatAction[];
  suggestions?: string[];
  attachments?: ChatAttachmentPreview[];
  sourceMode?: ChatSourceMode;
  createdAt: number;
}

export interface SearchProductsParams {
  query?: string | null;
  color?: string | null;
  talla?: string | null;
  minPrice?: number | null;
  maxPrice?: number | null;
  limit?: number;
}

