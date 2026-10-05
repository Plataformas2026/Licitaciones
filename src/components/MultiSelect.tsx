"use client";

import { useEffect, useId, useRef, useState } from "react";
import { IconoChevron, IconoRama } from "./icons.tsx";

interface Props {
  label: string;
  options: readonly string[];
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
}

/**
 * El valor de cada opción NO cambia (son las claves de MAPA_TERRITORIAL, etc.).
 * Solo se limpia lo que se muestra: sin emoji de pin y con la sangría "↳" como icono.
 */
function presentar(opcion: string): { texto: string; esSub: boolean } {
  const esSub = /^\s+↳/u.test(opcion);
  const texto = opcion.replace(/^[\s↳📍🌐]+/u, "").trim();
  return { texto, esSub };
}

/** Quita el emoji del texto de la etiqueta (🌐 Fuente -> Fuente). */
const sinEmoji = (s: string) => s.replace(/^[^\p{L}\p{N}]+/u, "").trim();

/** Desplegable con casillas (equivalente a st.multiselect). */
export function MultiSelect({ label, options, value, onChange, placeholder = "Elegir opciones" }: Props) {
  const [abierto, setAbierto] = useState(false);
  const contenedor = useRef<HTMLDivElement>(null);
  const id = useId();

  useEffect(() => {
    if (!abierto) return;
    const fuera = (e: MouseEvent) => {
      if (!contenedor.current?.contains(e.target as Node)) setAbierto(false);
    };
    const tecla = (e: KeyboardEvent) => {
      if (e.key === "Escape") setAbierto(false);
    };
    document.addEventListener("mousedown", fuera);
    document.addEventListener("keydown", tecla);
    return () => {
      document.removeEventListener("mousedown", fuera);
      document.removeEventListener("keydown", tecla);
    };
  }, [abierto]);

  const alternar = (opcion: string) =>
    onChange(value.includes(opcion) ? value.filter((v) => v !== opcion) : [...value, opcion]);

  return (
    <div ref={contenedor} className="relative">
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-ink">
        {sinEmoji(label)}
      </label>
      <button
        id={id}
        type="button"
        aria-expanded={abierto}
        aria-haspopup="listbox"
        onClick={() => setAbierto((a) => !a)}
        className={`flex w-full items-center justify-between gap-2 rounded-md border bg-white px-3 py-2 text-left text-sm focus:outline-2 focus:outline-brand/30 ${
          abierto ? "border-brand" : "border-line"
        }`}
      >
        <span className={`truncate ${value.length ? "text-ink" : "text-slate-400"}`}>
          {value.length === 0
            ? placeholder
            : value.length === 1
              ? presentar(value[0]).texto
              : `${value.length} seleccionados`}
        </span>
        <span className="flex shrink-0 items-center gap-1.5">
          {value.length > 1 && (
            <span className="rounded-full bg-brand-soft px-1.5 text-xs font-semibold tabular-nums text-brand-dark">
              {value.length}
            </span>
          )}
          <IconoChevron className={`text-muted transition-transform ${abierto ? "rotate-180" : ""}`} />
        </span>
      </button>

      {value.length > 0 && (
        <button
          type="button"
          onClick={() => onChange([])}
          className="mt-1 text-xs font-medium text-brand underline underline-offset-2 hover:text-brand-dark"
        >
          Quitar selección
        </button>
      )}

      {abierto && (
        <ul
          role="listbox"
          aria-multiselectable="true"
          aria-label={sinEmoji(label)}
          className="absolute z-20 mt-1 max-h-72 w-full min-w-64 overflow-y-auto rounded-lg border border-line bg-white py-1 shadow-[0_8px_24px_rgb(15_27_45/0.14)]"
        >
          {options.map((opcion) => {
            const marcada = value.includes(opcion);
            const { texto, esSub } = presentar(opcion);
            return (
              <li key={opcion} role="option" aria-selected={marcada}>
                <label
                  className={`flex cursor-pointer items-center gap-2 py-1.5 pr-3 text-sm hover:bg-paper ${
                    esSub ? "pl-7 text-muted" : "pl-3 font-medium text-ink"
                  } ${marcada ? "bg-brand-soft/60" : ""}`}
                >
                  <input type="checkbox" checked={marcada} onChange={() => alternar(opcion)} className="accent-brand" />
                  {esSub && <IconoRama className="shrink-0 text-slate-400" />}
                  <span>{texto}</span>
                </label>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
