import { CENTRAL_API_URL } from "./central-api";

export interface SystemHealthData {
  estado: string;
  timestamp?: string;
  services?: {
    mongodb?: {
      connected?: boolean;
      transactionsSupported?: boolean;
      readOnly?: boolean;
    };
  };
}

export interface SystemHealthStatus {
  ok: boolean;
  estado: string;
  timestamp: string;
  mongodbConnected: boolean;
  transactionsSupported: boolean;
  readOnly: boolean;
  canAcceptOrders: boolean;
  error?: string;
}

/**
 * Normaliza la URL base y la ruta relativa para evitar duplicaciones como /api/api/...
 */
function buildCentralUrl(path: string): string {
  const base = (CENTRAL_API_URL || "").replace(/\/+$/, "");
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  if (base.endsWith("/api") && normalizedPath.startsWith("/api/")) {
    return `${base}${normalizedPath.replace(/^\/api/, "")}`;
  }
  return `${base}${normalizedPath}`;
}

/**
 * Consulta el healthcheck técnico del sistema central (MongoDB y soporte de transacciones).
 * Permite detectar oportunamente si el backend está en mantenimiento o en modo solo lectura.
 */
export async function getSystemHealth(options?: { timeoutMs?: number }): Promise<SystemHealthStatus> {
  const timeoutMs = options?.timeoutMs ?? 5000;
  const nowIso = new Date().toISOString();

  if (!CENTRAL_API_URL) {
    return {
      ok: true,
      estado: "standalone",
      timestamp: nowIso,
      mongodbConnected: true,
      transactionsSupported: true,
      readOnly: false,
      canAcceptOrders: true,
    };
  }

  try {
    const url = buildCentralUrl("/api/estado");
    const response = await fetch(url, {
      method: "GET",
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(timeoutMs),
      // Cache temporal de 30 segundos en el servidor de Next.js
      next: { revalidate: 30 },
    });

    if (!response.ok) {
      return {
        ok: false,
        estado: `http_${response.status}`,
        timestamp: nowIso,
        mongodbConnected: false,
        transactionsSupported: false,
        readOnly: true,
        canAcceptOrders: false,
        error: `Servicio central no disponible (HTTP ${response.status})`,
      };
    }

    const data: SystemHealthData = await response.json();
    const isOk = data.estado === "ok";
    const mongoConnected = data.services?.mongodb?.connected ?? true;
    const isReadOnly = Boolean(data.services?.mongodb?.readOnly);
    const transactionsSupported = data.services?.mongodb?.transactionsSupported ?? true;

    return {
      ok: isOk && mongoConnected,
      estado: data.estado || "ok",
      timestamp: data.timestamp || nowIso,
      mongodbConnected: mongoConnected,
      transactionsSupported: transactionsSupported,
      readOnly: isReadOnly,
      canAcceptOrders: isOk && mongoConnected && !isReadOnly,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Error de conexión con el sistema central";
    return {
      ok: false,
      estado: "unreachable",
      timestamp: nowIso,
      mongodbConnected: false,
      transactionsSupported: false,
      readOnly: true,
      canAcceptOrders: false,
      error: message,
    };
  }
}
