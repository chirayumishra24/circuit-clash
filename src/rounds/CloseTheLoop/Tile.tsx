import type { Cell } from './puzzles'
import { BASE_SIDES, isRotatable } from './puzzles'

const SIZE = 100
const MID = SIZE / 2

/** Centre-to-edge stub for a connector on side `d` (0=N,1=E,2=S,3=W), at rotation 0. */
const STUB: Record<number, string> = {
  0: `M ${MID} ${MID} L ${MID} 0`,
  1: `M ${MID} ${MID} L ${SIZE} ${MID}`,
  2: `M ${MID} ${MID} L ${MID} ${SIZE}`,
  3: `M ${MID} ${MID} L 0 ${MID}`,
}

interface Props {
  cell: Cell
  live: boolean
  hinted: boolean
  onClick: () => void
  disabled: boolean
}

export function Tile({ cell, live, hinted, onClick, disabled }: Props) {
  const sides = BASE_SIDES[cell.type]
  const rotatable = isRotatable(cell)
  const wireColor = live ? '#16a34a' : '#64748b'
  const wireWidth = live ? 14 : 10

  if (cell.type === 'empty') {
    return <div className="aspect-square w-full rounded-2xl border-2 border-dashed border-slate-200 bg-slate-100/50" />
  }

  return (
    <button
      onClick={onClick}
      disabled={disabled || !rotatable}
      title={
        cell.type === 'switch'
          ? 'Click to toggle switch'
          : rotatable
            ? 'Click to rotate tile'
            : undefined
      }
      className={`relative aspect-square w-full rounded-2xl p-1 transition-all duration-200 ${
        hinted
          ? 'bg-amber-50 border-3 border-amber-400 ring-4 ring-amber-300/80 shadow-lg scale-105 z-10'
          : live
            ? 'bg-emerald-50/90 border-2 border-emerald-300 shadow-[0_6px_14px_rgba(16,185,129,0.22),inset_0_2px_4px_rgba(255,255,255,0.9)]'
            : 'bg-white border-2 border-slate-200 shadow-[0_4px_8px_rgba(15,23,42,0.06),inset_0_2px_4px_rgba(255,255,255,0.9)]'
      } ${
        rotatable && !disabled
          ? 'cursor-pointer hover:border-amber-400 hover:shadow-[0_8px_18px_rgba(245,158,11,0.25)] active:scale-95 active:translate-y-0.5'
          : 'cursor-default'
      }`}
    >
      <svg
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        className="h-full w-full transition-transform duration-300 ease-out"
        style={{ transform: `rotate(${cell.rot * 90}deg)` }}
      >
        {/* Wire stubs */}
        {sides.map((d) => (
          <path
            key={d}
            d={STUB[d]}
            stroke={wireColor}
            strokeWidth={wireWidth}
            strokeLinecap="round"
            fill="none"
          />
        ))}

        {live && (
          <g>
            {sides.map((d) => (
              <path
                key={`f${d}`}
                d={STUB[d]}
                stroke="#bbf7d0"
                strokeWidth={6}
                strokeLinecap="round"
                fill="none"
                strokeDasharray="6 14"
                style={{ animation: 'flow-dash 1.0s linear infinite' }}
              />
            ))}
          </g>
        )}

        {cell.type === 'source' && <Battery />}
        {cell.type === 'bulb' && <Bulb lit={live} />}
        {cell.type === 'switch' && <Switch closed={cell.closed !== false} live={live} />}
        {(cell.type === 'tee' || cell.type === 'cross' || cell.type === 'elbow') && (
          <circle cx={MID} cy={MID} r={8} fill={live ? '#16a34a' : '#64748b'} />
        )}

        {/* Terminal edge connection rivets — skip on bulb/source (their icons are enough) */}
        {cell.type !== 'bulb' && cell.type !== 'source' && sides.map((d) => {
          const cx = d === 1 ? SIZE - 3 : d === 3 ? 3 : MID
          const cy = d === 2 ? SIZE - 3 : d === 0 ? 3 : MID
          return (
            <circle
              key={`term-${d}`}
              cx={cx}
              cy={cy}
              r={live ? 7 : 5}
              fill={live ? '#22c55e' : '#d97706'}
              stroke={live ? '#86efac' : '#92400e'}
              strokeWidth={2}
            />
          )
        })}
      </svg>
    </button>
  )
}

function Battery() {
  return (
    <g>
      <rect x={28} y={24} width={44} height={52} rx={8} fill="#ffffff" stroke="#d97706" strokeWidth={5} />
      <rect x={40} y={15} width={20} height={10} rx={3} fill="#d97706" />
      <line x1={36} y1={44} x2={64} y2={44} stroke="#d97706" strokeWidth={6} strokeLinecap="round" />
      <line x1={42} y1={58} x2={58} y2={58} stroke="#d97706" strokeWidth={6} strokeLinecap="round" />
      <text x={20} y={18} fontSize={22} fontWeight="900" fill="#b45309">
        +
      </text>
      <text x={72} y={18} fontSize={24} fontWeight="900" fill="#475569">
        −
      </text>
    </g>
  )
}

function Bulb({ lit }: { lit: boolean }) {
  return (
    <g>
      {lit && <circle cx={MID} cy={MID} r={36} fill="#fde68a" opacity={0.65} />}
      <circle
        cx={MID}
        cy={MID}
        r={22}
        fill={lit ? '#fef08a' : '#f8fafc'}
        stroke={lit ? '#d97706' : '#64748b'}
        strokeWidth={5}
      />
      <path
        d={`M ${MID - 10} ${MID + 5} L ${MID - 3} ${MID - 6} L ${MID + 3} ${MID + 5} L ${MID + 10} ${MID - 6}`}
        stroke={lit ? '#92400e' : '#475569'}
        strokeWidth={4}
        fill="none"
        strokeLinecap="round"
      />
    </g>
  )
}

function Switch({ closed, live }: { closed: boolean; live: boolean }) {
  return (
    <g>
      <circle cx={28} cy={MID} r={7} fill={live ? '#16a34a' : '#64748b'} />
      <circle cx={72} cy={MID} r={7} fill={live ? '#16a34a' : '#64748b'} />
      <line
        x1={28}
        y1={MID}
        x2={closed ? 72 : 64}
        y2={closed ? MID : MID - 28}
        stroke={closed ? (live ? '#16a34a' : '#64748b') : '#e11d48'}
        strokeWidth={9}
        strokeLinecap="round"
      />
      {!closed && (
        <text x={MID} y={90} fontSize={16} fontWeight="900" fill="#e11d48" textAnchor="middle">
          OPEN
        </text>
      )}
    </g>
  )
}
