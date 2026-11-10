import {
  buildCentralApiHeaders,
  CentralApiAuth,
  CentralApiResult,
  fetchCentralApiWithFallback,
} from "./central-api";
import { CheckoutItemInput } from "@/types/checkout";

type CentralJsonAttempt = {
  path: string;
  method?: string;
  body?: BodyInit | null;
  headers?: HeadersInit;
};

export async function fetchCentralJson(
  attempts: CentralJsonAttempt[],
  auth?: CentralApiAuth | null,
  options?: { timeoutMs?: number; requestId?: string }
): Promise<CentralApiResult> {
  return fetchCentralApiWithFallback(
    attempts.map((attempt) => {
      const body = attempt.body ?? undefined;
      const headers = new Headers(
        buildCentralApiHeaders(auth, {
          includeJsonContentType: typeof body === "string",
          requestId: options?.requestId,
        })
      );

      new Headers(attempt.headers ?? undefined).forEach((value, key) => {
        headers.set(key, value);
      });

      return {
        path: attempt.path,
        init: {
          method: attempt.method ?? "GET",
          headers,
          body,
        },
      };
    }),
    options
  );
}

export async function syncRemoteCart(
  auth: CentralApiAuth,
  items: CheckoutItemInput[],
  options?: { requestId?: string }
) {
  const clearCartResult = await fetchCentralApiWithFallback([
    {
      path: "/carrito",
      init: {
        method: "DELETE",
        headers: buildCentralApiHeaders(auth, { requestId: options?.requestId }),
      },
    },
    {
      path: "/cart",
      init: {
        method: "DELETE",
        headers: buildCentralApiHeaders(auth, { requestId: options?.requestId }),
      },
    },
  ]);

  if (!clearCartResult.response.ok && clearCartResult.response.status !== 404) {
    return { ok: false as const, phase: "clear" as const, result: clearCartResult };
  }

  for (const item of items) {
    if (!item.productoId) continue;

    const payload = JSON.stringify({
      productoId: item.productoId,
      variantId: item.variantId ?? undefined,
      color: item.color,
      talla: item.talla,
      cantidad: item.cantidad,
      precio: item.precio,
    });

    const addResult = await fetchCentralApiWithFallback([
      {
        path: "/carrito/items",
        init: {
          method: "POST",
          headers: buildCentralApiHeaders(auth, {
            includeJsonContentType: true,
            requestId: options?.requestId,
          }),
          body: payload,
        },
      },
      {
        path: "/cart/items",
        init: {
          method: "POST",
          headers: buildCentralApiHeaders(auth, {
            includeJsonContentType: true,
            requestId: options?.requestId,
          }),
          body: payload,
        },
      },
    ]);

    if (!addResult.response.ok) {
      return { ok: false as const, phase: "add" as const, item, result: addResult };
    }
  }

  return { ok: true as const };
}
