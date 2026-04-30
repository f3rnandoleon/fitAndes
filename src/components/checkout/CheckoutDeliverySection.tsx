"use client";

import { DeliveryMethod, DeliveryOptionsConfig } from "@/types/checkout";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { 
  getPickupScheduleById, 
  getPickupScheduleTimeSlots, 
  getShippingDepartments, 
  getShippingCompaniesByDepartment, 
  getShippingBranches 
} from "@/lib/delivery-options";

interface Props {
  method: DeliveryMethod;
  setMethod: (method: DeliveryMethod) => void;
  config: DeliveryOptionsConfig;
  loading: boolean;
  error?: string;
  
  // Form fields
  address: string;
  setAddress: (v: string) => void;
  phone: string;
  setPhone: (v: string) => void;
  recipientName: string;
  setRecipientName: (v: string) => void;
  pickupScheduleId: string;
  setPickupScheduleId: (v: string) => void;
  pickupTime: string;
  setPickupTime: (v: string) => void;
  department: string;
  setDepartment: (v: string) => void;
  shippingCompany: string;
  setShippingCompany: (v: string) => void;
  branch: string;
  setBranch: (v: string) => void;
  senderCI: string;
  setSenderCI: (v: string) => void;
  senderPhone: string;
  setSenderPhone: (v: string) => void;
}

const DELIVERY_OPTIONS: Array<{ value: DeliveryMethod; label: string; description: string }> = [
  {
    value: "WHATSAPP",
    label: "WhatsApp",
    description: "Enviar mensaje listo para coordinar entrega directamente.",
  },
  {
    value: "PICKUP_POINT",
    label: "Punto de encuentro (La Paz)",
    description: "Entrega directa en puntos habilitados en la ciudad.",
  },
  {
    value: "SHIPPING_NATIONAL",
    label: "Envio nacional",
    description: "Envio a otro departamento mediante encomienda (Pago QR requerido).",
  },
];

export function CheckoutDeliverySection(props: Props) {
  const {
    method, setMethod, config, loading, error,
    address, setAddress, phone, setPhone, recipientName, setRecipientName,
    pickupScheduleId, setPickupScheduleId, pickupTime, setPickupTime,
    department, setDepartment, shippingCompany, setShippingCompany,
    branch, setBranch, senderCI, setSenderCI, senderPhone, setSenderPhone
  } = props;

  const pickupPointOptions = config.pickupPoints;
  const pickupScheduleOptions = config.pickupSchedules;
  const pickupTimeOptions = getPickupScheduleTimeSlots(pickupScheduleId, config);
  const shippingDepartments = getShippingDepartments(config);
  const shippingCompanies = getShippingCompaniesByDepartment(department, config);
  const shippingBranches = getShippingBranches(department, shippingCompany, config);

  return (
    <Card className="space-y-6">
      <div>
        <p className="text-[10px] uppercase tracking-[0.16em] text-subtle mb-4">
          Metodo de entrega
        </p>
        <div className="space-y-3">
          {DELIVERY_OPTIONS.map((option) => (
            <label
              key={option.value}
              className={`block border px-4 py-3 cursor-pointer transition-colors ${
                method === option.value ? "border-foreground bg-surface/30" : "border-border bg-white"
              }`}
            >
              <div className="flex items-start gap-3">
                <input
                  type="radio"
                  name="delivery-method"
                  value={option.value}
                  checked={method === option.value}
                  onChange={() => setMethod(option.value)}
                  className="mt-1 accent-foreground"
                />
                <div>
                  <p className="text-sm font-medium text-foreground">{option.label}</p>
                  <p className="text-xs mt-1 text-muted">{option.description}</p>
                </div>
              </div>
            </label>
          ))}
        </div>
      </div>

      {loading && (
        <p className="text-[11px] text-subtle animate-pulse">
          Cargando opciones de entrega del sistema central...
        </p>
      )}

      {error && (
        <div className="border border-danger/20 bg-danger/5 px-4 py-3 text-xs text-danger">
          {error}
        </div>
      )}

      {method === "PICKUP_POINT" && (
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
            placeholder="76543210"
          />
          <Input
            label="Nombre de quien recibe"
            value={recipientName}
            onChange={(e) => setRecipientName(e.target.value)}
            placeholder="Opcional"
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

      {method === "SHIPPING_NATIONAL" && (
        <div className="grid gap-4 sm:grid-cols-2">
          <Select
            label="Departamento"
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
            options={shippingDepartments.map(d => ({ value: d, label: d }))}
          />
          <Select
            label="Empresa de envio"
            value={shippingCompany}
            onChange={(e) => setShippingCompany(e.target.value)}
            options={shippingCompanies.map(c => ({ value: c.name, label: c.name }))}
          />
          <div className="sm:col-span-2">
            <Select
              label="Sucursal o terminal"
              value={branch}
              onChange={(e) => setBranch(e.target.value)}
              options={shippingBranches.map(b => ({ value: b, label: b }))}
            />
          </div>
          <Input
            label="Nombre del destinatario"
            value={recipientName}
            onChange={(e) => setRecipientName(e.target.value)}
            placeholder="Quien recibe el paquete"
          />
          <Input
            label="CI del destinatario"
            value={senderCI}
            onChange={(e) => setSenderCI(e.target.value)}
            placeholder="12345678"
          />
          <div className="sm:col-span-2">
            <Input
              label="Celular del destinatario"
              type="tel"
              value={senderPhone}
              onChange={(e) => setSenderPhone(e.target.value)}
              placeholder="76543210"
            />
          </div>
        </div>
      )}

      {method === "WHATSAPP" && (
        <p className="text-[11px] text-muted leading-relaxed">
          Al confirmar, abriremos un mensaje estructurado con el detalle de tu pedido para coordinar el pago y la entrega. El stock quedara reservado temporalmente.
        </p>
      )}
    </Card>
  );
}
