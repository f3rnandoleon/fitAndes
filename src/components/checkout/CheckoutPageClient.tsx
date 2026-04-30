"use client";

import Image from "next/image";
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
import { formatPrice } from "@/lib/format";
import { CheckoutCartSummary } from "@/components/checkout/CheckoutCartSummary";
import { CheckoutDeliverySection } from "@/components/checkout/CheckoutDeliverySection";
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
      return "Inicia sesion para registrar tu pedido en el historial.";
    }

    if (items.length === 0) {
      return "Tu carrito esta vacio.";
    }

    const invalidItem = items.find((item) => !item.productoId);
    if (invalidItem) {
      return "Hay un producto sin identificador valido. Vuelve a agregarlo desde el catalogo.";
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
        return "Ingresa un celular valido para coordinar la entrega.";
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
        return "Ingresa un celular valido del destinatario.";
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

    try {
      const pickupScheduleValue =
        deliveryMethod === "PICKUP_POINT" && selectedPickupSchedule && pickupTime
          ? `${selectedPickupSchedule.day} ${pickupTime}`
          : "";

      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
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
        }),
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

      const query = data.paymentId ? `?paymentId=${encodeURIComponent(data.paymentId)}` : "";
      router.push(data.orderId ? `/pedidos/${data.orderId}${query}` : "/pedidos");
      router.refresh();
    } catch {
      pendingWhatsappWindow?.close();
      setError("Ocurrio un problema al finalizar tu compra. Intenta nuevamente.");
      setLoading(false);
    }
  }

  if (items.length === 0) {
    return (
      <main className="min-h-[calc(100vh-82px)] px-4 sm:px-6 py-10 sm:py-14 bg-background">
        <Card className="max-w-[860px] mx-auto py-12 sm:py-20 text-center">
          <p className="text-[10px] uppercase mb-4 tracking-[0.2em] text-subtle">
            Carrito
          </p>
          <h1 className="text-4xl mb-4 font-serif text-foreground">
            Tu carrito esta vacio
          </h1>
          <p className="text-sm max-w-md mx-auto text-muted">
            Agrega productos desde el catalogo para revisar variantes, entrega y confirmar tu pedido.
          </p>
          <div className="mt-10">
            <Link href="/catalogo">
              <Button variant="primary" size="lg">Ir al catalogo</Button>
            </Link>
          </div>
        </Card>
      </main>
    );
  }

  return (
    <main className="min-h-[calc(100vh-82px)] px-4 sm:px-6 py-8 sm:py-12 bg-gradient-to-b from-background to-surface/40">
      <div className="max-w-[1240px] mx-auto">
        <header className="mb-10 flex flex-wrap items-start justify-between gap-6">
          <div className="max-w-2xl">
            <p className="text-[10px] uppercase mb-2 tracking-[0.2em] text-subtle">
              Revision final
            </p>
            <h1 className="text-4xl sm:text-5xl font-serif text-foreground">
              Finalizar compra
            </h1>
            <p className="mt-4 text-sm text-muted leading-relaxed">
              Tu carrito local se sincronizara con el sistema central para generar un pedido real y reservar stock.
            </p>
          </div>

          <CheckoutAuthStatus
            authenticated={authenticated}
            user={session?.user}
            loading={prefillLoading}
            onLogin={goToLogin}
          />
        </header>

        <div className="grid gap-8 lg:grid-cols-[1fr_360px] xl:grid-cols-[1fr_400px]">
          <div className="space-y-8">
            <section>
              <h2 className="text-xs uppercase tracking-widest text-subtle mb-4 px-1">Productos en reserva</h2>
              <CheckoutCartSummary
                items={items}
                updateQuantity={updateQuantity}
                removeItem={removeItem}
              />
            </section>

            <section>
              <h2 className="text-xs uppercase tracking-widest text-subtle mb-4 px-1">Datos de entrega</h2>
              <CheckoutDeliverySection
                method={deliveryMethod}
                setMethod={setDeliveryMethod}
                config={deliveryConfig}
                loading={deliveryOptionsLoading}
                error={deliveryOptionsError}
                address={address} setAddress={setAddress}
                phone={phone} setPhone={setPhone}
                recipientName={recipientName} setRecipientName={setRecipientName}
                pickupScheduleId={pickupScheduleId} setPickupScheduleId={setPickupScheduleId}
                pickupTime={pickupTime} setPickupTime={setPickupTime}
                department={department} setDepartment={setDepartment}
                shippingCompany={shippingCompany} setShippingCompany={setShippingCompany}
                branch={branch} setBranch={setBranch}
                senderCI={senderCI} setSenderCI={setSenderCI}
                senderPhone={senderPhone} setSenderPhone={setSenderPhone}
              />
            </section>

            {deliveryMethod !== "WHATSAPP" && (
              <section>
                <h2 className="text-xs uppercase tracking-widest text-subtle mb-4 px-1">Metodo de pago</h2>
                <Card className="space-y-4">
                  {[
                    { value: "EFECTIVO", label: "Efectivo", description: "Pago al momento de la entrega." },
                    { value: "QR", label: "QR", description: "Sube tu comprobante despues de crear el pedido." },
                  ].map((option) => {
                    const disabled = deliveryMethod === "SHIPPING_NATIONAL" && option.value !== "QR";
                    return (
                      <label
                        key={option.value}
                        className={`block border px-4 py-3 transition-colors ${
                          disabled ? "opacity-50 cursor-not-allowed bg-surface/20" : "cursor-pointer"
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
                            <p className="text-xs mt-1 text-muted">
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
              <h2 className="text-xs uppercase tracking-widest text-subtle mb-4 px-1">Observaciones</h2>
              <Card padding="none">
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={4}
                  placeholder="Instrucciones especiales para tu entrega..."
                  className="w-full p-4 text-sm bg-transparent outline-none resize-none placeholder:text-subtle/50"
                />
              </Card>
            </section>
          </div>

          <aside className="relative">
            <CheckoutSummarySidebar
              totalAmount={totalAmount}
              totalItems={totalItems}
              loading={loading}
              error={error}
              onSubmit={handleSubmit}
              authenticated={authenticated}
            />
            
            <div className="mt-6 px-4">
              <Link href="/catalogo" className="text-[10px] uppercase tracking-widest text-subtle hover:text-foreground transition-colors block text-center">
                ← Volver al catalogo
              </Link>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <label className="text-[10px] uppercase tracking-widest text-subtle px-1">
        {label}
      </label>
      {children}
    </div>
  );
}
