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

const DELIVERY_OPTIONS: Array<{ value: DeliveryMethod; label: string; description: string }> = [
  {
    value: "WHATSAPP",
    label: "WhatsApp",
    description: "Enviar Mensaje con el pedido listo para coordinar entrega directamente.",
  },
  {
    value: "PICKUP_POINT",
    label: "Punto de encuentro (La Paz)",
    description: "Llena informacion para entrega directa en el punto de encuentro deseado",
  },
  {
    value: "SHIPPING_NATIONAL",
    label: "Envio nacional",
    description: "Envio a otro departamento mediante encomienda. Este flujo requiere  datos de entrega y pago QR para confirmar envio.",
  },
];

const PAYMENT_OPTIONS: Array<{ value: PaymentMethod; label: string; description: string }> = [
  { value: "EFECTIVO", label: "Efectivo", description: "Pago al momento de la entrega." },
  { value: "QR", label: "QR", description: "Despues de crear pedido debe subir comprobante del pago para confirmar envio." },
];

function formatPrice(value: number) {
  return `Bs. ${new Intl.NumberFormat("es-BO", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)}`;
}

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
      <main className="min-h-[calc(100vh-82px)] px-4 sm:px-6 py-10 sm:py-14" style={{ background: "#f7f2eb" }}>
        <div className="max-w-[860px] mx-auto border p-8 sm:p-12 text-center" style={{ borderColor: "#e6ddd2", background: "rgba(255,255,255,0.88)" }}>
          <p className="text-xs uppercase mb-3" style={{ letterSpacing: "0.18em", color: "#8f8478" }}>
            Carrito
          </p>
          <h1 className="text-4xl mb-3" style={{ fontFamily: "Georgia, 'Times New Roman', serif", fontWeight: 400, color: "#111111" }}>
            Tu carrito esta vacio
          </h1>
          <p className="text-sm max-w-md mx-auto" style={{ color: "#5f564e" }}>
            Agrega productos desde el catalogo para revisar variantes, entrega y confirmar tu pedido.
          </p>
          <Link
            href="/catalogo"
            className="mt-8 inline-flex items-center justify-center bg-[#111111] px-6 py-3 text-xs uppercase text-white transition-opacity hover:opacity-85"
            style={{ letterSpacing: "0.16em" }}
          >
            Ir al catalogo
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-[calc(100vh-82px)] px-4 sm:px-6 py-8 sm:py-10" style={{ background: "linear-gradient(180deg, #f8f4ee 0%, #f3ece3 100%)" }}>
      <div className="max-w-[1240px] mx-auto">
        <div className="mb-8 flex items-start justify-between gap-6 flex-wrap">
          <div>
            <p className="text-xs uppercase mb-2" style={{ letterSpacing: "0.2em", color: "#8f8478" }}>
              Revision final
            </p>
            <h1 className="text-4xl sm:text-5xl" style={{ fontFamily: "Georgia, 'Times New Roman', serif", fontWeight: 400, color: "#111111" }}>
              Finalizar compra
            </h1>
            <p className="mt-3 text-sm max-w-2xl" style={{ color: "#5f564e" }}>
              Tu carrito local se sincronizara con el sistema central para generar un pedido real y reservar stock.
            </p>
          </div>

          <div className="border px-5 py-4 min-w-[260px]" style={{ borderColor: "#e6ddd2", background: "rgba(255,255,255,0.92)" }}>
            <p className="text-xs uppercase mb-1" style={{ letterSpacing: "0.16em", color: "#8f8478" }}>
              Estado de sesion
            </p>
            {authenticated ? (
              <>
                <p className="text-sm" style={{ color: "#111111" }}>{session.user.fullname}</p>
                <p className="text-xs mt-1" style={{ color: "#6f6459" }}>{session.user.email}</p>
                {prefillLoading ? (
                  <p className="text-[11px] mt-3" style={{ color: "#8f8478" }}>
                    Cargando datos de cliente...
                  </p>
                ) : null}
              </>
            ) : (
              <>
                <p className="text-sm" style={{ color: "#111111" }}>Necesitas iniciar sesion para confirmar.</p>
                <button
                  type="button"
                  onClick={goToLogin}
                  className="mt-3 inline-flex items-center justify-center bg-[#111111] px-4 py-2.5 text-[11px] uppercase text-white transition-opacity hover:opacity-85"
                  style={{ letterSpacing: "0.16em" }}
                >
                  Iniciar sesion
                </button>
              </>
            )}
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px] xl:grid-cols-[minmax(0,1fr)_390px] items-start">
          <section className="border overflow-hidden" style={{ borderColor: "#e6ddd2", background: "rgba(255,255,255,0.92)" }}>
            <div className="hidden md:grid grid-cols-[minmax(0,1fr)_120px_120px_48px] gap-4 px-6 py-4 border-b text-xs uppercase" style={{ borderColor: "#eee5da", letterSpacing: "0.14em", color: "#8f8478" }}>
              <span>Producto</span>
              <span className="text-center">Cantidad</span>
              <span className="text-right">Precio</span>
              <span className="sr-only">Acciones</span>
            </div>

            <div>
              {items.map((item) => (
                <article key={item.id} className="grid gap-4 md:grid-cols-[minmax(0,1fr)_120px_120px_48px] px-5 sm:px-6 py-5 border-b items-center" style={{ borderColor: "#f1e8de" }}>
                  <div className="flex gap-4 min-w-0">
                    <div className="relative h-24 w-20 shrink-0 overflow-hidden border" style={{ borderColor: "#ece2d6", background: "#f6f1ea" }}>
                      {item.imagen ? (
                        <Image src={item.imagen} alt={item.nombre} fill sizes="80px" unoptimized className="object-cover" />
                      ) : (
                        <div className="flex h-full items-center justify-center text-[11px] uppercase" style={{ color: "#8f8478" }}>
                          Sin foto
                        </div>
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium uppercase leading-snug" style={{ color: "#111111" }}>
                        {item.nombre}
                      </p>
                      {item.modelo ? (
                        <p className="text-xs mt-1 uppercase" style={{ letterSpacing: "0.08em", color: "#8f8478" }}>
                          {item.modelo}
                        </p>
                      ) : null}
                      <p className="text-xs mt-2" style={{ color: "#6f6459" }}>
                        Variante: {item.color} / {item.talla}
                      </p>
                      <p className="text-xs mt-1" style={{ color: "#6f6459" }}>
                        Stock disponible: {item.stockDisponible}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center md:justify-center">
                    <div className="inline-flex items-center border" style={{ borderColor: "#d9d0c5" }}>
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.id, item.cantidad - 1)}
                        className="h-10 w-10 text-base"
                        aria-label={`Reducir cantidad de ${item.nombre}`}
                      >
                        -
                      </button>
                      <span className="flex h-10 min-w-10 items-center justify-center text-sm">{item.cantidad}</span>
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.id, item.cantidad + 1)}
                        className="h-10 w-10 text-base"
                        aria-label={`Aumentar cantidad de ${item.nombre}`}
                      >
                        +
                      </button>
                    </div>
                  </div>

                  <div className="md:text-right">
                    <p className="text-base" style={{ color: "#111111", fontFamily: "Georgia, 'Times New Roman', serif" }}>
                      {formatPrice(item.precio * item.cantidad)}
                    </p>
                    <p className="text-xs mt-1" style={{ color: "#8f8478" }}>
                      {formatPrice(item.precio)} c/u
                    </p>
                  </div>

                  <div className="flex md:justify-end">
                    <button
                      type="button"
                      onClick={() => removeItem(item.id)}
                      className="flex h-10 w-10 items-center justify-center text-lg transition-opacity hover:opacity-55"
                      style={{ color: "#8f8478" }}
                      aria-label={`Quitar ${item.nombre}`}
                    >
                      ×
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <aside className="space-y-5 lg:sticky lg:top-24">
            <section className="border p-5 sm:p-6" style={{ borderColor: "#e6ddd2", background: "rgba(255,255,255,0.95)" }}>
              <p className="text-xs uppercase mb-4" style={{ letterSpacing: "0.16em", color: "#8f8478" }}>
                Metodo de entrega
              </p>
              <div className="space-y-3">
                {DELIVERY_OPTIONS.map((option) => (
                  <label
                    key={option.value}
                    className="block border px-4 py-3 cursor-pointer transition-colors"
                    style={{
                      borderColor: deliveryMethod === option.value ? "#111111" : "#e6ddd2",
                      background: deliveryMethod === option.value ? "#fcfaf7" : "#ffffff",
                    }}
                  >
                    <div className="flex items-start gap-3">
                      <input
                        type="radio"
                        name="delivery-method"
                        value={option.value}
                        checked={deliveryMethod === option.value}
                        onChange={() => setDeliveryMethod(option.value)}
                        className="mt-1"
                      />
                      <div>
                        <p className="text-sm" style={{ color: "#111111" }}>{option.label}</p>
                        <p className="text-xs mt-1" style={{ color: "#6f6459" }}>{option.description}</p>
                      </div>
                    </div>
                  </label>
                ))}
              </div>

              {deliveryOptionsLoading ? (
                <p className="mt-4 text-xs" style={{ color: "#6f6459" }}>
                  Cargando opciones de entrega del sistema central...
                </p>
              ) : null}

              {deliveryOptionsError ? (
                <p className="mt-4 border px-4 py-3 text-sm" style={{ borderColor: "#d9b2ac", background: "#f6e8e5", color: "#8b3f36" }}>
                  {deliveryOptionsError}
                </p>
              ) : null}

              {deliveryMethod === "PICKUP_POINT" ? (
                <div className="mt-4 space-y-3">
                  <Field label="Punto de encuentro">
                    <select
                      value={address}
                      onChange={(event) => setAddress(event.target.value)}
                      className="w-full border px-4 py-3 text-sm"
                      style={{ borderColor: "#ddd3c8", background: "#ffffff" }}
                    >
                      {pickupPointOptions.map((option) => (
                        <option key={option.id} value={option.name}>
                          {option.name}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Celular de contacto">
                    <input
                      type="tel"
                      value={phone}
                      onChange={(event) => setPhone(event.target.value)}
                      placeholder="76543210"
                      className="w-full border px-4 py-3 text-sm"
                      style={{ borderColor: "#ddd3c8", background: "#ffffff" }}
                    />
                  </Field>
                  <Field label="Nombre de quien recibe">
                    <input
                      type="text"
                      value={recipientName}
                      onChange={(event) => setRecipientName(event.target.value)}
                      placeholder="Nombre opcional"
                      className="w-full border px-4 py-3 text-sm"
                      style={{ borderColor: "#ddd3c8", background: "#ffffff" }}
                    />
                  </Field>
                  <Field label="Horario disponible">
                    <select
                      value={pickupScheduleId}
                      onChange={(event) => setPickupScheduleId(event.target.value)}
                      className="w-full border px-4 py-3 text-sm"
                      style={{ borderColor: "#ddd3c8", background: "#ffffff" }}
                    >
                      {pickupScheduleOptions.map((option) => (
                        <option key={option.id} value={option.id}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Hora especifica">
                    <select
                      value={pickupTime}
                      onChange={(event) => setPickupTime(event.target.value)}
                      className="w-full border px-4 py-3 text-sm"
                      style={{ borderColor: "#ddd3c8", background: "#ffffff" }}
                    >
                      {pickupTimeOptions.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </Field>
                </div>
              ) : null}

              {deliveryMethod === "SHIPPING_NATIONAL" ? (
                <div className="mt-4 space-y-3">
                  <Field label="Departamento">
                    <select
                      value={department}
                      onChange={(event) => setDepartment(event.target.value)}
                      className="w-full border px-4 py-3 text-sm"
                      style={{ borderColor: "#ddd3c8", background: "#ffffff" }}
                    >
                      {shippingDepartments.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Empresa de envio">
                    <select
                      value={shippingCompany}
                      onChange={(event) => setShippingCompany(event.target.value)}
                      className="w-full border px-4 py-3 text-sm"
                      style={{ borderColor: "#ddd3c8", background: "#ffffff" }}
                    >
                      {shippingCompanies.map((option) => (
                        <option key={option.id} value={option.name}>
                          {option.name}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Sucursal o terminal">
                    <select
                      value={branch}
                      onChange={(event) => setBranch(event.target.value)}
                      className="w-full border px-4 py-3 text-sm"
                      style={{ borderColor: "#ddd3c8", background: "#ffffff" }}
                    >
                      {shippingBranches.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Nombre del remitente">
                    <input
                      type="text"
                      value="FitAndes"
                      readOnly
                      className="w-full border px-4 py-3 text-sm"
                      style={{ borderColor: "#ddd3c8", background: "#ffffff" }}
                    />
                  </Field>
                  <Field label="Nombre del destinatario">
                    <input
                      type="text"
                      value={recipientName}
                      onChange={(event) => setRecipientName(event.target.value)}
                      placeholder="Opcional"
                      className="w-full border px-4 py-3 text-sm"
                      style={{ borderColor: "#ddd3c8", background: "#ffffff" }}
                    />
                  </Field>
                  
                  <Field label="CI del destinatario">
                    <input
                      type="text"
                      value={senderCI}
                      onChange={(event) => setSenderCI(event.target.value)}
                      placeholder="12345678"
                      className="w-full border px-4 py-3 text-sm"
                      style={{ borderColor: "#ddd3c8", background: "#ffffff" }}
                    />
                  </Field>
                  <Field label="Celular del destinatario">
                    <input
                      type="tel"
                      value={senderPhone}
                      onChange={(event) => setSenderPhone(event.target.value)}
                      placeholder="76543210"
                      className="w-full border px-4 py-3 text-sm"
                      style={{ borderColor: "#ddd3c8", background: "#ffffff" }}
                    />
                  </Field>
                </div>
              ) : null}

              {deliveryMethod === "WHATSAPP" ? (
                <p className="mt-4 text-xs"  style={{ color: "#6f6459" }}>
                  Al confirmar, abriremos un mensaje estructurado al numero +591 76574068 con el detalle del pedido y el stock quedara reservado.
                </p>
              ) : null}
            </section>
              {deliveryMethod !== "WHATSAPP" ? (
            <section className="border p-5 sm:p-6" style={{ borderColor: "#e6ddd2", background: "rgba(255,255,255,0.95)" }}>
              <p className="text-xs uppercase mb-4" style={{ letterSpacing: "0.16em", color: "#8f8478" }}>
                Metodo de pago
              </p>
              <div className="space-y-3">
                {PAYMENT_OPTIONS.map((option) => {
                  const disabled = deliveryMethod === "SHIPPING_NATIONAL" && option.value !== "QR";

                  return (
                    <label
                      key={option.value}
                      className="block border px-4 py-3 transition-colors"
                      style={{
                        borderColor: paymentMethod === option.value ? "#111111" : "#e6ddd2",
                        background: disabled ? "#f6f1ea" : paymentMethod === option.value ? "#fcfaf7" : "#ffffff",
                        opacity: disabled ? 0.55 : 1,
                        cursor: disabled ? "not-allowed" : "pointer",
                      }}
                    >
                      <div className="flex items-start gap-3">
                        <input
                          type="radio"
                          name="payment-method"
                          value={option.value}
                          checked={paymentMethod === option.value}
                          onChange={() => !disabled && setPaymentMethod(option.value)}
                          disabled={disabled}
                          className="mt-1"
                        />
                        <div>
                          <p className="text-sm" style={{ color: "#111111" }}>{option.label}</p>
                          <p className="text-xs mt-1" style={{ color: "#6f6459" }}>
                            {disabled ? "No disponible para envio nacional." : option.description}
                          </p>
                        </div>
                      </div>
                    </label>
                  );
                })}
              </div>
            </section>
              ) : null}

            <section className="border p-5 sm:p-6" style={{ borderColor: "#e6ddd2", background: "rgba(255,255,255,0.95)" }}>
              <Field label="Observaciones del pedido(Opcional)">
                <textarea
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                  rows={3}
                  placeholder="Indicaciones opcionales para la coordinacion o entrega"
                  className="w-full border px-4 py-3 text-sm resize-none"
                  style={{ borderColor: "#ddd3c8", background: "#ffffff" }}
                />
              </Field>
            </section>
            <section className="border p-5 sm:p-6" style={{ borderColor: "#e6ddd2", background: "rgba(255,255,255,0.98)" }}>
              <div className="flex items-center justify-between text-sm">
                <span style={{ color: "#5f564e" }}>Productos</span>
                <span style={{ color: "#111111" }}>{totalItems}</span>
              </div>
              <div className="mt-3 flex items-center justify-between text-sm">
                <span style={{ color: "#5f564e" }}>Subtotal</span>
                <span style={{ color: "#111111" }}>{formatPrice(totalAmount)}</span>
              </div>
              <div className="mt-2 flex items-center justify-between text-sm">
                <span style={{ color: "#5f564e" }}>Entrega</span>
                <span style={{ color: "#111111" }}>
                  {DELIVERY_OPTIONS.find((option) => option.value === deliveryMethod)?.label}
                </span>
              </div>
              <div className="mt-2 flex items-center justify-between text-sm">
                <span style={{ color: "#5f564e" }}>Pago</span>
                <span style={{ color: "#111111" }}>{paymentMethod}</span>
              </div>
              <div className="mt-2 flex items-center justify-between text-sm">
                <span style={{ color: "#5f564e" }}>Siguiente paso</span>
                <span style={{ color: "#111111" }}>
                  {paymentMethod === "QR" ? "Subir comprobante" : deliveryMethod === "WHATSAPP" ? "Abrir WhatsApp" : "Esperar confirmacion"}
                </span>
              </div>

              <div className="mt-5 border-t pt-5" style={{ borderColor: "#eee5da" }}>
                <div className="flex items-center justify-between">
                  <span className="text-xl" style={{ color: "#111111", fontFamily: "Georgia, 'Times New Roman', serif" }}>
                    Total
                  </span>
                  <strong className="text-2xl" style={{ color: "#0f56d9", fontFamily: "Georgia, 'Times New Roman', serif" }}>
                    {formatPrice(totalAmount)}
                  </strong>
                </div>
              </div>

              {error ? (
                <p className="mt-4 border px-4 py-3 text-sm" style={{ borderColor: "#d9b2ac", background: "#f6e8e5", color: "#8b3f36" }}>
                  {error}
                </p>
              ) : null}

              <button
                type="button"
                onClick={handleSubmit}
                disabled={loading}
                className="mt-6 flex w-full items-center justify-center rounded-full bg-[#2bc233] px-6 py-4 text-sm font-medium text-white transition-transform hover:translate-y-[-1px] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "Confirmando pedido..." : "Finalizar compra"}
              </button>

              <Link
                href="/catalogo"
                className="mt-4 inline-flex w-full items-center justify-center text-xs uppercase transition-opacity hover:opacity-60"
                style={{ letterSpacing: "0.14em", color: "#6f6459" }}
              >
                Seguir comprando
              </Link>
            </section>
          </aside>
        </div>
      </div>
    </main>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-xs uppercase block mb-2" style={{ letterSpacing: "0.14em", color: "#8f8478" }}>
        {label}
      </label>
      {children}
    </div>
  );
}
