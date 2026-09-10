import type { ButtonHTMLAttributes, ReactNode } from 'react'

type Variant = 'primary' | 'ghost' | 'volt' | 'ampere' | 'danger'
type Size = 'sm' | 'md' | 'lg'

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  children: ReactNode
}

const VARIANTS: Record<Variant, string> = {
  primary:
    'bg-gradient-to-b from-lime-400 to-lime-500 text-slate-900 border-none shadow-[0_8px_20px_rgba(101,163,13,0.3),inset_0_3px_6px_rgba(255,255,255,0.7),inset_0_-3px_6px_rgba(0,0,0,0.15)] hover:from-lime-300 hover:to-lime-400 active:shadow-[0_2px_6px_rgba(101,163,13,0.3),inset_0_3px_6px_rgba(0,0,0,0.2)]',
  ghost:
    'bg-white text-slate-700 border-none shadow-[0_6px_16px_rgba(148,163,184,0.2),inset_0_2px_4px_rgba(255,255,255,0.9),inset_0_-2px_4px_rgba(148,163,184,0.2)] hover:bg-slate-50 active:shadow-[inset_0_2px_5px_rgba(0,0,0,0.1)]',
  volt: 'bg-gradient-to-b from-amber-300 to-amber-500 text-slate-950 border-none shadow-[0_8px_20px_rgba(217,119,6,0.35),inset_0_3px_6px_rgba(255,255,255,0.75),inset_0_-3px_6px_rgba(0,0,0,0.15)] hover:from-amber-200 hover:to-amber-400 active:shadow-[0_2px_6px_rgba(217,119,6,0.3),inset_0_3px_6px_rgba(0,0,0,0.2)]',
  ampere:
    'bg-gradient-to-b from-cyan-300 to-cyan-500 text-slate-950 border-none shadow-[0_8px_20px_rgba(8,145,178,0.35),inset_0_3px_6px_rgba(255,255,255,0.75),inset_0_-3px_6px_rgba(0,0,0,0.15)] hover:from-cyan-200 hover:to-cyan-400 active:shadow-[0_2px_6px_rgba(8,145,178,0.3),inset_0_3px_6px_rgba(0,0,0,0.2)]',
  danger:
    'bg-gradient-to-b from-rose-400 to-rose-600 text-white border-none shadow-[0_8px_20px_rgba(225,29,72,0.3),inset_0_3px_6px_rgba(255,255,255,0.6),inset_0_-3px_6px_rgba(0,0,0,0.2)] hover:from-rose-300 hover:to-rose-500 active:shadow-[0_2px_6px_rgba(225,29,72,0.3),inset_0_3px_6px_rgba(0,0,0,0.25)]',
}

const SIZES: Record<Size, string> = {
  sm: 'px-4 py-2 text-sm rounded-full',
  md: 'px-6 py-3 text-base rounded-full',
  lg: 'px-9 py-4 text-xl rounded-full',
}

export function Button({ variant = 'primary', size = 'md', className = '', ...rest }: Props) {
  return (
    <button
      {...rest}
      className={`inline-flex items-center justify-center gap-2 border font-semibold tracking-wide transition-all duration-150 active:translate-y-[2px] disabled:cursor-not-allowed disabled:opacity-40 disabled:active:translate-y-0 ${VARIANTS[variant]} ${SIZES[size]} ${className}`}
    />
  )
}
