export type CentralApiRole = "ADMIN" | "VENDEDOR" | "CLIENTE";

export interface CentralApiAuth {
  userId: string;
  role: CentralApiRole;
  accessToken?: string | null;
}

export interface CentralApiAttempt {
  path: string;
  init?: RequestInit;
}

export interface CentralApiResult {
  response: Response;
  data: unknown;
  attemptIndex: number;
}

export const CENTRAL_API_URL = process.env.NEXT_PUBLIC_API_URL ?? process.env.API_URL ?? "";

const RETRYABLE_CENTRAL_STATUSES = new Set([400, 403, 404, 405, 422]);

export function buildCentralApiHeaders(
  auth?: CentralApiAuth | null,
  options?: { includeJsonContentType?: boolean; requestId?: string }
) {
  const headers: Record<string, string> = {};

  if (auth?.userId) {
    headers["x-user-id"] = auth.userId;
  }

  if (auth?.role) {
    headers["x-user-role"] = auth.role;
  }

  if (auth?.accessToken) {
    headers.Authorization = `Bearer ${auth.accessToken}`;
  }

  if (options?.requestId) {
    headers["x-request-id"] = options.requestId;
  }

  if (options?.includeJsonContentType) {
    headers["Content-Type"] = "application/json";
  }

  return headers;
}

export function parseJsonRecord(data: unknown): Record<string, unknown> | null {
  return data && typeof data === "object" ? (data as Record<string, unknown>) : null;
}

export function readString(source: Record<string, unknown> | null | undefined, ...keys: string[]): string | null {
  if (!source) return null;
  for (const key of keys) {
    const value = source[key];
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
    if (typeof value === "number") {
      return String(value);
    }
  }

  return null;
}

export async function fetchCentralApiWithFallback(
  attempts: CentralApiAttempt[],
  options?: { timeoutMs?: number; requestId?: string }
): Promise<CentralApiResult> {
  const timeoutMs = options?.timeoutMs ?? 10000;
  let lastError: unknown;

  for (let index = 0; index < attempts.length; index += 1) {
    const attempt = attempts[index];
    const url = `${CENTRAL_API_URL}${attempt.path}`;

    try {
      const response = await fetch(url, {
        ...attempt.init,
        signal: AbortSignal.timeout(timeoutMs),
      });

      const contentType = response.headers.get("content-type") ?? "";
      const isJson = contentType.includes("application/json");
      const data = isJson ? await response.json().catch(() => null) : await response.text().catch(() => "");

      if (response.ok) {
        return { response, data, attemptIndex: index };
      }

      if (RETRYABLE_CENTRAL_STATUSES.has(response.status) && index < attempts.length - 1) {
        continue;
      }

      return { response, data, attemptIndex: index };
    } catch (error) {
      lastError = error;
      if (index < attempts.length - 1) {
        continue;
      }
    }
  }

  throw lastError instanceof Error ? lastError : new Error("No pude conectar con el sistema central.");
}
