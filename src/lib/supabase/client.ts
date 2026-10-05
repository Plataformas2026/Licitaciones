import { createBrowserClient } from "@supabase/ssr";

/** Cliente de navegador: solo para iniciar y cerrar sesión. */
export function createClient() {
  // process.env.NEXT_PUBLIC_* debe escribirse literal para que Next lo inyecte en el bundle.
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
