import { Buscador } from "@/components/Buscador.tsx";

// Ayer en hora de Canarias (valor por defecto de "Fecha fin de presentación").
function ayer(): string {
  const hoy = new Date().toLocaleDateString("sv-SE", { timeZone: "Atlantic/Canary" });
  const [a, m, d] = hoy.split("-").map(Number);
  return new Date(Date.UTC(a, m - 1, d - 1)).toISOString().slice(0, 10);
}

// Se calcula en cada petición; si no, Next lo fijaría en el momento del build.
export const dynamic = "force-dynamic";

export default function Home() {
  return (
    <main className="mx-auto max-w-[1400px] px-4 py-8 sm:px-6">
      <h1 className="mb-6 text-3xl font-bold tracking-tight text-slate-900">
        🔍 Buscador inteligente de Licitaciones
      </h1>
      <Buscador cierreInicial={ayer()} />
    </main>
  );
}
