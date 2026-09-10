interface Props {
  remaining: number
  total: number
  label?: string
}

export function Timer({ remaining, total, label }: Props) {
  const pct = total > 0 ? Math.max(0, Math.min(100, (remaining / total) * 100)) : 0
  const urgent = remaining <= 10

  return (
    <div className="flex items-center gap-3">
      {label && (
        <span className="font-display text-xs font-black uppercase tracking-widest text-slate-700">
          {label}
        </span>
      )}
      <div className="relative h-3.5 w-40 overflow-hidden rounded-full bg-slate-200 border border-slate-300 shadow-inner">
        <div
          className={`h-full rounded-full transition-[width] duration-100 ease-linear ${
            urgent ? 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.6)]' : 'bg-emerald-500'
          }`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span
        className={`w-12 text-right font-display text-xl font-black tabular-nums ${
          urgent ? 'text-rose-600 animate-pulse' : 'text-slate-950'
        }`}
      >
        {Math.ceil(remaining)}s
      </span>
    </div>
  )
}
