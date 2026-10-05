/**
 * Comprueba que el port a TypeScript da los mismos resultados que las funciones
 * originales de app.py (palabras clave y filtros). Los valores esperados están en
 * fixtures/parity.json, generados ejecutando el código Python original.
 *
 *   npm run test:parity
 */
import { readFileSync } from "node:fs";
import { aplicarFiltros } from "../src/lib/filters.ts";
import { analizarConsultaPalabrasClave, tituloCumpleConsulta } from "../src/lib/keywords.ts";
import type { Filtros, Licitacion } from "../src/lib/types.ts";

const fx = JSON.parse(readFileSync(new URL("./fixtures/parity.json", import.meta.url), "utf-8"));

let fallos = 0;
const fallar = (msg: string) => {
  fallos++;
  console.error("✗", msg);
};

// 1. Palabras clave
for (const c of fx.keywords as { query: string; titulo: string; expected: boolean }[]) {
  const obtenido = tituloCumpleConsulta(c.titulo, analizarConsultaPalabrasClave(c.query));
  if (obtenido !== c.expected) fallar(`palabras clave ${JSON.stringify(c.query)} sobre ${JSON.stringify(c.titulo)}: esperado ${c.expected}, obtenido ${obtenido}`);
}
console.log(`Palabras clave: ${fx.keywords.length} casos revisados`);

// 2. Filtros
const base: Filtros = {
  consulta: "", palabrasClave: "", fuentes: [], tiposContrato: [], importeMin: 0, importeMax: 0,
  ccaa: [], lugarLibre: "", sectoresCpv: [], codigoCpv: "",
  fechaCierreTope: "2026-03-01", fechaDesde: "2026-01-01", fechaHasta: "2030-12-31",
  mostrarTodos: true, limite: 10,
};
const filas = (fx.filtros.rows as Licitacion[]).map((r, i) => ({ ...r, __i: i }));
for (const caso of fx.filtros.cases as { filtros: Partial<Filtros>; expected: number[] }[]) {
  const obtenido = aplicarFiltros(filas, { ...base, ...caso.filtros }).map((r) => (r as unknown as { __i: number }).__i);
  if (JSON.stringify(obtenido) !== JSON.stringify(caso.expected)) {
    fallar(`filtros ${JSON.stringify(caso.filtros)}: esperado [${caso.expected}], obtenido [${obtenido}]`);
  }
}
console.log(`Filtros: ${fx.filtros.cases.length} combinaciones revisadas`);

// 3. Formato de importe
const fmt = new Intl.NumberFormat("es-ES", { minimumFractionDigits: 2, maximumFractionDigits: 2, useGrouping: "always" });
for (const c of fx.importes as { valor: number; expected: string }[]) {
  const obtenido = `${fmt.format(c.valor)} €`;
  if (obtenido !== c.expected) fallar(`importe ${c.valor}: esperado "${c.expected}", obtenido "${obtenido}"`);
}
console.log(`Importes: ${fx.importes.length} casos revisados`);

if (fallos > 0) {
  console.error(`\n${fallos} diferencias con el código original`);
  process.exit(1);
}
console.log("\n✓ Idéntico al comportamiento de app.py");
