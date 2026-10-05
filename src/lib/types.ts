export type Modo = "buscar" | "novedades";

/** Filtros que envía el formulario (equivalen a los widgets de Streamlit). */
export interface Filtros {
  consulta: string;
  palabrasClave: string;
  fuentes: string[];
  tiposContrato: string[];
  importeMin: number;
  importeMax: number;
  ccaa: string[];
  lugarLibre: string;
  sectoresCpv: string[];
  codigoCpv: string;
  /** YYYY-MM-DD */
  fechaCierreTope: string;
  /** YYYY-MM-DD */
  fechaDesde: string;
  /** YYYY-MM-DD */
  fechaHasta: string;
  mostrarTodos: boolean;
  limite: number;
}

/** Fila tal y como vive en la tabla `licitaciones` de Supabase. */
export interface Licitacion {
  titulo: string | null;
  organo: string | null;
  fecha: string | null;
  importe: number | string | null;
  enlace: string | null;
  lugar_ejecucion: string | null;
  fecha_fin: string | null;
  cpv: string | null;
  fuente: string | null;
  tipo_contrato: string | null;
  es_novedad?: boolean | null;
  es_actualizada?: boolean | null;
  /** Solo viene del RPC `buscar_licitaciones`. */
  similarity?: number | null;
}

/** Fila lista para pintar en la tabla del navegador. */
export interface FilaResultado {
  titulo: string;
  organo: string;
  tipoContrato: string;
  lugar: string;
  cierre: string;
  fechaPub: string;
  /** Importe ya formateado (1.234,56 €). */
  importe: string;
  enlace: string;
  /** Relevancia ya formateada (87.50 %). */
  relevancia: string;
  esNovedad: boolean;
  esActualizada: boolean;
}

export interface RespuestaBusqueda {
  /**
   * ok                -> hay filas que mostrar
   * sin_datos         -> la consulta a Supabase no devolvió nada
   * sin_coincidencias -> hubo datos pero los filtros los eliminaron todos
   */
  estado: "ok" | "sin_datos" | "sin_coincidencias";
  /** Total encontrado tras aplicar filtros, antes de recortar por "número de resultados". */
  total: number;
  filas: FilaResultado[];
  /** true si se recortó por MAX_FILAS_RESPUESTA (límite de respuesta de Vercel). */
  truncado: boolean;
}
