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
  auth: CentralApiAuth,
  options?: { timeoutMs?: number }
): Promise<CentralApiResult> {
  return fetchCentralApiWithFallback(
    attempts.map((attempt) => {
      const body = attempt.body ?? undefined;
      const headers = new Headers(
        buildCentralApiHeaders(auth, { includeJsonContentType: typeof body === "string" })
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

export async function syncRemoteCart(auth: CentralApiAuth, items: CheckoutItemInput[]) {
  const clearCartResult = await fetchCentralApiWithFallback([
    {
      path: "/carrito",
      init: {
        method: "DELETE",
        headers: buildCentralApiHeaders(auth),
      },
    },
    {
      path: "/cart",
      init: {
        method: "DELETE",
        headers: buildCentralApiHeaders(auth),
      },
    },
  ]);

  if (!clearCartResult.response.ok) {
    return { ok: false, result: clearCartResult, phase: "clear" };
  }

  for (const item of items) {
    const headers = buildCentralApiHeaders(auth, { includeJsonContentType: true });

    const canonicalItemBody = {
      productoId: item.productoId,
      varianteId: item.variantId ?? undefined,
      color: item.color,
      colorSecundario: item.colorSecundario ?? undefined,
      talla: item.talla,
      cantidad: item.cantidad,
    };

    const legacyItemBody = {
      productoId: item.productoId,
      variantId: item.variantId ?? undefined,
      color: item.color,
      colorSecundario: item.colorSecundario ?? undefined,
      talla: item.talla,
      cantidad: item.cantidad,
    };

    const addItemResult = await fetchCentralApiWithFallback([
      {
        path: "/carrito/items",
        init: {
          method: "POST",
          headers,
          body: JSON.stringify(canonicalItemBody),
        },
      },
      {
        path: "/carrito/items",
        init: {
          method: "POST",
          headers,
          body: JSON.stringify(legacyItemBody),
        },
      },
      {
        path: "/cart/items",
        init: {
          method: "POST",
          headers,
          body: JSON.stringify(legacyItemBody),
        },
      },
    ]);

    if (!addItemResult.response.ok) {
      return { ok: false, result: addItemResult, phase: "add", item };
    }
  }

  return { ok: true };
}
