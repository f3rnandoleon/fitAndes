/**
 * Configuración y constantes globales de FitAndes
 */

export const WHATSAPP_NUMBER = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || process.env.WHATSAPP_NUMBER || "59167113105";
export const WHATSAPP_DISPLAY = "+591 67113105";

export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://fit-andes.vercel.app";
export const SITE_NAME = "FitAndes";

export const SOCIAL_LINKS = {
  tiktok: "https://www.tiktok.com/@fitandes",
  facebook: "https://www.facebook.com/share/1CnRxfHb2e/",
  whatsapp: `https://wa.me/${WHATSAPP_NUMBER}`,
};

export function getWhatsAppLink(message?: string): string {
  const text = message ? encodeURIComponent(message) : encodeURIComponent("Hola, me gustaría más información.");
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${text}`;
}

