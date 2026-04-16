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
] as const;

const COLOR_VALUE_MAP: Record<string, string> = {
  negro: "#111111",
  blanco: "#f7f5ef",
  gris: "#8c9097",
  grisclaro: "#d8dbe1",
  grisoscuro: "#5e646e",
  azul: "#2f5fd0",
  azulmarino: "#1f2f52",
  azulrey: "#2553ff",
  celeste: "#8fcdf2",
  turquesa: "#3ac7c3",
  verde: "#52935f",
  verdeoliva: "#71773f",
  verdeesmeralda: "#15956e",
  verdemilitar: "#4f5d3a",
  amarillo: "#efc53f",
  mostaza: "#bf9026",
  naranja: "#e57e22",
  rojo: "#cc3d36",
  vino: "#6d233d",
  amaranto: "#a53b5a",
  carmesi: "#9e1b32",
  burdeos: "#6f1732",
  paloderosa: "#ca8d97",
  rosa: "#eca2b2",
  magenta: "#d82d84",
  fucsia: "#d93b9f",
  morado: "#6941a5",
  lila: "#b79bd8",
  purpura: "#6d2d8f",
  beige: "#d8c2a3",
  crema: "#efe2c4",
  marron: "#7b553d",
  cafe: "#6f4e37",
  camel: "#bc905c",
  khaki: "#ada06c",
  dorado: "linear-gradient(135deg, #9d7a22 0%, #e7c761 52%, #8d6b1b 100%)",
  plateado: "linear-gradient(135deg, #8d939d 0%, #eef1f4 50%, #7b818b 100%)",
  coral: "#f28472",
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
