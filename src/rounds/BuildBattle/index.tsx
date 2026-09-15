import { useMemo, useRef, useState } from 'react'
import { POINTS, ROUNDS, TEAM_IDS, TEAM_THEME } from '../../constants'
import { useGame } from '../../context/GameContext'
import { useCountdown } from '../../hooks/useCountdown'
import { useSound } from '../../hooks/useSound'
import { RoundShell } from '../../components/RoundShell'
import { Timer } from '../../components/Timer'
import { Button } from '../../components/ui/Button'
import { CircuitCanvas } from '../../components/CircuitCanvas'
import { cloneCircuit, simulate } from '../../sim/circuit'
import type { Circuit, Component } from '../../sim/circuit'
import { BRIEFS, componentCount } from './briefs'
import type { TeamId } from '../../types'

const BUILD_SECONDS = 90
const STEAL_SECONDS = 30
const MAX_RAILS = 4

type Phase = 'brief' | 'build' | 'steal' | 'verdict' | 'handoff' | 'results'

interface TurnResult {
  solved: boolean
  components: number
  elegant: boolean
  stolenBy?: TeamId
  circuit: Circuit
}

const emptyCircuit = (): Circuit => ({
  cells: 2,
  main: [],
  branches: [{ id: 'r1', components: [] }],
})

