"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  EMPTY_DELIVERY_OPTIONS,
  getPickupScheduleById,
  getPickupScheduleTimeSlots,
  getShippingBranches,
  getShippingCompaniesByDepartment,
  getShippingDepartments,
} from "@/lib/delivery-options";
import type { DeliveryOptionsConfig } from "@/types/checkout";
import { canPedidoBeEditedByClient, getPedidoDelivery, type Pedido } from "@/types/pedidos";

function normalizePhone(phone?: string | null) {
  return (phone ?? "").replace(/\D/g, "").trim();
}

function compactText(value?: string | null) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

function normalizeText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function mergeStringOptions(options: string[], currentValue: string) {
  if (!currentValue || options.includes(currentValue)) return options;
  return [currentValue, ...options];
}

function mergeNamedOptions<T extends { name: string }>(options: T[], currentValue: string, factory: (name: string) => T) {
  if (!currentValue || options.some((option) => option.name === currentValue)) return options;
  return [factory(currentValue), ...options];
}

function resolvePickupSelection(scheduledAt: string | null | undefined, config: DeliveryOptionsConfig) {
  if (!scheduledAt) return { pickupScheduleId: "", pickupTime: "" };

  const normalizedScheduledAt = normalizeText(scheduledAt);
  const timeMatch = scheduledAt.match(/\b\d{2}:\d{2}\b/);
  const pickupTime = timeMatch?.[0] ?? "";

  const schedule = config.pickupSchedules.find((option) => {
    if (!normalizedScheduledAt.includes(normalizeText(option.day))) return false;
    if (!pickupTime) return true;
    return getPickupScheduleTimeSlots(option.id, config).includes(pickupTime);
  });

  return {
    pickupScheduleId: schedule?.id ?? "",
    pickupTime,
  };
}

