/**
 * Centralized text normalization utilities.
 */

/**
 * Removes all non-digit characters from a phone number string.
 */
export function normalizePhone(phone?: string): string {
  return (phone ?? "").replace(/\D/g, "").trim();
}

/**
 * Trims a string and returns undefined if the result is empty.
 * Useful for optional fields in payloads.
 */
export function compactText(value?: string | null): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

/**
 * Trims a string and returns an empty string if null or undefined.
 */
export function normalizeText(value?: string | null): string {
  return value?.trim() || "";
}

/**
 * Normalizes text by removing accents, converting to lowercase and trimming.
 * Useful for fuzzy matching or canonical comparisons.
 */
export function removeAccents(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}
