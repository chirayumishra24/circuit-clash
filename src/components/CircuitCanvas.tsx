import type { Circuit, Component, SimResult } from '../sim/circuit'

/**
 * Draws a Circuit as a schematic: battery on the left, an optional series `main` section
 * along the top, then the parallel branches stacked between two bus bars. Bulb glow is
 * driven straight from the simulator, so what students see is what the model computed.
 */

const RAIL_GAP = 78
const LEFT_BUS = 250
const RIGHT_BUS = 620
const TOP = 54

interface Props {
  circuit: Circuit
  sim: SimResult
  /** Component ids to outline — a sabotage being pointed at, or a selected part. */
  highlight?: string[]
  onComponentClick?: (component: Component) => void
  /** Extra label drawn under the battery, e.g. an ammeter reading. */
  caption?: string
}

export function CircuitCanvas({ circuit, sim, highlight = [], onComponentClick, caption }: Props) {
  const rails = circuit.branches.length
  const height = TOP + Math.max(1, rails) * RAIL_GAP + 70
  const railY = (i: number) => TOP + 30 + i * RAIL_GAP
  const firstY = railY(0)
  const lastY = railY(Math.max(0, rails - 1))
  const bottomY = lastY + 62
  const wire = '#475569'
  const liveWire = sim.open || sim.shortCircuit ? wire : '#15803d'

  return (
    <svg viewBox={`0 0 700 ${height}`} className="h-full w-full" role="img">
      {/* Battery, and the return path along the bottom */}
      <BatterySymbol x={70} y={(firstY + bottomY) / 2} cells={circuit.cells} />

      <path
        d={`M 70 ${(firstY + bottomY) / 2 - 34} L 70 ${TOP} L ${LEFT_BUS} ${TOP} L ${LEFT_BUS} ${firstY}`}
        stroke={liveWire}
        strokeWidth={6}
        fill="none"
        strokeLinecap="round"
      />
      <path
        d={`M 70 ${(firstY + bottomY) / 2 + 34} L 70 ${bottomY} L ${RIGHT_BUS} ${bottomY} L ${RIGHT_BUS} ${lastY}`}
        stroke={liveWire}
        strokeWidth={6}
        fill="none"
        strokeLinecap="round"
      />

      {/* Bus bars joining the parallel branches */}
      {rails > 1 && (
        <>
          <line x1={LEFT_BUS} y1={firstY} x2={LEFT_BUS} y2={lastY} stroke={liveWire} strokeWidth={6} strokeLinecap="round" />
          <line x1={RIGHT_BUS} y1={firstY} x2={RIGHT_BUS} y2={lastY} stroke={liveWire} strokeWidth={6} strokeLinecap="round" />
        </>
      )}

      {/* Animated Live Electron Flow Particle Overlay */}
      {!sim.open && !sim.shortCircuit && (
        <g
          stroke="#86efac"
          strokeWidth={3.5}
          fill="none"
          strokeLinecap="round"
          strokeDasharray="6 18"
          style={{ animation: 'flow-dash 1.2s linear infinite' }}
        >
          <path d={`M 70 ${(firstY + bottomY) / 2 - 34} L 70 ${TOP} L ${LEFT_BUS} ${TOP} L ${LEFT_BUS} ${firstY}`} />
          <path d={`M 70 ${(firstY + bottomY) / 2 + 34} L 70 ${bottomY} L ${RIGHT_BUS} ${bottomY} L ${RIGHT_BUS} ${lastY}`} />
          {rails > 1 && (
            <>
              <line x1={LEFT_BUS} y1={firstY} x2={LEFT_BUS} y2={lastY} />
              <line x1={RIGHT_BUS} y1={firstY} x2={RIGHT_BUS} y2={lastY} />
            </>
          )}
          {circuit.branches.map((b, bi) => {
            if ((sim.branchCurrent[b.id] ?? 0) <= 0.0001) return null
            return <line key={`flow-${b.id}`} x1={LEFT_BUS} y1={railY(bi)} x2={RIGHT_BUS} y2={railY(bi)} />
          })}
        </g>
      )}

      {/* Main series section, drawn on the top wire */}
      {circuit.main.map((c, i) => {
        const span = LEFT_BUS - 100
        const x = 100 + (span * (i + 0.5)) / circuit.main.length
        return (
          <ComponentSymbol
            key={c.id}
            component={c}
            x={x}
            y={TOP}
            brightness={sim.brightness[c.id] ?? 0}
            highlighted={highlight.includes(c.id)}
            onClick={onComponentClick}
          />
        )
      })}

      {/* Branches */}
      {circuit.branches.map((branch, bi) => {
        const y = railY(bi)
        const current = sim.branchCurrent[branch.id] ?? 0
        const dead = current <= 0.0001
        const span = RIGHT_BUS - LEFT_BUS

        return (
          <g key={branch.id}>
            <line
              x1={LEFT_BUS}
              y1={y}
              x2={RIGHT_BUS}
              y2={y}
              stroke={dead ? wire : liveWire}
              strokeWidth={6}
              strokeLinecap="round"
            />
            {branch.components.map((c, ci) => (
              <ComponentSymbol
                key={c.id}
                component={c}
                x={LEFT_BUS + (span * (ci + 0.5)) / branch.components.length}
                y={y}
                brightness={sim.brightness[c.id] ?? 0}
                highlighted={highlight.includes(c.id)}
                onClick={onComponentClick}
              />
            ))}
            {branch.components.length === 0 && (
              <text x={(LEFT_BUS + RIGHT_BUS) / 2} y={y - 12} fill="#1e293b" fontSize={14} fontWeight={900} textAnchor="middle">
                [ empty rail ]
              </text>
            )}
          </g>
        )
      })}

      {sim.shortCircuit && (
        <g>
          <rect x={120} y={height - 34} width={460} height={28} rx={8} fill="#fee2e2" stroke="#f43f5e" strokeWidth={2} />
          <text x={350} y={height - 15} fill="#9f1239" fontSize={14} fontWeight={900} textAnchor="middle">
            ⚠ SHORT CIRCUIT — Path has zero resistance to limit current!
          </text>
        </g>
      )}
      {caption && !sim.shortCircuit && (
        <text x={350} y={height - 16} fill="#0f172a" fontSize={14} fontWeight={800} textAnchor="middle">
          {caption}
        </text>
      )}
    </svg>
  )
}

