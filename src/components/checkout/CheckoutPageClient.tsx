"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { useReservationCart } from "@/components/providers/ReservationCartProvider";
import {
  EMPTY_DELIVERY_OPTIONS,
  formatDateLabel,
  getShippingBranches,
  getShippingCompaniesByDepartment,
  getShippingDepartments,
} from "@/lib/delivery-options";
import type {
  CheckoutCustomerContext,
  CheckoutSubmitResponse,
  DeliveryMethod,
  DeliveryOptionsConfig,
  PaymentMethod,
} from "@/types/checkout";
import { CheckoutCartSummary } from "@/components/checkout/CheckoutCartSummary";
import { CheckoutDeliverySection, DELIVERY_OPTIONS } from "@/components/checkout/CheckoutDeliverySection";
import { CheckoutSummarySidebar } from "@/components/checkout/CheckoutSummarySidebar";
import { CheckoutAuthStatus } from "@/components/checkout/CheckoutAuthStatus";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { DEFAULT_NATIONAL_SHIPPING_FEE } from "@/lib/constants";
import { sanitizeCallbackUrl } from "@/lib/text";
import { getCouponErrorMessage, type PricingSummary } from "@/types/promociones";

function buildDefaultAddress(context: CheckoutCustomerContext | null) {
  if (!context?.defaultAddress) return "";

  const parts = [context.defaultAddress.zone, context.defaultAddress.addressLine, context.defaultAddress.reference]
    .map((value) => value?.trim())
    .filter(Boolean);

  return parts.join(", ");
}

function persistPaymentReference(orderId: string | null | undefined, paymentId: string | null | undefined) {
  if (!orderId || !paymentId) return;
  window.localStorage.setItem(`fitandes-payment:${orderId}`, paymentId);
}

