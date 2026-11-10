"use client";

import { useEffect, useMemo, useState } from "react";
import type { FilaResultado } from "@/lib/types.ts";
import { IconoChevron, IconoEnlace } from "./icons.tsx";

const POR_PAGINA = 50;

const COLUMNAS = [
  "#",
  "Relevancia (%)",
  "Título",
  "Órgano",
  "Tipo Contrato",
  "Lugar",
  "Cierre",
  "Fecha Pub.",
  "Importe",
  "Enlace oficial",
];

type TipoOrden = "numero" | "importe" | "fecha" | "texto";

/** Columnas ordenables (índice en COLUMNAS -> campo de la fila y tipo de dato). "#" y "Enlace oficial" no se ordenan. */
const ORDENABLES: Record<number, { campo: keyof FilaResultado; tipo: TipoOrden }> = {
  1: { campo: "relevancia", tipo: "numero" },
  2: { campo: "titulo", tipo: "texto" },
  3: { campo: "organo", tipo: "texto" },
  4: { campo: "tipoContrato", tipo: "texto" },
  5: { campo: "lugar", tipo: "texto" },
  6: { campo: "cierre", tipo: "fecha" },
  7: { campo: "fechaPub", tipo: "fecha" },
  8: { campo: "importe", tipo: "importe" },
};

const comparadorTexto = new Intl.Collator("es", { sensitivity: "base", numeric: true });
const SIN_DATO = /^(no especificad[oa])?$/i;

/** Valor comparable de una celda ya formateada; null = vacío o no disponible (va siempre al final). */
function valorOrden(fila: FilaResultado, campo: keyof FilaResultado, tipo: TipoOrden): number | string | null {
  const bruto = String(fila[campo] ?? "").trim();
  if (SIN_DATO.test(bruto)) return null;

  if (tipo === "numero") {
    // "87.50 %" -> 87.5
    const n = parseFloat(bruto);
    return Number.isFinite(n) ? n : null;
  }
  if (tipo === "importe") {
    // Formato español "1.250,50 €": el punto separa millares y la coma los decimales.
    const limpio = bruto.replace(/[^\d,.\-]/g, "");
    if (!/\d/.test(limpio)) return null;
    const n = Number(limpio.replace(/\./g, "").replace(",", "."));
    return Number.isFinite(n) ? n : null;
  }
  if (tipo === "fecha") {
    // "2026-12-01", "2026-12-01T10:00:00" o "2026-12-01 10:00"
    const m = /^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2})(?::(\d{2}))?)?/.exec(bruto);
    if (!m) return null;
    const t = Date.UTC(+m[1], +m[2] - 1, +m[3], +(m[4] ?? 0), +(m[5] ?? 0), +(m[6] ?? 0));
    return Number.isFinite(t) ? t : null;
  }
  return bruto;
}

