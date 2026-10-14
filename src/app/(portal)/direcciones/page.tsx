"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Badge } from "@/components/ui/Badge";

export interface SavedAddress {
  _id: string;
  alias?: string;
  nombreDestinatario: string;
  telefono: string;
  departamento: string;
  ciudad?: string;
  direccion: string;
  referencia?: string;
  esPredeterminada?: boolean;
}

const DEPARTAMENTOS_BOLIVIA = [
  { value: "La Paz", label: "La Paz" },
  { value: "Cochabamba", label: "Cochabamba" },
  { value: "Santa Cruz", label: "Santa Cruz" },
  { value: "Oruro", label: "Oruro" },
  { value: "Potosí", label: "Potosí" },
  { value: "Chuquisaca", label: "Chuquisaca (Sucre)" },
  { value: "Tarija", label: "Tarija" },
  { value: "Beni", label: "Beni" },
  { value: "Pando", label: "Pando" },
];

export default function DireccionesPage() {
  const [direcciones, setDirecciones] = useState<SavedAddress[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form fields
  const [alias, setAlias] = useState("Casa");
  const [nombreDestinatario, setNombreDestinatario] = useState("");
  const [telefono, setTelefono] = useState("");
  const [departamento, setDepartamento] = useState("La Paz");
  const [ciudad, setCiudad] = useState("La Paz");
  const [direccion, setDireccion] = useState("");
  const [referencia, setReferencia] = useState("");
  const [esPredeterminada, setEsPredeterminada] = useState(false);

  async function loadAddresses() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/clientes/me/direcciones");
      if (!res.ok) throw new Error("No pude cargar tus direcciones.");
      const data = await res.json();
      setDirecciones(Array.isArray(data) ? data : []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error al cargar direcciones.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAddresses();
  }, []);

  function handleOpenNew() {
    setEditingId(null);
    setAlias("Casa");
    setNombreDestinatario("");
    setTelefono("");
    setDepartamento("La Paz");
    setCiudad("La Paz");
    setDireccion("");
    setReferencia("");
    setEsPredeterminada(direcciones.length === 0);
    setError("");
    setModalOpen(true);
  }

  function handleOpenEdit(dir: SavedAddress) {
    setEditingId(dir._id);
    setAlias(dir.alias ?? "Casa");
    setNombreDestinatario(dir.nombreDestinatario);
    setTelefono(dir.telefono);
    setDepartamento(dir.departamento);
    setCiudad(dir.ciudad ?? dir.departamento);
    setDireccion(dir.direccion);
    setReferencia(dir.referencia ?? "");
    setEsPredeterminada(Boolean(dir.esPredeterminada));
    setError("");
    setModalOpen(true);
  }

  async function handleSaveAddress(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");

    const payload = {
      alias: alias.trim(),
      nombreDestinatario: nombreDestinatario.trim(),
      telefono: telefono.trim(),
      departamento,
      ciudad: ciudad.trim() || departamento,
      direccion: direccion.trim(),
      referencia: referencia.trim(),
      esPredeterminada,
    };

    try {
      const url = editingId
        ? `/api/clientes/me/direcciones/${editingId}`
        : "/api/clientes/me/direcciones";
      const method = editingId ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "No pude guardar la dirección.");

      setModalOpen(false);
      setSuccess(editingId ? "Dirección actualizada correctamente." : "Dirección guardada exitosamente.");
      setTimeout(() => setSuccess(""), 4000);
      loadAddresses();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error al guardar dirección.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("¿Estás seguro de que deseas eliminar esta dirección?")) return;

    try {
      const res = await fetch(`/api/clientes/me/direcciones/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("No pude eliminar la dirección.");
      setSuccess("Dirección eliminada.");
      setTimeout(() => setSuccess(""), 3000);
      setDirecciones((prev) => prev.filter((d) => d._id !== id));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error al eliminar.");
    }
  }

  async function handleSetDefault(id: string) {
    try {
      const res = await fetch(`/api/clientes/me/direcciones/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ esPredeterminada: true }),
      });
      if (!res.ok) throw new Error("No pude actualizar la dirección predeterminada.");
      setSuccess("Dirección predeterminada actualizada.");
      setTimeout(() => setSuccess(""), 3000);
      loadAddresses();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error al actualizar.");
    }
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <p className="text-[10px] uppercase tracking-[0.22em] text-subtle mb-1">
            Libreta de entrega
          </p>
          <h1
            className="text-3xl sm:text-4xl text-foreground font-serif"
            style={{ fontFamily: "Georgia, 'Times New Roman', serif", fontWeight: 400 }}
          >
            Mis Direcciones
          </h1>
          <p className="text-sm text-muted mt-1">
            Guarda tus puntos de recojo o agencias de encomienda favoritas para comprar en 1 clic.
          </p>
        </div>

        <Button variant="primary" onClick={handleOpenNew} className="shrink-0">
          + Nueva dirección
        </Button>
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

      {loading ? (
        <div className="py-16 text-center text-subtle animate-pulse text-sm">
          Cargando libreta de direcciones...
        </div>
      ) : direcciones.length === 0 ? (
        <Card className="p-10 text-center space-y-3 bg-white">
          <p className="text-3xl text-subtle">📍</p>
          <p className="text-base font-serif text-foreground">Aún no tienes direcciones guardadas</p>
          <p className="text-xs text-muted max-w-sm mx-auto">
            Agrega tu dirección o agencia de encomienda para no tener que escribir tus datos en cada compra.
          </p>
          <Button variant="outline" size="sm" onClick={handleOpenNew} className="mt-2">
            Agregar mi primera dirección
          </Button>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {direcciones.map((dir) => (
            <Card
              key={dir._id}
              className={`p-5 space-y-4 flex flex-col justify-between transition-all ${
                dir.esPredeterminada ? "border-foreground/40 shadow-sm bg-white" : "border-border bg-white"
              }`}
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-foreground uppercase tracking-wider">
                      {dir.alias || "Dirección"}
                    </span>
                    {dir.esPredeterminada && (
                      <Badge variant="success">Predeterminada</Badge>
                    )}
                  </div>
                  <span className="text-[11px] text-muted font-medium">{dir.departamento}</span>
                </div>

                <div className="pt-2 text-sm text-foreground space-y-1">
                  <p className="font-medium">{dir.nombreDestinatario}</p>
                  <p className="text-xs text-muted">Cel: {dir.telefono}</p>
                  <p className="text-xs text-muted leading-relaxed">
                    {dir.direccion}
                    {dir.ciudad ? `, ${dir.ciudad}` : ""}
                  </p>
                  {dir.referencia && (
                    <p className="text-[11px] text-subtle italic">Ref: {dir.referencia}</p>
                  )}
                </div>
              </div>

              <div className="pt-3 border-t border-border/60 flex items-center justify-between text-xs">
                {!dir.esPredeterminada ? (
                  <button
                    type="button"
                    onClick={() => handleSetDefault(dir._id)}
                    className="text-subtle hover:text-foreground text-[11px] uppercase tracking-wider"
                  >
                    Hacer predeterminada
                  </button>
                ) : (
                  <span />
                )}

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => handleOpenEdit(dir)}
                    className="text-muted hover:text-foreground font-medium"
                  >
                    Editar
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(dir._id)}
                    className="text-red-600 hover:text-red-700 font-medium"
                  >
                    Eliminar
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Modal / Formulario Flotante de Dirección */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-white rounded-2xl shadow-xl border border-border p-6 sm:p-7 space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-border/60 pb-3">
              <h3 className="text-lg font-serif text-foreground">
                {editingId ? "Editar Dirección" : "Nueva Dirección de Entrega"}
              </h3>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="text-muted hover:text-foreground text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveAddress} className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <Input
                    label="Nombre de referencia / Alias (ej. Casa, Oficina, Terminal)"
                    value={alias}
                    onChange={(e) => setAlias(e.target.value)}
                    required
                  />
                </div>

                <div>
                  <Input
                    label="Nombre completo del destinatario"
                    placeholder="Quien retira el paquete"
                    value={nombreDestinatario}
                    onChange={(e) => setNombreDestinatario(e.target.value)}
                    required
                  />
                </div>

                <div>
                  <Input
                    label="Celular de contacto"
                    placeholder="ej. 76543210"
                    type="tel"
                    value={telefono}
                    onChange={(e) => setTelefono(e.target.value)}
                    required
                  />
                </div>

                <div>
                  <Select
                    label="Departamento"
                    value={departamento}
                    onChange={(e) => {
                      setDepartamento(e.target.value);
                      setCiudad(e.target.value);
                    }}
                    options={DEPARTAMENTOS_BOLIVIA}
                  />
                </div>

                <div>
                  <Input
                    label="Ciudad o Municipio"
                    placeholder="ej. La Paz, El Alto, Sacaba"
                    value={ciudad}
                    onChange={(e) => setCiudad(e.target.value)}
                    required
                  />
                </div>

                <div className="sm:col-span-2">
                  <Input
                    label="Dirección o Sucursal de Encomienda"
                    placeholder="ej. Calle 21 de Calacoto #450 o Terminal Central Bolivar"
                    value={direccion}
                    onChange={(e) => setDireccion(e.target.value)}
                    required
                  />
                </div>

                <div className="sm:col-span-2">
                  <Input
                    label="Referencia o detalles adicionales (opcional)"
                    placeholder="ej. Al lado de la farmacia, frente a la plaza"
                    value={referencia}
                    onChange={(e) => setReferencia(e.target.value)}
                  />
                </div>

                <div className="sm:col-span-2 flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="esPredeterminada"
                    checked={esPredeterminada}
                    onChange={(e) => setEsPredeterminada(e.target.checked)}
                    className="rounded border-border text-foreground focus:ring-foreground"
                  />
                  <label htmlFor="esPredeterminada" className="text-xs text-foreground cursor-pointer">
                    Establecer como dirección predeterminada
                  </label>
                </div>
              </div>

              <div className="pt-3 border-t border-border/60 flex justify-end gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setModalOpen(false)}
                  disabled={saving}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  loading={saving}
                  disabled={saving}
                >
                  {editingId ? "Actualizar" : "Guardar dirección"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
