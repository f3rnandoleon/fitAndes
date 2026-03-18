interface RecursoConImagenes {
  imagen?: string | null;
  imagenes?: Array<string | null | undefined> | null;
}

interface ProductoConImagenes extends RecursoConImagenes {
  variantes?: RecursoConImagenes[] | null;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? process.env.API_URL ?? "";

function apiOrigin(): string | null {
  if (!API_URL) return null;

  try {
    return new URL(API_URL).origin;
  } catch {
    return null;
  }
}

function normalizarImagen(value: unknown): string | null {
  if (typeof value !== "string") return null;

  const imagen = value.trim();
  if (!imagen) return null;

  if (/^[a-z][a-z\d+.-]*:/i.test(imagen)) return imagen;
  if (imagen.startsWith("//")) return `https:${imagen}`;

  const origin = apiOrigin();
  if (!origin) return imagen;

  try {
    return new URL(imagen.startsWith("/") ? imagen : `/${imagen}`, origin).toString();
  } catch {
    return imagen;
  }
}

function recolectarImagenes(origen?: RecursoConImagenes | null): string[] {
  if (!origen) return [];

  const imagenes = Array.isArray(origen.imagenes) ? origen.imagenes : [];
  const candidatas = [...imagenes, origen.imagen]
    .map(normalizarImagen)
    .filter((imagen): imagen is string => Boolean(imagen));

  return Array.from(new Set(candidatas));
}

export function imagenesDeVariante(variante?: RecursoConImagenes | null): string[] {
  return recolectarImagenes(variante);
}

export function primeraImagenDeVariante(variante?: RecursoConImagenes | null): string | null {
  return imagenesDeVariante(variante)[0] ?? null;
}

export function imagenesDeProducto(producto?: ProductoConImagenes | null): string[] {
  if (!producto) return [];

  const imagenes = (producto.variantes ?? []).flatMap((variante) => imagenesDeVariante(variante));
  if (imagenes.length > 0) return Array.from(new Set(imagenes));

  return recolectarImagenes(producto);
}

export function primeraImagenDeProducto(producto?: ProductoConImagenes | null): string | null {
  return imagenesDeProducto(producto)[0] ?? null;
}
