/**
 * Configuración y constantes globales de FitAndes
 */

export const WHATSAPP_NUMBER = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || process.env.WHATSAPP_NUMBER || "59167113105";
export const WHATSAPP_DISPLAY = "+591 67113105";

export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://fit-andes.vercel.app";
export const SITE_NAME = "FitAndes";

export const SEASONAL_THEME_ENABLED = process.env.NEXT_PUBLIC_SEASONAL_THEME === "false";
export const DEFAULT_NATIONAL_SHIPPING_FEE = Number(process.env.NEXT_PUBLIC_NATIONAL_SHIPPING_FEE) || 10;
export const PROMO_NATIONAL_SHIPPING_FEE = 20;

const rawPromoExpressEnv = process.env.NEXT_PUBLIC_PROMO_EXPRESS_CHECKOUT?.trim().toLowerCase();
export const PROMO_EXPRESS_ENV_OVERRIDE: boolean | undefined =
  rawPromoExpressEnv === "true" ? true : rawPromoExpressEnv === "false" ? false : undefined;

export const BOLIVIA_OTHER_DEPARTMENTS = [
  "Oruro",
  "Potosí",
  "Cochabamba",
  "Sucre",
  "Tarija",
  "Pando",
  "Beni",
  "Santa Cruz",
] as const;

export type BoliviaOtherDepartment = (typeof BOLIVIA_OTHER_DEPARTMENTS)[number];

export const SOCIAL_LINKS = {
  tiktok: "https://www.tiktok.com/@fitandes",
  facebook: "https://www.facebook.com/share/1CnRxfHb2e/",
  whatsapp: `https://wa.me/${WHATSAPP_NUMBER}`,
};

export function getWhatsAppLink(message?: string): string {
  const text = message ? encodeURIComponent(message) : encodeURIComponent("Hola, me gustaría más información.");
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${text}`;
}

