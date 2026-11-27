import CheckoutPageClient from "@/components/checkout/CheckoutPageClient";
import PromoExpressCheckoutClient from "@/components/checkout/PromoExpressCheckoutClient";
import { CENTRAL_API_URL } from "@/lib/central-api";
import { PROMO_EXPRESS_ENV_OVERRIDE } from "@/lib/constants";
import type { DeliveryOptionsConfig } from "@/types/checkout";

export const dynamic = "force-dynamic";

async function resolveDeliveryConfigForCheckout(): Promise<DeliveryOptionsConfig | null> {
  if (!CENTRAL_API_URL) return null;

  try {
    const response = await fetch(`${CENTRAL_API_URL}/delivery-options`, {
      cache: "no-store",
      signal: AbortSignal.timeout(4000),
    });
    if (!response.ok) return null;
    return (await response.json().catch(() => null)) as DeliveryOptionsConfig | null;
  } catch {
    return null;
  }
}

export default async function CheckoutPage() {
  if (PROMO_EXPRESS_ENV_OVERRIDE === false) {
    return <CheckoutPageClient />;
  }

  const deliveryConfig = await resolveDeliveryConfigForCheckout();
  const usePromoExpress =
    PROMO_EXPRESS_ENV_OVERRIDE === true ||
    Boolean(deliveryConfig?.shippingPolicy?.promoExpressCheckout);

  if (usePromoExpress) {
    return <PromoExpressCheckoutClient initialDeliveryConfig={deliveryConfig} />;
  }

  return <CheckoutPageClient />;
}
