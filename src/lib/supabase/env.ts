/**
 * Credenciales de AUTENTICACIÓN (clave pública/anon, la que puede ir al navegador).
 * Son distintas de SUPABASE_URL / SUPABASE_KEY, que siguen usándose solo en el servidor para leer datos.
 */
export function getAuthEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    throw new Error(
      "Faltan NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY (necesarias para el inicio de sesión).",
    );
  }
  return { url, key };
}
