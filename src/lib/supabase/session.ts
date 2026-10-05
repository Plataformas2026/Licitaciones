import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getAuthEnv } from "./env.ts";

const PUBLICAS = ["/login"];

/** Solo rutas internas ("/algo"), nunca "//otro-sitio" ni URLs absolutas. */
export function destinoSeguro(next: string | null | undefined): string {
  if (!next || !next.startsWith("/") || next.startsWith("//") || next.startsWith("/\\")) return "/";
  if (next.startsWith("/login")) return "/";
  return next;
}

/**
 * Refresca la sesión en cada petición y decide:
 *  - sin sesión + página privada  -> redirige a /login (o 401 si es la API)
 *  - con sesión + /login          -> redirige a la página principal
 */
export async function actualizarSesion(request: NextRequest) {
  let response = NextResponse.next({ request });

  const { url, key } = getAuthEnv();
  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });

  // No insertes lógica entre createServerClient y getClaims().
  const { data } = await supabase.auth.getClaims();
  const autenticado = Boolean(data?.claims?.sub);

  const { pathname, search } = request.nextUrl;
  const esPublica = PUBLICAS.some((p) => pathname === p || pathname.startsWith(`${p}/`));

  const redirigir = (destino: string, params?: Record<string, string>) => {
    const u = request.nextUrl.clone();
    u.pathname = destino;
    u.search = "";
    for (const [k, v] of Object.entries(params ?? {})) u.searchParams.set(k, v);
    const r = NextResponse.redirect(u);
    // Conserva las cookies de sesión que haya refrescado Supabase.
    response.cookies.getAll().forEach((c) => r.cookies.set(c));
    return r;
  };

  if (!autenticado && !esPublica) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Sesión caducada. Vuelve a iniciar sesión." }, { status: 401 });
    }
    return redirigir("/login", pathname === "/" ? undefined : { next: pathname + search });
  }

  if (autenticado && pathname === "/login") {
    return redirigir(destinoSeguro(request.nextUrl.searchParams.get("next")));
  }

  return response;
}
