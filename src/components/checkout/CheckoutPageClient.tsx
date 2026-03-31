"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useState } from "react";
import { useReservationCart } from "@/components/providers/ReservationCartProvider";
import type { CheckoutSubmitResponse, DeliveryMethod, PaymentMethod, PickupPoint } from "@/types/checkout";

const DELIVERY_OPTIONS: Array<{ value: DeliveryMethod; label: string; description: string }> = [
  {
    value: "WHATSAPP",
    label: "WhatsApp",
    description: "Prepara un mensaje estructurado del pedido y lo envia al WhatsApp de FitAndes.",
  },
  {
    value: "PICKUP_LAPAZ",
    label: "Entrega en La Paz",
    description: "Retiro coordinado en un punto de entrega. Se pedira tu celular para contactarte.",
  },
  {
    value: "HOME_DELIVERY",
    label: "Entrega en casa",
    description: "Envio a domicilio con direccion exacta y celular de contacto.",
  },
];

const PICKUP_OPTIONS: Array<{ value: PickupPoint; label: string }> = [
  { value: "TELEFERICO_MORADO", label: "Teleferico Morado (Faro Murillo, Obelisco)" },
  { value: "TELEFERICO_ROJO", label: "Teleferico Rojo (Estacion Central, 16 de Julio)" },
  { value: "CORREOS", label: "Correos" },
];

const PAYMENT_OPTIONS: Array<{ value: PaymentMethod; label: string; description: string }> = [
  { value: "EFECTIVO", label: "Efectivo", description: "Pago coordinado al momento de la entrega o retiro." },
  { value: "QR", label: "QR", description: "Pago por QR coordinado durante la confirmacion del pedido." },
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

export default function CheckoutPageClient() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const { items, totalAmount, totalItems, updateQuantity, removeItem, clearCart } = useReservationCart();
  const [deliveryMethod, setDeliveryMethod] = useState<DeliveryMethod>("WHATSAPP");
  const [pickupPoint, setPickupPoint] = useState<PickupPoint>("TELEFERICO_MORADO");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("EFECTIVO");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const authenticated = status === "authenticated" && session?.user?.role === "CLIENTE";

  function goToLogin() {
    router.push(`/login?callbackUrl=${encodeURIComponent(sanitizeCallbackUrl("/checkout"))}`);
  }

  function validateForm() {
    const normalizedPhone = phone.replace(/\D/g, "");

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

    if (deliveryMethod === "PICKUP_LAPAZ" && normalizedPhone.length < 8) {
      return "Ingresa un celular valido para coordinar la entrega en La Paz.";
    }

    if (deliveryMethod === "HOME_DELIVERY") {
      if (!address.trim()) {
        return "Ingresa la direccion exacta para la entrega en casa.";
      }

      if (normalizedPhone.length < 8) {
        return "Ingresa un celular valido para la entrega en casa.";
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

    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items,
          paymentMethod,
          delivery: {
            method: deliveryMethod,
            pickupPoint: deliveryMethod === "PICKUP_LAPAZ" ? pickupPoint : null,
            phone: deliveryMethod === "WHATSAPP" ? "" : phone,
            address: deliveryMethod === "HOME_DELIVERY" ? address : "",
          },
        }),
      });

      const data = (await response.json()) as CheckoutSubmitResponse;

      if (!response.ok || !data.ok) {
        setError(data.message ?? "No pude completar tu pedido en este momento.");
        setLoading(false);
        return;
      }

      clearCart();

      if (data.whatsappUrl) {
        window.open(data.whatsappUrl, "_blank", "noopener,noreferrer");
      }

      router.push(data.orderId ? `/pedidos/${data.orderId}` : "/pedidos");
      router.refresh();
    } catch {
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
              Revisa tu pedido, elige la entrega y confirma. Cuando termines, la compra se guardara en tu historial.
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

              {deliveryMethod === "PICKUP_LAPAZ" && (
                <div className="mt-4 space-y-3">
                  <div>
                    <label className="text-xs uppercase block mb-2" style={{ letterSpacing: "0.14em", color: "#8f8478" }}>
                      Punto de entrega
                    </label>
                    <select
                      value={pickupPoint}
                      onChange={(event) => setPickupPoint(event.target.value as PickupPoint)}
                      className="w-full border px-4 py-3 text-sm"
                      style={{ borderColor: "#ddd3c8", background: "#ffffff" }}
                    >
                      {PICKUP_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs uppercase block mb-2" style={{ letterSpacing: "0.14em", color: "#8f8478" }}>
                      Celular de contacto
                    </label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(event) => setPhone(event.target.value)}
                      placeholder="76543210"
                      className="w-full border px-4 py-3 text-sm"
                      style={{ borderColor: "#ddd3c8", background: "#ffffff" }}
                    />
                  </div>
                </div>
              )}

              {deliveryMethod === "HOME_DELIVERY" && (
                <div className="mt-4 space-y-3">
                  <div>
                    <label className="text-xs uppercase block mb-2" style={{ letterSpacing: "0.14em", color: "#8f8478" }}>
                      Direccion exacta
                    </label>
                    <textarea
                      value={address}
                      onChange={(event) => setAddress(event.target.value)}
                      rows={4}
                      placeholder="Zona, calle, numero de casa o edificio, referencias"
                      className="w-full border px-4 py-3 text-sm resize-none"
                      style={{ borderColor: "#ddd3c8", background: "#ffffff" }}
                    />
                  </div>
                  <div>
                    <label className="text-xs uppercase block mb-2" style={{ letterSpacing: "0.14em", color: "#8f8478" }}>
                      Celular de contacto
                    </label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(event) => setPhone(event.target.value)}
                      placeholder="76543210"
                      className="w-full border px-4 py-3 text-sm"
                      style={{ borderColor: "#ddd3c8", background: "#ffffff" }}
                    />
                  </div>
                </div>
              )}

              {deliveryMethod === "WHATSAPP" && (
                <p className="mt-4 text-xs" style={{ color: "#6f6459" }}>
                  Al confirmar, abriremos un mensaje estructurado al numero +591 76574068 con el detalle completo del pedido.
                </p>
              )}
            </section>

            <section className="border p-5 sm:p-6" style={{ borderColor: "#e6ddd2", background: "rgba(255,255,255,0.95)" }}>
              <p className="text-xs uppercase mb-4" style={{ letterSpacing: "0.16em", color: "#8f8478" }}>
                Metodo de pago
              </p>
              <div className="space-y-3">
                {PAYMENT_OPTIONS.map((option) => (
                  <label
                    key={option.value}
                    className="block border px-4 py-3 cursor-pointer transition-colors"
                    style={{
                      borderColor: paymentMethod === option.value ? "#111111" : "#e6ddd2",
                      background: paymentMethod === option.value ? "#fcfaf7" : "#ffffff",
                    }}
                  >
                    <div className="flex items-start gap-3">
                      <input
                        type="radio"
                        name="payment-method"
                        value={option.value}
                        checked={paymentMethod === option.value}
                        onChange={() => setPaymentMethod(option.value)}
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
