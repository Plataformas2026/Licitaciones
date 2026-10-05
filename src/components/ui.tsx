import type { ReactNode } from "react";
import { IconoAlerta, IconoInfo, IconoOk } from "./icons.tsx";

export const campo =
  "w-full rounded-md border border-line bg-white px-3 py-2 text-sm text-ink placeholder:text-slate-400 shadow-[inset_0_1px_0_rgb(15_27_45/0.03)] focus:border-brand focus:outline-2 focus:outline-brand/30 disabled:cursor-not-allowed disabled:bg-paper disabled:text-slate-400";

export const etiqueta = "mb-1.5 block text-sm font-medium text-ink";

export const botonPrimario =
  "inline-flex items-center justify-center gap-2 rounded-md bg-brand px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-60";

export const botonSecundario =
  "inline-flex items-center justify-center gap-2 rounded-md border border-line bg-white px-5 py-2.5 text-sm font-semibold text-ink shadow-sm transition-colors hover:bg-paper disabled:cursor-not-allowed disabled:opacity-60";

export function Panel({
  titulo,
  children,
  className = "",
}: {
  titulo?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`rounded-xl border border-line bg-white shadow-[0_1px_2px_rgb(15_27_45/0.04)] ${className}`}>
      {titulo && (
        <h2 className="border-b border-line px-5 py-3 font-serif text-base font-semibold text-ink">{titulo}</h2>
      )}
      <div className="p-5">{children}</div>
    </section>
  );
}

const variantes = {
  ok: { caja: "border-emerald-200 bg-emerald-50 text-emerald-950", Icono: IconoOk, color: "text-emerald-700" },
  aviso: { caja: "border-amber-200 bg-amber-50 text-amber-950", Icono: IconoInfo, color: "text-amber-700" },
  error: { caja: "border-red-200 bg-red-50 text-red-950", Icono: IconoAlerta, color: "text-red-700" },
  info: { caja: "border-line bg-white text-ink", Icono: IconoInfo, color: "text-brand" },
} as const;

export function Aviso({
  tipo,
  children,
  rol,
}: {
  tipo: keyof typeof variantes;
  children: ReactNode;
  rol?: "alert" | "status";
}) {
  const { caja, Icono, color } = variantes[tipo];
  return (
    <div role={rol} className={`flex items-start gap-3 rounded-lg border px-4 py-3 text-sm leading-relaxed ${caja}`}>
      <Icono className={`mt-0.5 shrink-0 ${color}`} width="1.25em" height="1.25em" />
      <div>{children}</div>
    </div>
  );
}
