import { Marca } from "./icons.tsx";
import { BotonSalir } from "./BotonSalir.tsx";

export function Cabecera({ email }: { email: string }) {
  return (
    <header className="border-b border-line bg-white">
      <div className="mx-auto flex max-w-[1400px] items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <div className="flex items-center gap-3">
          <Marca />
          <p className="font-serif text-lg font-semibold leading-tight text-ink">
            Buscador inteligente
          </p>
        </div>
        <div className="flex items-center gap-3 text-sm">
          {email && <span className="hidden max-w-64 truncate text-muted sm:block">{email}</span>}
          <BotonSalir />
        </div>
      </div>
    </header>
  );
}
