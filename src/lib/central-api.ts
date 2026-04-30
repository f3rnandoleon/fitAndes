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

const RETRYABLE_CENTRAL_STATUSES = new Set([400, 404, 405, 422]);

export function buildCentralApiHeaders(
  auth: CentralApiAuth,
  options?: { includeJsonContentType?: boolean; requestId?: string }
) {
  const headers: Record<string, string> = {
    "x-user-id": auth.userId,
    "x-user-role": auth.role,
  };

  if (options?.requestId) {
    headers["x-request-id"] = options.requestId;
  }

  if (options?.includeJsonContentType) {
    headers["Content-Type"] = "application/json";
  }

  if (auth.accessToken) {
    headers.Authorization = `Bearer ${auth.accessToken}`;
  }

  return headers;
}

export function parseJsonRecord(data: unknown): Record<string, unknown> | null {
  return data && typeof data === "object" ? (data as Record<string, unknown>) : null;
}

export function readString(source: Record<string, unknown> | null, ...keys: string[]): string | null {
  for (const key of keys) {
    const value = source?.[key];
    if (typeof value === "string" && value.trim()) {
      return value;
    }
  }

  return null;
}

function shouldRetryCentralAttempt(status: number, hasMoreAttempts: boolean) {
  return hasMoreAttempts && RETRYABLE_CENTRAL_STATUSES.has(status);
}

export async function fetchCentralApiWithFallback(
  attempts: CentralApiAttempt[],
  options?: { timeoutMs?: number },
): Promise<CentralApiResult> {
  if (!CENTRAL_API_URL) {
    throw new Error("Central API URL is not configured.");
  }

  const timeoutMs = options?.timeoutMs ?? 10000;
  let lastResult: CentralApiResult | null = null;
  let lastError: unknown = null;

  for (const [attemptIndex, attempt] of attempts.entries()) {
    try {
      const response = await fetch(`${CENTRAL_API_URL}${attempt.path}`, {
        ...attempt.init,
        cache: attempt.init?.cache ?? "no-store",
        signal: attempt.init?.signal ?? AbortSignal.timeout(timeoutMs),
      });

      const data = await response.json().catch(() => null);
      lastResult = { response, data, attemptIndex };

      if (response.ok || !shouldRetryCentralAttempt(response.status, attemptIndex < attempts.length - 1)) {
        return lastResult;
      }
    } catch (error) {
      lastError = error;

      if (attemptIndex === attempts.length - 1) {
        throw error;
      }
    }
  }

  if (lastResult) {
    return lastResult;
  }

  throw lastError instanceof Error ? lastError : new Error("No se pudo completar la solicitud a la API central.");
}
