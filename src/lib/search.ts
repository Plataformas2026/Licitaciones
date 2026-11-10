import { MAX_FILAS_RESPUESTA } from "./constants.ts";
import { embeberConsulta } from "./embeddings.ts";
import { aplicarFiltros } from "./filters.ts";
import { getSupabase } from "./supabase.ts";
import type {
  Filtros,
  FilaResultado,
  Licitacion,
  Modo,
  RespuestaBusqueda,
} from "./types.ts";

// Se omite `texto_completo`: la app original lo descargaba pero nunca lo usaba,
// y es la columna más pesada.
const COLUMNAS =
  "titulo, organo, fecha, importe, enlace, lugar_ejecucion, fecha_fin, cpv, fuente, tipo_contrato, es_novedad, es_actualizada";

const TAM_LOTE = 1000;
const LOTES_EN_PARALELO = 4;

function diaSiguiente(iso: string): string {
  const [a, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(a, m - 1, d + 1)).toISOString().slice(0, 10);
}

const esIso = (s: string) => /^\d{4}-\d{2}-\d{2}$/.test(s);

/**
 * Similitud mínima para mostrar un resultado de la búsqueda por texto («¿Qué tipo de licitación buscas?»).
 * Misma escala 0-1 que devuelve el RPC (la relevancia en % es similarity * 100), es decir, 70 %.
 */
const UMBRAL_SIMILITUD = 0.7;

/**
 * La base de datos cancela las consultas que superan su `statement_timeout` (3 s con la clave anon, 8 s con el resto).
 * La primera búsqueda tras un rato sin uso las pilla con la caché fría y puede cancelarse; la repetición ya va en caliente.
 * En lugar de pedir al usuario que vuelva a pulsar, el RPC se repite aquí, solo ante errores transitorios y con tope.
 */
const INTENTOS_RPC = 3;
const ESPERA_RPC_MS = 1500;
const PRESUPUESTO_MS = 40_000; // no empezar otro intento si ya se han gastado 40 s (maxDuration de la ruta = 60 s)

const esErrorTransitorio = (e: { code?: string; message?: string }) =>
  e.code === "57014" ||
  /statement timeout|canceling statement|timeout|timed out|fetch failed|network|econnreset|socket hang up|\b50[234]\b/i.test(
    e.message ?? "",
  );

/** Búsqueda semántica: mismo RPC `buscar_licitaciones` que usaba Streamlit. */
async function buscarPorVectores(consulta: string): Promise<Licitacion[]> {
  const inicio = Date.now();
  const vector = await embeberConsulta(consulta); // el modelo se espera una sola vez; los reintentos solo repiten el RPC

  for (let intento = 1; ; intento++) {
    const { data, error } = await getSupabase().rpc("buscar_licitaciones", {
      query_embedding: vector,
      match_threshold: 0.2,
      match_count: 999999,
    });

    if (!error) {
      // Sin similitud informada no se puede descartar: se trata igual que en aFila() (100 %).
      return ((data ?? []) as Licitacion[]).filter(
        (x) => x.similarity == null || Number(x.similarity) >= UMBRAL_SIMILITUD,
      );
    }

    console.warn(
      `[buscar_licitaciones] intento ${intento}/${INTENTOS_RPC} fallido (${error.code || "sin código"}): ${error.message}`,
    );

    // Un error que no es transitorio (función inexistente, permisos...) se muestra tal cual: no se repite ni se oculta.
    if (!esErrorTransitorio(error)) throw new Error(`Error en la búsqueda vectorial: ${error.message}`);

    if (intento >= INTENTOS_RPC || Date.now() - inicio > PRESUPUESTO_MS) {
      throw new Error(
        `Por favor, vuelva a realizar la búsqueda. El proceso anterior ha tardado más de lo previsto. (${error.message})`,
      );
    }
    await new Promise((resolver) => setTimeout(resolver, ESPERA_RPC_MS * intento));
  }
}