export function ResultsTable({ filas }: { filas: FilaResultado[] }) {
  const [pagina, setPagina] = useState(1);
  // Orden manual elegido con las cabeceras; null = orden en que llegaron los resultados (relevancia, de mayor a menor).
  const [orden, setOrden] = useState<{ col: number; dir: "asc" | "desc" } | null>(null);
  const totalPaginas = Math.max(1, Math.ceil(filas.length / POR_PAGINA));

  // Nueva búsqueda -> volver a la primera página y al orden inicial.
  useEffect(() => {
    setPagina(1);
    setOrden(null);
  }, [filas]);

  // Primer clic: ascendente; clics siguientes sobre la misma cabecera: alternan.
  const ordenarPor = (col: number) => {
    setOrden((o) => (o && o.col === col ? { col, dir: o.dir === "asc" ? "desc" : "asc" } : { col, dir: "asc" }));
    setPagina(1);
  };

  // Ordena solo las filas ya recibidas: no hay nuevas llamadas al servidor ni al modelo.
  const filasOrdenadas = useMemo(() => {
    if (!orden) return filas;
    const { campo, tipo } = ORDENABLES[orden.col];
    const sentido = orden.dir === "asc" ? 1 : -1;
    return filas
      .map((fila, idx) => ({ fila, idx, v: valorOrden(fila, campo, tipo) }))
      .sort((a, b) => {
        if (a.v === null || b.v === null) {
          if (a.v === b.v) return a.idx - b.idx;
          return a.v === null ? 1 : -1; // vacíos siempre al final, en ambos sentidos
        }
        const c = typeof a.v === "string" ? comparadorTexto.compare(a.v, b.v as string) : a.v - (b.v as number);
        return c * sentido || a.idx - b.idx; // empates: se conserva el orden de llegada
      })
      .map((x) => x.fila);
  }, [filas, orden]);

  const inicio = (pagina - 1) * POR_PAGINA;
  const visibles = filasOrdenadas.slice(inicio, inicio + POR_PAGINA);

  return (
    <div>
      <div className="relative max-h-[70vh] overflow-auto rounded-xl border border-line bg-white shadow-[0_1px_2px_rgb(15_27_45/0.04)]">
        <table className="w-full min-w-[1150px] border-collapse text-sm">
          <thead className="sticky top-0 z-10 bg-ink text-left text-white">
            <tr>
              {COLUMNAS.map((c, i) => {
                const dirActiva = orden && orden.col === i ? orden.dir : null;
                return (
                  <th
                    key={c}
                    scope="col"
                    aria-sort={dirActiva === "asc" ? "ascending" : dirActiva === "desc" ? "descending" : undefined}
                    className={`whitespace-nowrap px-3 py-2.5 text-xs font-semibold ${i === 8 ? "text-right" : ""}`}
                  >
                    {ORDENABLES[i] ? (
                      <button
                        type="button"
                        onClick={() => ordenarPor(i)}
                        title={`Ordenar por ${c}`}
                        className="inline-flex cursor-pointer items-center gap-1 whitespace-nowrap font-semibold hover:underline focus-visible:outline-white"
                      >
                        {c}
                        {dirActiva && <IconoChevron className={dirActiva === "asc" ? "rotate-180" : ""} />}
                      </button>
                    ) : (
                      c
                    )}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {visibles.map((f, i) => {
              const nueva = f.esNovedad;
              const actualizada = !nueva && f.esActualizada;
              const fondo = nueva ? "bg-[#e6f4ea]" : actualizada ? "bg-[#e3eefc]" : "bg-white";
              const texto = nueva ? "text-[#14532d] font-semibold" : actualizada ? "text-[#0b3a7a] font-semibold" : "text-ink";
              const marca = nueva
                ? "shadow-[inset_3px_0_0_#1e8e3e]"
                : actualizada
                  ? "shadow-[inset_3px_0_0_#0b5fc4]"
                  : "";
              const porcentaje = Math.max(0, Math.min(100, parseFloat(f.relevancia) || 0));
              return (
                <tr key={`${inicio + i}-${f.enlace}`} className={`border-t border-line align-top ${fondo} ${texto}`}>
                  <td className={`px-3 py-2.5 tabular-nums ${marca}`}>{inicio + i + 1}</td>
                  <td className="whitespace-nowrap px-3 py-2.5">
                    <span className="tabular-nums">{f.relevancia}</span>
                    <span aria-hidden className="mt-1 block h-1 w-16 overflow-hidden rounded-full bg-ink/10">
                      <span className="block h-full rounded-full bg-brand" style={{ width: `${porcentaje}%` }} />
                    </span>
                  </td>
                  <td className="min-w-72 max-w-md px-3 py-2.5 leading-snug">{f.titulo}</td>
                  <td className="min-w-48 px-3 py-2.5 leading-snug">{f.organo}</td>
                  <td className="px-3 py-2.5">{f.tipoContrato}</td>
                  <td className="min-w-40 px-3 py-2.5 leading-snug">{f.lugar}</td>
                  <td className="whitespace-nowrap px-3 py-2.5 tabular-nums">{f.cierre}</td>
                  <td className="whitespace-nowrap px-3 py-2.5 tabular-nums">{f.fechaPub}</td>
                  <td className="whitespace-nowrap px-3 py-2.5 text-right tabular-nums">{f.importe}</td>
                  <td className="whitespace-nowrap px-3 py-2.5">
                    {f.enlace ? (
                      <a
                        href={f.enlace}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 font-medium text-brand underline underline-offset-2 hover:text-brand-dark"
                      >
                        Ver licitación
                        <IconoEnlace />
                        <span className="sr-only">(se abre en una pestaña nueva)</span>
                      </a>
                    ) : (
                      "—"
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {totalPaginas > 1 && (
        <nav aria-label="Paginación de resultados" className="mt-4 flex items-center justify-between gap-3 text-sm">
          <button
            type="button"
            onClick={() => setPagina((p) => Math.max(1, p - 1))}
            disabled={pagina === 1}
            className="rounded-md border border-line bg-white px-4 py-2 font-medium shadow-sm hover:bg-paper disabled:cursor-not-allowed disabled:opacity-40"
          >
            Anterior
          </button>
          <span className="tabular-nums text-muted">
            Página {pagina} de {totalPaginas}
          </span>
          <button
            type="button"
            onClick={() => setPagina((p) => Math.min(totalPaginas, p + 1))}
            disabled={pagina === totalPaginas}
            className="rounded-md border border-line bg-white px-4 py-2 font-medium shadow-sm hover:bg-paper disabled:cursor-not-allowed disabled:opacity-40"
          >
            Siguiente
          </button>
        </nav>
      )}
    </div>
  );
}
