"use client";

import { useEffect, useState } from "react";
import type { DeliveryOptionsConfig } from "@/types/checkout";

function createEmptyConfig(): DeliveryOptionsConfig {
  return {
    pickupPoints: [],
    pickupSchedules: [],
    shippingCompanies: [],
  };
}

function createPickupPoint() {
  return { id: "", name: "" };
}

function createPickupSchedule() {
  return { id: "", day: "", start: "10:00", end: "14:00", label: "" };
}

function createShippingCompany() {
  return {
    id: "",
    name: "",
    departments: [],
  };
}

function createShippingDepartment() {
  return {
    name: "",
    branches: [""],
  };
}

export default function DeliveryOptionsAdmin() {
  const [config, setConfig] = useState<DeliveryOptionsConfig>(createEmptyConfig());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadConfig() {
      setLoading(true);
      setError("");

      try {
        const response = await fetch("/api/admin/delivery-options", { cache: "no-store" });
        const data = (await response.json().catch(() => null)) as DeliveryOptionsConfig | { message?: string } | null;

        if (!response.ok) {
          throw new Error((data && "message" in data && data.message) || "No pude cargar la configuracion.");
        }

        if (!cancelled) {
          setConfig((data as DeliveryOptionsConfig) ?? createEmptyConfig());
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : "No pude cargar la configuracion.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadConfig();

    return () => {
      cancelled = true;
    };
  }, []);

  async function handleSave() {
    setSaving(true);
    setError("");
    setMessage("");

    try {
      const response = await fetch("/api/admin/delivery-options", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      });

      const data = (await response.json().catch(() => null)) as DeliveryOptionsConfig | { message?: string } | null;

      if (!response.ok) {
        throw new Error((data && "message" in data && data.message) || "No pude guardar la configuracion.");
      }

      setConfig((data as DeliveryOptionsConfig) ?? createEmptyConfig());
      setMessage("Configuracion guardada correctamente.");
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "No pude guardar la configuracion.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="border p-8" style={{ borderColor: "var(--border)", background: "var(--surface)" }}>
        <p className="text-sm" style={{ color: "var(--muted)" }}>
          Cargando configuracion de entrega...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <p className="text-xs uppercase mb-2" style={{ letterSpacing: "0.22em", color: "var(--subtle)" }}>
            Interno
          </p>
          <h1 className="text-4xl" style={{ fontFamily: "Georgia, 'Times New Roman', serif", fontWeight: 400 }}>
            Admin de entregas
          </h1>
          <p className="text-sm mt-2 max-w-2xl" style={{ color: "var(--muted)" }}>
            Aqui puedes editar puntos de encuentro, horarios y opciones de envio. Al guardar, se sincroniza la configuracion
            del sistema central.
          </p>
        </div>

        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center justify-center bg-[#111111] px-5 py-3 text-xs uppercase text-white transition-opacity hover:opacity-85 disabled:cursor-not-allowed disabled:opacity-60"
          style={{ letterSpacing: "0.16em" }}
        >
          {saving ? "Guardando..." : "Guardar cambios"}
        </button>
      </div>

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

      <Section
        title="Puntos de encuentro"
        description="Edita, crea o elimina los puntos que aparecen en el checkout para entrega en La Paz."
        actionLabel="Agregar punto"
        onAdd={() =>
          setConfig((current) => ({
            ...current,
            pickupPoints: [...current.pickupPoints, createPickupPoint()],
          }))
        }
      >
        {config.pickupPoints.map((point, index) => (
          <div key={`pickup-point-${index}`} className="border p-4 space-y-3" style={{ borderColor: "#ece6dc" }}>
            <Field label="Nombre del punto">
              <input
                type="text"
                value={point.name}
                onChange={(event) =>
                  setConfig((current) => ({
                    ...current,
                    pickupPoints: current.pickupPoints.map((item, itemIndex) =>
                      itemIndex === index ? { ...item, name: event.target.value } : item,
                    ),
                  }))
                }
                className="w-full border px-4 py-3 text-sm"
                style={{ borderColor: "#ddd3c8", background: "#ffffff" }}
              />
            </Field>
            <DangerButton
              label="Eliminar punto"
              onClick={() =>
                setConfig((current) => ({
                  ...current,
                  pickupPoints: current.pickupPoints.filter((_, itemIndex) => itemIndex !== index),
                }))
              }
            />
          </div>
        ))}
      </Section>

      <Section
        title="Horarios disponibles"
        description="Cada fila representa un bloque horario editable. El checkout derivara horas especificas desde estos rangos."
        actionLabel="Agregar horario"
        onAdd={() =>
          setConfig((current) => ({
            ...current,
            pickupSchedules: [...current.pickupSchedules, createPickupSchedule()],
          }))
        }
      >
        {config.pickupSchedules.map((schedule, index) => (
          <div key={`pickup-schedule-${index}`} className="border p-4 space-y-3" style={{ borderColor: "#ece6dc" }}>
            <div className="grid gap-3 md:grid-cols-3">
              <Field label="Dia">
                <input
                  type="text"
                  value={schedule.day}
                  onChange={(event) =>
                    setConfig((current) => ({
                      ...current,
                      pickupSchedules: current.pickupSchedules.map((item, itemIndex) =>
                        itemIndex === index ? { ...item, day: event.target.value } : item,
                      ),
                    }))
                  }
                  className="w-full border px-4 py-3 text-sm"
                  style={{ borderColor: "#ddd3c8", background: "#ffffff" }}
                />
              </Field>
              <Field label="Inicio">
                <input
                  type="time"
                  value={schedule.start}
                  onChange={(event) =>
                    setConfig((current) => ({
                      ...current,
                      pickupSchedules: current.pickupSchedules.map((item, itemIndex) =>
                        itemIndex === index ? { ...item, start: event.target.value } : item,
                      ),
                    }))
                  }
                  className="w-full border px-4 py-3 text-sm"
                  style={{ borderColor: "#ddd3c8", background: "#ffffff" }}
                />
              </Field>
              <Field label="Fin">
                <input
                  type="time"
                  value={schedule.end}
                  onChange={(event) =>
                    setConfig((current) => ({
                      ...current,
                      pickupSchedules: current.pickupSchedules.map((item, itemIndex) =>
                        itemIndex === index ? { ...item, end: event.target.value } : item,
                      ),
                    }))
                  }
                  className="w-full border px-4 py-3 text-sm"
                  style={{ borderColor: "#ddd3c8", background: "#ffffff" }}
                />
              </Field>
            </div>
            <p className="text-xs" style={{ color: "var(--subtle)" }}>
              Vista previa: {schedule.day || "Dia"}: {schedule.start || "--:--"}-{schedule.end || "--:--"}
            </p>
            <DangerButton
              label="Eliminar horario"
              onClick={() =>
                setConfig((current) => ({
                  ...current,
                  pickupSchedules: current.pickupSchedules.filter((_, itemIndex) => itemIndex !== index),
                }))
              }
            />
          </div>
        ))}
      </Section>

      <Section
        title="Empresas de envio"
        description="Administra empresas, departamentos y sucursales para el flujo de envio nacional."
        actionLabel="Agregar empresa"
        onAdd={() =>
          setConfig((current) => ({
            ...current,
            shippingCompanies: [...current.shippingCompanies, createShippingCompany()],
          }))
        }
      >
        {config.shippingCompanies.map((company, companyIndex) => (
          <div key={`shipping-company-${companyIndex}`} className="border p-4 space-y-4" style={{ borderColor: "#ece6dc" }}>
            <Field label="Empresa">
              <input
                type="text"
                value={company.name}
                onChange={(event) =>
                  setConfig((current) => ({
                    ...current,
                    shippingCompanies: current.shippingCompanies.map((item, itemIndex) =>
                      itemIndex === companyIndex ? { ...item, name: event.target.value } : item,
                    ),
                  }))
                }
                className="w-full border px-4 py-3 text-sm"
                style={{ borderColor: "#ddd3c8", background: "#ffffff" }}
              />
            </Field>

            <div className="space-y-3">
              {company.departments.map((department, departmentIndex) => (
                <div key={`shipping-department-${companyIndex}-${departmentIndex}`} className="border p-4 space-y-3" style={{ borderColor: "#f1ebe3" }}>
                  <Field label="Departamento">
                    <input
                      type="text"
                      value={department.name}
                      onChange={(event) =>
                        setConfig((current) => ({
                          ...current,
                          shippingCompanies: current.shippingCompanies.map((item, itemIndex) =>
                            itemIndex === companyIndex
                              ? {
                                  ...item,
                                  departments: item.departments.map((departmentItem, currentDepartmentIndex) =>
                                    currentDepartmentIndex === departmentIndex
                                      ? { ...departmentItem, name: event.target.value }
                                      : departmentItem,
                                  ),
                                }
                              : item,
                          ),
                        }))
                      }
                      className="w-full border px-4 py-3 text-sm"
                      style={{ borderColor: "#ddd3c8", background: "#ffffff" }}
                    />
                  </Field>

                  <div className="space-y-2">
                    {department.branches.map((branch, branchIndex) => (
                      <div key={`branch-${companyIndex}-${departmentIndex}-${branchIndex}`} className="flex gap-2">
                        <input
                          type="text"
                          value={branch}
                          onChange={(event) =>
                            setConfig((current) => ({
                              ...current,
                              shippingCompanies: current.shippingCompanies.map((item, itemIndex) =>
                                itemIndex === companyIndex
                                  ? {
                                      ...item,
                                      departments: item.departments.map((departmentItem, currentDepartmentIndex) =>
                                        currentDepartmentIndex === departmentIndex
                                          ? {
                                              ...departmentItem,
                                              branches: departmentItem.branches.map((branchItem, currentBranchIndex) =>
                                                currentBranchIndex === branchIndex ? event.target.value : branchItem,
                                              ),
                                            }
                                          : departmentItem,
                                      ),
                                    }
                                  : item,
                              ),
                            }))
                          }
                          className="w-full border px-4 py-3 text-sm"
                          style={{ borderColor: "#ddd3c8", background: "#ffffff" }}
                        />
                        <button
                          type="button"
                          onClick={() =>
                            setConfig((current) => ({
                              ...current,
                              shippingCompanies: current.shippingCompanies.map((item, itemIndex) =>
                                itemIndex === companyIndex
                                  ? {
                                      ...item,
                                      departments: item.departments.map((departmentItem, currentDepartmentIndex) =>
                                        currentDepartmentIndex === departmentIndex
                                          ? {
                                              ...departmentItem,
                                              branches: departmentItem.branches.filter((_, currentBranchIndex) => currentBranchIndex !== branchIndex),
                                            }
                                          : departmentItem,
                                      ),
                                    }
                                  : item,
                              ),
                            }))
                          }
                          className="shrink-0 border px-3 py-2 text-xs uppercase transition-opacity hover:opacity-60"
                          style={{ borderColor: "#d9b2ac", color: "#8b3f36", letterSpacing: "0.12em" }}
                        >
                          Quitar
                        </button>
                      </div>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      setConfig((current) => ({
                        ...current,
                        shippingCompanies: current.shippingCompanies.map((item, itemIndex) =>
                          itemIndex === companyIndex
                            ? {
                                ...item,
                                departments: item.departments.map((departmentItem, currentDepartmentIndex) =>
                                  currentDepartmentIndex === departmentIndex
                                    ? { ...departmentItem, branches: [...departmentItem.branches, ""] }
                                    : departmentItem,
                                ),
                              }
                            : item,
                        ),
                      }))
                    }
                    className="inline-flex items-center justify-center border px-4 py-2 text-xs uppercase transition-colors hover:bg-white"
                    style={{ borderColor: "#ddd3c8", letterSpacing: "0.14em", color: "#5f564e" }}
                  >
                    Agregar sucursal
                  </button>

                  <DangerButton
                    label="Eliminar departamento"
                    onClick={() =>
                      setConfig((current) => ({
                        ...current,
                        shippingCompanies: current.shippingCompanies.map((item, itemIndex) =>
                          itemIndex === companyIndex
                            ? {
                                ...item,
                                departments: item.departments.filter((_, currentDepartmentIndex) => currentDepartmentIndex !== departmentIndex),
                              }
                            : item,
                        ),
                      }))
                    }
                  />
                </div>
              ))}
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              <button
                type="button"
                onClick={() =>
                  setConfig((current) => ({
                    ...current,
                    shippingCompanies: current.shippingCompanies.map((item, itemIndex) =>
                      itemIndex === companyIndex
                        ? { ...item, departments: [...item.departments, createShippingDepartment()] }
                        : item,
                    ),
                  }))
                }
                className="inline-flex items-center justify-center border px-4 py-2 text-xs uppercase transition-colors hover:bg-white"
                style={{ borderColor: "#ddd3c8", letterSpacing: "0.14em", color: "#5f564e" }}
              >
                Agregar departamento
              </button>

              <DangerButton
                label="Eliminar empresa"
                onClick={() =>
                  setConfig((current) => ({
                    ...current,
                    shippingCompanies: current.shippingCompanies.filter((_, itemIndex) => itemIndex !== companyIndex),
                  }))
                }
              />
            </div>
          </div>
        ))}
      </Section>
    </div>
  );
}

function Section({
  title,
  description,
  actionLabel,
  onAdd,
  children,
}: {
  title: string;
  description: string;
  actionLabel: string;
  onAdd: () => void;
  children: React.ReactNode;
}) {
  return (
    <section className="border p-5 sm:p-6 space-y-4" style={{ borderColor: "var(--border)", background: "var(--surface)" }}>
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-2xl" style={{ fontFamily: "Georgia, 'Times New Roman', serif", fontWeight: 400 }}>
            {title}
          </h2>
          <p className="text-sm mt-1 max-w-2xl" style={{ color: "var(--muted)" }}>
            {description}
          </p>
        </div>

        <button
          type="button"
          onClick={onAdd}
          className="inline-flex items-center justify-center border px-4 py-2 text-xs uppercase transition-colors hover:bg-white"
          style={{ borderColor: "#ddd3c8", letterSpacing: "0.14em", color: "#5f564e" }}
        >
          {actionLabel}
        </button>
      </div>

      <div className="space-y-4">{children}</div>
    </section>
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

function DangerButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center justify-center border px-4 py-2 text-xs uppercase transition-opacity hover:opacity-60"
      style={{ borderColor: "#d9b2ac", color: "#8b3f36", letterSpacing: "0.12em" }}
    >
      {label}
    </button>
  );
}
