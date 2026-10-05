"use client";

import { useEffect, useState } from "react";
import type { FilaResultado } from "@/lib/types.ts";

const POR_PAGINA = 50;

export function ResultsTable({ filas }: { filas: FilaResultado[] }) {
  const [pagina, setPagina] = useState(1);
  const totalPaginas = Math.max(1, Math.ceil(filas.length / POR_PAGINA));

  // Nueva búsqueda -> volver a la primera página.
  useEffect(() => setPagina(1), [filas]);

  const inicio = (pagina - 1) * POR_PAGINA;
  const visibles = filas.slice(inicio, inicio + POR_PAGINA);

  return (
    <div>
      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
        <table className="w-full min-w-[1100px] border-collapse text-sm">
          <thead className="bg-slate-100 text-left text-slate-700">
            <tr>
              {["#", "Relevancia (%)", "Título", "Órgano", "Tipo Contrato", "Lugar", "Cierre", "Fecha Pub.", "Importe", "Enlace oficial"].map(
                (c) => (
                  <th key={c} scope="col" className="whitespace-nowrap px-3 py-2 font-semibold">
                    {c}
                  </th>
                ),
              )}
            </tr>
          </thead>
          <tbody>
            {visibles.map((f, i) => {
              const color = f.esNovedad
                ? "bg-[#d4edda] font-bold text-[#155724]"
                : f.esActualizada
                  ? "bg-[#cce5ff] font-bold text-[#004085]"
                  : "";
              return (
                <tr key={`${inicio + i}-${f.enlace}`} className={`border-t border-slate-200 align-top ${color}`}>
                  <td className="px-3 py-2 tabular-nums">{inicio + i + 1}</td>
                  <td className="whitespace-nowrap px-3 py-2 tabular-nums">{f.relevancia}</td>
                  <td className="min-w-72 px-3 py-2">{f.titulo}</td>
                  <td className="min-w-48 px-3 py-2">{f.organo}</td>
                  <td className="px-3 py-2">{f.tipoContrato}</td>
                  <td className="min-w-40 px-3 py-2">{f.lugar}</td>
                  <td className="whitespace-nowrap px-3 py-2">{f.cierre}</td>
                  <td className="whitespace-nowrap px-3 py-2">{f.fechaPub}</td>
                  <td className="whitespace-nowrap px-3 py-2 text-right tabular-nums">{f.importe}</td>
                  <td className="whitespace-nowrap px-3 py-2">
                    {f.enlace ? (
                      <a
                        href={f.enlace}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-brand underline underline-offset-2 hover:text-brand-dark"
                      >
                        Ver licitación 🔗
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
        <nav aria-label="Paginación de resultados" className="mt-3 flex items-center justify-between gap-3 text-sm">
          <button
            type="button"
            onClick={() => setPagina((p) => Math.max(1, p - 1))}
            disabled={pagina === 1}
            className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 disabled:opacity-40"
          >
            Anterior
          </button>
          <span>
            Página {pagina} de {totalPaginas}
          </span>
          <button
            type="button"
            onClick={() => setPagina((p) => Math.min(totalPaginas, p + 1))}
            disabled={pagina === totalPaginas}
            className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 disabled:opacity-40"
          >
            Siguiente
          </button>
        </nav>
      )}
    </div>
  );
}
