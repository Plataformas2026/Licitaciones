"use client";

import { useEffect, useId, useRef, useState } from "react";

interface Props {
  label: string;
  options: readonly string[];
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
}

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
      <label htmlFor={id} className="mb-1 block text-sm font-medium text-slate-700">
        {label}
      </label>
      <button
        id={id}
        type="button"
        aria-expanded={abierto}
        aria-haspopup="listbox"
        onClick={() => setAbierto((a) => !a)}
        className="flex w-full items-center justify-between gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-left text-sm focus:outline-2 focus:outline-brand"
      >
        <span className={value.length ? "text-slate-900" : "text-slate-400"}>
          {value.length === 0
            ? placeholder
            : value.length === 1
              ? value[0].trim()
              : `${value.length} seleccionados`}
        </span>
        <span aria-hidden className="text-slate-400">▾</span>
      </button>

      {value.length > 0 && (
        <button
          type="button"
          onClick={() => onChange([])}
          className="mt-1 text-xs text-brand underline underline-offset-2 hover:text-brand-dark"
        >
          Quitar selección
        </button>
      )}

      {abierto && (
        <ul
          role="listbox"
          aria-multiselectable="true"
          aria-label={label}
          className="absolute z-20 mt-1 max-h-72 w-full min-w-64 overflow-y-auto rounded-lg border border-slate-300 bg-white py-1 shadow-lg"
        >
          {options.map((opcion) => {
            const marcada = value.includes(opcion);
            return (
              <li key={opcion} role="option" aria-selected={marcada}>
                <label className="flex cursor-pointer items-start gap-2 whitespace-pre-wrap px-3 py-1.5 text-sm hover:bg-slate-100">
                  <input
                    type="checkbox"
                    checked={marcada}
                    onChange={() => alternar(opcion)}
                    className="mt-0.5 accent-brand"
                  />
                  <span>{opcion}</span>
                </label>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
