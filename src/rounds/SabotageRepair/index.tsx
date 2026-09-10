import { useMemo, useState } from 'react'
import { POINTS, ROUNDS, TEAM_IDS, TEAM_THEME } from '../../constants'
import { useGame } from '../../context/GameContext'
import { useCountdown } from '../../hooks/useCountdown'
import { useSound } from '../../hooks/useSound'
import { RoundShell } from '../../components/RoundShell'
import { Timer } from '../../components/Timer'
import { Button } from '../../components/ui/Button'
import { CircuitCanvas } from '../../components/CircuitCanvas'
import { allBulbs, cloneCircuit, simulate } from '../../sim/circuit'
import type { Circuit, Component } from '../../sim/circuit'
import type { TeamId } from '../../types'

const REPAIR_SECONDS = 45

type Phase = 'brief' | 'shield' | 'sabotage' | 'predict' | 'repair' | 'reveal' | 'handoff' | 'results'

/** Two cells, a master switch, and two bulbs on their own rails. */
const baseCircuit = (): Circuit => ({
  cells: 2,
  main: [{ id: 'S0', type: 'switch', closed: true }],
  branches: [
    { id: 'r1', components: [{ id: 'L1', type: 'bulb' }] },
    { id: 'r2', components: [{ id: 'L2', type: 'bulb' }] },
  ],
})

const EFFECTS = [
  'All the bulbs go out',
  'One bulb goes out, the rest stay lit',
  'All the bulbs get dimmer but stay lit',
  'Nothing changes at all',
]

interface Sabotage {
  id: string
  label: string
  blurb: string
  /** Index into EFFECTS. */
  effect: number
  apply: (c: Circuit) => Circuit
  explain: string
}

const SABOTAGES: Sabotage[] = [
  {
    id: 'open-switch',
    label: 'Open the master switch',
    blurb: 'Break the shared path for all branches.',
    effect: 0,
    apply: (c) => {
      const next = cloneCircuit(c)
      const s = next.main.find((x) => x.type === 'switch')
      if (s) s.closed = false
      return next
    },
    explain:
      'The master switch sits in the line every branch shares, so opening it breaks the circuit for all of them.',
  },
  {
    id: 'remove-bulb',
    label: 'Unscrew one bulb',
    blurb: 'Leave an empty holder on one rail.',
    effect: 1,
    apply: (c) => {
      const next = cloneCircuit(c)
      const rail = next.branches[0]
      const bulb = rail.components.find((x) => x.type === 'bulb')
      if (bulb) {
        rail.components = rail.components.map((x) =>
          x.id === bulb.id ? { id: `gap-${bulb.id}`, type: 'switch', closed: false } : x,
        )
      }
      return next
    },
    explain:
      'These bulbs are in parallel, so each has its own path. Unscrewing one only breaks that one rail.',
  },
  {
    id: 'add-resistor',
    label: 'Add a resistor to the main line',
    blurb: 'Choke the current for the whole circuit.',
    effect: 2,
    apply: (c) => {
      const next = cloneCircuit(c)
      next.main.push({ id: 'Rsab', type: 'resistor' })
      return next
    },
    explain:
      'Extra resistance in the shared line lowers the current everywhere, so every bulb dims without going out.',
  },
]

interface TurnResult {
  sabotage: string
  predicted: boolean
  repaired: boolean
}