export default function OrderDeliveryEditSection({ pedido }: { pedido: Pedido }) {
  const router = useRouter();
  const delivery = getPedidoDelivery(pedido);
  const canEdit = canPedidoBeEditedByClient(pedido);

  const [deliveryConfig, setDeliveryConfig] = useState<DeliveryOptionsConfig>(EMPTY_DELIVERY_OPTIONS);
  const [optionsLoading, setOptionsLoading] = useState(false);
  const [optionsError, setOptionsError] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const [address, setAddress] = useState(delivery?.address ?? "");
  const [phone, setPhone] = useState(delivery?.phone ?? "");
  const [recipientName, setRecipientName] = useState(delivery?.recipientName ?? "");
  const [pickupScheduleId, setPickupScheduleId] = useState("");
  const [pickupTime, setPickupTime] = useState("");
  const [department, setDepartment] = useState(delivery?.department ?? "");
  const [city, setCity] = useState(delivery?.city ?? "");
  const [shippingCompany, setShippingCompany] = useState(delivery?.shippingCompany ?? "");
  const [branch, setBranch] = useState(delivery?.branch ?? "");
  const [senderName, setSenderName] = useState(delivery?.senderName ?? "FitAndes");
  const [senderCI, setSenderCI] = useState(delivery?.senderCI ?? "");
  const [senderPhone, setSenderPhone] = useState(delivery?.senderPhone ?? "");

  const pickupPointOptions = useMemo(
    () => mergeNamedOptions(deliveryConfig.pickupPoints, address, (name) => ({ id: `current-${name}`, name })),
    [address, deliveryConfig.pickupPoints],
  );
  const pickupScheduleOptions = deliveryConfig.pickupSchedules;
  const pickupTimeOptions = useMemo(() => {
    const base = getPickupScheduleTimeSlots(pickupScheduleId, deliveryConfig);
    return mergeStringOptions(base, pickupTime);
  }, [deliveryConfig, pickupScheduleId, pickupTime]);
  const shippingDepartments = useMemo(
    () => mergeStringOptions(getShippingDepartments(deliveryConfig), department),
    [deliveryConfig, department],
  );
  const shippingCompanies = useMemo(
    () =>
      mergeNamedOptions(
        getShippingCompaniesByDepartment(department, deliveryConfig),
        shippingCompany,
        (name) => ({ id: `current-${name}`, name, departments: [] }),
      ),
    [deliveryConfig, department, shippingCompany],
  );
  const shippingBranches = useMemo(
    () => mergeStringOptions(getShippingBranches(department, shippingCompany, deliveryConfig), branch),
    [branch, deliveryConfig, department, shippingCompany],
  );

  useEffect(() => {
    if (!canEdit || !delivery?.method || delivery.method === "WHATSAPP") {
      return;
    }

    let cancelled = false;
    setOptionsLoading(true);
    setOptionsError("");

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
          setOptionsError(fetchError instanceof Error ? fetchError.message : "No pude cargar las opciones de entrega.");
          setDeliveryConfig(EMPTY_DELIVERY_OPTIONS);
        }
      })
      .finally(() => {
        if (!cancelled) setOptionsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [canEdit, delivery?.method]);

  useEffect(() => {
    if (delivery?.method !== "PICKUP_POINT" || deliveryConfig.pickupSchedules.length === 0) return;

    const selection = resolvePickupSelection(delivery.scheduledAt, deliveryConfig);
    if (!pickupScheduleId && selection.pickupScheduleId) {
      setPickupScheduleId(selection.pickupScheduleId);
    }
    if (!pickupTime && selection.pickupTime) {
      setPickupTime(selection.pickupTime);
    }
  }, [delivery, deliveryConfig, pickupScheduleId, pickupTime]);

  useEffect(() => {
    if (delivery?.method !== "PICKUP_POINT") return;

    if (!pickupPointOptions.some((option) => option.name === address)) {
      setAddress(pickupPointOptions[0]?.name ?? "");
    }

    if (!pickupScheduleOptions.some((option) => option.id === pickupScheduleId)) {
      setPickupScheduleId(pickupScheduleOptions[0]?.id ?? "");
    }
  }, [address, delivery?.method, pickupPointOptions, pickupScheduleId, pickupScheduleOptions]);

  useEffect(() => {
    if (delivery?.method !== "PICKUP_POINT") return;
    if (!pickupTimeOptions.includes(pickupTime)) {
      setPickupTime(pickupTimeOptions[0] ?? "");
    }
  }, [delivery?.method, pickupTime, pickupTimeOptions]);

  useEffect(() => {
    if (delivery?.method !== "SHIPPING_NATIONAL") return;
    if (!shippingDepartments.includes(department)) {
      setDepartment(shippingDepartments[0] ?? "");
    }
  }, [delivery?.method, department, shippingDepartments]);

  useEffect(() => {
    if (delivery?.method !== "SHIPPING_NATIONAL") return;
    if (!shippingCompanies.some((option) => option.name === shippingCompany)) {
      setShippingCompany(shippingCompanies[0]?.name ?? "");
    }
  }, [delivery?.method, shippingCompanies, shippingCompany]);

  useEffect(() => {
    if (delivery?.method !== "SHIPPING_NATIONAL") return;
    if (!shippingBranches.includes(branch)) {
      setBranch(shippingBranches[0] ?? "");
    }
  }, [branch, delivery?.method, shippingBranches]);

  if (!delivery?.method || !canEdit) {
    return null;
  }

  if (delivery.method === "WHATSAPP") {
    return null;
  }

  if (delivery.method !== "PICKUP_POINT" && delivery.method !== "SHIPPING_NATIONAL") {
    return null;
  }

  const editableDelivery = delivery;

  function validateForm() {
    if (optionsLoading) {
      return "Espera a que terminen de cargar las opciones de entrega.";
    }

    if (editableDelivery.method === "PICKUP_POINT") {
      if (!address.trim()) return "Selecciona un punto de encuentro.";
      if (normalizePhone(phone).length < 8) return "Ingresa un celular valido para coordinar la entrega.";
      if (!pickupScheduleId || !pickupTime) return "Selecciona un horario valido para la entrega.";
    }

    if (editableDelivery.method === "SHIPPING_NATIONAL") {
      if (!department.trim() || !shippingCompany.trim()) {
        return "Selecciona departamento y empresa de envio.";
      }
      if (!compactText(senderName) || !compactText(senderCI)) {
        return "Completa nombre y CI del remitente.";
      }
      if (normalizePhone(senderPhone).length < 8) {
        return "Ingresa un celular valido del remitente.";
      }
    }

    return "";
  }

  async function handleSaveDelivery() {
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      setMessage("");
      return;
    }

    setSaving(true);
    setError("");
    setMessage("");

    const scheduledAt =
      editableDelivery.method === "PICKUP_POINT"
        ? [getPickupScheduleById(pickupScheduleId, deliveryConfig)?.day, pickupTime].filter(Boolean).join(" ")
        : undefined;

    const deliverySnapshot =
      editableDelivery.method === "PICKUP_POINT"
        ? {
            method: "PICKUP_POINT",
            address: address.trim(),
            phone: normalizePhone(phone),
            recipientName: compactText(recipientName),
            scheduledAt: compactText(scheduledAt),
          }
        : {
            method: "SHIPPING_NATIONAL",
            department: department.trim(),
            city: compactText(city),
            shippingCompany: shippingCompany.trim(),
            branch: compactText(branch),
            recipientName: compactText(recipientName),
            senderName: compactText(senderName),
            senderCI: senderCI.trim(),
            senderPhone: normalizePhone(senderPhone),
          };

    try {
      const response = await fetch(`/api/orders/${pedido._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deliverySnapshot }),
      });

      const data = (await response.json().catch(() => null)) as { message?: string } | null;
      if (!response.ok) {
        setError(data?.message ?? "No pude actualizar la entrega.");
        setSaving(false);
        return;
      }

      setMessage("Datos de entrega actualizados correctamente.");
      router.refresh();
    } catch {
      setError("Ocurrio un problema al actualizar la entrega.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="border p-5 space-y-4" style={{ borderColor: "var(--border)", background: "var(--surface)" }}>
      <div>
        <p className="text-xs uppercase mb-2" style={{ letterSpacing: "0.14em", color: "var(--subtle)" }}>
          Editar entrega
        </p>
        <p className="text-sm" style={{ color: "var(--muted)" }}>
          Puedes actualizar los datos de entrega mientras el pedido siga pendiente y dentro de los primeros 30 minutos.
        </p>
      </div>

      {optionsError ? (
        <p className="border px-4 py-3 text-sm" style={{ borderColor: "#d9b2ac", background: "#f6e8e5", color: "#8b3f36" }}>
          {optionsError}
        </p>
      ) : null}

      {editableDelivery.method === "PICKUP_POINT" ? (
        <div className="space-y-3">
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
              className="w-full border px-4 py-3 text-sm"
              style={{ borderColor: "#ddd3c8", background: "#ffffff" }}
            />
          </Field>
          <Field label="Nombre de quien recibe">
            <input
              type="text"
              value={recipientName}
              onChange={(event) => setRecipientName(event.target.value)}
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

      {editableDelivery.method === "SHIPPING_NATIONAL" ? (
        <div className="space-y-3">
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
          <Field label="Ciudad">
            <input
              type="text"
              value={city}
              onChange={(event) => setCity(event.target.value)}
              className="w-full border px-4 py-3 text-sm"
              style={{ borderColor: "#ddd3c8", background: "#ffffff" }}
            />
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
          <Field label="Nombre del destinatario">
            <input
              type="text"
              value={recipientName}
              onChange={(event) => setRecipientName(event.target.value)}
              className="w-full border px-4 py-3 text-sm"
              style={{ borderColor: "#ddd3c8", background: "#ffffff" }}
            />
          </Field>
          <Field label="Nombre del remitente">
            <input
              type="text"
              value={senderName}
              onChange={(event) => setSenderName(event.target.value)}
              className="w-full border px-4 py-3 text-sm"
              style={{ borderColor: "#ddd3c8", background: "#ffffff" }}
            />
          </Field>
          <Field label="CI del remitente">
            <input
              type="text"
              value={senderCI}
              onChange={(event) => setSenderCI(event.target.value)}
              className="w-full border px-4 py-3 text-sm"
              style={{ borderColor: "#ddd3c8", background: "#ffffff" }}
            />
          </Field>
          <Field label="Celular del remitente">
            <input
              type="tel"
              value={senderPhone}
              onChange={(event) => setSenderPhone(event.target.value)}
              className="w-full border px-4 py-3 text-sm"
              style={{ borderColor: "#ddd3c8", background: "#ffffff" }}
            />
          </Field>
        </div>
      ) : null}

      {message ? (
        <p className="border px-4 py-3 text-sm" style={{ borderColor: "#c5d8c9", background: "#e7efe9", color: "#2f6b43" }}>
          {message}
        </p>
      ) : null}

      {error ? (
        <p className="border px-4 py-3 text-sm" style={{ borderColor: "#d9b2ac", background: "#f6e8e5", color: "#8b3f36" }}>
          {error}
        </p>
      ) : null}

      <button
        type="button"
        onClick={handleSaveDelivery}
        disabled={saving || optionsLoading}
        className="inline-flex items-center justify-center bg-[#111111] px-5 py-3 text-xs uppercase text-white transition-opacity hover:opacity-85 disabled:cursor-not-allowed disabled:opacity-60"
        style={{ letterSpacing: "0.16em" }}
      >
        {saving ? "Guardando..." : "Guardar entrega"}
      </button>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-xs uppercase block mb-2" style={{ letterSpacing: "0.14em", color: "var(--subtle)" }}>
        {label}
      </label>
      {children}
    </div>
  );
}