export default function CheckoutPageClient() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const { items, totalAmount, totalItems, cuponCodigo, setCuponCodigo, updateQuantity, removeItem, clearCart } = useReservationCart();

  const [deliveryMethod, setDeliveryMethod] = useState<DeliveryMethod>("WHATSAPP");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("EFECTIVO");

  // Datos para compra como invitado
  const [guestName, setGuestName] = useState("");
  const [guestPhone, setGuestPhone] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [guestCI, setGuestCI] = useState("");

  // Campos de entrega
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [recipientName, setRecipientName] = useState("");
  const [pickupDate, setPickupDate] = useState("");
  const [pickupScheduleId, setPickupScheduleId] = useState("");
  const [pickupTime, setPickupTime] = useState("");
  const [department, setDepartment] = useState("");
  const [city, setCity] = useState("");
  const [shippingCompany, setShippingCompany] = useState("");
  const [branch, setBranch] = useState("");
  const [senderName, setSenderName] = useState("");
  const [senderCI, setSenderCI] = useState("");
  const [senderPhone, setSenderPhone] = useState("");
  const [notes, setNotes] = useState("");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [prefillLoading, setPrefillLoading] = useState(false);
  const [deliveryConfig, setDeliveryConfig] = useState<DeliveryOptionsConfig>(EMPTY_DELIVERY_OPTIONS);
  const [deliveryOptionsLoading, setDeliveryOptionsLoading] = useState(true);
  const [deliveryOptionsError, setDeliveryOptionsError] = useState("");
  const [systemWarning, setSystemWarning] = useState<string | null>(null);
  const [isSystemReadOnly, setIsSystemReadOnly] = useState<boolean>(false);

  // Estado de promociones automáticas y cupón (evaluados en servidor)
  const [pricingSummary, setPricingSummary] = useState<PricingSummary | null>(null);
  const [pricingLoading, setPricingLoading] = useState(false);
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [couponSuccess, setCouponSuccess] = useState<string | null>(null);

  const authenticated = status === "authenticated" && session?.user?.role === "CLIENTE";
  const pickupPointOptions = deliveryConfig.pickupPoints;
  const shippingDepartments = getShippingDepartments(deliveryConfig);
  const shippingCompanies = getShippingCompaniesByDepartment(department, deliveryConfig);
  const shippingBranches = getShippingBranches(department, shippingCompany, deliveryConfig);

  // Cálculo de tarifa de flete nacional
  const nationalFlatFee = deliveryConfig.shippingPolicy?.nationalFlatFee ?? DEFAULT_NATIONAL_SHIPPING_FEE;
  const shippingCost = deliveryMethod === "SHIPPING_NATIONAL" ? nationalFlatFee : 0;
  const shippingLabel =
    deliveryMethod === "PICKUP_POINT"
      ? "Gratis (0.00 Bs)"
      : deliveryMethod === "SHIPPING_NATIONAL"
      ? `Bs ${nationalFlatFee}.00`
      : "Por coordinar";

  const evaluationItemsKey = items
    .map((item) => `${item.productoId ?? ""}:${item.variantId ?? ""}:${item.color}:${item.talla}:${item.cantidad}`)
    .join("|");
  const guestPhoneNormalized = guestPhone.replace(/\D/g, "").trim();

  // Evaluación en vivo de rebajas de catálogo, promociones automáticas y cupón contra el servidor central
  useEffect(() => {
    if (items.length === 0) {
      setPricingSummary(null);
      return;
    }

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
          telefonoInvitado: !authenticated && guestPhoneNormalized.length >= 7 ? guestPhoneNormalized : undefined,
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
        .catch(() => {
          // Si falla la evaluación en vivo, mantenemos el subtotal base sin bloquear la UI
        })
        .finally(() => {
          if (!controller.signal.aborted) {
            setPricingLoading(false);
          }
        });
    }, 250);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [evaluationItemsKey, cuponCodigo, shippingCost, authenticated, guestPhoneNormalized]);

  async function handleApplyCoupon(rawCode: string) {
    const code = rawCode.trim().toUpperCase();
    if (!code) return;

    setCouponLoading(true);
    setCouponError(null);
    setCouponSuccess(null);

    try {
      // 1. Si el cliente está autenticado, persistimos el cupón en su carrito del servidor (Sección 12.4)
      if (authenticated) {
        const cartRes = await fetch("/api/cart/cupon", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ codigo: code }),
        });
        const cartData = await cartRes.json().catch(() => null);

        if (cartRes.ok && cartData?.ok) {
          const appliedCode = typeof cartData.cuponCodigo === "string" ? cartData.cuponCodigo : code;
          setCuponCodigo(appliedCode);
          if (cartData.resumenPrecios) {
            setPricingSummary(cartData.resumenPrecios as PricingSummary);
          }
          setCouponSuccess(cartData.message || "Cupón aplicado correctamente.");
          return;
        }

        // Si el backend rechazó el cupón por reglas de negocio (no por carrito vacío/404), mostramos el error exacto
        if (cartRes.status !== 404 && cartRes.status < 500 && cartData?.cuponErrorCodigo) {
          setCouponError(getCouponErrorMessage(cartData.cuponErrorCodigo, cartData.message));
          return;
        }
      }

      // 2. Evaluación directa (invitados o fallback si el carrito remoto aún no se sincronizó)
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
          telefonoInvitado: !authenticated && guestPhoneNormalized.length >= 7 ? guestPhoneNormalized : undefined,
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
        const res = await fetch("/api/cart/cupon", { method: "DELETE" });
        const data = await res.json().catch(() => null);
        if (res.ok && data?.resumenPrecios) {
          setPricingSummary(data.resumenPrecios as PricingSummary);
        }
      }
    } catch {
      // El efecto en vivo recalculará automáticamente sin cupón
    } finally {
      setCouponLoading(false);
    }
  }

  useEffect(() => {
    let cancelled = false;
    setDeliveryOptionsLoading(true);
    setDeliveryOptionsError("");

    void fetch("/api/delivery-options", { cache: "no-store" })
      .then(async (response) => {
        const data = (await response.json().catch(() => null)) as DeliveryOptionsConfig | { message?: string } | null;
        if (!response.ok) {
          throw new Error((data && "message" in data && data.message) || "No pude cargar las opciones de entrega.");
        }
        return data as DeliveryOptionsConfig;
      })
      .then((config) => {
        if (!cancelled) {
          setDeliveryConfig(config ?? EMPTY_DELIVERY_OPTIONS);
        }
      })
      .catch((fetchError: unknown) => {
        if (!cancelled) {
          setDeliveryOptionsError(fetchError instanceof Error ? fetchError.message : "No pude cargar las opciones de entrega.");
          setDeliveryConfig(EMPTY_DELIVERY_OPTIONS);
        }
      })
      .finally(() => {
        if (!cancelled) setDeliveryOptionsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    void fetch("/api/estado", { cache: "no-store" })
      .then(async (response) => {
        const data = await response.json().catch(() => null);
        if (cancelled) return;

        if (data?.readOnly) {
          setIsSystemReadOnly(true);
          setSystemWarning(
            "El sistema central se encuentra temporalmente en modo de consulta por mantenimiento. Las compras web están en pausa temporal."
          );
        } else if (!response.ok || (data && data.mongodbConnected === false)) {
          setSystemWarning(
            "El sistema central de pedidos se encuentra en mantenimiento técnico programado. Si experimentas problemas al confirmar tu orden, te sugerimos coordinar directamente por WhatsApp."
          );
        }
      })
      .catch(() => {
        // En caso de fallo de red aislado, no bloqueamos la UI
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (deliveryMethod === "SHIPPING_NATIONAL" && paymentMethod !== "QR") {
      setPaymentMethod("QR");
    } else if (deliveryMethod === "WHATSAPP" && paymentMethod !== "EFECTIVO") {
      setPaymentMethod("EFECTIVO");
    }
  }, [deliveryMethod, paymentMethod]);

  // Reset pickup selections when switching away from PICKUP_POINT
  useEffect(() => {
    if (deliveryMethod !== "PICKUP_POINT") return;

    if (!pickupPointOptions.some((option) => option.name === address)) {
      setAddress("");
      setPickupDate("");
      setPickupScheduleId("");
      setPickupTime("");
    }
  }, [deliveryMethod, address, pickupPointOptions]);

  useEffect(() => {
    if (deliveryMethod !== "SHIPPING_NATIONAL") return;

    if (!shippingDepartments.includes(department)) {
      setDepartment(shippingDepartments[0] ?? "");
    }
  }, [deliveryMethod, department, shippingDepartments]);

  useEffect(() => {
    if (deliveryMethod !== "SHIPPING_NATIONAL") return;

    if (!shippingCompanies.some((company) => company.name === shippingCompany)) {
      setShippingCompany(shippingCompanies[0]?.name ?? "");
    }
  }, [deliveryMethod, shippingCompany, shippingCompanies]);

  useEffect(() => {
    if (deliveryMethod !== "SHIPPING_NATIONAL") return;

    if (!shippingBranches.includes(branch)) {
      setBranch(shippingBranches[0] ?? "");
    }
  }, [deliveryMethod, branch, shippingBranches]);

  useEffect(() => {
    if (!authenticated) return;

    let cancelled = false;
    setPrefillLoading(true);

    void fetch("/api/checkout", { cache: "no-store" })
      .then(async (response) => {
        const data = (await response.json().catch(() => null)) as CheckoutCustomerContext | { message?: string } | null;
        if (!response.ok) {
          throw new Error((data && "message" in data && data.message) || "No pude cargar tus datos.");
        }
        return data as CheckoutCustomerContext;
      })
      .then((context) => {
        if (cancelled) return;

        if (context.profile?.defaultDeliveryMethod && DELIVERY_OPTIONS.some((option) => option.value === context.profile?.defaultDeliveryMethod)) {
          setDeliveryMethod(context.profile.defaultDeliveryMethod);
        }

        const fallbackPhone = context.profile?.phone ?? context.defaultAddress?.phone ?? "";
        const fallbackName = context.defaultAddress?.recipientName ?? context.user?.fullname ?? "";
        const fallbackAddress = buildDefaultAddress(context);

        setPhone((current) => current || fallbackPhone);
        setRecipientName((current) => current || fallbackName);
        setAddress((current) => current || fallbackAddress);
        setDepartment((current) => current || context.defaultAddress?.department || "");
        setCity((current) => current || context.defaultAddress?.city || "");
        setSenderName("WEB");
        setSenderPhone((current) => current || fallbackPhone);
        setNotes((current) => current || context.profile?.notes || "");
      })
      .catch((fetchError: unknown) => {
        if (cancelled) return;
        const message = fetchError instanceof Error ? fetchError.message : "No pude cargar tus datos de checkout.";
        setError(message);
      })
      .finally(() => {
        if (!cancelled) setPrefillLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [authenticated]);

  function goToLogin() {
    router.push(`/login?callbackUrl=${encodeURIComponent(sanitizeCallbackUrl("/checkout"))}`);
  }

  function validateForm() {
    if (isSystemReadOnly) {
      return "El sistema se encuentra temporalmente en mantenimiento. Por favor contáctanos por WhatsApp (+591 67113105) para apartar tus prendas.";
    }

    if (items.length === 0) {
      return "Tu carrito está vacío.";
    }

    const invalidItem = items.find((item) => !item.productoId);
    if (invalidItem) {
      return "Hay un producto sin identificador válido. Vuelve a agregarlo desde el catálogo.";
    }

    if (notes.trim().length > 300) {
      return "Las observaciones no pueden superar los 300 caracteres.";
    }

    // Validar datos de comprador si compra como invitado
    if (!authenticated) {
      if (!guestName.trim()) {
        return "Por favor ingresa tu nombre completo.";
      }
      const rawGuestPhone = guestPhone.replace(/\D/g, "");
      if (rawGuestPhone.length < 7) {
        return "Por favor ingresa un número de celular válido para coordinar tu pedido.";
      }
    }

    const normalizedPhone = (authenticated ? phone : guestPhone || phone).replace(/\D/g, "");
    const normalizedSenderPhone = (authenticated ? senderPhone : guestPhone || senderPhone).replace(/\D/g, "");

    if (deliveryMethod === "PICKUP_POINT") {
      if (pickupPointOptions.length === 0) {
        return "No pude cargar los puntos de entrega del sistema central.";
      }

      if (!address.trim()) {
        return "Selecciona un punto de encuentro.";
      }

      if (!pickupDate) {
        return "Selecciona una fecha de entrega.";
      }

      if (!pickupScheduleId) {
        return "Selecciona un rango horario disponible.";
      }

      if (!pickupTime.trim()) {
        return "Selecciona una hora específica para la entrega.";
      }

      if (normalizedPhone.length < 7) {
        return "Ingresa un celular válido para coordinar la entrega.";
      }
    }

    if (deliveryMethod === "SHIPPING_NATIONAL") {
      if (shippingDepartments.length === 0 || shippingCompanies.length === 0) {
        return "No pude cargar las opciones de envío del sistema central.";
      }

      if (paymentMethod !== "QR") {
        return "El envío nacional solo admite pago QR.";
      }

      if (!department.trim() || !shippingCompany.trim() || !branch.trim()) {
        return "Selecciona departamento, empresa y sucursal de encomienda.";
      }

      const activeCI = authenticated ? senderCI : guestCI || senderCI;
      if (!activeCI.trim()) {
        return "Ingresa el CI del destinatario para la guía de encomienda.";
      }

      if (normalizedSenderPhone.length < 7) {
        return "Ingresa un celular válido del destinatario.";
      }
    }

    return "";
  }

  async function handleSubmit() {
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setError("");
    setLoading(true);
    const pendingWhatsappWindow = deliveryMethod === "WHATSAPP" ? window.open("", "_blank") : null;

    if (pendingWhatsappWindow) {
      pendingWhatsappWindow.document.write("<title>Abriendo WhatsApp...</title><p style=\"font-family:sans-serif;padding:16px\">Preparando tu pedido para WhatsApp...</p>");
      pendingWhatsappWindow.opener = null;
    }

    const pickupScheduleValue =
      deliveryMethod === "PICKUP_POINT" && pickupDate && pickupTime
        ? `${formatDateLabel(pickupDate)} ${pickupTime}`
        : "";

    const activeCustomerName = authenticated ? (session?.user?.fullname ?? "Cliente") : guestName.trim();
    const activeCustomerPhone = authenticated ? phone.trim() : (guestPhone.trim() || phone.trim());
    const activeCustomerCI = authenticated ? senderCI.trim() : (guestCI.trim() || senderCI.trim());

    const checkoutPayload = {
      items,
      paymentMethod,
      delivery: {
        method: deliveryMethod,
        address: address.trim(),
        phone: activeCustomerPhone,
        recipientName: recipientName.trim() || activeCustomerName,
        scheduledAt: pickupScheduleValue,
        department: department.trim(),
        city: city.trim(),
        shippingCompany: shippingCompany.trim(),
        branch: branch.trim(),
        senderName: senderName.trim() || activeCustomerName,
        senderCI: activeCustomerCI,
        senderPhone: senderPhone.trim() || activeCustomerPhone,
      },
      notes: notes.trim(),
      ...(cuponCodigo ? { cuponCodigo } : {}),
      esInvitado: !authenticated,
      clienteInvitado: !authenticated
        ? {
            nombreCompleto: activeCustomerName,
            telefono: activeCustomerPhone,
            email: guestEmail.trim() || undefined,
            ci: activeCustomerCI || undefined,
          }
        : undefined,
    };

    if (paymentMethod === "QR") {
      try {
        window.localStorage.setItem("fitandes-pending-checkout", JSON.stringify(checkoutPayload));
        window.localStorage.setItem(
          "fitandes-pending-checkout-preview",
          JSON.stringify({
            shippingCost,
            shippingLabel,
            pricingSummary,
          }),
        );
        router.push("/pagar/confirmar");
        return;
      } catch {
        setError("No pude preparar el pago QR. Intenta nuevamente.");
        setLoading(false);
        return;
      }
    }

    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(checkoutPayload),
      });

      const data = (await response.json().catch(() => null)) as CheckoutSubmitResponse | null;

      if (!response.ok || !data?.ok) {
        pendingWhatsappWindow?.close();
        setError(data?.message ?? "No pude completar tu pedido en este momento.");
        setLoading(false);
        return;
      }

      clearCart();
      persistPaymentReference(data.orderId, data.paymentId);

      if (data.whatsappUrl) {
        if (pendingWhatsappWindow && !pendingWhatsappWindow.closed) {
          pendingWhatsappWindow.location.href = data.whatsappUrl;
        } else {
          window.location.href = data.whatsappUrl;
        }
      } else {
        pendingWhatsappWindow?.close();
      }

      if (!authenticated) {
        router.push(`/checkout/confirmacion?orderId=${data.orderId || ""}&numero=${encodeURIComponent(data.orderNumber || "")}&metodo=${encodeURIComponent(deliveryMethod)}`);
      } else {
        router.push(data.orderId ? `/pedidos/${data.orderId}` : "/pedidos");
      }
      router.refresh();
    } catch {
      pendingWhatsappWindow?.close();
      setError("Ocurrió un problema al finalizar tu compra. Intenta nuevamente.");
      setLoading(false);
    }
  }

  if (items.length === 0) {
    return (
      <main className="min-h-[calc(100vh-82px)] bg-background px-4 py-10 sm:px-6 sm:py-14">
        <Card className="max-w-[860px] mx-auto rounded-[30px] py-12 text-center sm:py-20">
          <div className="mx-auto mb-8 flex h-24 w-24 items-center justify-center rounded-full bg-surface-soft text-muted">
            <svg className="h-10 w-10 opacity-60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
          </div>
          <p className="text-[10px] uppercase mb-4 tracking-[0.2em] text-subtle">
            Carrito
          </p>
          <h1 className="mb-4 text-3xl font-serif text-foreground sm:text-4xl">
            Tu carrito está vacío
          </h1>
          <p className="text-sm max-w-md mx-auto text-muted">
            Agrega productos desde el catálogo para revisar variantes, entrega y confirmar tu pedido.
          </p>
          <div className="mt-10">
            <Link href="/catalogo">
              <Button variant="primary" size="lg">Ir al catálogo</Button>
            </Link>
          </div>
        </Card>
      </main>
    );
  }

  return (
    <main className="min-h-[calc(100vh-82px)] bg-gradient-to-b from-background to-surface/40 px-4 py-6 pb-36 sm:px-6 sm:py-8 sm:pb-36 lg:py-12 lg:pb-12">
      <div className="max-w-[1240px] mx-auto">
        <header className="mb-8 rounded-[24px] sm:rounded-[28px] border bg-white px-4 py-5 sm:mb-10 sm:px-6 sm:py-6 border-border shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-5 sm:gap-6">
            <div className="max-w-2xl">
              <p className="text-[10px] uppercase mb-2 tracking-[0.2em] text-subtle">
                Revisión final
              </p>
              <h1 className="text-3xl font-serif text-foreground sm:text-5xl">
                Finalizar compra
              </h1>
              <p className="mt-3 sm:mt-4 text-sm text-muted leading-relaxed">
                Revisa tus prendas, datos de entrega y el método de pago antes de confirmar.
              </p>
            </div>

            <CheckoutAuthStatus
              authenticated={authenticated}
              user={session?.user}
              loading={prefillLoading}
              onLogin={goToLogin}
            />
          </div>

          {/* Stepper visual de progreso */}
          <ol aria-label="Pasos del proceso de compra" className="mt-5 sm:mt-6 pt-4 sm:pt-5 border-t border-border/70 grid grid-cols-3 gap-2 sm:gap-4">
            {[
              { step: "01", label: "Prendas", desktopLabel: "Prendas reservadas", done: true },
              { step: "02", label: "Entrega", desktopLabel: "Datos y entrega", active: true },
              {
                step: "03",
                label: deliveryMethod === "WHATSAPP" ? "Confirmar" : "Pago",
                desktopLabel: deliveryMethod === "WHATSAPP" ? "Confirmación" : "Pago y envío",
                active: false,
              },
            ].map((item) => (
              <li key={item.step} className="flex items-center gap-1.5 sm:gap-3 min-w-0">
                <span
                  className={`flex h-6 w-6 sm:h-7 sm:w-7 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold tracking-wider ${
                    item.done
                      ? "bg-success text-white"
                      : item.active
                      ? "bg-foreground text-background"
                      : "border border-border bg-surface text-subtle"
                  }`}
                >
                  {item.done ? "✓" : item.step}
                </span>
                <span
                  className={`text-[10px] sm:text-xs uppercase tracking-[0.06em] sm:tracking-[0.12em] truncate ${
                    item.done || item.active ? "text-foreground font-medium" : "text-subtle"
                  }`}
                >
                  <span className="sm:hidden">{item.label}</span>
                  <span className="hidden sm:inline">{item.desktopLabel}</span>
                </span>
              </li>
            ))}
          </ol>
        </header>

        {systemWarning && (
          <div className="rounded-[24px] border border-amber-200/90 bg-amber-50/80 p-4 sm:p-5 text-amber-900 shadow-xs mb-8">
            <div className="flex items-start gap-3 sm:gap-4">
              <span className="text-2xl shrink-0" aria-hidden="true">
                ℹ️
              </span>
              <div className="text-xs sm:text-sm leading-relaxed space-y-1.5">
                <p className="font-semibold text-amber-950">
                  Aviso de disponibilidad del sistema
                </p>
                <p className="text-amber-900">
                  {systemWarning}
                </p>
                <p className="pt-0.5 text-xs">
                  ¿Prefieres asegurar tus prendas inmediatamente?{" "}
                  <a
                    href="https://wa.me/59167113105?text=Hola%20Fit%20Andes%2C%20quisiera%20coordinar%20mi%20pedido%20directamente"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-semibold text-amber-950 underline underline-offset-2 hover:opacity-80"
                  >
                    Chatea con nosotros por WhatsApp (+591 67113105)
                  </a>
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="grid gap-8 lg:grid-cols-[1fr_360px] xl:grid-cols-[1fr_400px]">
          <div className="space-y-6 sm:space-y-8">
            {/* Formulario de Comprador Invitado */}
            {!authenticated && (
              <section>
                <div className="flex flex-wrap items-center justify-between gap-2 mb-4 px-1">
                  <h2 className="text-xs uppercase tracking-widest text-subtle font-semibold">
                    1. Datos de quien compra (Invitado)
                  </h2>
                  <button
                    type="button"
                    onClick={goToLogin}
                    className="text-xs text-foreground font-medium underline underline-offset-2 hover:opacity-75"
                  >
                    ¿Ya tienes cuenta? Iniciar sesión
                  </button>
                </div>
                <Card className="rounded-[28px] space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Input
                      label="Nombre y Apellidos *"
                      value={guestName}
                      onChange={(e) => {
                        setGuestName(e.target.value);
                        if (!recipientName) setRecipientName(e.target.value);
                      }}
                      placeholder="Ej. Rodrigo Mendoza"
                      required
                    />
                    <Input
                      label="Celular WhatsApp *"
                      type="tel"
                      value={guestPhone}
                      onChange={(e) => {
                        setGuestPhone(e.target.value);
                        if (!phone) setPhone(e.target.value);
                      }}
                      placeholder="Ej. 76543210"
                      required
                    />
                    <Input
                      label="Correo Electrónico (Opcional)"
                      type="email"
                      value={guestEmail}
                      onChange={(e) => setGuestEmail(e.target.value)}
                      placeholder="Para enviarte el recibo"
                    />
                    <Input
                      label="Cédula de Identidad (CI)"
                      value={guestCI}
                      onChange={(e) => {
                        setGuestCI(e.target.value);
                        if (!senderCI) setSenderCI(e.target.value);
                      }}
                      placeholder="Requerido si es envío nacional"
                    />
                  </div>
                </Card>
              </section>
            )}

            <section>
              <h2 className="mb-4 px-1 text-xs uppercase tracking-widest text-subtle font-semibold">
                {!authenticated ? "2. Prendas en reserva" : "Prendas en reserva"}
              </h2>
              <CheckoutCartSummary
                items={items}
                evaluatedItems={pricingSummary?.items}
                updateQuantity={updateQuantity}
                removeItem={removeItem}
              />
            </section>

            <section>
              <h2 className="mb-4 px-1 text-xs uppercase tracking-widest text-subtle font-semibold">
                {!authenticated ? "3. Modalidad y datos de entrega" : "Datos de entrega"}
              </h2>
              <CheckoutDeliverySection
                method={deliveryMethod}
                setMethod={setDeliveryMethod}
                config={deliveryConfig}
                loading={deliveryOptionsLoading}
                error={deliveryOptionsError}
                address={address}
                setAddress={setAddress}
                phone={phone || guestPhone}
                setPhone={setPhone}
                recipientName={recipientName || guestName}
                setRecipientName={setRecipientName}
                pickupDate={pickupDate}
                setPickupDate={setPickupDate}
                pickupScheduleId={pickupScheduleId}
                setPickupScheduleId={setPickupScheduleId}
                pickupTime={pickupTime}
                setPickupTime={setPickupTime}
                department={department}
                setDepartment={setDepartment}
                shippingCompany={shippingCompany}
                setShippingCompany={setShippingCompany}
                branch={branch}
                setBranch={setBranch}
                senderCI={senderCI || guestCI}
                setSenderCI={setSenderCI}
                senderPhone={senderPhone || guestPhone}
                setSenderPhone={setSenderPhone}
              />
            </section>

            {deliveryMethod !== "WHATSAPP" && (
              <section>
                <h2 className="mb-4 px-1 text-xs uppercase tracking-widest text-subtle font-semibold">
                  {!authenticated ? "4. Método de pago" : "Método de pago"}
                </h2>
                <Card className="space-y-4 rounded-[28px]">
                  {[
                    { value: "EFECTIVO", label: "Efectivo", description: "Pago presencial al momento del encuentro." },
                    { value: "QR", label: "Transferencia QR BancoSol", description: "Paga con QR desde cualquier banco y sube tu comprobante." },
                  ].map((option) => {
                    const disabled = deliveryMethod === "SHIPPING_NATIONAL" && option.value !== "QR";
                    return (
                      <label
                        key={option.value}
                        className={`block rounded-[20px] border px-4 py-3.5 transition-all ${
                          disabled ? "cursor-not-allowed bg-surface/20 opacity-50" : "cursor-pointer active:scale-[0.99]"
                        } ${paymentMethod === option.value ? "border-foreground bg-surface/40 shadow-xs" : "border-border bg-white"}`}
                      >
                        <div className="flex items-start gap-3">
                          <input
                            type="radio"
                            name="payment-method"
                            value={option.value}
                            checked={paymentMethod === option.value}
                            onChange={() => !disabled && setPaymentMethod(option.value as PaymentMethod)}
                            disabled={disabled}
                            className="mt-1 accent-foreground"
                          />
                          <div>
                            <p className="text-sm font-medium text-foreground">{option.label}</p>
                            <p className="mt-1 text-xs text-muted">
                              {disabled ? "El envío nacional solo admite pago por transferencia QR." : option.description}
                            </p>
                          </div>
                        </div>
                      </label>
                    );
                  })}
                </Card>
              </section>
            )}

            <section>
              <h2 className="mb-4 px-1 text-xs uppercase tracking-widest text-subtle font-semibold">
                Instrucciones u observaciones
              </h2>
              <Card padding="none" className="overflow-hidden rounded-[28px] border border-border">
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  placeholder="Referencias adicionales de entrega, horarios preferidos o aclaraciones..."
                  className="w-full resize-none bg-transparent p-4 text-sm outline-none placeholder:text-subtle/50"
                />
              </Card>
            </section>
          </div>

          <aside className="relative lg:pl-2">
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
              loading={loading}
              disabled={isSystemReadOnly}
              error={error}
              onSubmit={handleSubmit}
              authenticated={authenticated}
            />

            <div className="mt-6 px-2 sm:px-4">
              <Link href="/catalogo" className="block text-center text-[10px] uppercase tracking-widest text-subtle transition-colors hover:text-foreground">
                Volver al catálogo
              </Link>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
