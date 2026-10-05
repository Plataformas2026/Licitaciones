import type { NextRequest } from "next/server";
import { actualizarSesion } from "@/lib/supabase/session.ts";

// En Next.js 16 el antiguo `middleware.ts` se llama `proxy.ts`.
export async function proxy(request: NextRequest) {
  return actualizarSesion(request);
}

export const config = {
  matcher: [
    // Todo salvo estáticos de Next, favicon e iconos (menos invocaciones en el plan gratuito).
    "/((?!_next/static|_next/image|favicon.ico|icon.svg|.*\\.(?:svg|png|jpg|jpeg|gif|webp|woff2?)$).*)",
  ],
};
