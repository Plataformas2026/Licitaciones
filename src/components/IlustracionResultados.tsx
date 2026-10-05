/** Maqueta decorativa de resultados (datos de ejemplo, no reales). */
const FILAS = [
  { titulo: "Servicio de mantenimiento de equipos informáticos", relevancia: 94, nueva: true },
  { titulo: "Suministro de licencias de software y soporte técnico", relevancia: 88, nueva: false },
  { titulo: "Consultoría para la transformación digital de pymes", relevancia: 81, nueva: false },
];

export function IlustracionResultados() {
  return (
    <div aria-hidden="true" className="select-none space-y-3">
      {FILAS.map((f, i) => (
        <div
          key={f.titulo}
          className={`rounded-lg border px-4 py-3 ${
            f.nueva ? "border-emerald-400/40 bg-emerald-400/10" : "border-white/10 bg-white/[0.04]"
          }`}
          style={{ marginLeft: `${i * 1.25}rem` }}
        >
          <p className="text-sm leading-snug text-white/90">{f.titulo}</p>
          <div className="mt-2.5 flex items-center gap-3">
            <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/10">
              <span className="block h-full rounded-full bg-sky-400" style={{ width: `${f.relevancia}%` }} />
            </span>
            <span className="text-xs font-medium tabular-nums text-white/70">{f.relevancia} %</span>
          </div>
        </div>
      ))}
    </div>
  );
}
