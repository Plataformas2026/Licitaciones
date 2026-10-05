import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getAuthEnv } from "./env.ts";

/** Cliente de servidor con la sesión del usuario (Server Components y route handlers). */
export async function createClient() {
  const { url, key } = getAuthEnv();
  const cookieStore = await cookies();

  return createServerClient(url, key, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // Llamado desde un Server Component: el proxy ya refresca la sesión.
        }
      },
    },
  });
}

/** Devuelve el id y el email del usuario con sesión válida, o null. */
export async function getUsuario(): Promise<{ id: string; email: string } | null> {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;
  if (!claims?.sub) return null;
  return { id: claims.sub, email: typeof claims.email === "string" ? claims.email : "" };
}
