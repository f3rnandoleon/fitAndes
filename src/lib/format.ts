/**
 * Centralized formatting utilities for the application.
 */

/**
 * Formats a number as a currency string in Bs. (Bolivian Bolivianos).
 */
export function formatPrice(value: number): string {
  return `Bs. ${new Intl.NumberFormat("es-BO", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)}`;
}

/**
 * Alias for formatPrice to maintain compatibility with legacy code.
 */
export const formatMoney = formatPrice;

/**
 * Formats a date string or object into a human-readable format.
 */
export function formatDate(date: string | Date): string {
  const d = typeof date === "string" ? new Date(date) : date;
  if (isNaN(d.getTime())) return "Fecha invalida";
  
  return new Intl.DateTimeFormat("es-BO", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}