export function SabotageRepair() {
  const { state, dispatch } = useGame()
  const play = useSound()

  const [phase, setPhase] = useState<Phase>('brief')
  const [turn, setTurn] = useState(0)
  const [sabotage, setSabotage] = useState<Sabotage | null>(null)
  const [circuit, setCircuit] = useState<Circuit>(baseCircuit)
  const [prediction, setPrediction] = useState<number | null>(null)
  const [results, setResults] = useState<Partial<Record<TeamId, TurnResult>>>({})

  const saboteurId = TEAM_IDS[turn]
  const defenderId = TEAM_IDS[(turn + 1) % TEAM_IDS.length]

  const sim = useMemo(() => simulate(circuit), [circuit])
  const target = useMemo(() => simulate(baseCircuit()), [])

  /** Back to working order: every original bulb present and at its original brightness. */
  const repaired = useMemo(() => {
    const bulbs = allBulbs(circuit)
    if (bulbs.length !== allBulbs(baseCircuit()).length) return false
    return bulbs.every((b) => Math.abs((sim.brightness[b.id] ?? 0) - (target.brightness[b.id] ?? 0)) < 0.01)
  }, [circuit, sim, target])

  const { remaining, setRemaining } = useCountdown({
    seconds: REPAIR_SECONDS,
    running: (phase === 'predict' || phase === 'repair') && !state.paused,
    resetKey: `${turn}-${phase === 'repair' ? 'r' : 'p'}`,
    onEnd: () => {
      if (phase === 'predict' || phase === 'repair') finishAttempt(false)
    },
  })

  function chooseSabotage(s: Sabotage) {
    setSabotage(s)
    setCircuit(s.apply(baseCircuit()))
    setPrediction(null)
    play('buzz')
    setPhase('predict')
    setRemaining(REPAIR_SECONDS)
  }

  function predict(index: number) {
    if (!sabotage || phase !== 'predict') return
    setPrediction(index)
    const right = index === sabotage.effect
    play(right ? 'correct' : 'wrong')
    dispatch({
      type: 'AWARD',
      team: defenderId,
      points: right ? POINTS.sabotage.prediction : 0,
      round: 'sabotage',
      correct: right,
    })
    setPhase('repair')
  }

  /** Clicking the faulty part is the repair: close it, remove it, or refit the bulb. */
  function repairClick(component: Component) {
    if (phase !== 'repair') return

    setCircuit((c) => {
      const next = cloneCircuit(c)

      if (component.type === 'resistor') {
        next.main = next.main.filter((x) => x.id !== component.id)
        for (const b of next.branches) b.components = b.components.filter((x) => x.id !== component.id)
        return next
      }

      if (component.type === 'switch') {
        if (component.id.startsWith('gap-')) {
          const bulbId = component.id.slice(4)
          for (const b of next.branches) {
            b.components = b.components.map((x) => (x.id === component.id ? { id: bulbId, type: 'bulb' } : x))
          }
          return next
        }
        const s = next.main.find((x) => x.id === component.id)
        if (s) s.closed = s.closed === false
        for (const b of next.branches) {
          const bs = b.components.find((x) => x.id === component.id)
          if (bs) bs.closed = bs.closed === false
        }
        return next
      }

      return next
    })
    play('spark')
  }

  function submitRepair() {
    if (!repaired) {
      play('wrong')
      return
    }
    play('charge')
    dispatch({
      type: 'AWARD',
      team: defenderId,
      points: POINTS.sabotage.repair,
      round: 'sabotage',
      correct: true,
    })
    finishAttempt(true)
  }

  function finishAttempt(didRepair: boolean) {
    if (!didRepair) {
      dispatch({
        type: 'AWARD',
        team: saboteurId,
        points: POINTS.sabotage.sabotageWins,
        round: 'sabotage',
        correct: true,
      })
    }
    setResults((r) => ({
      ...r,
      [saboteurId]: {
        sabotage: sabotage?.label ?? '—',
        predicted: prediction !== null && prediction === sabotage?.effect,
        repaired: didRepair,
      },
    }))
    setPhase('reveal')
  }

  function nextRole() {
    if (turn === 0) {
      setTurn(1)
      setSabotage(null)
      setCircuit(baseCircuit())
      setPrediction(null)
      setPhase('handoff')
    } else {
      setPhase('results')
    }
  }

  // ---------------------------------------------------------------- render

  if (phase === 'brief' || phase === 'handoff') {
    const nextTurn = phase === 'brief' ? 0 : 1
    const sab = state.teams[TEAM_IDS[nextTurn]]
    const def = state.teams[TEAM_IDS[(nextTurn + 1) % TEAM_IDS.length]]

    return (
      <RoundShell roundId="sabotage">
        <div className="grid h-full place-items-center py-6">
          <div className="clay-chassis pop-in w-full max-w-2xl p-8 text-center bg-white shadow-2xl">
            <div className="text-6xl animate-bounce">🛠️</div>
            <h3 className="mt-4 font-display text-4xl font-black text-slate-900">
              {phase === 'brief' ? 'Sabotage & Repair' : 'Swap Team Roles'}
            </h3>
            <p className="mt-3 text-lg font-bold text-slate-700">
              <span className="font-black text-amber-700">{sab.name}</span> secretly breaks a circuit component.{' '}
              <span className="font-black text-cyan-700">{def.name}</span> predicts the fault and fixes it within {REPAIR_SECONDS} seconds!
            </p>
            <div className="mt-3 inline-block rounded-full bg-slate-100 px-4 py-1.5 text-xs font-bold text-slate-700 shadow-inner">
              +{POINTS.sabotage.prediction} correct prediction · +{POINTS.sabotage.repair} successful repair · +{POINTS.sabotage.sabotageWins} to saboteur if unfixed
            </div>
            <div className="mt-8">
              <Button size="lg" onClick={() => setPhase('shield')}>
                {def.name} — Look Away! 🙈
              </Button>
            </div>
          </div>
        </div>
      </RoundShell>
    )
  }

  if (phase === 'shield') {
    return (
      <RoundShell roundId="sabotage" activeTeam={saboteurId}>
        <div className="grid h-full place-items-center py-6">
          <div className="clay-chassis pop-in w-full max-w-2xl p-8 text-center bg-white shadow-2xl">
            <div className="text-6xl animate-bounce">🙈</div>
            <h3 className="mt-4 font-display text-3xl font-black text-slate-900">
              {state.teams[defenderId].name} — Eyes Shut!
            </h3>
            <p className="mt-2 text-base font-bold text-slate-600">
              <span className="font-black" style={{ color: TEAM_THEME[saboteurId].accent }}>
                {state.teams[saboteurId].name}
              </span>
              , pick your sabotage below. Only one!
            </p>
            <div className="mt-6">
              <Button size="lg" onClick={() => setPhase('sabotage')}>
                Show Sabotage Options ⚡
              </Button>
            </div>
          </div>
        </div>
      </RoundShell>
    )
  }

  if (phase === 'sabotage') {
    return (
      <RoundShell roundId="sabotage" activeTeam={saboteurId}>
        <div className="mx-auto flex h-full max-w-3xl flex-col justify-center">
          <div className="clay-chassis p-8 bg-white shadow-2xl">
            <h3 className="text-center font-display text-3xl font-black text-slate-900">
              Choose Your Sabotage
            </h3>
            <p className="mt-1 text-center text-sm font-bold text-slate-600">
              Every sabotage is fully fixable — make them think!
            </p>
            <div className="mt-6 space-y-3">
              {SABOTAGES.map((s) => (
                <button
                  key={s.id}
                  onClick={() => chooseSabotage(s)}
                  className="clay-card w-full border-2 border-slate-200 bg-white p-4 text-left transition hover:border-rose-400 hover:bg-rose-50 cursor-pointer"
                >
                  <div className="font-display text-lg font-black text-slate-900">{s.label}</div>
                  <div className="mt-0.5 text-xs font-bold text-slate-600">{s.blurb}</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </RoundShell>
    )
  }

  if (phase === 'predict' || phase === 'repair') {
    const isRepair = phase === 'repair'

    return (
      <RoundShell
        roundId="sabotage"
        activeTeam={defenderId}
        headerRight={<Timer remaining={remaining} total={REPAIR_SECONDS} />}
      >
        <div className="mx-auto flex h-full max-w-4xl flex-col justify-center">
          <div className="clay-chassis p-6 bg-white shadow-2xl flex flex-col gap-3">
            <div className="text-center">
              <h3 className="font-display text-2xl font-black text-slate-900">
                {isRepair ? '🔧 Repair The Circuit!' : '🔍 What Has Happened To This Circuit?'}
              </h3>
              <p className="text-sm font-bold text-slate-600">
                <span className="font-black" style={{ color: TEAM_THEME[defenderId].accent }}>
                  {state.teams[defenderId].name}
                </span>{' '}
                {isRepair
                  ? '— Click the faulty part on the board to repair it, then submit!'
                  : '— Predict the effect of the secret sabotage!'}
              </p>
            </div>

            <div className="h-52 rounded-2xl border-2 border-slate-200 bg-white p-2 shadow-inner">
              <CircuitCanvas
                circuit={circuit}
                sim={sim}
                onComponentClick={isRepair ? repairClick : undefined}
                highlight={[]}
                caption={isRepair ? 'Click a component on the diagram to fix it' : undefined}
              />
            </div>

            {!isRepair ? (
              <div className="mt-2 grid gap-2.5 sm:grid-cols-2">
                {EFFECTS.map((e, i) => (
                  <button
                    key={i}
                    onClick={() => predict(i)}
                    className="clay-card border-2 border-slate-200 bg-white p-3 text-left transition hover:border-amber-400 cursor-pointer"
                  >
                    <span className="mr-2.5 font-display font-black text-amber-600">
                      [{String.fromCharCode(65 + i)}]
                    </span>
                    <span className="font-bold text-slate-900 text-sm">{e}</span>
                  </button>
                ))}
              </div>
            ) : (
              <div className="mt-2 flex items-center justify-between border-t border-slate-100 pt-3">
                <span className={`text-sm font-black ${repaired ? 'text-emerald-600' : 'text-slate-600'}`}>
                  {repaired ? '✔ Circuit fully restored to normal brightness!' : '⏳ Still faulted — inspect the components.'}
                </span>
                <Button onClick={submitRepair} disabled={!repaired} size="lg">
                  Submit Repair ✔
                </Button>
              </div>
            )}
          </div>
        </div>
      </RoundShell>
    )
  }

  if (phase === 'reveal') {
    const res = results[saboteurId]
    return (
      <RoundShell roundId="sabotage">
        <div className="grid h-full place-items-center py-6">
          <div className="clay-chassis pop-in w-full max-w-2xl p-8 text-center bg-white shadow-2xl">
            <div className="text-6xl animate-bounce">{res?.repaired ? '🔧' : '💥'}</div>
            <h3 className="mt-3 font-display text-4xl font-black text-slate-900">
              {res?.repaired ? 'Repaired in Time!' : 'The Sabotage Held!'}
            </h3>
            <p className="mt-2 text-base font-bold text-slate-800">
              <strong>{sabotage?.label}</strong> — {sabotage?.explain}
            </p>
            <div className="mt-4 inline-block rounded-2xl bg-slate-100 px-6 py-2 text-sm font-bold text-slate-800">
              Prediction: {res?.predicted ? '✔ Correct (+50 pts)' : '✘ Missed'} · Repair:{' '}
              {res?.repaired ? '✔ Fixed (+100 pts)' : '✘ Not repaired (+100 pts to saboteur)'}
            </div>
            <div className="mt-8">
              <Button size="lg" onClick={nextRole}>
                {turn === 0 ? 'Swap Roles for Team 2 →' : 'View Round Results →'}
              </Button>
            </div>
          </div>
        </div>
      </RoundShell>
    )
  }

  return (
    <RoundShell roundId="sabotage">
      <div className="grid h-full place-items-center py-6">
        <div className="clay-chassis rise-in w-full max-w-2xl p-8 text-center bg-white shadow-2xl">
          <h3 className="font-display text-3xl font-black text-slate-900">Tools Down!</h3>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {TEAM_IDS.map((id) => (
              <div
                key={id}
                className={`rounded-3xl p-5 ${id === 'volt' ? 'clay-card-volt' : 'clay-card-amp'}`}
              >
                <div
                  className="font-display text-2xl font-black"
                  style={{ color: id === 'volt' ? '#78350f' : '#164e63' }}
                >
                  {state.teams[id].name}
                </div>
                <div className="mt-2 font-display text-4xl font-black text-emerald-600">
                  +{state.scoreLog.sabotage[id]}
                </div>
                <div className="text-xs font-bold uppercase tracking-widest text-slate-600">
                  Points This Round
                </div>
              </div>
            ))}
          </div>
          <div className="mt-8">
            <Button size="lg" onClick={() => dispatch({ type: 'COMPLETE_ROUND', round: 'sabotage' })}>
              Back to Tournament Board →
            </Button>
          </div>
        </div>
      </div>
    </RoundShell>
  )
}
