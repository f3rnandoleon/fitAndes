"use client";

import { useState } from "react";

interface Variante { color: string; talla: string; stock: number; }
interface Props { variantes: Variante[]; colores: string[]; tallas: string[]; }

export default function VarianteSelector({ variantes, colores, tallas }: Props) {
  const [colorSel, setColorSel] = useState<string>(colores[0] ?? "");
  const [tallaSel, setTallaSel] = useState<string>("");

  const varianteActual = variantes.find((v) => v.color === colorSel && v.talla === tallaSel);
  const tallasDisponibles = tallas.filter((t) =>
    variantes.some((v) => v.color === colorSel && v.talla === t)
  );

  return (
    <div className="flex flex-col gap-5">
      <div>
        <p className="text-xs font-medium text-gray-400 uppercase tracking-widest mb-2">
          Color — <span className="text-gray-200 normal-case">{colorSel}</span>
        </p>
        <div className="flex flex-wrap gap-2">
          {colores.map((c) => (
            <button
              key={c}
              onClick={() => { setColorSel(c); setTallaSel(""); }}
              className={`px-3 py-1.5 rounded-lg text-sm border transition ${
                colorSel === c
                  ? "border-amber-400 text-amber-400 bg-amber-400/10"
                  : "border-gray-700 text-gray-400 hover:border-gray-500"
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="text-xs font-medium text-gray-400 uppercase tracking-widest mb-2">Talla</p>
        <div className="flex flex-wrap gap-2">
          {tallas.map((t) => {
            const disponible = tallasDisponibles.includes(t);
            return (
              <button
                key={t}
                onClick={() => disponible && setTallaSel(t)}
                disabled={!disponible}
                className={`px-3 py-1.5 rounded-lg text-sm border transition ${
                  tallaSel === t
                    ? "border-amber-400 text-amber-400 bg-amber-400/10"
                    : disponible
                    ? "border-gray-700 text-gray-400 hover:border-gray-500"
                    : "border-gray-800 text-gray-700 cursor-not-allowed line-through"
                }`}
              >
                {t}
              </button>
            );
          })}
        </div>
      </div>

      {varianteActual && (
        <p className={`text-sm ${
          varianteActual.stock > 5 ? "text-green-400"
          : varianteActual.stock > 0 ? "text-amber-400"
          : "text-red-400"
        }`}>
          {varianteActual.stock > 5
            ? `✓ ${varianteActual.stock} unidades disponibles`
            : varianteActual.stock > 0
            ? `⚠ Últimas ${varianteActual.stock} unidades`
            : "✗ Sin stock"}
        </p>
      )}
    </div>
  );
}