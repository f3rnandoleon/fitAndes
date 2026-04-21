"use client";

import { useEffect, useState } from "react";
import { getCatalogVariantAvailableStock, type CatalogVariant } from "@/types/catalogo";

interface Props {
  variantes: CatalogVariant[];
  colores: string[];
  tallas: string[];
  onVarianteChange?: (variante: CatalogVariant | null) => void;
}

export default function VarianteSelector({ variantes, colores, tallas, onVarianteChange }: Props) {
  const variantesDisponibles = variantes.filter((variant) => getCatalogVariantAvailableStock(variant) > 0);
  const coloresDisponibles = colores.filter((color) => variantesDisponibles.some((variant) => variant.color === color));
  const primeraVariante = variantesDisponibles[0] ?? variantes[0];
  const [colorSel, setColorSel] = useState<string>(primeraVariante?.color ?? coloresDisponibles[0] ?? "");
  const [tallaSel, setTallaSel] = useState<string>(primeraVariante?.talla ?? "");

  const varianteActual = variantesDisponibles.find((v) => v.color === colorSel && v.talla === tallaSel);
  const stockActual = varianteActual ? getCatalogVariantAvailableStock(varianteActual) : 0;
  const tallasDisponibles = tallas.filter((t) => variantesDisponibles.some((v) => v.color === colorSel && v.talla === t));

  useEffect(() => {
    const tallaValida = variantesDisponibles.some((v) => v.color === colorSel && v.talla === tallaSel);
    if (!tallaValida) {
      const siguienteTalla = variantesDisponibles.find((v) => v.color === colorSel)?.talla ?? "";
      if (siguienteTalla !== tallaSel) {
        setTallaSel(siguienteTalla);
        return;
      }
    }

    onVarianteChange?.(variantesDisponibles.find((v) => v.color === colorSel && v.talla === tallaSel) ?? null);
  }, [colorSel, tallaSel, variantesDisponibles, onVarianteChange]);

  return (
    <div className="flex flex-col gap-5">
      <div>
        <p className="text-xs uppercase mb-2" style={{ letterSpacing: "0.16em", color: "var(--subtle)" }}>
          Color - <span className="normal-case" style={{ color: "var(--foreground)" }}>{colorSel}</span>
        </p>
        <div className="flex flex-wrap gap-2">
          {coloresDisponibles.map((c) => (
            <button
              key={c}
              onClick={() => setColorSel(c)}
              className="px-3 py-1.5 text-sm border transition"
              style={
                colorSel === c
                  ? { borderColor: "#1a1a1a", color: "#1a1a1a", background: "#ddd9d3" }
                  : { borderColor: "var(--border)", color: "var(--muted)", background: "var(--surface)" }
              }
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="text-xs uppercase mb-2" style={{ letterSpacing: "0.16em", color: "var(--subtle)" }}>
          Talla
        </p>
        <div className="flex flex-wrap gap-2">
          {tallasDisponibles.map((t) => (
            <button
              key={t}
              onClick={() => setTallaSel(t)}
              className="px-3 py-1.5 text-sm border transition"
              style={
                tallaSel === t
                  ? { borderColor: "#1a1a1a", color: "#1a1a1a", background: "#ddd9d3" }
                  : { borderColor: "var(--border)", color: "var(--muted)", background: "var(--surface)" }
              }
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {varianteActual && (
        <p
          className="text-sm"
          style={{
            color:
              stockActual > 5
                ? "var(--success)"
                : stockActual > 0
                  ? "var(--accent)"
                  : "var(--danger)",
          }}
        >
          {stockActual > 5
            ? `${stockActual} unidades disponibles`
            : stockActual > 0
              ? `Ultimas ${stockActual} unidades`
              : "Sin stock"}
        </p>
      )}
    </div>
  );
}
