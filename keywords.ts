/**
 * Port 1:1 de la sintaxis del campo "Palabras clave" de app.py:
 *   "frase exacta"   frase contigua en el título
 *   -"frase"         exclusión obligatoria de frase
 *   palabra          palabra (o su plural regular)
 *   -palabra         exclusión obligatoria de palabra
 *   AND / OR         AND liga más fuerte que OR; sin operador = OR
 */

const LETRAS = "a-zA-ZáéíóúüñÁÉÍÓÚÜÑ";

export type Termino =
  | { tipo: "palabra"; valor: string }
  | { tipo: "frase"; valor: string[] };

export interface ConsultaPalabrasClave {
  gruposIncluir: Termino[][];
  frasesExcluir: string[][];
  palabrasExcluir: string[];
}

export function tokenizarPalabras(texto: string | null | undefined): string[] {
  if (!texto) return [];
  return texto.match(new RegExp(`[${LETRAS}]+`, "g")) ?? [];
}

/** Variantes singular/plural más probables en español (heurística, no lematizador). */
export function formasSingularPlural(palabra: string): Set<string> {
  const p = palabra.toLowerCase().trim();
  const formas = new Set<string>([p]);

  if (p.length < 4) return formas;

  if (p.endsWith("z")) formas.add(p.slice(0, -1) + "ces");
  if (p.endsWith("ces") && p.length > 4) formas.add(p.slice(0, -3) + "z");

  if (p.endsWith("s")) {
    formas.add(p.slice(0, -1));
    if (p.endsWith("es")) formas.add(p.slice(0, -2));
  } else {
    formas.add(p + "s");
    formas.add(p + "es");
  }

  return formas;
}

function seIntersectan(a: Set<string>, b: Set<string>): boolean {
  for (const x of a) if (b.has(x)) return true;
  return false;
}

export function analizarConsultaPalabrasClave(texto: string): ConsultaPalabrasClave {
  const frasesExcluir: string[][] = [];
  const palabrasExcluir: string[] = [];
  const marcadoresFrase = new Map<string, string[]>();

  const textoSinFrases = texto.replace(
    /(-?)"([^"]*)"/g,
    (_coincidencia, signo: string, contenido: string) => {
      const palabrasFrase = tokenizarPalabras(contenido);
      if (palabrasFrase.length === 0) return " ";
      if (signo === "-") {
        frasesExcluir.push(palabrasFrase);
        return " ";
      }
      const marcador = `__FRASE${marcadoresFrase.size}__`;
      marcadoresFrase.set(marcador, palabrasFrase);
      return ` ${marcador} `;
    },
  );

  const gruposIncluir: Termino[][] = [];
  let grupoActual: Termino[] = [];
  let operadorPendiente: "AND" | "OR" = "OR";

  const patronTokens = new RegExp(
    `(-?)(\\bAND\\b|\\bOR\\b|__FRASE\\d+__|[${LETRAS}]+)`,
    "g",
  );

  for (const m of textoSinFrases.matchAll(patronTokens)) {
    const signo = m[1];
    const token = m[2];

    if (token === "AND" || token === "OR") {
      operadorPendiente = token;
      continue;
    }

    let termino: Termino;
    const frase = marcadoresFrase.get(token);
    if (frase) {
      termino = { tipo: "frase", valor: frase };
    } else if (signo === "-") {
      palabrasExcluir.push(token);
      continue;
    } else {
      termino = { tipo: "palabra", valor: token };
    }

    if (grupoActual.length === 0) {
      grupoActual = [termino];
    } else if (operadorPendiente === "AND") {
      grupoActual.push(termino);
    } else {
      gruposIncluir.push(grupoActual);
      grupoActual = [termino];
    }

    operadorPendiente = "OR";
  }

  if (grupoActual.length > 0) gruposIncluir.push(grupoActual);

  return { gruposIncluir, frasesExcluir, palabrasExcluir };
}

function contieneFrase(
  formasTituloPorPosicion: Set<string>[],
  palabrasFrase: string[],
): boolean {
  if (palabrasFrase.length === 0) return false;

  const formasFrase = palabrasFrase.map(formasSingularPlural);
  const totalFrase = formasFrase.length;
  const totalTitulo = formasTituloPorPosicion.length;

  for (let inicio = 0; inicio <= totalTitulo - totalFrase; inicio++) {
    let todas = true;
    for (let i = 0; i < totalFrase; i++) {
      if (!seIntersectan(formasFrase[i], formasTituloPorPosicion[inicio + i])) {
        todas = false;
        break;
      }
    }
    if (todas) return true;
  }
  return false;
}

function tituloCoincideTermino(
  porPosicion: Set<string>[],
  planas: Set<string>,
  termino: Termino,
): boolean {
  if (termino.tipo === "frase") return contieneFrase(porPosicion, termino.valor);
  return seIntersectan(formasSingularPlural(termino.valor), planas);
}

export function tituloCumpleConsulta(
  titulo: string | null | undefined,
  consulta: ConsultaPalabrasClave,
): boolean {
  if (!titulo) return false;

  const porPosicion = tokenizarPalabras(titulo).map(formasSingularPlural);

  for (const frase of consulta.frasesExcluir) {
    if (contieneFrase(porPosicion, frase)) return false;
  }

  const planas = new Set<string>();
  for (const formas of porPosicion) for (const f of formas) planas.add(f);

  for (const palabra of consulta.palabrasExcluir) {
    if (seIntersectan(formasSingularPlural(palabra), planas)) return false;
  }

  if (consulta.gruposIncluir.length > 0) {
    const cumpleAlguno = consulta.gruposIncluir.some((grupo) =>
      grupo.every((t) => tituloCoincideTermino(porPosicion, planas, t)),
    );
    if (!cumpleAlguno) return false;
  }

  return true;
}

export function consultaTieneCriterios(c: ConsultaPalabrasClave): boolean {
  return (
    c.gruposIncluir.length > 0 ||
    c.frasesExcluir.length > 0 ||
    c.palabrasExcluir.length > 0
  );
}