export function BuildBattle() {
  const { state, dispatch } = useGame()
  const play = useSound()

  const [phase, setPhase] = useState<Phase>('brief')
  const [turn, setTurn] = useState(0)
  const [circuit, setCircuit] = useState<Circuit>(emptyCircuit)
  const [verdict, setVerdict] = useState<{ ok: boolean; reason: string } | null>(null)
  const [results, setResults] = useState<Partial<Record<TeamId, TurnResult>>>({})
  const nextId = useRef(2)

  const brief = BRIEFS[turn % BRIEFS.length]
  const ownerId = TEAM_IDS[turn]
  const stealerId = TEAM_IDS[(turn + 1) % TEAM_IDS.length]
  const builderId = phase === 'steal' ? stealerId : ownerId
  const theme = TEAM_THEME[builderId]

  const sim = useMemo(() => simulate(circuit), [circuit])

  const { remaining, setRemaining } = useCountdown({
    seconds: phase === 'steal' ? STEAL_SECONDS : BUILD_SECONDS,
    running: (phase === 'build' || phase === 'steal') && !state.paused,
    resetKey: `${turn}-${phase}`,
    onEnd: () => {
      if (phase === 'build') startSteal()
      else if (phase === 'steal') finishTurn(false)
    },
  })

  // ------------------------------------------------------------- bench edits

  const uid = (prefix: string) => `${prefix}${nextId.current++}`

  function addBulb(railId: string) {
    setCircuit((c) => {
      const next = cloneCircuit(c)
      const rail = next.branches.find((b) => b.id === railId)
      rail?.components.push({ id: uid('L'), type: 'bulb' })
      return next
    })
    play('spark')
  }

  function addSwitch(railId: string | 'main') {
    setCircuit((c) => {
      const next = cloneCircuit(c)
      const part: Component = { id: uid('S'), type: 'switch', closed: true }
      if (railId === 'main') next.main.push(part)
      else next.branches.find((b) => b.id === railId)?.components.push(part)
      return next
    })
    play('spark')
  }

  function addRail() {
    setCircuit((c) => {
      if (c.branches.length >= MAX_RAILS) return c
      const next = cloneCircuit(c)
      next.branches.push({ id: uid('r'), components: [] })
      return next
    })
    play('spark')
  }

  function removeRail(railId: string) {
    setCircuit((c) => {
      if (c.branches.length <= 1) return c
      const next = cloneCircuit(c)
      next.branches = next.branches.filter((b) => b.id !== railId)
      return next
    })
  }

  function removeComponent(component: Component) {
    setCircuit((c) => {
      const next = cloneCircuit(c)
      next.main = next.main.filter((x) => x.id !== component.id)
      for (const b of next.branches) b.components = b.components.filter((x) => x.id !== component.id)
      return next
    })
  }

  function setCells(n: number) {
    setCircuit((c) => ({ ...cloneCircuit(c), cells: n }))
  }

  function clearBench() {
    setCircuit(emptyCircuit())
    setVerdict(null)
  }

  // ------------------------------------------------------------- turn flow

  function submit() {
    const result = brief.validate(circuit)
    setVerdict(result)
    play(result.ok ? 'charge' : 'wrong')

    if (!result.ok) return

    const count = componentCount(circuit)
    const elegant = count <= brief.target
    const stealing = phase === 'steal'

    dispatch({
      type: 'AWARD',
      team: builderId,
      points: stealing ? POINTS.build.steal : POINTS.build.solve,
      round: 'build',
      correct: true,
    })
    if (elegant && !stealing) {
      dispatch({ type: 'AWARD', team: builderId, points: POINTS.build.elegance, round: 'build' })
    }

    setResults((r) => ({
      ...r,
      [ownerId]: {
        solved: true,
        components: count,
        elegant: elegant && !stealing,
        stolenBy: stealing ? builderId : undefined,
        circuit: cloneCircuit(circuit),
      },
    }))
    setPhase('verdict')
  }

  function startSteal() {
    play('buzz')
    setVerdict(null)
    setCircuit(emptyCircuit())
    setPhase('steal')
    setRemaining(STEAL_SECONDS)
  }

  function finishTurn(solved: boolean) {
    if (!solved && !results[ownerId]) {
      setResults((r) => ({
        ...r,
        [ownerId]: { solved: false, components: 0, elegant: false, circuit: cloneCircuit(circuit) },
      }))
    }
    setPhase(turn === 0 ? 'handoff' : 'results')
  }

  function beginTurn(nextTurn: number) {
    setTurn(nextTurn)
    setCircuit(emptyCircuit())
    setVerdict(null)
    setRemaining(BUILD_SECONDS)
    setPhase('build')
  }

  // ---------------------------------------------------------------- render

  if (phase === 'brief' || phase === 'handoff') {
    const nextTurn = phase === 'brief' ? 0 : 1
    const nextTeam = state.teams[TEAM_IDS[nextTurn]]
    const prev = results.volt

    return (
      <RoundShell roundId="build">
        <div className="grid h-full place-items-center py-6">
          <div className="clay-chassis pop-in w-full max-w-2xl p-8 text-center bg-white shadow-2xl">
            <div className="text-6xl animate-bounce">🔋</div>
            <h3 className="mt-4 font-display text-4xl font-black text-slate-900">
              {phase === 'brief' ? 'Build Battle' : 'Next Team to the Bench'}
            </h3>
            <p className="mt-3 text-lg font-medium text-slate-700">
              Each team receives a circuit challenge and <strong>{BUILD_SECONDS} seconds</strong> at the workbench.
              Wire it correctly, then test your circuit!
            </p>
            <div className="mt-3 inline-block rounded-full bg-slate-100 px-4 py-1.5 text-xs font-bold text-slate-700 shadow-inner">
              +{POINTS.build.solve} working circuit · +{POINTS.build.elegance} no spare parts · {STEAL_SECONDS}s steal attempt for +{POINTS.build.steal}
            </div>

            {phase === 'handoff' && prev && (
              <div className="mx-auto mt-6 w-fit rounded-2xl border-2 border-amber-300 bg-amber-50 px-6 py-3 text-sm font-bold text-amber-950 shadow-sm">
                <span>{state.teams.volt.name}</span>{' '}
                {prev.solved ? 'successfully closed their build!' : 'did not finish in time.'}{' '}
                A brand-new brief is ready for the other side!
              </div>
            )}

            <div className="mt-8">
              <Button
                size="lg"
                variant={nextTurn === 0 ? 'volt' : 'ampere'}
                onClick={() => beginTurn(nextTurn)}
              >
                {nextTeam.name} — Take The Bench →
              </Button>
            </div>
          </div>
        </div>
      </RoundShell>
    )
  }

  if (phase === 'verdict') {
    return (
      <RoundShell roundId="build">
        <div className="grid h-full place-items-center py-6">
          <div className="clay-chassis pop-in w-full max-w-2xl p-8 text-center bg-white shadow-2xl">
            <div className="text-6xl animate-bounce">🎉</div>
            <h3 className="mt-3 font-display text-4xl font-black text-emerald-600">Circuit Approved!</h3>
            <p className="mt-3 text-lg font-bold text-slate-800">{verdict?.reason}</p>
            <p className="mt-2 text-sm font-bold text-slate-600">
              Built by{' '}
              <span style={{ color: theme.accent }} className="font-black">
                {state.teams[builderId].name}
              </span>{' '}
              using {componentCount(circuit)} components.
            </p>
            <Button className="mt-6" size="lg" onClick={() => finishTurn(true)}>
              Continue to Match Summary →
            </Button>
          </div>
        </div>
      </RoundShell>
    )
  }

  if (phase === 'results') {
    return (
      <RoundShell roundId="build">
        <div className="mx-auto h-full max-w-5xl py-4">
          <div className="clay-chassis p-8 bg-white shadow-2xl">
            <h3 className="text-center font-display text-3xl font-black text-slate-900">
              ⚡ Round 2 Results: Build Battle
            </h3>
            <div className="mt-6 grid gap-4 lg:grid-cols-2">
              {TEAM_IDS.map((id, i) => {
                const res = results[id]
                const b = BRIEFS[i % BRIEFS.length]
                const isVolt = id === 'volt'
                return (
                  <div
                    key={id}
                    className={`rise-in rounded-3xl p-5 ${isVolt ? 'clay-card-volt' : 'clay-card-amp'}`}
                    style={{ animationDelay: `${i * 90}ms` }}
                  >
                    <div
                      className="font-display text-2xl font-black"
                      style={{ color: isVolt ? '#78350f' : '#164e63' }}
                    >
                      {state.teams[id].name}
                    </div>
                    <p className="mt-1 text-xs font-bold text-slate-700">{b.text}</p>
                    <div className="mt-3 h-44 rounded-2xl bg-white p-2 shadow-inner">
                      {res && (
                        <CircuitCanvas circuit={res.circuit} sim={simulate(res.circuit)} />
                      )}
                    </div>
                    <div className="mt-3 flex items-center justify-between text-sm font-bold text-slate-800">
                      <div>
                        {res?.solved ? (
                          <span className="text-emerald-700">
                            ✔ Completed{res.elegant ? ' (no spare parts)' : ''}
                            {res.stolenBy ? ` · stolen by ${state.teams[res.stolenBy].name}` : ''}
                          </span>
                        ) : (
                          <span className="text-rose-700">✘ Not completed</span>
                        )}
                      </div>
                      <div className="font-display text-lg font-black text-slate-900">
                        Round Total: <strong className="text-emerald-600">+{state.scoreLog.build[id]}</strong>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
            <p className="mt-5 text-center text-xs font-bold text-slate-500">💡 {ROUNDS.build.objective}</p>
            <div className="mt-6 flex justify-center">
              <Button size="lg" onClick={() => dispatch({ type: 'COMPLETE_ROUND', round: 'build' })}>
                Back to Tournament Board →
              </Button>
            </div>
          </div>
        </div>
      </RoundShell>
    )
  }

  // build / steal
  return (
    <RoundShell
      roundId="build"
      activeTeam={builderId}
      headerRight={
        <div className="flex items-center gap-3">
          {phase === 'steal' && (
            <span className="rounded-full bg-rose-500 px-3 py-1 font-display text-xs font-black uppercase tracking-wider text-white shadow-sm animate-bounce">
              ⚡ STEAL ATTEMPT
            </span>
          )}
          <Timer remaining={remaining} total={phase === 'steal' ? STEAL_SECONDS : BUILD_SECONDS} />
        </div>
      }
    >
      <div className="mx-auto grid h-full max-w-6xl grid-cols-1 gap-4 lg:grid-cols-[1fr_280px]">
        {/* Left: Workbench Canvas */}
        <div className="flex min-h-0 flex-col gap-3">
          {/* Brief Banner */}
          <div className="clay-card flex flex-col gap-1 border-2 border-emerald-400 bg-emerald-50 px-5 py-3.5 shadow-sm">
            <span className="font-display text-xs font-black uppercase tracking-wider text-emerald-900">
              Brief for {state.teams[builderId].name}:
            </span>
            <p className="text-base font-black text-slate-900">{brief.text}</p>
          </div>

          {/* Circuit Canvas in Clay Chassis */}
          <div className="clay-chassis relative min-h-0 flex-1 bg-white p-4 shadow-xl border-2 border-slate-200">
            <CircuitCanvas
              circuit={circuit}
              sim={sim}
              onComponentClick={removeComponent}
              caption="Click any component on the schematic to remove it"
            />
          </div>

          {verdict && !verdict.ok && (
            <div className="pop-in rounded-2xl border-2 border-rose-500 bg-rose-100 px-5 py-3 text-sm font-black text-rose-950 shadow-sm">
              ✘ {verdict.reason}
            </div>
          )}
        </div>

        {/* Right: Component Controls Sidebar */}
        <div className="flex flex-col gap-3 overflow-y-auto pb-4">
          {/* Battery Selector */}
          <div className="clay-card border-2 border-slate-300 bg-white p-4 shadow-sm">
            <div className="font-display text-xs font-black uppercase tracking-wider text-slate-900">
              Battery Voltage
            </div>
            <div className="mt-2.5 flex gap-2">
              {[1, 2, 3].map((n) => (
                <button
                  key={n}
                  onClick={() => setCells(n)}
                  className={`clay-btn flex-1 py-2 text-xs font-black transition cursor-pointer ${
                    circuit.cells === n
                      ? 'bg-amber-500 text-slate-950 shadow-md border-2 border-amber-600'
                      : 'bg-slate-100 text-slate-900 hover:bg-slate-200 border border-slate-300'
                  }`}
                >
                  {n} cell{n > 1 ? 's' : ''}
                </button>
              ))}
            </div>
          </div>

          {/* Rails Selector */}
          <div className="clay-card border-2 border-slate-300 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="font-display text-xs font-black uppercase tracking-wider text-slate-900">
                Circuit Rails
              </span>
              <button
                onClick={addRail}
                disabled={circuit.branches.length >= MAX_RAILS}
                className="clay-btn bg-slate-900 text-white hover:bg-slate-800 px-3 py-1 text-xs font-black cursor-pointer disabled:opacity-30"
              >
                + Add Rail
              </button>
            </div>

            <div className="mt-3 space-y-2.5">
              {circuit.branches.map((rail, i) => (
                <div key={rail.id} className="clay-inset rounded-2xl bg-slate-100 p-3 border-2 border-slate-300">
                  <div className="flex items-center justify-between text-xs font-black text-slate-900">
                    <span>Rail {i + 1}</span>
                    <button
                      onClick={() => removeRail(rail.id)}
                      disabled={circuit.branches.length <= 1}
                      className="font-black text-rose-700 hover:text-rose-900 cursor-pointer disabled:opacity-20"
                      title="Remove rail"
                    >
                      ✕ Remove
                    </button>
                  </div>
                  <div className="mt-2.5 flex gap-2">
                    <button
                      onClick={() => addBulb(rail.id)}
                      className="clay-btn flex-1 bg-amber-50 hover:bg-amber-100 border-2 border-amber-400 py-2 text-xs font-black text-amber-950 cursor-pointer"
                    >
                      💡 Add Bulb
                    </button>
                    <button
                      onClick={() => addSwitch(rail.id)}
                      className="clay-btn flex-1 bg-emerald-50 hover:bg-emerald-100 border-2 border-emerald-400 py-2 text-xs font-black text-emerald-950 cursor-pointer"
                    >
                      ⏻ Add Switch
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={() => addSwitch('main')}
              className="clay-btn mt-3 w-full bg-slate-800 hover:bg-slate-900 text-white py-2 text-xs font-black cursor-pointer"
            >
              ⏻ Add Master Switch (Series)
            </button>
          </div>

          {/* Action Buttons */}
          <div className="mt-auto space-y-2 pt-2">
            <Button className="w-full" size="lg" onClick={submit}>
              ✔ Test My Circuit
            </Button>
            <button
              onClick={clearBench}
              className="clay-btn w-full bg-slate-200 hover:bg-slate-300 border border-slate-300 py-2 text-xs font-black text-slate-900 cursor-pointer"
            >
              ↺ Reset Circuit Bench
            </button>
            <p className="text-center text-xs font-black text-slate-800">
              {componentCount(circuit)} components (Target budget: {brief.target})
            </p>
          </div>
        </div>
      </div>
    </RoundShell>
  )
}
