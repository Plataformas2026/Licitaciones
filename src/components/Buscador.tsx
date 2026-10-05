"use client";

import { useRef, useState, type FormEvent, type ReactNode } from "react";
import {
  FUENTES,
  MAX_FILAS_RESPUESTA,
  OPCIONES_CCAA,
  OPCIONES_SECTOR_CPV,
  TIPOS_CONTRATO,
} from "@/lib/constants.ts";
import type { Modo, RespuestaBusqueda } from "@/lib/types.ts";
import { MultiSelect } from "./MultiSelect.tsx";
import { ResultsTable } from "./ResultsTable.tsx";

interface Props {
  /** Fecha por defecto de "Fecha fin de presentación (Mínima)": ayer, calculada en el servidor. */
  cierreInicial: string;
}

const CAMPOS_VACIOS = {
  consulta: "",
  palabrasClave: "",
  fuentes: [] as string[],
  tiposContrato: [] as string[],
  importeMin: "0",
  importeMax: "0",
  ccaa: [] as string[],
  lugarLibre: "",
  sectoresCpv: [] as string[],
  codigoCpv: "",
  mostrarTodos: true,
  limite: 10,
};

const entrada =
  "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-2 focus:outline-brand disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400";
const etiqueta = "mb-1 block text-sm font-medium text-slate-700";

