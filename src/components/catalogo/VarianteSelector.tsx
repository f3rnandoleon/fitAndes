"use client";

import { useState } from "react";

interface Variante {
  color: string;
  talla: string;
  stock: number;
}
interface Props {
  variantes: Variante[];
  colores: string[];
  tallas: string[];
}

export default function VarianteSelector({ variantes, colores, tallas }: Props) {
  const [colorSel, setColorSel] = useState<string>(colores[0] ?? "");
  const [tallaSel, setTallaSel] = useState<string>("");

  const varianteActual = variantes.find((v) => v.color === colorSel && v.talla === tallaSel);
  const tallasDisponibles = tallas.filter((t) => variantes.some((v) => v.color === colorSel && v.talla === t));

  return (
    <div className="flex flex-col gap-5">
      <div>
        <p className="text-xs uppercase mb-2" style={{ letterSpacing: "0.16em", color: "var(--subtle)" }}>
          Color - <span className="normal-case" style={{ color: "var(--foreground)" }}>{colorSel}</span>
        </p>
        <div className="flex flex-wrap gap-2">
          {colores.map((c) => (
            <button
              key={c}
              onClick={() => {
                setColorSel(c);
                setTallaSel("");
              }}
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
          {tallas.map((t) => {
            const disponible = tallasDisponibles.includes(t);
            return (
              <button
                key={t}
                onClick={() => disponible && setTallaSel(t)}
                disabled={!disponible}
                className="px-3 py-1.5 text-sm border transition disabled:cursor-not-allowed"
                style={
                  tallaSel === t
                    ? { borderColor: "#1a1a1a", color: "#1a1a1a", background: "#ddd9d3" }
                    : disponible
                      ? { borderColor: "var(--border)", color: "var(--muted)", background: "var(--surface)" }
                      : { borderColor: "#ddd5cc", color: "#b8b0a5", background: "#efeae3", textDecoration: "line-through" }
                }
              >
                {t}
              </button>
            );
          })}
        </div>
      </div>

      {varianteActual && (
        <p
          className="text-sm"
          style={{
            color:
              varianteActual.stock > 5
                ? "var(--success)"
                : varianteActual.stock > 0
                  ? "var(--accent)"
                  : "var(--danger)",
          }}
        >
          {varianteActual.stock > 5
            ? `${varianteActual.stock} unidades disponibles`
            : varianteActual.stock > 0
              ? `Ultimas ${varianteActual.stock} unidades`
              : "Sin stock"}
        </p>
      )}
    </div>
  );
}
