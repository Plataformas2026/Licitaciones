/**
 * Embedding de la consulta con el MISMO modelo que usa tu ingesta en Python
 * (intfloat/multilingual-e5-small, 384 dimensiones, prefijo "query: ").
 *
 * Se ejecuta en el propio servidor con Transformers.js (ONNX, cuantizado q8,
 * ~120 MB). El modelo se descarga de Hugging Face la primera vez que se
 * necesita en cada instancia fría y se guarda en /tmp (lo único escribible
 * en Vercel); el resto de búsquedas reutilizan el modelo en memoria.
 */
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { FeatureExtractionPipeline } from "@huggingface/transformers";

const MODELO = "Xenova/multilingual-e5-small";

let extractor: Promise<FeatureExtractionPipeline> | null = null;

function cargarExtractor(): Promise<FeatureExtractionPipeline> {
  if (!extractor) {
    extractor = (async () => {
      const { pipeline, env } = await import("@huggingface/transformers");
      env.cacheDir = join(tmpdir(), "transformers-cache");
      env.allowLocalModels = false;
      return (await pipeline("feature-extraction", MODELO, {
        dtype: "q8",
      })) as FeatureExtractionPipeline;
    })();
    // Si falla la descarga, permitir reintento en la siguiente petición.
    extractor.catch(() => {
      extractor = null;
    });
  }
  return extractor;
}

export async function embeberConsulta(texto: string): Promise<number[]> {
  let modelo: FeatureExtractionPipeline;
  try {
    modelo = await cargarExtractor();
  } catch (e) {
    const detalle = e instanceof Error ? e.message : String(e);
    throw new Error(`No se pudo cargar el modelo de embeddings (${MODELO}): ${detalle}`);
  }
  const salida = await modelo(`query: ${texto.trim()}`, {
    pooling: "mean",
    normalize: true,
  });
  return Array.from(salida.data as Float32Array);
}
