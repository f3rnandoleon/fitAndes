import type { ChatIntent } from "@/lib/chat/types";

export const CHAT_INTENTS: ChatIntent[] = [
  "buscar_producto",
  "ver_detalle",
  "ver_similares",
  "agregar_carrito",
  "ver_pedidos",
  "ver_pedido",
  "buscar_por_codigo",
  "ayuda",
  "fallback",
];

export const COLOR_ALIASES: Record<string, string[]> = {
  negro: ["negro", "negra", "oscur@", "black"],
  blanco: ["blanco", "blanca", "white"],
  gris: ["gris", "gray", "grey"],
  azul: ["azul", "celeste", "navy", "azul marino"],
  rojo: ["rojo", "roja", "bordo", "granate"],
  verde: ["verde", "oliva"],
  beige: ["beige", "crema", "camel"],
  cafe: ["cafe", "marron", "brown"],
  rosado: ["rosado", "rosa", "pink"],
  morado: ["morado", "lila", "violeta", "purple"],
  amarillo: ["amarillo", "mostaza"],
  naranja: ["naranja"],
};

export const SIZE_ALIASES: Record<string, string[]> = {
  XS: ["xs", "extra small", "extra chico"],
  S: ["s", "small", "chico", "pequeno", "pequeÃ±o"],
  M: ["m", "medium", "mediano"],
  L: ["l", "large", "grande"],
  XL: ["xl", "extra large", "extra grande"],
  XXL: ["xxl", "2xl", "doble xl"],
};

export const GREETING_KEYWORDS = ["hola", "buenas", "buen dia", "buen dÃ­a", "hey", "hello"];
export const HELP_KEYWORDS = ["ayuda", "opciones", "que puedes", "quÃ© puedes", "como funciona", "cÃ³mo funciona"];
export const DETAIL_KEYWORDS = ["detalle", "detalles", "mas fotos", "mÃ¡s fotos", "mostrar", "muestrame", "muÃ©strame", "ver"];
export const SIMILAR_KEYWORDS = ["similar", "similares", "parecido", "parecidos", "parece"];
export const ADD_KEYWORDS = ["agrega", "agregar", "aÃ±ade", "anade", "carrito", "reserva", "llevar", "comprar esta", "lo quiero"];
export const ORDER_KEYWORDS = ["pedido", "pedidos", "compras", "historial", "mis pedidos", "mis compras"];
export const CODE_KEYWORDS = ["codigo", "cÃ³digo", "qr", "barra", "barcode"];

export const QUERY_STOPWORDS = new Set([
  "quiero",
  "busco",
  "buscar",
  "mostrar",
  "muestrame",
  "muÃ©strame",
  "ver",
  "detalle",
  "detalles",
  "algo",
  "parecido",
  "similares",
  "agrega",
  "agregar",
  "aÃ±ade",
  "anade",
  "carrito",
  "reserva",
  "pedido",
  "pedidos",
  "codigo",
  "cÃ³digo",
  "qr",
  "barra",
  "por",
  "favor",
  "de",
  "la",
  "el",
  "los",
  "las",
  "unas",
  "unos",
  "que",
  "quÃ©",
  "me",
  "tienes",
  "tienen",
  "talla",
  "color",
  "para",
  "con",
  "sin",
  "quiera",
  "primera",
  "primero",
  "segunda",
  "segundo",
  "tercera",
  "tercero",
]);

