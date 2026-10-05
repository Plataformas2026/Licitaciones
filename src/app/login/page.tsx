import type { Metadata } from "next";
import { FormularioLogin } from "@/components/FormularioLogin.tsx";
import { IlustracionResultados } from "@/components/IlustracionResultados.tsx";
import { Marca } from "@/components/icons.tsx";
import { destinoSeguro } from "@/lib/supabase/session.ts";

export const metadata: Metadata = { title: "Iniciar sesión · Buscador inteligente de Licitaciones" };

export default async function Login({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;

  return (
    <div className="grid min-h-dvh lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)]">
      {/* Panel de marca */}
      <aside className="hidden flex-col justify-between bg-ink px-12 py-12 text-white lg:flex xl:px-20">
        <div className="flex items-center gap-3">
          <Marca tamano={36} />
          <span className="font-serif text-lg font-semibold">Buscador inteligente</span>
        </div>

        <div className="max-w-xl">
          <h1 className="font-serif text-4xl font-semibold leading-[1.15] tracking-tight xl:text-[2.75rem]">
            Todas las licitaciones públicas, en un solo buscador.
          </h1>
          <p className="mt-5 max-w-md text-base leading-relaxed text-white/70">
            Busca por significado o por palabras clave en PLACSP, TED y los portales autonómicos, y filtra por
            importe, lugar, sector CPV y plazo.
          </p>
          <div className="mt-12">
            <IlustracionResultados />
          </div>
        </div>

        <p className="text-sm text-white/50">Acceso restringido a usuarios autorizados.</p>
      </aside>

      {/* Formulario */}
      <main className="flex flex-col justify-center bg-white px-6 py-12 sm:px-12">
        <div className="mx-auto w-full max-w-sm">
          <div className="mb-10 flex items-center gap-3 lg:hidden">
            <Marca />
            <span className="font-serif text-lg font-semibold">Buscador inteligente</span>
          </div>

          <h2 className="font-serif text-3xl font-semibold tracking-tight text-ink">Iniciar sesión</h2>
          <p className="mt-2 text-sm text-muted">Introduce tus credenciales para acceder al buscador.</p>

          <div className="mt-8">
            <FormularioLogin destino={destinoSeguro(next)} />
          </div>
        </div>
      </main>
    </div>
  );
}
