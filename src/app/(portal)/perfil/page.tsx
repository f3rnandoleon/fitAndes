"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";

interface CustomerProfile {
  telefono?: string;
  tipoDocumento?: string;
  numeroDocumento?: string;
  notas?: string;
  metodoEntregaPredeterminado?: string;
}

const DOCUMENT_TYPES = [
  { value: "CI", label: "Cédula de Identidad (CI)" },
  { value: "NIT", label: "NIT (Facturación)" },
  { value: "PASAPORTE", label: "Pasaporte / Extranjero" },
];

const DELIVERY_PREFERENCES = [
  { value: "PICKUP_POINT", label: "Punto de Encuentro en La Paz (Teleférico / Plazas - Gratuito)" },
  { value: "SHIPPING_NATIONAL", label: "Envío Nacional por Courier / Flota (Departamental)" },
];

export default function PerfilPage() {
  const { data: session, update: updateSession } = useSession();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [nombreCompleto, setNombreCompleto] = useState("");
  const [telefono, setTelefono] = useState("");
  const [tipoDocumento, setTipoDocumento] = useState("CI");
  const [numeroDocumento, setNumeroDocumento] = useState("");
  const [metodoEntrega, setMetodoEntrega] = useState("PICKUP_POINT");
  const [notas, setNotas] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadProfile() {
      setLoading(true);
      setError("");
      try {
        const res = await fetch("/api/clientes/me");
        if (!res.ok) throw new Error("No se pudo cargar la información del perfil.");
        const data = await res.json();

        if (!cancelled) {
          const profile: CustomerProfile = data.profile ?? data;
          setNombreCompleto(data.user?.nombreCompleto ?? data.user?.fullname ?? session?.user?.fullname ?? "");
          setTelefono(profile.telefono ?? "");
          setTipoDocumento(profile.tipoDocumento ?? "CI");
          setNumeroDocumento(profile.numeroDocumento ?? "");
          setMetodoEntrega(profile.metodoEntregaPredeterminado ?? "PICKUP_POINT");
          setNotas(profile.notas ?? "");
        }
      } catch (err: unknown) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Error al cargar perfil.");
          setNombreCompleto(session?.user?.fullname ?? "");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadProfile();

    return () => {
      cancelled = true;
    };
  }, [session]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const res = await fetch("/api/clientes/me", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombreCompleto: nombreCompleto.trim(),
          telefono: telefono.trim(),
          tipoDocumento,
          numeroDocumento: numeroDocumento.trim(),
          metodoEntregaPredeterminado: metodoEntrega,
          notas: notas.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "No se pudo actualizar el perfil.");
      }

      setSuccess("¡Perfil y preferencias actualizadas correctamente!");
      if (updateSession) {
        void updateSession();
      }
      setTimeout(() => setSuccess(""), 4000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Ocurrió un error al guardar.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <p className="text-[10px] uppercase tracking-[0.22em] text-subtle mb-1">
          Ajustes de cuenta
        </p>
        <h1
          className="text-3xl sm:text-4xl text-foreground font-serif"
          style={{ fontFamily: "var(--font-serif, Georgia, serif)", fontWeight: 400 }}
        >
          Mi Perfil
        </h1>
        <p className="text-sm text-muted mt-1 leading-relaxed">
          Mantén tus datos y preferencias actualizados para agilizar la entrega de tus encomiendas y pedidos en La Paz y todo el país.
        </p>
      </div>

      <Card className="p-6 sm:p-8 space-y-6 bg-white">
        {loading ? (
          <div className="py-12 text-center text-subtle animate-pulse text-sm">
            Cargando tus datos...
          </div>
        ) : (
          <form onSubmit={handleSave} className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Input
                  label="Nombre completo"
                  type="text"
                  value={nombreCompleto}
                  onChange={(e) => setNombreCompleto(e.target.value)}
                  placeholder="Tu nombre y apellido"
                  required
                />
                <p className="text-[10px] text-muted mt-1">
                  Utilizado para rotular tus pedidos y coordinar las entregas.
                </p>
              </div>

              <div className="sm:col-span-2">
                <label className="text-xs uppercase tracking-wider text-subtle block mb-1.5">
                  Correo electrónico
                </label>
                <input
                  type="email"
                  value={session?.user?.email ?? ""}
                  disabled
                  className="w-full border border-border/80 bg-surface/60 rounded px-3.5 py-2.5 text-sm text-muted cursor-not-allowed"
                />
                <p className="text-[10px] text-muted mt-1">
                  Tu correo es el identificador principal de tu cuenta.
                </p>
              </div>

              <div>
                <Input
                  label="Celular de contacto (WhatsApp)"
                  type="tel"
                  placeholder="ej. 76543210"
                  value={telefono}
                  onChange={(e) => setTelefono(e.target.value)}
                  required
                />
                <p className="text-[10px] text-muted mt-1">
                  Para confirmar recojos y guías de encomienda.
                </p>
              </div>

              <div>
                <Select
                  label="Tipo de documento"
                  value={tipoDocumento}
                  onChange={(e) => setTipoDocumento(e.target.value)}
                  options={DOCUMENT_TYPES}
                />
              </div>

              <div className="sm:col-span-2">
                <Input
                  label="Número de documento de identidad (CI / NIT)"
                  placeholder="ej. 6543210 LP"
                  value={numeroDocumento}
                  onChange={(e) => setNumeroDocumento(e.target.value)}
                  required
                />
                <p className="text-[10px] text-muted mt-1">
                  Requerido por las empresas de transporte interdepartamental para retirar encomiendas.
                </p>
              </div>

              <div className="sm:col-span-2">
                <Select
                  label="Método de entrega preferido"
                  value={metodoEntrega}
                  onChange={(e) => setMetodoEntrega(e.target.value)}
                  options={DELIVERY_PREFERENCES}
                />
                <p className="text-[10px] text-muted mt-1">
                  Preseleccionaremos automáticamente esta opción al realizar tus compras en el checkout.
                </p>
              </div>

              <div className="sm:col-span-2">
                <label className="text-xs uppercase tracking-wider text-subtle block mb-1.5">
                  Notas habituales de entrega (opcional)
                </label>
                <textarea
                  rows={3}
                  value={notas}
                  onChange={(e) => setNotas(e.target.value)}
                  placeholder="ej. Dejar en portería, coordinar 15 min antes de llegar..."
                  className="w-full border border-border rounded px-3.5 py-2.5 text-sm placeholder:text-subtle/50 focus:outline-none focus:ring-1 focus:ring-foreground/20 bg-background"
                />
              </div>
            </div>

            {error && (
              <div className="border border-red-200 bg-red-50 p-3 rounded text-xs text-red-700">
                {error}
              </div>
            )}

            {success && (
              <div className="border border-green-200 bg-green-50 p-3 rounded text-xs text-green-700">
                {success}
              </div>
            )}

            <div className="pt-2 flex justify-end">
              <Button
                type="submit"
                variant="primary"
                loading={saving}
                disabled={saving}
                className="w-full sm:w-auto px-6"
              >
                Guardar cambios
              </Button>
            </div>
          </form>
        )}
      </Card>
    </div>
  );
}
