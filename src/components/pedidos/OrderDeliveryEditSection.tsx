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
import { normalizePhone, compactText, removeAccents } from "@/lib/text";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

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

  const normalizedScheduledAt = removeAccents(scheduledAt);
  const timeMatch = scheduledAt.match(/\b\d{2}:\d{2}\b/);
  const pickupTime = timeMatch?.[0] ?? "";

  const schedule = config.pickupSchedules.find((option) => {
    if (!normalizedScheduledAt.includes(removeAccents(option.day))) return false;
    if (!pickupTime) return true;
    return getPickupScheduleTimeSlots(option.id, config).includes(pickupTime);
  });

  return {
    pickupScheduleId: schedule?.id ?? "",
    pickupTime,
  };
}

/**
 * Component to edit the delivery details of an existing order.
 * Only accessible if the order is in a state that allows editing.
 */
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

  function validateForm() {
    if (optionsLoading) {
      return "Espera a que terminen de cargar las opciones de entrega.";
    }

    if (delivery?.method === "PICKUP_POINT") {
      if (!address.trim()) return "Selecciona un punto de encuentro.";
      if (normalizePhone(phone).length < 8) return "Ingresa un celular valido para coordinar la entrega.";
      if (!pickupScheduleId || !pickupTime) return "Selecciona un horario valido para la entrega.";
    }

    if (delivery?.method === "SHIPPING_NATIONAL") {
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

    const scheduledAtValue =
      delivery?.method === "PICKUP_POINT"
        ? [getPickupScheduleById(pickupScheduleId, deliveryConfig)?.day, pickupTime].filter(Boolean).join(" ")
        : undefined;

    const deliverySnapshot =
      delivery?.method === "PICKUP_POINT"
        ? {
            method: "PICKUP_POINT",
            address: address.trim(),
            phone: normalizePhone(phone),
            recipientName: compactText(recipientName),
            scheduledAt: compactText(scheduledAtValue),
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
    <Card className="space-y-6">
      <header className="flex justify-between items-start">
        <div>
          <p className="text-[10px] uppercase tracking-[0.16em] text-subtle mb-1">
            Editar entrega
          </p>
          <p className="text-sm text-muted max-w-md">
            Puedes actualizar los datos mientras el pedido siga pendiente (max. 30 min).
          </p>
        </div>
        <Badge variant="warning">Editable</Badge>
      </header>

      {optionsError && (
        <div className="border border-danger/20 bg-danger/5 px-4 py-3 text-xs text-danger">
          {optionsError}
        </div>
      )}

      {delivery?.method === "PICKUP_POINT" && (
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Select
              label="Punto de encuentro"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              options={pickupPointOptions.map(p => ({ value: p.name, label: p.name }))}
            />
          </div>
          <Input
            label="Celular de contacto"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
          <Input
            label="Nombre de quien recibe"
            value={recipientName}
            onChange={(e) => setRecipientName(e.target.value)}
          />
          <Select
            label="Dia disponible"
            value={pickupScheduleId}
            onChange={(e) => setPickupScheduleId(e.target.value)}
            options={pickupScheduleOptions.map(s => ({ value: s.id, label: s.label }))}
          />
          <Select
            label="Hora especifica"
            value={pickupTime}
            onChange={(e) => setPickupTime(e.target.value)}
            options={pickupTimeOptions.map(t => ({ value: t, label: t }))}
          />
        </div>
      )}

      {delivery?.method === "SHIPPING_NATIONAL" && (
        <div className="grid gap-4 sm:grid-cols-2">
          <Select
            label="Departamento"
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
            options={shippingDepartments.map(d => ({ value: d, label: d }))}
          />
          <Input
            label="Ciudad"
            value={city}
            onChange={(e) => setCity(e.target.value)}
          />
          <Select
            label="Empresa de envio"
            value={shippingCompany}
            onChange={(e) => setShippingCompany(e.target.value)}
            options={shippingCompanies.map(c => ({ value: c.name, label: c.name }))}
          />
          <Select
            label="Sucursal o terminal"
            value={branch}
            onChange={(e) => setBranch(e.target.value)}
            options={shippingBranches.map(b => ({ value: b, label: b }))}
          />
          <Input
            label="Nombre del destinatario"
            value={recipientName}
            onChange={(e) => setRecipientName(e.target.value)}
          />
          <Input
            label="Nombre del remitente"
            value={senderName}
            onChange={(e) => setSenderName(e.target.value)}
          />
          <Input
            label="CI del remitente"
            value={senderCI}
            onChange={(e) => setSenderCI(e.target.value)}
          />
          <Input
            label="Celular del remitente"
            type="tel"
            value={senderPhone}
            onChange={(e) => setSenderPhone(e.target.value)}
          />
        </div>
      )}

      {message && (
        <div className="border border-success/20 bg-success/5 px-4 py-3 text-xs text-success">
          {message}
        </div>
      )}

      {error && (
        <div className="border border-danger/20 bg-danger/5 px-4 py-3 text-xs text-danger">
          {error}
        </div>
      )}

      <footer className="pt-2">
        <Button
          variant="primary"
          onClick={handleSaveDelivery}
          disabled={saving || optionsLoading}
          loading={saving}
          className="w-full sm:w-auto"
        >
          Guardar entrega
        </Button>
      </footer>
    </Card>
  );
}