/** Lectura paginada de la tabla (sin consulta de texto). */
async function leerTabla(modo: Modo, f: Filtros): Promise<Licitacion[]> {
  const sb = getSupabase();

  const pedirLote = async (desde: number): Promise<Licitacion[]> => {
    let q = sb.from("licitaciones").select(COLUMNAS);

    if (modo === "novedades") q = q.or("es_novedad.eq.true,es_actualizada.eq.true");

    // Filtros que se resuelven en la propia base de datos para descargar menos filas.
    // Después se vuelven a aplicar en aplicarFiltros(), así que el resultado es el mismo.
    if (f.importeMin > 0) q = q.gte("importe", f.importeMin);
    if (f.importeMax > 0) q = q.lte("importe", f.importeMax);
    if (esIso(f.fechaDesde)) q = q.gte("fecha", f.fechaDesde);
    if (esIso(f.fechaHasta)) q = q.lt("fecha", diaSiguiente(f.fechaHasta));

    const { data, error } = await q
      .order("fecha", { ascending: false })
      .range(desde, desde + TAM_LOTE - 1);
    if (error) throw new Error(`Error al leer Supabase: ${error.message}`);
    return (data ?? []) as Licitacion[];
  };

  const todos: Licitacion[] = [];
  let inicio = 0;
  let terminado = false;

  while (!terminado) {
    const lotes = await Promise.all(
      Array.from({ length: LOTES_EN_PARALELO }, (_, i) =>
        pedirLote(inicio + i * TAM_LOTE),
      ),
    );
    for (const filas of lotes) {
      todos.push(...filas);
      if (filas.length < TAM_LOTE) {
        terminado = true;
        break;
      }
    }
    inicio += LOTES_EN_PARALELO * TAM_LOTE;
  }
  return todos;
}

/** 1234.5 -> "1.234,50 €" (mismo formato que la app original). */
const formatoImporte = new Intl.NumberFormat("es-ES", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
  useGrouping: "always",
});

function aFila(x: Licitacion): FilaResultado {
  const importe = x.importe === null || x.importe === undefined || x.importe === "" ? NaN : Number(x.importe);
  const similitud = x.similarity ?? null;
  const relevancia = similitud === null ? 100 : Math.round(similitud * 10000) / 100;

  return {
    titulo: x.titulo ?? "",
    organo: x.organo ?? "",
    tipoContrato: x.tipo_contrato ?? "No especificado",
    lugar: x.lugar_ejecucion ?? "No especificado",
    cierre: x.fecha_fin ?? "No especificada",
    fechaPub: x.fecha ?? "",
    importe: Number.isNaN(importe) ? "No especificado" : `${formatoImporte.format(importe)} €`,
    enlace: x.enlace ?? "",
    relevancia: `${relevancia.toFixed(2)} %`,
    esNovedad: x.es_novedad === true,
    esActualizada: x.es_actualizada === true,
  };
}

export async function ejecutarBusqueda(
  modo: Modo,
  f: Filtros,
): Promise<RespuestaBusqueda> {
  const hayConsulta = f.consulta.trim().length > 0;

  let filas = hayConsulta ? await buscarPorVectores(f.consulta) : await leerTabla(modo, f);

  if (filas.length === 0) {
    return { estado: "sin_datos", total: 0, filas: [], truncado: false };
  }

  if (modo === "novedades") {
    filas = filas.filter((x) => x.es_novedad === true || x.es_actualizada === true);
  }

  // Sin consulta de texto no hay similitud: relevancia 100 %, como en Streamlit.
  if (!hayConsulta) filas = filas.map((x) => ({ ...x, similarity: 1 }));

  filas = aplicarFiltros(filas, f);

  if (filas.length === 0) {
    return { estado: "sin_coincidencias", total: 0, filas: [], truncado: false };
  }

  const total = filas.length;
  if (!f.mostrarTodos) filas = filas.slice(0, f.limite);

  const truncado = filas.length > MAX_FILAS_RESPUESTA;
  if (truncado) filas = filas.slice(0, MAX_FILAS_RESPUESTA);

  return { estado: "ok", total, filas: filas.map(aFila), truncado };
}
