"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { FaCheckCircle, FaClock, FaMapMarkerAlt, FaTruck, FaWhatsapp } from "react-icons/fa";
import { useReservationCart } from "@/components/providers/ReservationCartProvider";
import { CheckoutAuthStatus } from "@/components/checkout/CheckoutAuthStatus";
import { CheckoutCartSummary } from "@/components/checkout/CheckoutCartSummary";
import { CheckoutSummarySidebar, resolveFinalCheckoutTotal } from "@/components/checkout/CheckoutSummarySidebar";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { formatPrice } from "@/lib/format";
import {
  BOLIVIA_OTHER_DEPARTMENTS,
  PROMO_NATIONAL_SHIPPING_FEE,
  WHATSAPP_DISPLAY,
} from "@/lib/constants";
import { buildPromoExpressWhatsappUrl } from "@/lib/checkout/notifications";
import { sanitizeCallbackUrl } from "@/lib/text";
import type {
  CheckoutCustomerContext,
  CheckoutItemInput,
  CheckoutSubmitPayload,
  CheckoutSubmitResponse,
  DeliveryOptionsConfig,
} from "@/types/checkout";
import { getCouponErrorMessage, type PricingSummary } from "@/types/promociones";

const ACTIVE_RESERVATION_KEY = "fitandes-promo-active-reservation";
const CONFIRMED_ORDER_KEY = "fitandes-promo-confirmed-order";
const EXPIRED_ORDERS_KEY = "fitandes-promo-expired-orders";
const CART_STORAGE_KEY = "fitandes-reservas";
const MAX_RECEIPT_SIZE_BYTES = 5 * 1024 * 1024;

function hasStoredCartItems(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const raw = window.localStorage.getItem(CART_STORAGE_KEY);
    if (!raw) return false;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0;
  } catch {
    return false;
  }
}

type PromoStep = 1 | 2 | 3 | 4;
type LocationMode = "LA_PAZ" | "OTHER";

interface ActivePromoReservation {
  orderId: string;
  orderNumber: string;
  paymentId: string;
  reservationToken: string | null;
  expiresAt: string;
  isLaPaz: boolean;
  department: string;
  customerName: string;
  customerPhone: string;
  items: CheckoutItemInput[];
  subtotal: number;
  descuento: number;
  descuentoCatalogo: number;
  descuentoPromociones: number;
  descuentoEnvio: number;
  costoEnvio: number;
  total: number;
  cuponCodigo: string | null;
}

interface ReservationStatusResponse {
  ok?: boolean;
  valid?: boolean;
  expired?: boolean;
  hasReceipt?: boolean;
  estadoPedido?: string;
  estadoPago?: string;
  estadoReservaStock?: string;
  expiresAt?: string;
  subtotal?: number;
  descuento?: number;
  descuentoEnvio?: number;
  costoEnvio?: number;
  total?: number;
  orderNumber?: string;
  paymentId?: string;
}

interface Props {
  initialDeliveryConfig?: DeliveryOptionsConfig | null;
}

function readStoredReservation(): ActivePromoReservation | null {
  if (typeof window === "undefined") return null;
  try {
    const raw =
      window.sessionStorage.getItem(ACTIVE_RESERVATION_KEY) ??
      window.localStorage.getItem(ACTIVE_RESERVATION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as ActivePromoReservation;
    if (!parsed?.orderId || !parsed?.paymentId || !parsed?.expiresAt) return null;
    return parsed;
  } catch {
    return null;
  }
}

function saveStoredReservation(data: ActivePromoReservation | null) {
  if (typeof window === "undefined") return;
  try {
    if (!data) {
      window.sessionStorage.removeItem(ACTIVE_RESERVATION_KEY);
      window.localStorage.removeItem(ACTIVE_RESERVATION_KEY);
      return;
    }
    const serialized = JSON.stringify(data);
    window.sessionStorage.setItem(ACTIVE_RESERVATION_KEY, serialized);
    window.localStorage.setItem(ACTIVE_RESERVATION_KEY, serialized);
  } catch {
    // Ignore storage quota errors
  }
}

function readConfirmedOrder(): ActivePromoReservation | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(CONFIRMED_ORDER_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as ActivePromoReservation;
    if (!parsed?.orderId) return null;
    return parsed;
  } catch {
    return null;
  }
}

function saveConfirmedOrder(data: ActivePromoReservation | null) {
  if (typeof window === "undefined") return;
  try {
    if (!data) {
      window.sessionStorage.removeItem(CONFIRMED_ORDER_KEY);
      return;
    }
    window.sessionStorage.setItem(CONFIRMED_ORDER_KEY, JSON.stringify(data));
  } catch {
    // Ignore storage quota errors
  }
}

function getExpiredOrderIds(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(EXPIRED_ORDERS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((id): id is string => typeof id === "string") : [];
  } catch {
    return [];
  }
}

function markOrderAsExpiredLocally(orderId: string) {
  if (typeof window === "undefined" || !orderId) return;
  try {
    const existing = getExpiredOrderIds();
    const updated = Array.from(new Set([...existing, orderId])).slice(-30);
    window.localStorage.setItem(EXPIRED_ORDERS_KEY, JSON.stringify(updated));
  } catch {
    // Ignore storage quota errors
  }
}

