interface Props {
  remaining: number
  total: number
  label?: string
  className?: string
}

export function Timer({ remaining, total, label, className = '' }: Props) {
  const pct = total > 0 ? Math.max(0, Math.min(100, (remaining / total) * 100)) : 0
  const urgent = remaining <= Math.max(5, total * 0.3)

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {label && (
        <span className="font-display text-xs font-black uppercase tracking-widest text-slate-700">
          {label}
        </span>
      )}
      <div className="relative h-4 w-32 md:w-44 overflow-hidden rounded-full bg-slate-200/90 border-2 border-slate-300 shadow-inner">
        <div
          className={`h-full rounded-full transition-[width] duration-150 ease-linear ${
            urgent
              ? 'bg-gradient-to-r from-rose-600 to-rose-500 shadow-[0_0_12px_rgba(244,63,94,0.8)]'
              : 'bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-400'
          }`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <div
        className={`flex items-center gap-1.5 rounded-2xl px-3.5 py-1 font-display text-lg md:text-xl font-black tabular-nums border-2 shadow-sm transition-all ${
          urgent
            ? 'border-rose-500 bg-rose-50 text-rose-600 ring-2 ring-rose-400/50 animate-pulse'
            : 'border-slate-300 bg-white text-slate-900'
        }`}
      >
        <span className="text-base">⏱️</span>
        <span>{Math.ceil(remaining)}s</span>
      </div>
    </div>
  )
}
