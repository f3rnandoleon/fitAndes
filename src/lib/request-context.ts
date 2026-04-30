import { headers } from "next/headers";

export async function getRequestId(): Promise<string> {
  const headersList = await headers();
  const reqId = headersList.get("x-request-id") || headersList.get("X-Request-Id");
  return reqId || crypto.randomUUID();
}
