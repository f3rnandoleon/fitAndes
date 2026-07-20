export const COLOR_OPTIONS = [
  "Negro",
  "Blanco",
  "Gris",
  "Gris Claro",
  "Gris Oscuro",
  "Azul",
  "Azul Marino",
  "Azul Rey",
  "Celeste",
  "Turquesa",
  "Verde",
  "Verde Oliva",
  "Verde Esmeralda",
  "Verde Militar",
  "Amarillo",
  "Mostaza",
  "Naranja",
  "Rojo",
  "Vino",
  "Amaranto",
  "Carmesi",
  "Burdeos",
  "Palo de Rosa",
  "Rosa",
  "Magenta",
  "Fucsia",
  "Morado",
  "Lila",
  "Purpura",
  "Beige",
  "Crema",
  "Marron",
  "Cafe",
  "Camel",
  "Khaki",
  "Dorado",
  "Plateado",
  "Coral",
  "Terracota",
  "Lavanda",
  "Salmon",
  "Aguamarina",
  "Menta",
  "Carbon",
  "Marfil",
  "Indigo",
  "Cian",
  "Bronce",
  "Cobre",
  "Hueso",
  "Chocolate",
  "Cereza",
  "Ciruela",
  "Petroleo",
  "Arena",
  "Ambar",
] as const;

export const COLOR_VALUE_MAP: Record<string, string> = {
  negro: "#111827",
  blanco: "#FFFFFF",
  gris: "#6B7280",
  grisclaro: "#D1D5DB",
  grisoscuro: "#374151",
  azul: "#2563EB",
  azulmarino: "#172554",
  azulrey: "#1D4ED8",
  celeste: "#7DD3FC",
  turquesa: "#14B8A6",
  verde: "#16A34A",
  verdeoliva: "#6B7D3E",
  verdeesmeralda: "#059669",
  verdemilitar: "#4B5320",
  amarillo: "#FACC15",
  mostaza: "#CA8A04",
  naranja: "#F97316",
  rojo: "#DC2626",
  vino: "#722F37",
  amaranto: "#9F1239",
  carmesi: "#DC143C",
  burdeos: "#800020",
  paloderosa: "#C08081",
  rosa: "#F472B6",
  magenta: "#D946EF",
  fucsia: "#FF00FF",
  morado: "#7E22CE",
  lila: "#C4B5FD",
  purpura: "#9333EA",
  beige: "#D6C6A5",
  crema: "#FFFDD0",
  marron: "#7C2D12",
  cafe: "#6F4E37",
  camel: "#C19A6B",
  khaki: "#BDB76B",
  dorado: "#D4AF37",
  plateado: "#C0C0C0",
  coral: "#FF7F50",
  terracota: "#C65D3B",
  lavanda: "#C4B5FD",
  salmon: "#FA8072",
  aguamarina: "#7FFFD4",
  menta: "#98FF98",
  carbon: "#36454F",
  marfil: "#FFFFF0",
  indigo: "#4F46E5",
  cian: "#06B6D4",
  bronce: "#CD7F32",
  cobre: "#B87333",
  hueso: "#E3DAC9",
  chocolate: "#7B3F00",
  cereza: "#D2042D",
  ciruela: "#8E4585",
  petroleo: "#006D77",
  arena: "#C2B280",
  ambar: "#FFBF00",
};

const LIGHT_COLOR_KEYS = new Set(["blanco", "grisclaro", "beige", "crema", "plateado"]);
const COLOR_ORDER = new Map(COLOR_OPTIONS.map((color, index) => [normalizeColorKey(color), index]));

export function normalizeColorKey(color: string): string {
  return color
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, "");
}

export function getProductColorValue(color: string): string {
  return COLOR_VALUE_MAP[normalizeColorKey(color)] ?? "#b7b7b7";
}

export function isLightProductColor(color: string): boolean {
  return LIGHT_COLOR_KEYS.has(normalizeColorKey(color));
}

export function sortProductColors(colors: string[]): string[] {
  return [...colors].sort((a, b) => {
    const orderA = COLOR_ORDER.get(normalizeColorKey(a));
    const orderB = COLOR_ORDER.get(normalizeColorKey(b));

    if (orderA !== undefined && orderB !== undefined) return orderA - orderB;
    if (orderA !== undefined) return -1;
    if (orderB !== undefined) return 1;
    return a.localeCompare(b, "es", { sensitivity: "base" });
  });
}
