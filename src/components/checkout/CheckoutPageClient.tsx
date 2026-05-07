"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { useReservationCart } from "@/components/providers/ReservationCartProvider";
import {
  EMPTY_DELIVERY_OPTIONS,
  getPickupScheduleById,
  getPickupScheduleTimeSlots,
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

function sanitizeCallbackUrl(path: string) {
  return path.startsWith("/") ? path : "/checkout";
}

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
  const { items, totalAmount, totalItems, updateQuantity, removeItem, clearCart } = useReservationCart();
  const [deliveryMethod, setDeliveryMethod] = useState<DeliveryMethod>("WHATSAPP");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("EFECTIVO");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [recipientName, setRecipientName] = useState("");
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

  const authenticated = status === "authenticated" && session?.user?.role === "CLIENTE";
  const pickupPointOptions = deliveryConfig.pickupPoints;
  const pickupScheduleOptions = deliveryConfig.pickupSchedules;
  const selectedPickupSchedule = getPickupScheduleById(pickupScheduleId, deliveryConfig);
  const pickupTimeOptions = getPickupScheduleTimeSlots(pickupScheduleId, deliveryConfig);
  const shippingDepartments = getShippingDepartments(deliveryConfig);
  const shippingCompanies = getShippingCompaniesByDepartment(department, deliveryConfig);
  const shippingBranches = getShippingBranches(department, shippingCompany, deliveryConfig);

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
    if (deliveryMethod === "SHIPPING_NATIONAL" && paymentMethod !== "QR") {
      setPaymentMethod("QR");
    }
  }, [deliveryMethod, paymentMethod]);

  useEffect(() => {
    if (deliveryMethod !== "PICKUP_POINT") return;

    if (!pickupPointOptions.some((option) => option.name === address)) {
      setAddress(pickupPointOptions[0]?.name ?? "");
    }

    if (!pickupScheduleOptions.some((option) => option.id === pickupScheduleId)) {
      setPickupScheduleId(pickupScheduleOptions[0]?.id ?? "");
    }
  }, [deliveryMethod, address, pickupScheduleId, pickupPointOptions, pickupScheduleOptions]);

  useEffect(() => {
    if (deliveryMethod !== "PICKUP_POINT") return;

    if (!pickupTimeOptions.includes(pickupTime)) {
      setPickupTime(pickupTimeOptions[0] ?? "");
    }
  }, [deliveryMethod, pickupTime, pickupTimeOptions]);

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
    const normalizedPhone = phone.replace(/\D/g, "");
    const normalizedSenderPhone = senderPhone.replace(/\D/g, "");

    if (!authenticated) {
      return "Inicia sesión para registrar tu pedido en el historial.";
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

    if (deliveryMethod === "PICKUP_POINT") {
      if (pickupPointOptions.length === 0 || pickupScheduleOptions.length === 0) {
        return "No pude cargar los puntos de entrega del sistema central.";
      }

      if (!address.trim()) {
        return "Selecciona un punto de encuentro.";
      }

      if (normalizedPhone.length < 8) {
        return "Ingresa un celular válido para coordinar la entrega.";
      }

      if (!pickupScheduleId) {
        return "Selecciona un rango horario disponible.";
      }

      if (!pickupTime.trim()) {
        return "Selecciona una hora especifica dentro del rango.";
      }
    }

    if (deliveryMethod === "SHIPPING_NATIONAL") {
      if (shippingDepartments.length === 0 || shippingCompanies.length === 0) {
        return "No pude cargar las opciones de envio del sistema central.";
      }

      if (paymentMethod !== "QR") {
        return "El envio nacional solo admite pago QR.";
      }

      if (!department.trim() || !shippingCompany.trim() || !branch.trim()) {
        return "Selecciona departamento, empresa y sucursal de encomienda.";
      }

      if (!senderCI.trim()) {
        return "Ingresa el CI del destinatario.";
      }

      if (normalizedSenderPhone.length < 8) {
        return "Ingresa un celular válido del destinatario.";
      }
    }

    return "";
  }

  async function handleSubmit() {
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      if (!authenticated) goToLogin();
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
      deliveryMethod === "PICKUP_POINT" && selectedPickupSchedule && pickupTime
        ? `${selectedPickupSchedule.day} ${pickupTime}`
        : "";

    const checkoutPayload = {
      items,
      paymentMethod,
      delivery: {
        method: deliveryMethod,
        address: address.trim(),
        phone: phone.trim(),
        recipientName: recipientName.trim(),
        scheduledAt: pickupScheduleValue,
        department: department.trim(),
        city: city.trim(),
        shippingCompany: shippingCompany.trim(),
        branch: branch.trim(),
        senderName: senderName.trim(),
        senderCI: senderCI.trim(),
        senderPhone: senderPhone.trim(),
      },
      notes: notes.trim(),
    };

    if (paymentMethod === "QR") {
      try {
        window.localStorage.setItem("fitandes-pending-checkout", JSON.stringify(checkoutPayload));
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

      router.push(data.orderId ? `/pedidos/${data.orderId}` : "/pedidos");
      router.refresh();
    } catch {
      pendingWhatsappWindow?.close();
      setError("Ocurrio un problema al finalizar tu compra. Intenta nuevamente.");
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
    <main className="min-h-[calc(100vh-82px)] bg-gradient-to-b from-background to-surface/40 px-4 py-6 pb-28 sm:px-6 sm:py-8 sm:pb-32 lg:py-12 lg:pb-12">
      <div className="max-w-[1240px] mx-auto">
        <header className="mb-8 rounded-[28px] border bg-white px-5 py-6 sm:mb-10 sm:px-6" style={{ borderColor: "#ece6dc" }}>
          <div className="flex flex-wrap items-start justify-between gap-6">
            <div className="max-w-2xl">
              <p className="text-[10px] uppercase mb-2 tracking-[0.2em] text-subtle">
                Revisión final
              </p>
              <h1 className="text-3xl font-serif text-foreground sm:text-5xl">
                Finalizar compra
              </h1>
              <p className="mt-4 text-sm text-muted leading-relaxed">
                Revisa tu pedido y los detalles antes de finalizar la compra.
              </p>
            </div>

            <CheckoutAuthStatus
              authenticated={authenticated}
              user={session?.user}
              loading={prefillLoading}
              onLogin={goToLogin}
            />
          </div>
        </header>

        <div className="grid gap-8 lg:grid-cols-[1fr_360px] xl:grid-cols-[1fr_400px]">
          <div className="space-y-6 sm:space-y-8">
            {!authenticated && (
              <div className="rounded-[20px] bg-accent/10 border border-accent/20 p-5">
                <h3 className="text-sm font-semibold text-accent mb-2">Inicia sesión para comprar</h3>
                <p className="text-sm text-muted">
                  Puedes revisar tu carrito, pero necesitarás iniciar sesión para registrar y confirmar el pedido.
                </p>
              </div>
            )}
            
            <section>
              <h2 className="mb-4 px-1 text-xs uppercase tracking-widest text-subtle">Productos en reserva</h2>
              <CheckoutCartSummary
                items={items}
                updateQuantity={updateQuantity}
                removeItem={removeItem}
              />
            </section>

            <section>
              <h2 className="mb-4 px-1 text-xs uppercase tracking-widest text-subtle">Datos de entrega</h2>
              <CheckoutDeliverySection
                method={deliveryMethod}
                setMethod={setDeliveryMethod}
                config={deliveryConfig}
                loading={deliveryOptionsLoading}
                error={deliveryOptionsError}
                address={address}
                setAddress={setAddress}
                phone={phone}
                setPhone={setPhone}
                recipientName={recipientName}
                setRecipientName={setRecipientName}
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
                senderCI={senderCI}
                setSenderCI={setSenderCI}
                senderPhone={senderPhone}
                setSenderPhone={setSenderPhone}
              />
            </section>

            {deliveryMethod !== "WHATSAPP" && (
              <section>
                <h2 className="mb-4 px-1 text-xs uppercase tracking-widest text-subtle">Método de pago</h2>
                <Card className="space-y-4 rounded-[28px]">
                  {[
                    { value: "EFECTIVO", label: "Efectivo", description: "Pago al momento de la entrega." },
                    { value: "QR", label: "QR", description: "Sube tu comprobante despues de crear el pedido." },
                  ].map((option) => {
                    const disabled = deliveryMethod === "SHIPPING_NATIONAL" && option.value !== "QR";
                    return (
                      <label
                        key={option.value}
                        className={`block rounded-[20px] border px-4 py-3 transition-all ${disabled ? "cursor-not-allowed bg-surface/20 opacity-50" : "cursor-pointer active:scale-[0.98]"
                          } ${paymentMethod === option.value ? "border-foreground bg-surface/30" : "border-border bg-white"}`}
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
                              {disabled ? "No disponible para envio nacional." : option.description}
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
              <h2 className="mb-4 px-1 text-xs uppercase tracking-widest text-subtle">Observaciones</h2>
              <Card padding="none" className="overflow-hidden rounded-[28px]">
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={4}
                  placeholder="Instrucciones especiales para tu entrega..."
                  className="w-full resize-none bg-transparent p-4 text-sm outline-none placeholder:text-subtle/50"
                />
              </Card>
            </section>
          </div>

          <aside className="relative lg:pl-2">
            <CheckoutSummarySidebar
              totalAmount={totalAmount}
              totalItems={totalItems}
              loading={loading}
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