export function Buscador({ cierreInicial }: Props) {
  const [c, setC] = useState(CAMPOS_VACIOS);
  const [fechaCierre, setFechaCierre] = useState(cierreInicial);
  const [fechaDesde, setFechaDesde] = useState("2026-01-01");
  const [fechaHasta, setFechaHasta] = useState("2030-12-31");

  const [cargando, setCargando] = useState<Modo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  const [resultado, setResultado] = useState<{ datos: RespuestaBusqueda; mostrarTodos: boolean } | null>(null);
  const abortar = useRef<AbortController | null>(null);

  const set = <K extends keyof typeof CAMPOS_VACIOS>(k: K, v: (typeof CAMPOS_VACIOS)[K]) =>
    setC((prev) => ({ ...prev, [k]: v }));

  // Buscador semántico y palabras clave son excluyentes: usar uno desactiva el otro.
  const hayPalabrasClave = c.palabrasClave.trim().length > 0;
  const hayConsulta = c.consulta.trim().length > 0;

  async function lanzar(modo: Modo) {
    abortar.current?.abort();
    const ctrl = new AbortController();
    abortar.current = ctrl;

    setCargando(modo);
    setError(null);
    setAviso(null);

    try {
      const res = await fetch("/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: ctrl.signal,
        body: JSON.stringify({
          modo,
          ...c,
          importeMin: Number(c.importeMin) || 0,
          importeMax: Number(c.importeMax) || 0,
          fechaCierreTope: fechaCierre,
          fechaDesde,
          fechaHasta,
        }),
      });

      const texto = await res.text();
      let datos: (RespuestaBusqueda & { error?: string }) | null = null;
      try {
        datos = JSON.parse(texto);
      } catch {
        /* respuesta no JSON (p. ej. timeout de Vercel) */
      }

      if (!res.ok || !datos) {
        throw new Error(
          datos?.error ??
            (res.status === 504
              ? "La búsqueda ha tardado demasiado. Si es la primera búsqueda con texto, vuelve a intentarlo: el modelo ya habrá empezado a cargarse."
              : `Error ${res.status} al buscar.`),
        );
      }

      if (datos.estado === "sin_datos") {
        setResultado(null);
        setAviso(
          modo === "novedades"
            ? "No hay nuevas licitaciones ni actualizaciones en este ciclo."
            : "No se encontraron resultados que coincidan con la búsqueda.",
        );
      } else if (datos.estado === "sin_coincidencias") {
        setResultado(null);
        setAviso(
          modo === "novedades"
            ? "No hay novedades ni actualizaciones que coincidan con los filtros y la búsqueda indicada."
            : "No hay licitaciones que coincidan con los filtros y la búsqueda indicada.",
        );
      } else {
        setResultado({ datos, mostrarTodos: c.mostrarTodos });
      }
    } catch (e) {
      if (e instanceof DOMException && e.name === "AbortError") return;
      setResultado(null);
      setError(e instanceof Error ? e.message : "Error desconocido");
    } finally {
      if (abortar.current === ctrl) setCargando(null);
    }
  }

  function limpiar() {
    abortar.current?.abort();
    setC(CAMPOS_VACIOS);
    setResultado(null);
    setError(null);
    setAviso(null);
    setCargando(null);
  }

  function alEnviar(e: FormEvent) {
    e.preventDefault();
    void lanzar("buscar");
  }

  function mensajeExito(): ReactNode {
    if (!resultado) return null;
    const { datos, mostrarTodos } = resultado;
    const mostrados = datos.filas.length;

    if (datos.truncado) {
      return (
        <>
          Hay <strong>{datos.total.toLocaleString("es-ES")}</strong> licitaciones; se muestran las{" "}
          {MAX_FILAS_RESPUESTA.toLocaleString("es-ES")} primeras por el límite de respuesta. Añade filtros para acotar.
        </>
      );
    }
    if (!mostrarTodos && datos.total > mostrados) {
      return (
        <>
          ¡Mostrando las <strong>{mostrados} licitaciones más relevantes</strong> de un total de{" "}
          <strong>{datos.total}</strong> encontradas!
        </>
      );
    }
    return <>¡Se han encontrado y mostrado las {mostrados} licitaciones relevantes!</>;
  }

  const ocupado = cargando !== null;

  return (
    <form onSubmit={alEnviar} className="space-y-6">
      {/* Búsqueda principal */}
      <section className="space-y-4">
        <div>
          <label htmlFor="consulta" className={etiqueta}>
            ¿Qué tipo de licitación buscas?
          </label>
          <input
            id="consulta"
            type="text"
            value={c.consulta}
            disabled={hayPalabrasClave}
            onChange={(e) => set("consulta", e.target.value)}
            placeholder="ej. mantenimiento informático, suministro de vehículos, obras..."
            className={entrada}
          />
        </div>

        <div>
          <label htmlFor="palabras" className={etiqueta}>
            Palabras clave
          </label>
          <input
            id="palabras"
            type="text"
            value={c.palabrasClave}
            disabled={hayConsulta}
            onChange={(e) => set("palabrasClave", e.target.value)}
            placeholder="ej. mantenimiento, obras..."
            className={entrada}
          />
          <p className="mt-1.5 text-xs leading-relaxed text-slate-500">
            Varias palabras seguidas equivalen a OR (basta con que aparezca una). Usa AND para exigir varios términos a
            la vez (ej. software AND web) y OR para exigir cualquiera (ej. suministro OR servicio). Las comillas exigen
            una frase exacta (ej. &quot;mantenimiento de equipos&quot;) y el guion excluye un término o frase (ej.
            -provisional o -&quot;obras menores&quot;).
          </p>
        </div>
      </section>

      {/* Filtros avanzados */}
      <section aria-labelledby="titulo-filtros" className="space-y-4">
        <h2 id="titulo-filtros" className="text-lg font-semibold text-slate-900">
          ⚙️ Filtros avanzados
        </h2>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <MultiSelect label="🌐 Fuente" options={FUENTES} value={c.fuentes} onChange={(v) => set("fuentes", v)} />
          <MultiSelect
            label="📋 Tipo de contrato"
            options={TIPOS_CONTRATO}
            value={c.tiposContrato}
            onChange={(v) => set("tiposContrato", v)}
          />
          <div>
            <label htmlFor="imp-min" className={etiqueta}>
              Importe Mínimo (€)
            </label>
            <input
              id="imp-min"
              type="number"
              inputMode="decimal"
              min={0}
              step="any"
              value={c.importeMin}
              onChange={(e) => set("importeMin", e.target.value)}
              className={entrada}
            />
          </div>
          <div>
            <label htmlFor="imp-max" className={etiqueta}>
              Importe Máximo (€)
            </label>
            <input
              id="imp-max"
              type="number"
              inputMode="decimal"
              min={0}
              step="any"
              value={c.importeMax}
              onChange={(e) => set("importeMax", e.target.value)}
              className={entrada}
            />
          </div>
          <MultiSelect
            label="📍 Lugar de ejecución (Desplegable)"
            options={OPCIONES_CCAA}
            value={c.ccaa}
            onChange={(v) => set("ccaa", v)}
          />
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <label htmlFor="lugar" className={etiqueta}>
              📍 Lugar de ejecución (Libre)
            </label>
            <input
              id="lugar"
              type="text"
              value={c.lugarLibre}
              onChange={(e) => set("lugarLibre", e.target.value)}
              placeholder="ej. San Sebastián"
              className={entrada}
            />
          </div>
          <MultiSelect
            label="📦 Sector CPV"
            options={OPCIONES_SECTOR_CPV}
            value={c.sectoresCpv}
            onChange={(v) => set("sectoresCpv", v)}
          />
          <div>
            <label htmlFor="cpv" className={etiqueta}>
              🔢 Código CPV
            </label>
            <input
              id="cpv"
              type="text"
              value={c.codigoCpv}
              onChange={(e) => set("codigoCpv", e.target.value)}
              placeholder="ej. 45210000"
              className={entrada}
            />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <label htmlFor="cierre" className={etiqueta}>
              ⏳ Fecha fin de presentación (Mínima)
            </label>
            <input
              id="cierre"
              type="date"
              value={fechaCierre}
              onChange={(e) => setFechaCierre(e.target.value)}
              className={entrada}
            />
          </div>
          <div>
            <label htmlFor="desde" className={etiqueta}>
              📅 Rango publicación (Desde)
            </label>
            <input
              id="desde"
              type="date"
              value={fechaDesde}
              onChange={(e) => setFechaDesde(e.target.value)}
              className={entrada}
            />
          </div>
          <div>
            <label htmlFor="hasta" className={etiqueta}>
              📅 Rango publicación (Hasta)
            </label>
            <input
              id="hasta"
              type="date"
              value={fechaHasta}
              onChange={(e) => setFechaHasta(e.target.value)}
              className={entrada}
            />
          </div>
        </div>
      </section>

      {/* Número de resultados */}
      <fieldset className="rounded-lg border border-slate-300 bg-slate-50 p-4 lg:w-3/5">
        <legend className="px-1 text-sm font-semibold text-slate-800">¿Cuántos resultados quieres ver?</legend>
        <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={c.mostrarTodos}
              onChange={(e) => set("mostrarTodos", e.target.checked)}
              className="accent-brand"
            />
            Mostrar TODOS los resultados
          </label>

          <div className="flex min-w-64 flex-1 items-center gap-3">
            <label
              htmlFor="limite"
              className={`whitespace-nowrap text-sm ${c.mostrarTodos ? "text-slate-400" : "text-slate-700"}`}
            >
              Seleccionar número de resultados:
            </label>
            <input
              id="limite"
              type="range"
              min={1}
              max={500}
              value={c.limite}
              disabled={c.mostrarTodos}
              onChange={(e) => setC((p) => ({ ...p, limite: Number(e.target.value), mostrarTodos: false }))}
              className="flex-1 accent-brand disabled:opacity-40"
            />
            <output htmlFor="limite" className={`w-9 text-right text-sm tabular-nums ${c.mostrarTodos ? "text-slate-400" : ""}`}>
              {c.limite}
            </output>
          </div>
        </div>
      </fieldset>

      {/* Acciones */}
      <div className="grid gap-3 sm:grid-cols-3">
        <button
          type="submit"
          disabled={ocupado}
          className="rounded-lg bg-brand px-5 py-2.5 text-base font-bold text-white shadow-sm hover:bg-brand-dark disabled:opacity-60"
        >
          {cargando === "buscar" ? "Buscando…" : "🔍 Buscar licitaciones"}
        </button>
        <button
          type="button"
          disabled={ocupado}
          onClick={() => void lanzar("novedades")}
          className="rounded-lg border border-slate-300 bg-white px-5 py-2.5 text-base font-semibold text-slate-800 hover:bg-slate-100 disabled:opacity-60"
        >
          {cargando === "novedades" ? "Buscando…" : "✨ Novedades"}
        </button>
        <button
          type="button"
          onClick={limpiar}
          className="rounded-lg border border-slate-300 bg-white px-5 py-2.5 text-base font-semibold text-slate-800 hover:bg-slate-100"
        >
          🔄 Limpiar Filtros
        </button>
      </div>

      {/* Estado y resultados */}
      <div aria-live="polite" className="space-y-4">
        {cargando && (
          <p className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
            {cargando === "novedades" ? "Buscando en novedades y actualizaciones…" : "Buscando en Supabase…"}
            {hayConsulta && " La primera búsqueda con texto tras un rato sin uso puede tardar unos segundos mientras se carga el modelo."}
          </p>
        )}
        {error && (
          <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            ⚠️ {error}
          </p>
        )}
        {aviso && (
          <p className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">{aviso}</p>
        )}

        {resultado && (
          <>
            <p className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-900">
              {mensajeExito()}
            </p>
            <p className="text-sm text-slate-600">🟢 <em>Verde</em>: Licitaciones Nuevas | 🔵 <em>Azul</em>: Licitaciones Actualizadas</p>
            <ResultsTable filas={resultado.datos.filas} />
          </>
        )}
      </div>
    </form>
  );
}
