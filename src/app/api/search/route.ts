import { ejecutarBusqueda } from "@/lib/search.ts";
import type { Filtros, Modo } from "@/lib/types.ts";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
// 60 s de margen: la primera búsqueda semántica de cada instancia fría descarga el modelo.
// Comprueba el máximo permitido por tu plan en la documentación de Vercel.
export const maxDuration = 60;

const texto = (v: unknown, max = 500) => (typeof v === "string" ? v.slice(0, max) : "");
const lista = (v: unknown) =>
  Array.isArray(v) ? v.filter((x): x is string => typeof x === "string").slice(0, 100) : [];
const numero = (v: unknown, defecto = 0) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : defecto;
};
const fecha = (v: unknown, defecto: string) =>
  typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : defecto;

export async function POST(req: Request) {
  try {
    const cuerpo = (await req.json()) as Record<string, unknown>;

    const modo: Modo = cuerpo.modo === "novedades" ? "novedades" : "buscar";
    const f: Filtros = {
      consulta: texto(cuerpo.consulta),
      palabrasClave: texto(cuerpo.palabrasClave),
      fuentes: lista(cuerpo.fuentes),
      tiposContrato: lista(cuerpo.tiposContrato),
      importeMin: numero(cuerpo.importeMin),
      importeMax: numero(cuerpo.importeMax),
      ccaa: lista(cuerpo.ccaa),
      lugarLibre: texto(cuerpo.lugarLibre, 200),
      sectoresCpv: lista(cuerpo.sectoresCpv),
      codigoCpv: texto(cuerpo.codigoCpv, 50),
      fechaCierreTope: fecha(cuerpo.fechaCierreTope, "1900-01-01"),
      fechaDesde: fecha(cuerpo.fechaDesde, "1900-01-01"),
      fechaHasta: fecha(cuerpo.fechaHasta, "2999-12-31"),
      mostrarTodos: cuerpo.mostrarTodos !== false,
      limite: Math.min(Math.max(Math.trunc(numero(cuerpo.limite, 10)), 1), 500),
    };

    const resultado = await ejecutarBusqueda(modo, f);
    return Response.json(resultado);
  } catch (e) {
    const mensaje = e instanceof Error ? e.message : "Error desconocido";
    return Response.json({ error: mensaje }, { status: 500 });
  }
}
