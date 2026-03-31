export type CentralApiRole = "ADMIN" | "VENDEDOR" | "CLIENTE";

export interface CentralApiAuth {
  userId: string;
  role: CentralApiRole;
  accessToken?: string | null;
}

export function buildCentralApiHeaders(auth: CentralApiAuth, options?: { includeJsonContentType?: boolean }) {
  const headers: Record<string, string> = {
    "x-user-id": auth.userId,
    "x-user-role": auth.role,
  };

  if (options?.includeJsonContentType) {
    headers["Content-Type"] = "application/json";
  }

  if (auth.accessToken) {
    headers.Authorization = `Bearer ${auth.accessToken}`;
  }

  return headers;
}
