import { MAPA_TERRITORIAL, SECTORES_CPV } from "./constants.ts";
import {
  analizarConsultaPalabrasClave,
  consultaTieneCriterios,
  tituloCumpleConsulta,
} from "./keywords.ts";
import type { Filtros, Licitacion } from "./types.ts";

// `\b` de JavaScript solo entiende ASCII y falla con "Álava", "León" o "Ávila".
// Estos lookarounds reproducen el `\b` Unicode de Python.
const LIM_IZQ = "(?<![\\p{L}\\p{N}_])";
const LIM_DER = "(?![\\p{L}\\p{N}_])";

const escapar = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const palabraCompleta = (s: string) => `${LIM_IZQ}${escapar(s)}${LIM_DER}`;

const NO_ESPECIFICADO = new Set(["no especificada", "no especificado"]);

/** Devuelve "YYYY-MM-DD" si los 10 primeros caracteres son una fecha ISO válida. */
export function fechaIso(valor: string | null | undefined): string | null {
  if (valor === null || valor === undefined) return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(valor).trim());
  if (!m) return null;
  const [, a, mes, d] = m;
  const fecha = new Date(Date.UTC(Number(a), Number(mes) - 1, Number(d)));
  const valida =
    fecha.getUTCFullYear() === Number(a) &&
    fecha.getUTCMonth() === Number(mes) - 1 &&
    fecha.getUTCDate() === Number(d);
  return valida ? `${a}-${mes}-${d}` : null;
}

function listaCpv(cpv: string | null | undefined): string[] | null {
  if (!cpv || cpv === "No especificado") return null;
  return String(cpv)
    .split(",")
    .map((c) => c.trim());
}

function importeNumerico(valor: Licitacion["importe"]): number {
  if (valor === null || valor === undefined || valor === "") return NaN;
  return Number(valor);
}

/** Equivalente a `aplicar_filtros_comunes(df)` de app.py. */
export function aplicarFiltros(filas: Licitacion[], f: Filtros): Licitacion[] {
  let r = filas;
  if (r.length === 0) return r;

  // 1. Fuente (subcadena, sin distinguir mayúsculas)
  if (f.fuentes.length > 0) {
    const buscadas = f.fuentes.map((x) => x.trim().toLowerCase());
    r = r.filter((x) => {
      const fuente = String(x.fuente ?? "").toLowerCase();
      return buscadas.some((b) => fuente.includes(b));
    });
  }

  // 2. Tipo de contrato
  if (f.tiposContrato.length > 0) {
    const patron = new RegExp(
      f.tiposContrato.map(palabraCompleta).join("|"),
      "iu",
    );
    r = r.filter((x) => x.tipo_contrato != null && patron.test(x.tipo_contrato));
  }

  // 3. Importes (los nulos quedan fuera, igual que NaN en pandas)
  if (f.importeMin > 0) {
    r = r.filter((x) => importeNumerico(x.importe) >= f.importeMin);
  }
  if (f.importeMax > 0) {
    r = r.filter((x) => importeNumerico(x.importe) <= f.importeMax);
  }

  // 4. Lugar de ejecución (desplegable)
  if (f.ccaa.length > 0) {
    const patrones: string[] = [];
    for (const item of f.ccaa) {
      const terminos = MAPA_TERRITORIAL[item] ?? [item];
      for (const p of terminos) {
        patrones.push(
          p === "Palma"
            ? `(?<![Ll][Aa]\\s)${palabraCompleta("Palma")}`
            : palabraCompleta(p),
        );
      }
    }
    const patron = new RegExp(patrones.join("|"), "iu");
    r = r.filter((x) => x.lugar_ejecucion != null && patron.test(x.lugar_ejecucion));
  }

  // 5. Lugar de ejecución (texto libre)
  const lugarLibre = f.lugarLibre.trim().toLowerCase();
  if (lugarLibre) {
    r = r.filter(
      (x) => x.lugar_ejecucion != null && x.lugar_ejecucion.toLowerCase().includes(lugarLibre),
    );
  }

  // 6. Sector CPV (prefijos de división)
  if (f.sectoresCpv.length > 0) {
    const prefijos = f.sectoresCpv.flatMap((s) => SECTORES_CPV[s] ?? []);
    r = r.filter((x) => {
      const lista = listaCpv(x.cpv);
      return lista !== null && lista.some((c) => prefijos.some((p) => c.startsWith(p)));
    });
  }

  // 7. Código CPV concreto (subcadena)
  const codigo = f.codigoCpv.trim();
  if (codigo) {
    r = r.filter((x) => {
      const lista = listaCpv(x.cpv);
      return lista !== null && lista.some((c) => c.includes(codigo));
    });
  }

  // 8. Fecha fin de presentación (si falta o no se entiende, NO se excluye)
  r = r.filter((x) => {
    const crudo = x.fecha_fin;
    if (crudo === null || crudo === undefined || !String(crudo).trim()) return true;
    if (NO_ESPECIFICADO.has(String(crudo).trim().toLowerCase())) return true;
    const iso = fechaIso(crudo);
    if (iso === null) return true;
    return iso >= f.fechaCierreTope;
  });

  // 9. Fecha de publicación (si falta o no se entiende, SÍ se excluye)
  r = r.filter((x) => {
    const iso = fechaIso(x.fecha);
    if (iso === null) return false;
    return f.fechaDesde <= iso && iso <= f.fechaHasta;
  });

  // 10. Palabras clave sobre el título
  if (f.palabrasClave.trim()) {
    const consulta = analizarConsultaPalabrasClave(f.palabrasClave);
    if (consultaTieneCriterios(consulta)) {
      r = r.filter((x) => tituloCumpleConsulta(x.titulo, consulta));
    }
  }

  return r;
}
