"use client";

import { useEffect, useState } from "react";
import type { FilaResultado } from "@/lib/types.ts";
import { IconoEnlace } from "./icons.tsx";

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

export function ResultsTable({ filas }: { filas: FilaResultado[] }) {
  const [pagina, setPagina] = useState(1);
  const totalPaginas = Math.max(1, Math.ceil(filas.length / POR_PAGINA));

  // Nueva búsqueda -> volver a la primera página.
  useEffect(() => setPagina(1), [filas]);

  const inicio = (pagina - 1) * POR_PAGINA;
  const visibles = filas.slice(inicio, inicio + POR_PAGINA);

  return (
    <div>
      <div className="relative max-h-[70vh] overflow-auto rounded-xl border border-line bg-white shadow-[0_1px_2px_rgb(15_27_45/0.04)]">
        <table className="w-full min-w-[1150px] border-collapse text-sm">
          <thead className="sticky top-0 z-10 bg-ink text-left text-white">
            <tr>
              {COLUMNAS.map((c, i) => (
                <th
                  key={c}
                  scope="col"
                  className={`whitespace-nowrap px-3 py-2.5 text-xs font-semibold ${i === 8 ? "text-right" : ""}`}
                >
                  {c}
                </th>
              ))}
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