function BatterySymbol({ x, y, cells }: { x: number; y: number; cells: number }) {
  return (
    <g>
      {Array.from({ length: cells }).map((_, i) => {
        const cy = y - 34 + 20 + i * 22
        return (
          <g key={i}>
            <line x1={x - 18} y1={cy} x2={x + 18} y2={cy} stroke="#d97706" strokeWidth={6} strokeLinecap="round" />
            <line x1={x - 9} y1={cy + 9} x2={x + 9} y2={cy + 9} stroke="#d97706" strokeWidth={5} strokeLinecap="round" />
          </g>
        )
      })}
      <text x={x + 28} y={y - 24} fill="#b45309" fontSize={24} fontWeight={900}>
        +
      </text>
      <text x={x + 28} y={y + 40} fill="#0f172a" fontSize={26} fontWeight={900}>
        −
      </text>
      <text x={x} y={y + 64} fill="#0f172a" fontSize={14} fontWeight={900} textAnchor="middle">
        {cells} cell{cells === 1 ? '' : 's'} · {(cells * 1.5).toFixed(1)} V
      </text>
    </g>
  )
}

interface SymbolProps {
  component: Component
  x: number
  y: number
  brightness: number
  highlighted: boolean
  onClick?: (component: Component) => void
}

function ComponentSymbol({ component, x, y, brightness, highlighted, onClick }: SymbolProps) {
  const clickable = !!onClick
  const wrap = (children: React.ReactNode) => (
    <g
      onClick={clickable ? () => onClick!(component) : undefined}
      style={{ cursor: clickable ? 'pointer' : 'default' }}
    >
      <rect x={x - 26} y={y - 26} width={52} height={52} fill="transparent" />
      {highlighted && (
        <rect
          x={x - 24}
          y={y - 24}
          width={48}
          height={48}
          rx={10}
          fill="none"
          stroke="#f59e0b"
          strokeWidth={4}
          strokeDasharray="5 4"
        />
      )}
      {children}
    </g>
  )

  if (component.type === 'bulb') {
    const lit = Math.max(0, Math.min(1.4, brightness))
    return wrap(
      <>
        {lit > 0.05 && <circle cx={x} cy={y} r={28} fill="#fde68a" opacity={0.35 + lit * 0.4} />}
        <circle
          cx={x}
          cy={y}
          r={16}
          fill={lit > 0.05 ? '#fef08a' : '#f1f5f9'}
          stroke={lit > 0.05 ? '#d97706' : '#64748b'}
          strokeWidth={4}
        />
        <path
          d={`M ${x - 7} ${y + 4} L ${x - 2} ${y - 5} L ${x + 3} ${y + 4} L ${x + 8} ${y - 5}`}
          stroke={lit > 0.05 ? '#92400e' : '#475569'}
          strokeWidth={3}
          strokeLinecap="round"
          fill="none"
        />
      </>,
    )
  }

  if (component.type === 'resistor') {
    return wrap(
      <>
        <rect x={x - 22} y={y - 10} width={44} height={20} rx={4} fill="#f3e8ff" stroke="#7c3aed" strokeWidth={3.5} />
        <text x={x} y={y + 26} fill="#6d28d9" fontSize={12} fontWeight={800} textAnchor="middle">
          resistor
        </text>
      </>,
    )
  }

  if (component.type === 'switch') {
    const closed = component.closed !== false
    return wrap(
      <>
        <circle cx={x - 16} cy={y} r={5} fill="#475569" />
        <circle cx={x + 16} cy={y} r={5} fill="#475569" />
        <line
          x1={x - 16}
          y1={y}
          x2={closed ? x + 16 : x + 10}
          y2={closed ? y : y - 20}
          stroke={closed ? '#16a34a' : '#e11d48'}
          strokeWidth={5}
          strokeLinecap="round"
        />
        <text x={x} y={y + 26} fill={closed ? '#16a34a' : '#e11d48'} fontSize={12} fontWeight={800} textAnchor="middle">
          {closed ? 'CLOSED' : 'OPEN'}
        </text>
      </>,
    )
  }

  return wrap(<circle cx={x} cy={y} r={5} fill="#64748b" />)
}