export default function PromoExpressCheckoutClient({ initialDeliveryConfig = null }: Props) {
  const router = useRouter();
  const { data: session, status } = useSession();
  const { items, totalAmount, totalItems, cuponCodigo, setCuponCodigo, updateQuantity, removeItem, clearCart } =
    useReservationCart();

  const authenticated = status === "authenticated" && session?.user?.role === "CLIENTE";

  const [step, setStep] = useState<PromoStep>(1);
  const [hydratedStorage, setHydratedStorage] = useState(false);

  // Paso 2: Ubicación y contacto
  const [locationMode, setLocationMode] = useState<LocationMode>("LA_PAZ");
  const [selectedDepartment, setSelectedDepartment] = useState<string>("");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [prefillLoading, setPrefillLoading] = useState(false);

  // Configuración del sistema central
  const [nationalFlatFee, setNationalFlatFee] = useState<number>(
    initialDeliveryConfig?.shippingPolicy?.nationalFlatFee ?? PROMO_NATIONAL_SHIPPING_FEE
  );
  const [isSystemReadOnly, setIsSystemReadOnly] = useState(false);
  const [systemWarning, setSystemWarning] = useState<string | null>(null);

  // Evaluación de promociones y cupón
  const [pricingSummary, setPricingSummary] = useState<PricingSummary | null>(null);
  const [pricingLoading, setPricingLoading] = useState(false);
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [couponSuccess, setCouponSuccess] = useState<string | null>(null);

  // Paso 3: Reserva activa + QR + Comprobante
  const [activeReservation, setActiveReservation] = useState<ActivePromoReservation | null>(null);
  const [checkingReservation, setCheckingReservation] = useState(false);
  const [timeLeftMs, setTimeLeftMs] = useState<number | null>(null);
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [receiptPreviewUrl, setReceiptPreviewUrl] = useState<string | null>(null);
  const [reserving, setReserving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [error, setError] = useState("");

  // Paso 4: Pedido confirmado
  const [confirmedOrder, setConfirmedOrder] = useState<ActivePromoReservation | null>(null);

  const expiringRef = useRef(false);
  const uploadingRef = useRef(false);

  const qrImageUrl =
    process.env.NEXT_PUBLIC_BANCOSOL_QR_URL ||
    "https://res.cloudinary.com/dq1jeikev/image/upload/v1777964054/comprobante_xvdhuf.jpg";

  const isLaPaz = locationMode === "LA_PAZ";
  const shippingCost = step >= 2 && !isLaPaz ? nationalFlatFee : 0;
  const shippingLabel =
    step === 1
      ? "Se calcula en el siguiente paso"
      : isLaPaz
        ? "Gratis (La Paz)"
        : formatPrice(nationalFlatFee);

  const expireAndRedirectToCatalog = useCallback(
    async (reservation: ActivePromoReservation, alreadyExpiredOnServer = false) => {
      if (expiringRef.current) return;
      expiringRef.current = true;

      markOrderAsExpiredLocally(reservation.orderId);
      saveStoredReservation(null);
      setActiveReservation(null);

      if (!alreadyExpiredOnServer) {
        try {
          await fetch(`/api/orders/${encodeURIComponent(reservation.orderId)}/expire-reservation`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              ...(reservation.reservationToken ? { "x-reservation-token": reservation.reservationToken } : {}),
            },
            body: JSON.stringify(reservation.reservationToken ? { token: reservation.reservationToken } : {}),
            keepalive: true,
          });
        } catch {
          // El backend también ejecuta lazy expiration si falla la red
        }
      }

      router.replace("/catalogo?reservaExpirada=1");
    },
    [router]
  );

  const verifyReservationOnServer = useCallback(
    async (reservation: ActivePromoReservation) => {
      if (getExpiredOrderIds().includes(reservation.orderId)) {
        await expireAndRedirectToCatalog(reservation, true);
        return;
      }

      setCheckingReservation(true);
      try {
        const query = reservation.reservationToken
          ? `?token=${encodeURIComponent(reservation.reservationToken)}`
          : "";
        const res = await fetch(
          `/api/orders/${encodeURIComponent(reservation.orderId)}/reservation-status${query}`,
          {
            cache: "no-store",
            headers: reservation.reservationToken
              ? { "x-reservation-token": reservation.reservationToken }
              : undefined,
          }
        );

        const data = (await res.json().catch(() => null)) as ReservationStatusResponse | null;

        if (!res.ok || !data) {
          if (res.status === 404 || res.status === 410 || res.status === 401 || res.status === 403) {
            await expireAndRedirectToCatalog(reservation, true);
            return;
          }
          // Error transitorio de red/5xx: mantenemos la reserva en pantalla y dejamos correr el timer local
          return;
        }

        if (data.hasReceipt) {
          saveStoredReservation(null);
          saveConfirmedOrder(reservation);
          setActiveReservation(null);
          setConfirmedOrder(reservation);
          clearCart();
          setStep(4);
          return;
        }

        const isCancelledOrReleased =
          data.expired === true ||
          data.valid === false ||
          data.estadoPedido === "CANCELLED" ||
          data.estadoReservaStock === "RELEASED";

        if (isCancelledOrReleased) {
          await expireAndRedirectToCatalog(reservation, true);
          return;
        }

        const synced: ActivePromoReservation = {
          ...reservation,
          orderNumber: data.orderNumber || reservation.orderNumber,
          paymentId: data.paymentId || reservation.paymentId,
          expiresAt: data.expiresAt || reservation.expiresAt,
          subtotal: typeof data.subtotal === "number" ? data.subtotal : reservation.subtotal,
          descuento: typeof data.descuento === "number" ? data.descuento : reservation.descuento,
          descuentoEnvio: typeof data.descuentoEnvio === "number" ? data.descuentoEnvio : reservation.descuentoEnvio,
          costoEnvio: typeof data.costoEnvio === "number" ? data.costoEnvio : reservation.costoEnvio,
          total: typeof data.total === "number" ? data.total : reservation.total,
        };

        saveStoredReservation(synced);
        setActiveReservation(synced);
      } catch {
        // Mantiene estado local si la red falla momentáneamente
      } finally {
        setCheckingReservation(false);
      }
    },
    [clearCart, expireAndRedirectToCatalog]
  );

  // 1. Hidratación inicial: recuperar reserva activa (Paso 3) o confirmación reciente (Paso 4)
  useEffect(() => {
    const stored = readStoredReservation();
    if (stored) {
      if (getExpiredOrderIds().includes(stored.orderId)) {
        saveStoredReservation(null);
        router.replace("/catalogo?reservaExpirada=1");
        return;
      }
      setActiveReservation(stored);
      setStep(3);
      setHydratedStorage(true);
      void verifyReservationOnServer(stored);
      return;
    }

    const confirmed = readConfirmedOrder();
    if (confirmed && !hasStoredCartItems()) {
      setConfirmedOrder(confirmed);
      setStep(4);
    } else if (confirmed && hasStoredCartItems()) {
      saveConfirmedOrder(null);
    }
    setHydratedStorage(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 2. Re-verificar reserva al volver de la app bancaria (visibilitychange / focus en móvil)
  useEffect(() => {
    if (step !== 3 || !activeReservation) return;

    function handleVisibilityReturn() {
      if (document.visibilityState === "visible" && activeReservation && !expiringRef.current) {
        void verifyReservationOnServer(activeReservation);
      }
    }

    document.addEventListener("visibilitychange", handleVisibilityReturn);
    return () => document.removeEventListener("visibilitychange", handleVisibilityReturn);
  }, [step, activeReservation, verifyReservationOnServer]);

  // 3. Consultar tarifa nacional vigente y salud del sistema central
  useEffect(() => {
    let cancelled = false;

    if (!initialDeliveryConfig?.shippingPolicy?.nationalFlatFee) {
      void fetch("/api/delivery-options", { cache: "no-store" })
        .then(async (res) => (res.ok ? ((await res.json()) as DeliveryOptionsConfig) : null))
        .then((config) => {
          if (!cancelled && typeof config?.shippingPolicy?.nationalFlatFee === "number") {
            setNationalFlatFee(config.shippingPolicy.nationalFlatFee);
          }
        })
        .catch(() => {});
    }

    void fetch("/api/estado", { cache: "no-store" })
      .then(async (res) => ({ ok: res.ok, data: await res.json().catch(() => null) }))
      .then(({ ok, data }) => {
        if (cancelled) return;
        if (data?.readOnly) {
          setIsSystemReadOnly(true);
          setSystemWarning(
            "El sistema central está temporalmente en mantenimiento. Las compras web están en pausa momentánea."
          );
        } else if (!ok || (data && data.mongodbConnected === false)) {
          setSystemWarning(
            "El sistema central podría presentar intermitencias. Si tienes inconvenientes, escríbenos por WhatsApp."
          );
        }
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [initialDeliveryConfig]);

  // 4. Precargar nombre y celular si el cliente está logeado
  useEffect(() => {
    if (!authenticated) return;

    let cancelled = false;
    setPrefillLoading(true);

    if (session?.user?.fullname) {
      setCustomerName((current) => current || session.user.fullname || "");
    }

    void fetch("/api/checkout", { cache: "no-store" })
      .then(async (res) => (res.ok ? ((await res.json()) as CheckoutCustomerContext) : null))
      .then((context) => {
        if (cancelled || !context) return;
        const fallbackName = context.defaultAddress?.recipientName || context.user?.fullname || "";
        const fallbackPhone = context.profile?.phone || context.defaultAddress?.phone || "";
        setCustomerName((current) => current || fallbackName);
        setCustomerPhone((current) => current || fallbackPhone);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setPrefillLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [authenticated, session?.user?.fullname]);

  // 5. Evaluación en vivo de precios, rebajas, promociones y cupón (Pasos 1 y 2)
  const evaluationItemsKey = items
    .map((item) => `${item.productoId ?? ""}:${item.variantId ?? ""}:${item.color}:${item.talla}:${item.cantidad}`)
    .join("|");
  const normalizedPhone = customerPhone.replace(/\D/g, "").trim();

  useEffect(() => {
    if (step > 2 || items.length === 0) return;

    const validItems = items
      .filter((item) => Boolean(item.productoId))
      .map((item) => ({
        productoId: item.productoId,
        varianteId: item.variantId ?? undefined,
        color: item.color,
        talla: item.talla,
        cantidad: item.cantidad,
      }));

    if (validItems.length === 0) {
      setPricingSummary(null);
      return;
    }

    const controller = new AbortController();
    const timer = setTimeout(() => {
      setPricingLoading(true);
      void fetch("/api/promociones/evaluar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          items: validItems,
          cuponCodigo: cuponCodigo || undefined,
          costoEnvio: shippingCost,
          telefonoInvitado: !authenticated && normalizedPhone.length >= 7 ? normalizedPhone : undefined,
        }),
      })
        .then(async (res) => {
          const data = await res.json().catch(() => null);
          if (!res.ok || !data?.ok || !data.resumenPrecios) return;
          const summary = data.resumenPrecios as PricingSummary;
          setPricingSummary(summary);
          if (cuponCodigo && summary.cuponValido === false) {
            setCouponError(getCouponErrorMessage(summary.cuponErrorCodigo, summary.cuponErrorMensaje));
            setCouponSuccess(null);
            setCuponCodigo(null);
          }
        })
        .catch(() => {})
        .finally(() => {
          if (!controller.signal.aborted) setPricingLoading(false);
        });
    }, 220);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [evaluationItemsKey, cuponCodigo, shippingCost, authenticated, normalizedPhone, step]);

  // 6. Temporizador estricto de 10 minutos en el Paso 3
  useEffect(() => {
    if (step !== 3 || !activeReservation?.expiresAt) {
      setTimeLeftMs(null);
      return;
    }

    const targetMs = new Date(activeReservation.expiresAt).getTime();
    if (Number.isNaN(targetMs)) {
      setTimeLeftMs(null);
      return;
    }

    const tick = () => {
      const remaining = Math.max(0, targetMs - Date.now());
      setTimeLeftMs(remaining);
      if (remaining <= 0 && !expiringRef.current && !uploadingRef.current) {
        void expireAndRedirectToCatalog(activeReservation, false);
      }
    };

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [step, activeReservation, expireAndRedirectToCatalog]);

  // 7. Vista previa local del comprobante seleccionado
  useEffect(() => {
    if (!receiptFile) {
      setReceiptPreviewUrl(null);
      return;
    }
    const objectUrl = URL.createObjectURL(receiptFile);
    setReceiptPreviewUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [receiptFile]);

  function goToLogin() {
    router.push(`/login?callbackUrl=${encodeURIComponent(sanitizeCallbackUrl("/checkout"))}`);
  }

  async function handleApplyCoupon(rawCode: string) {
    const code = rawCode.trim().toUpperCase();
    if (!code) return;

    setCouponLoading(true);
    setCouponError(null);
    setCouponSuccess(null);

    try {
      const validItems = items
        .filter((item) => Boolean(item.productoId))
        .map((item) => ({
          productoId: item.productoId,
          varianteId: item.variantId ?? undefined,
          color: item.color,
          talla: item.talla,
          cantidad: item.cantidad,
        }));

      const evalRes = await fetch("/api/promociones/evaluar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: validItems,
          cuponCodigo: code,
          costoEnvio: shippingCost,
          telefonoInvitado: !authenticated && normalizedPhone.length >= 7 ? normalizedPhone : undefined,
        }),
      });

      const evalData = await evalRes.json().catch(() => null);
      if (!evalRes.ok || !evalData?.ok || !evalData.resumenPrecios) {
        setCouponError(getCouponErrorMessage(evalData?.cuponErrorCodigo, evalData?.message));
        return;
      }

      const summary = evalData.resumenPrecios as PricingSummary;
      setPricingSummary(summary);

      if (summary.cuponValido === false) {
        setCouponError(getCouponErrorMessage(summary.cuponErrorCodigo, summary.cuponErrorMensaje));
        return;
      }

      setCuponCodigo(code);
      setCouponSuccess("Cupón aplicado correctamente.");
    } catch {
      setCouponError("No pude validar el cupón en este momento. Intenta nuevamente.");
    } finally {
      setCouponLoading(false);
    }
  }

  async function handleRemoveCoupon() {
    setCouponLoading(true);
    setCouponError(null);
    setCouponSuccess(null);
    try {
      setCuponCodigo(null);
      if (authenticated) {
        await fetch("/api/cart/cupon", { method: "DELETE" }).catch(() => {});
      }
    } finally {
      setCouponLoading(false);
    }
  }

  function handleContinueToStep2() {
    if (isSystemReadOnly) {
      setError("El sistema está en mantenimiento temporal. Contáctanos por WhatsApp (+591 67113105).");
      return;
    }
    if (items.length === 0) {
      setError("Tu carrito está vacío.");
      return;
    }
    const invalidItem = items.find((item) => !item.productoId);
    if (invalidItem) {
      setError("Hay un producto sin identificador válido. Vuelve a agregarlo desde el catálogo.");
      return;
    }

    setError("");
    saveConfirmedOrder(null);
    setConfirmedOrder(null);
    setStep(2);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleReserveAndProceedToQR() {
    if (isSystemReadOnly) {
      setError("El sistema está en mantenimiento temporal. Contáctanos por WhatsApp (+591 67113105).");
      return;
    }
    if (items.length === 0) {
      setError("Tu carrito está vacío.");
      return;
    }
    if (!isLaPaz && !selectedDepartment) {
      setError("Selecciona el departamento al que enviaremos tu pedido.");
      return;
    }

    const cleanName = customerName.trim();
    const cleanPhoneDigits = customerPhone.replace(/\D/g, "").trim();

    if (cleanName.length < 3) {
      setError("Ingresa tu nombre completo (mínimo 3 caracteres).");
      return;
    }
    if (cleanPhoneDigits.length < 7) {
      setError("Ingresa un número de celular WhatsApp válido.");
      return;
    }

    setError("");
    setReserving(true);

    const targetDepartment = isLaPaz ? "La Paz" : selectedDepartment;
    const checkoutPayload: CheckoutSubmitPayload = {
      items,
      paymentMethod: "QR",
      promoExpress: true,
      delivery: isLaPaz
        ? {
            method: "WHATSAPP",
            department: "La Paz",
            city: "La Paz",
            recipientName: cleanName,
            phone: cleanPhoneDigits,
          }
        : {
            method: "SHIPPING_NATIONAL",
            department: targetDepartment,
            city: targetDepartment,
            recipientName: cleanName,
            phone: cleanPhoneDigits,
            senderName: cleanName,
            senderPhone: cleanPhoneDigits,
          },
      ...(cuponCodigo ? { cuponCodigo } : {}),
      esInvitado: !authenticated,
      clienteInvitado: !authenticated
        ? {
            nombreCompleto: cleanName,
            telefono: cleanPhoneDigits,
          }
        : undefined,
    };

    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(checkoutPayload),
      });

      const data = (await response.json().catch(() => null)) as CheckoutSubmitResponse | null;

      if (!response.ok || !data?.ok || !data.orderId || !data.paymentId) {
        if (response.status === 429 || data?.code === "TOO_MANY_ACTIVE_RESERVATIONS") {
          setError(
            data?.message ||
              "Ya tienes reservas pendientes activas. Completa tu pago anterior o espera unos minutos antes de crear una nueva."
          );
        } else {
          setError(data?.message || "No pude reservar tus prendas en este momento. Intenta nuevamente.");
        }
        setReserving(false);
        return;
      }

      const fallbackSubtotal = pricingSummary?.subtotalLista ?? totalAmount;
      const fallbackTotal = resolveFinalCheckoutTotal(totalAmount, shippingCost, pricingSummary);
      const fallbackExpiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

      const reservation: ActivePromoReservation = {
        orderId: data.orderId,
        orderNumber: data.orderNumber || data.orderId,
        paymentId: data.paymentId,
        reservationToken: data.reservationToken ?? null,
        expiresAt: data.expiresAt || fallbackExpiresAt,
        isLaPaz,
        department: targetDepartment,
        customerName: cleanName,
        customerPhone: cleanPhoneDigits,
        items: [...items],
        subtotal: typeof data.subtotal === "number" ? data.subtotal : fallbackSubtotal,
        descuento: typeof data.descuento === "number" ? data.descuento : pricingSummary?.descuentoTotal ?? 0,
        descuentoCatalogo:
          typeof data.descuentoCatalogo === "number"
            ? data.descuentoCatalogo
            : pricingSummary?.descuentoCatalogo ?? 0,
        descuentoPromociones:
          typeof data.descuentoPromociones === "number"
            ? data.descuentoPromociones
            : pricingSummary?.descuentoPromociones ?? 0,
        descuentoEnvio:
          typeof data.descuentoEnvio === "number" ? data.descuentoEnvio : pricingSummary?.descuentoEnvio ?? 0,
        costoEnvio: typeof data.costoEnvio === "number" ? data.costoEnvio : shippingCost,
        total: typeof data.total === "number" ? data.total : fallbackTotal,
        cuponCodigo: data.cuponCodigo ?? cuponCodigo ?? null,
      };

      expiringRef.current = false;
      saveStoredReservation(reservation);
      setActiveReservation(reservation);
      setReceiptFile(null);
      setStep(3);
      setReserving(false);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch {
      setError("No pude conectar para reservar tus prendas. Revisa tu conexión e intenta nuevamente.");
      setReserving(false);
    }
  }

  async function handleUploadReceipt() {
    if (!activeReservation) return;
    if (!receiptFile) {
      setError("Selecciona la imagen de tu comprobante de pago antes de continuar.");
      return;
    }

    setError("");
    uploadingRef.current = true;
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", receiptFile);
      if (activeReservation.reservationToken) {
        formData.append("reservationToken", activeReservation.reservationToken);
      }

      const response = await fetch(
        `/api/payments/${encodeURIComponent(activeReservation.paymentId)}/upload-comprobante`,
        {
          method: "POST",
          headers: activeReservation.reservationToken
            ? { "x-reservation-token": activeReservation.reservationToken }
            : undefined,
          body: formData,
        }
      );

      const data = (await response.json().catch(() => null)) as {
        ok?: boolean;
        code?: string;
        message?: string;
      } | null;

      if (response.status === 410 || data?.code === "RESERVATION_EXPIRED") {
        uploadingRef.current = false;
        setUploading(false);
        await expireAndRedirectToCatalog(activeReservation, true);
        return;
      }

      if (!response.ok) {
        uploadingRef.current = false;
        setError(data?.message || "No pude subir tu comprobante. Verifica la imagen e intenta nuevamente.");
        setUploading(false);
        return;
      }

      // Comprobante subido con éxito: bloqueamos expiración, limpiamos carrito y pasamos al Paso 4
      expiringRef.current = true;
      uploadingRef.current = false;
      saveStoredReservation(null);
      saveConfirmedOrder(activeReservation);
      setConfirmedOrder(activeReservation);
      setActiveReservation(null);
      clearCart();
      setUploading(false);
      setStep(4);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch {
      uploadingRef.current = false;
      setError("Ocurrió un error de conexión al subir tu comprobante. Intenta nuevamente.");
      setUploading(false);
    }
  }

  async function handleCancelActiveReservation() {
    if (!activeReservation || cancelling) return;
    setCancelling(true);
    setError("");

    const reservationToCancel = activeReservation;
    expiringRef.current = true;
    markOrderAsExpiredLocally(reservationToCancel.orderId);
    saveStoredReservation(null);

    try {
      await fetch(`/api/orders/${encodeURIComponent(reservationToCancel.orderId)}/expire-reservation`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(reservationToCancel.reservationToken
            ? { "x-reservation-token": reservationToCancel.reservationToken }
            : {}),
        },
        body: JSON.stringify(
          reservationToCancel.reservationToken ? { token: reservationToCancel.reservationToken } : {}
        ),
      });
    } catch {
      // Best-effort cancellation
    } finally {
      setActiveReservation(null);
      setReceiptFile(null);
      setCancelling(false);
      expiringRef.current = false;
      setStep(1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  async function handleDownloadQR() {
    try {
      const response = await fetch(qrImageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `fitandes-qr-${activeReservation?.orderNumber || "pago"}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch {
      window.open(qrImageUrl, "_blank");
    }
  }

  // Espera mínima de hidratación para evitar destello de carrito vacío si hay reserva activa
  if (!hydratedStorage) {
    return (
      <main className="min-h-[calc(100vh-82px)] bg-background px-4 py-14 flex items-center justify-center">
        <p className="text-sm text-subtle animate-pulse">Preparando tu pedido...</p>
      </main>
    );
  }

  // Estado carrito vacío (solo si NO estamos en Paso 3 con reserva activa ni en Paso 4 confirmado)
  if (items.length === 0 && !(step === 3 && activeReservation) && !(step === 4 && confirmedOrder)) {
    return (
      <main className="min-h-[calc(100vh-82px)] bg-background px-4 py-10 sm:px-6 sm:py-14">
        <Card className="max-w-[860px] mx-auto rounded-[30px] py-12 text-center sm:py-20">
          <div className="mx-auto mb-8 flex h-24 w-24 items-center justify-center rounded-full bg-surface-soft text-muted">
            <svg className="h-10 w-10 opacity-60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
              />
            </svg>
          </div>
          <p className="text-[10px] uppercase mb-4 tracking-[0.2em] text-subtle">Carrito</p>
          <h1 className="mb-4 text-3xl font-serif text-foreground sm:text-4xl">Tu carrito está vacío</h1>
          <p className="text-sm max-w-md mx-auto text-muted">
            Agrega tus prendas favoritas desde el catálogo para aprovechar la promo y reservar al instante.
          </p>
          <div className="mt-10">
            <Link href="/catalogo">
              <Button variant="primary" size="lg">
                Ir al catálogo
              </Button>
            </Link>
          </div>
        </Card>
      </main>
    );
  }

  const totalSeconds = timeLeftMs !== null ? Math.floor(timeLeftMs / 1000) : null;
  const minutes = totalSeconds !== null ? Math.floor(totalSeconds / 60) : 10;
  const seconds = totalSeconds !== null ? totalSeconds % 60 : 0;
  const formattedCountdown = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  const isCriticalTime = totalSeconds !== null && totalSeconds <= 120;
  const isWarningTime = totalSeconds !== null && totalSeconds > 120 && totalSeconds <= 300;

  const stepItems = [
    { num: 1 as PromoStep, short: "Prendas", desktop: "Prendas" },
    { num: 2 as PromoStep, short: "Envío", desktop: "Ubicación y datos" },
    { num: 3 as PromoStep, short: "Pago QR", desktop: "Pago QR (10 min)" },
    { num: 4 as PromoStep, short: "WhatsApp", desktop: "Confirmar" },
  ];

  return (
    <main className="min-h-[calc(100vh-82px)] bg-gradient-to-b from-background to-surface/40 px-4 py-6 pb-36 sm:px-6 sm:py-8 sm:pb-36 lg:py-12 lg:pb-12">
      <div className="max-w-[1240px] mx-auto">
        {/* Cabecera + Stepper de 4 pasos */}
        <header className="mb-8 rounded-[24px] sm:rounded-[28px] border bg-white px-4 py-5 sm:mb-10 sm:px-6 sm:py-6 border-border shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-5 sm:gap-6">
            <div className="max-w-2xl">
              <p className="text-[10px] uppercase mb-2 tracking-[0.2em] text-subtle">
                Compra rápida · Promo FitAndes
              </p>
              <h1 className="text-3xl font-serif text-foreground sm:text-4xl">
                {step === 1 && "Revisa tus prendas"}
                {step === 2 && "¿Dónde enviamos tu pedido?"}
                {step === 3 && "Paga con QR y sube tu comprobante"}
                {step === 4 && "¡Pedido recibido con éxito!"}
              </h1>
              <p className="mt-2.5 text-sm text-muted leading-relaxed">
                {step === 1 && "Verifica tallas, cantidades y descuentos aplicados antes de elegir tu ubicación."}
                {step === 2 && "Indícanos si estás en La Paz u otro departamento y tu WhatsApp para coordinar la entrega."}
                {step === 3 && "Tus prendas están reservadas por 10 minutos. Escanea el QR y sube la captura de pago."}
                {step === 4 && "Tu comprobante ya fue enviado. Confirma por WhatsApp para coordinar tu entrega con calma."}
              </p>
            </div>

            {step <= 2 && (
              <CheckoutAuthStatus
                authenticated={authenticated}
                user={session?.user}
                loading={prefillLoading}
                onLogin={goToLogin}
              />
            )}
          </div>

          <ol
            aria-label="Pasos del proceso de compra"
            className="mt-5 sm:mt-6 pt-4 sm:pt-5 border-t border-border/70 grid grid-cols-4 gap-1.5 sm:gap-4"
          >
            {stepItems.map((item) => {
              const isDone = step > item.num;
              const isActive = step === item.num;
              return (
                <li key={item.num} className="flex items-center gap-1.5 sm:gap-2.5 min-w-0">
                  <span
                    className={`flex h-6 w-6 sm:h-7 sm:w-7 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold tracking-wider ${
                      isDone
                        ? "bg-success text-white"
                        : isActive
                          ? "bg-foreground text-background"
                          : "border border-border bg-surface text-subtle"
                    }`}
                  >
                    {isDone ? "✓" : `0${item.num}`}
                  </span>
                  <span
                    className={`text-[10px] sm:text-xs uppercase tracking-[0.04em] sm:tracking-[0.1em] truncate ${
                      isDone || isActive ? "text-foreground font-medium" : "text-subtle"
                    }`}
                  >
                    <span className="sm:hidden">{item.short}</span>
                    <span className="hidden sm:inline">{item.desktop}</span>
                  </span>
                </li>
              );
            })}
          </ol>
        </header>

        {systemWarning && (
          <div className="rounded-[20px] border border-amber-200/90 bg-amber-50/80 p-4 text-amber-900 text-xs sm:text-sm mb-6">
            <strong className="font-semibold text-amber-950">Aviso del sistema:</strong> {systemWarning}
          </div>
        )}

        {/* ==================== PASO 1: PRENDAS Y DESCUENTOS ==================== */}
        {step === 1 && (
          <div className="grid gap-8 lg:grid-cols-[1fr_360px] xl:grid-cols-[1fr_400px]">
            <div className="space-y-4">
              <div className="flex items-center justify-between px-1">
                <h2 className="text-xs uppercase tracking-widest text-subtle font-semibold">
                  Prendas seleccionadas ({totalItems})
                </h2>
                <Link
                  href="/catalogo"
                  className="text-xs text-foreground underline underline-offset-2 hover:opacity-75"
                >
                  Seguir viendo catálogo
                </Link>
              </div>
              <CheckoutCartSummary
                items={items}
                evaluatedItems={pricingSummary?.items}
                updateQuantity={updateQuantity}
                removeItem={removeItem}
              />
            </div>

            <CheckoutSummarySidebar
              totalAmount={totalAmount}
              totalItems={totalItems}
              shippingCost={0}
              shippingLabel={shippingLabel}
              hideShippingRow
              pricingSummary={pricingSummary}
              pricingLoading={pricingLoading}
              appliedCoupon={cuponCodigo}
              couponLoading={couponLoading}
              couponError={couponError}
              couponSuccess={couponSuccess}
              onApplyCoupon={handleApplyCoupon}
              onRemoveCoupon={handleRemoveCoupon}
              loading={false}
              disabled={isSystemReadOnly}
              error={error}
              onSubmit={handleContinueToStep2}
              authenticated={authenticated}
              submitLabel="Continuar"
            />
          </div>
        )}

        {/* ==================== PASO 2: UBICACIÓN Y CONTACTO ==================== */}
        {step === 2 && (
          <div className="grid gap-8 lg:grid-cols-[1fr_360px] xl:grid-cols-[1fr_400px]">
            <div className="space-y-6">
              <button
                type="button"
                onClick={() => {
                  setError("");
                  setStep(1);
                }}
                className="inline-flex items-center gap-1.5 text-xs uppercase tracking-wider text-muted hover:text-foreground transition-colors cursor-pointer"
              >
                ← Volver a mis prendas
              </button>

              {/* Selección La Paz vs Otro departamento */}
              <Card className="rounded-[28px] space-y-5">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.18em] text-subtle mb-1">Paso 2 · Ubicación</p>
                  <h2 className="text-xl font-serif text-foreground">¿De qué departamento eres?</h2>
                  <p className="text-xs text-muted mt-1">
                    La entrega o agencia de envío la coordinaremos con calma por WhatsApp una vez confirmado tu pago.
                  </p>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={() => {
                      setLocationMode("LA_PAZ");
                      setSelectedDepartment("");
                      setError("");
                    }}
                    className={`rounded-2xl border p-4 text-left transition-all cursor-pointer ${
                      isLaPaz
                        ? "border-foreground bg-foreground/[0.04] ring-1 ring-foreground"
                        : "border-border bg-white hover:border-foreground/40"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-surface text-foreground">
                        <FaMapMarkerAlt className="h-4 w-4" />
                      </span>
                      <span className="rounded-full bg-success/15 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-success">
                        Gratis
                      </span>
                    </div>
                    <p className="mt-3 text-base font-medium text-foreground">Soy de La Paz</p>
                    <p className="mt-1 text-xs text-muted leading-relaxed">
                      Sin costo adicional de envío. Coordinamos punto de entrega por WhatsApp.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setLocationMode("OTHER");
                      setError("");
                    }}
                    className={`rounded-2xl border p-4 text-left transition-all cursor-pointer ${
                      !isLaPaz
                        ? "border-foreground bg-foreground/[0.04] ring-1 ring-foreground"
                        : "border-border bg-white hover:border-foreground/40"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-surface text-foreground">
                        <FaTruck className="h-4 w-4" />
                      </span>
                      <span className="rounded-full bg-foreground/10 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-foreground">
                        +{formatPrice(nationalFlatFee)}
                      </span>
                    </div>
                    <p className="mt-3 text-base font-medium text-foreground">Otro departamento</p>
                    <p className="mt-1 text-xs text-muted leading-relaxed">
                      Envío nacional con costo único de {formatPrice(nationalFlatFee)} a todo Bolivia.
                    </p>
                  </button>
                </div>

                {!isLaPaz && (
                  <div className="pt-3 border-t border-border/60 space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs font-medium text-foreground">
                        Elige tu departamento <span className="text-danger">*</span>
                      </p>
                      <span className="text-[11px] text-muted">
                        Costo de envío: <strong className="text-foreground">{formatPrice(nationalFlatFee)}</strong>
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                      {BOLIVIA_OTHER_DEPARTMENTS.map((dept) => {
                        const active = selectedDepartment === dept;
                        return (
                          <button
                            key={dept}
                            type="button"
                            onClick={() => {
                              setSelectedDepartment(dept);
                              setError("");
                            }}
                            className={`rounded-xl border px-3 py-2.5 text-xs font-medium transition-all cursor-pointer ${
                              active
                                ? "border-foreground bg-foreground text-background shadow-xs"
                                : "border-border bg-white text-foreground hover:border-foreground/50 hover:bg-surface/40"
                            }`}
                          >
                            {dept}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </Card>

              {/* Datos mínimos de contacto para WhatsApp */}
              <Card className="rounded-[28px] space-y-4">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.18em] text-subtle mb-1">
                    Tus datos para coordinar entrega
                  </p>
                  <h2 className="text-xl font-serif text-foreground">Nombre y celular WhatsApp</h2>
                  <p className="text-xs text-muted mt-1">
                    Usaremos estos datos para identificar tu comprobante y coordinar la entrega contigo por WhatsApp.
                  </p>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <Input
                    label="Nombre completo *"
                    value={customerName}
                    onChange={(e) => {
                      setCustomerName(e.target.value);
                      if (error) setError("");
                    }}
                    placeholder="Ej. Ana Pérez"
                    required
                  />
                  <Input
                    label="Celular WhatsApp *"
                    type="tel"
                    inputMode="numeric"
                    value={customerPhone}
                    onChange={(e) => {
                      setCustomerPhone(e.target.value);
                      if (error) setError("");
                    }}
                    placeholder="Ej. 76543210"
                    required
                  />
                </div>

                <div className="rounded-xl border border-amber-200 bg-amber-50/70 px-3.5 py-2.5 text-[11px] text-amber-950 leading-relaxed">
                  <strong>Importante:</strong> Al presionar <em>&ldquo;Reservar y pagar con QR&rdquo;</em> tus prendas
                  quedarán apartadas por <strong>10 minutos</strong> para que realices el pago y subas tu comprobante.
                </div>
              </Card>
            </div>

            <CheckoutSummarySidebar
              totalAmount={totalAmount}
              totalItems={totalItems}
              shippingCost={shippingCost}
              shippingLabel={shippingLabel}
              pricingSummary={pricingSummary}
              pricingLoading={pricingLoading}
              appliedCoupon={cuponCodigo}
              couponLoading={couponLoading}
              couponError={couponError}
              couponSuccess={couponSuccess}
              onApplyCoupon={handleApplyCoupon}
              onRemoveCoupon={handleRemoveCoupon}
              loading={reserving}
              disabled={isSystemReadOnly || reserving}
              error={error}
              onSubmit={handleReserveAndProceedToQR}
              authenticated={authenticated}
              submitLabel={reserving ? "Reservando prendas..." : "Reservar y pagar con QR"}
            />
          </div>
        )}

        {/* ==================== PASO 3: RESERVA 10 MIN + QR + COMPROBANTE ==================== */}
        {step === 3 && activeReservation && (
          <div className="space-y-6 max-w-5xl mx-auto">
            {/* Banner de cuenta regresiva de 10 minutos */}
            <div
              className={`rounded-2xl border p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs transition-colors ${
                isCriticalTime
                  ? "border-red-300 bg-red-50 text-red-950"
                  : isWarningTime
                    ? "border-amber-300 bg-amber-50 text-amber-950"
                    : "border-emerald-300 bg-emerald-50 text-emerald-950"
              }`}
            >
              <div className="flex items-start gap-3">
                <div
                  className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
                    isCriticalTime
                      ? "bg-red-200 text-red-800 animate-pulse"
                      : isWarningTime
                        ? "bg-amber-200 text-amber-900"
                        : "bg-emerald-200 text-emerald-900"
                  }`}
                >
                  <FaClock className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-sm font-semibold">
                    Prendas reservadas · Pedido {activeReservation.orderNumber}
                  </p>
                  <p className="text-xs opacity-90 mt-0.5 leading-relaxed">
                    {isCriticalTime
                      ? "¡Últimos minutos! Sube tu comprobante antes de que llegue a 00:00 o las prendas se liberarán automáticamente."
                      : "Tienes un máximo de 10 minutos para transferir por QR y subir tu comprobante. Si vence el tiempo, el stock se libera."}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0">
                <div className="text-left sm:text-right">
                  <p className="text-[10px] uppercase tracking-wider opacity-75">Tiempo límite</p>
                  <p
                    className={`text-2xl font-mono font-bold tracking-wider ${
                      isCriticalTime ? "text-red-700 animate-pulse" : ""
                    }`}
                  >
                    {formattedCountdown}
                  </p>
                </div>
              </div>
            </div>

            {checkingReservation && (
              <p className="text-center text-xs text-subtle animate-pulse">
                Verificando vigencia de tu reserva con el servidor...
              </p>
            )}

            <div className="grid gap-6 sm:gap-8 lg:grid-cols-2">
              {/* Columna QR + Desglose detallado */}
              <Card padding="none" className="p-5 sm:p-6 flex flex-col items-center text-center rounded-[28px]">
                <p className="text-[10px] uppercase tracking-[0.2em] text-subtle mb-2">
                  Paso 3A · Escanea y transfiere
                </p>
                <h2 className="text-xl font-serif mb-5">Código QR BancoSol</h2>

                <div className="relative w-full aspect-square max-w-[270px] sm:max-w-[300px] bg-white p-3 border border-border/60 rounded-2xl mb-5 shadow-xs">
                  <Image src={qrImageUrl} alt="QR de Pago FitAndes" fill className="object-contain p-2" />
                </div>

                <Button variant="outline" size="sm" onClick={handleDownloadQR} className="w-full max-w-[320px] mb-5">
                  Descargar Código QR
                </Button>

                {/* Detalle completo del monto */}
                <div className="w-full max-w-[340px] rounded-2xl border border-border/70 bg-surface/40 p-4 text-left text-xs space-y-2">
                  <p className="text-[10px] uppercase tracking-[0.16em] text-subtle font-semibold pb-1 border-b border-border/60">
                    Detalle a pagar ({activeReservation.items.reduce((acc, i) => acc + i.cantidad, 0)} prendas)
                  </p>

                  <div className="flex justify-between gap-2 text-muted">
                    <span>Subtotal prendas</span>
                    <span className="whitespace-nowrap">{formatPrice(activeReservation.subtotal)}</span>
                  </div>

                  {activeReservation.descuentoCatalogo > 0 && (
                    <div className="flex justify-between gap-2 text-success">
                      <span>Rebajas de catálogo</span>
                      <span className="whitespace-nowrap font-medium">
                        - {formatPrice(activeReservation.descuentoCatalogo)}
                      </span>
                    </div>
                  )}

                  {activeReservation.descuentoPromociones > 0 && (
                    <div className="flex justify-between gap-2 text-success">
                      <span>
                        Promociones{activeReservation.cuponCodigo ? ` (${activeReservation.cuponCodigo})` : ""}
                      </span>
                      <span className="whitespace-nowrap font-medium">
                        - {formatPrice(activeReservation.descuentoPromociones)}
                      </span>
                    </div>
                  )}

                  {Math.max(0, activeReservation.descuento - activeReservation.descuentoEnvio) > 0 &&
                    activeReservation.descuentoCatalogo === 0 &&
                    activeReservation.descuentoPromociones === 0 && (
                      <div className="flex justify-between gap-2 text-success">
                        <span>Descuento{activeReservation.cuponCodigo ? ` (${activeReservation.cuponCodigo})` : ""}</span>
                        <span className="whitespace-nowrap font-medium">
                          - {formatPrice(Math.max(0, activeReservation.descuento - activeReservation.descuentoEnvio))}
                        </span>
                      </div>
                    )}

                  <div className="flex justify-between gap-2 text-muted">
                    <span>
                      {activeReservation.isLaPaz
                        ? "Envío (La Paz)"
                        : `Envío nacional (${activeReservation.department})`}
                    </span>
                    <span className="whitespace-nowrap font-medium">
                      {activeReservation.isLaPaz ? (
                        <span className="text-success">Gratis</span>
                      ) : activeReservation.descuentoEnvio > 0 &&
                        Math.max(0, activeReservation.costoEnvio - activeReservation.descuentoEnvio) === 0 ? (
                        <span className="text-success">Gratis</span>
                      ) : (
                        formatPrice(Math.max(0, activeReservation.costoEnvio - activeReservation.descuentoEnvio))
                      )}
                    </span>
                  </div>

                  <div className="pt-2.5 mt-1 border-t border-border flex justify-between items-baseline gap-2">
                    <span className="text-xs font-semibold uppercase tracking-wider text-foreground">
                      Total a transferir
                    </span>
                    <span className="text-xl font-serif font-bold text-foreground whitespace-nowrap">
                      {formatPrice(activeReservation.total)}
                    </span>
                  </div>
                </div>

                <div className="mt-4 w-full max-w-[340px] rounded-xl bg-surface/50 border border-border/60 p-3 text-left text-[11px] space-y-1">
                  <div className="flex justify-between">
                    <span className="text-muted">Banco:</span>
                    <span className="font-medium text-foreground">BancoSol</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted">Titular:</span>
                    <span className="font-medium text-foreground">Fernando Leon Andrade Gutierrez</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted">Moneda:</span>
                    <span className="font-medium text-foreground">Bolivianos (BOB)</span>
                  </div>
                </div>
              </Card>

              {/* Columna Subida de Comprobante */}
              <Card padding="none" className="p-5 sm:p-6 flex flex-col justify-between rounded-[28px]">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.2em] text-subtle mb-2">
                    Paso 3B · Confirmar pago
                  </p>
                  <h2 className="text-xl font-serif mb-2">Sube tu comprobante</h2>
                  <p className="text-xs text-muted mb-6 leading-relaxed">
                    Una vez realizada la transferencia por exactamente{" "}
                    <strong className="text-foreground">{formatPrice(activeReservation.total)}</strong>, adjunta la
                    captura para asegurar tu pedido.
                  </p>

                  <div className="border-2 border-dashed border-border rounded-2xl p-5 sm:p-7 text-center bg-surface/30 hover:border-foreground/40 transition-colors">
                    <input
                      type="file"
                      id="promo-receipt-upload"
                      accept="image/*"
                      onChange={(e) => {
                        const selected = e.target.files?.[0] ?? null;
                        if (!selected) {
                          setReceiptFile(null);
                          return;
                        }
                        if (!selected.type.startsWith("image/")) {
                          setReceiptFile(null);
                          setError("Solo se permiten archivos de imagen (JPG, PNG o WEBP).");
                          return;
                        }
                        if (selected.size > MAX_RECEIPT_SIZE_BYTES) {
                          setReceiptFile(null);
                          setError("La imagen del comprobante supera los 5 MB. Por favor envía una captura más liviana.");
                          return;
                        }
                        setReceiptFile(selected);
                        setError("");
                      }}
                      className="hidden"
                    />
                    <label htmlFor="promo-receipt-upload" className="cursor-pointer block">
                      {receiptPreviewUrl ? (
                        <div className="space-y-3">
                          <div className="relative mx-auto h-44 w-full max-w-[240px] overflow-hidden rounded-xl border border-border bg-white">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={receiptPreviewUrl}
                              alt="Vista previa del comprobante"
                              className="h-full w-full object-contain"
                            />
                          </div>
                          <p className="text-xs font-medium text-foreground break-all">{receiptFile?.name}</p>
                          <span className="inline-block text-[11px] underline text-muted">
                            Cambiar imagen
                          </span>
                        </div>
                      ) : (
                        <>
                          <div className="w-12 h-12 bg-background rounded-full flex items-center justify-center mx-auto mb-3 border border-border">
                            <svg className="w-6 h-6 text-subtle" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1M16 8l-4-4m0 0L8 8m4-4v12"
                              />
                            </svg>
                          </div>
                          <p className="text-sm font-medium text-foreground mb-1">Toca para subir tu comprobante</p>
                          <p className="text-xs text-muted">Imagen JPG, PNG o WEBP (máx. 5 MB)</p>
                        </>
                      )}
                    </label>
                  </div>

                  {error && (
                    <div className="mt-4 p-3 rounded-xl bg-danger/10 border border-danger/25 text-danger text-xs font-medium">
                      {error}
                    </div>
                  )}
                </div>

                <div className="mt-8 space-y-3">
                  <Button
                    variant="primary"
                    size="lg"
                    className="w-full"
                    loading={uploading}
                    disabled={!receiptFile || uploading || cancelling}
                    onClick={handleUploadReceipt}
                  >
                    {uploading ? "Enviando comprobante..." : "Subir comprobante y continuar"}
                  </Button>

                  <button
                    type="button"
                    disabled={uploading || cancelling}
                    onClick={handleCancelActiveReservation}
                    className="w-full py-2 text-xs text-muted hover:text-danger transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    {cancelling ? "Liberando prendas..." : "Cancelar reserva y volver al carrito"}
                  </button>
                </div>
              </Card>
            </div>
          </div>
        )}

        {/* ==================== PASO 4: CONFIRMACIÓN Y WHATSAPP 67113105 ==================== */}
        {step === 4 && confirmedOrder && (
          <div className="max-w-2xl mx-auto">
            <Card className="rounded-[28px] p-6 sm:p-8 space-y-6 bg-white border border-border shadow-sm">
              <div className="text-center space-y-3">
                <div className="w-16 h-16 bg-success/10 text-success rounded-full flex items-center justify-center mx-auto">
                  <FaCheckCircle className="w-9 h-9" />
                </div>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-[11px] font-semibold">
                  Comprobante enviado · Reserva extendida 48h
                </span>
                <h2 className="text-2xl sm:text-3xl font-serif text-foreground">
                  ¡Último paso: coordina tu entrega por WhatsApp!
                </h2>
                <p className="text-sm text-muted leading-relaxed">
                  Tu pedido <strong className="text-foreground font-mono">{confirmedOrder.orderNumber}</strong> ya está
                  registrado y nuestro equipo está verificando tu comprobante. Presiona el botón de abajo para enviarnos
                  el detalle a nuestro WhatsApp y coordinar tu entrega o envío con calma.
                </p>
              </div>

              {/* Resumen del pedido confirmado */}
              <div className="rounded-2xl border border-border/70 bg-surface/35 p-4 sm:p-5 space-y-3 text-xs">
                <div className="flex flex-wrap justify-between gap-2 pb-2.5 border-b border-border/60">
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-subtle">Cliente</p>
                    <p className="font-medium text-foreground text-sm">{confirmedOrder.customerName}</p>
                    <p className="text-muted">WhatsApp: {confirmedOrder.customerPhone}</p>
                  </div>
                  <div className="text-left sm:text-right">
                    <p className="text-[10px] uppercase tracking-wider text-subtle">Ubicación</p>
                    <p className="font-medium text-foreground text-sm">
                      {confirmedOrder.isLaPaz ? "La Paz" : confirmedOrder.department}
                    </p>
                    <p className="text-muted">
                      {confirmedOrder.isLaPaz
                        ? "Envío gratis"
                        : `Envío nacional (${formatPrice(Math.max(0, confirmedOrder.costoEnvio - confirmedOrder.descuentoEnvio))})`}
                    </p>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <p className="text-[10px] uppercase tracking-wider text-subtle font-semibold">Prendas</p>
                  {confirmedOrder.items.map((item) => (
                    <div key={item.id} className="flex justify-between gap-3 text-foreground">
                      <span className="min-w-0">
                        {item.cantidad}x {item.nombre} ({item.color} / {item.talla})
                      </span>
                      <span className="shrink-0 whitespace-nowrap font-medium">
                        {formatPrice(item.precio * item.cantidad)}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="pt-2.5 border-t border-border/60 flex justify-between items-baseline">
                  <span className="text-xs font-semibold uppercase tracking-wider text-foreground">Total pagado</span>
                  <span className="text-lg font-serif font-bold text-foreground">
                    {formatPrice(confirmedOrder.total)}
                  </span>
                </div>
              </div>

              {/* Botón principal de redirección a WhatsApp 67113105 */}
              <div className="space-y-3 pt-1">
                <a
                  href={buildPromoExpressWhatsappUrl({
                    orderNumber: confirmedOrder.orderNumber,
                    customerName: confirmedOrder.customerName,
                    customerPhone: confirmedOrder.customerPhone,
                    isLaPaz: confirmedOrder.isLaPaz,
                    department: confirmedOrder.department,
                    items: confirmedOrder.items,
                    subtotal: confirmedOrder.subtotal,
                    descuentoTotal: Math.max(0, confirmedOrder.descuento - confirmedOrder.descuentoEnvio),
                    cuponCodigo: confirmedOrder.cuponCodigo,
                    costoEnvio: confirmedOrder.costoEnvio,
                    descuentoEnvio: confirmedOrder.descuentoEnvio,
                    total: confirmedOrder.total,
                  })}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full inline-flex items-center justify-center gap-2.5 rounded-full py-4 px-6 text-xs sm:text-sm uppercase tracking-wider bg-[#25d366] text-white font-semibold hover:bg-[#1fb959] transition-all shadow-sm active:scale-[0.99]"
                >
                  <FaWhatsapp className="text-lg shrink-0" />
                  Confirmar y coordinar por WhatsApp ({WHATSAPP_DISPLAY})
                </a>

                <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                  {authenticated && (
                    <Link
                      href={`/pedidos/${confirmedOrder.orderId}`}
                      className="inline-flex items-center justify-center rounded-full border border-border px-5 py-2.5 text-xs uppercase tracking-wider text-foreground hover:bg-surface transition-colors"
                    >
                      Ver mi pedido
                    </Link>
                  )}
                  <Link
                    href="/catalogo"
                    onClick={() => saveConfirmedOrder(null)}
                    className="inline-flex items-center justify-center rounded-full border border-border px-5 py-2.5 text-xs uppercase tracking-wider text-muted hover:text-foreground hover:bg-surface transition-colors"
                  >
                    Volver al catálogo
                  </Link>
                </div>
              </div>
            </Card>
          </div>
        )}
      </div>
    </main>
  );
}
