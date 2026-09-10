import { useEffect, useMemo, useState } from 'react'
import { POINTS, ROUNDS, TEAM_IDS, TEAM_THEME } from '../../constants'
import { useGame } from '../../context/GameContext'
import { useSound } from '../../hooks/useSound'
import { RoundShell } from '../../components/RoundShell'
import { Button } from '../../components/ui/Button'
import { CircuitCanvas } from '../../components/CircuitCanvas'
import { simulate } from '../../sim/circuit'
import type { Circuit } from '../../sim/circuit'
import type { TeamId } from '../../types'

type Phase = 'brief' | 'placement' | 'placementReveal' | 'predict' | 'predictReveal' | 'results'

interface Slot {
  id: string
  label: string
  correct: boolean
  outcome: string
}

const PLACEMENT_SLOTS: Slot[] = [
  {
    id: 'series',
    label: 'In the main line, so all the current flows through it',
    correct: true,
    outcome: 'Correct — an ammeter goes in series. Every electron in the circuit passes through it, so it can count them.',
  },
  {
    id: 'across-bulb',
    label: 'Across the bulb, with one lead on each side',
    correct: false,
    outcome:
      'That is a voltmeter position. An ammeter has almost no resistance, so it short-circuits the bulb — the bulb goes out and the meter takes all the current.',
  },
  {
    id: 'across-battery',
    label: 'Straight across the battery terminals',
    correct: false,
    outcome:
      'That is a direct short across the cell. Huge current, a hot meter, and a blown fuse. Never do this.',
  },
]

interface Scenario {
  id: string
  description: string
  circuit: Circuit
}

const SCENARIOS: Scenario[] = [
  {
    id: 's1',
    description: 'Two cells and one bulb, wired in series.',
    circuit: { cells: 2, main: [], branches: [{ id: 'b1', components: [{ id: 'L1', type: 'bulb' }] }] },
  },
  {
    id: 's2',
    description: 'Two cells and two bulbs, wired in series.',
    circuit: {
      cells: 2,
      main: [],
      branches: [
        { id: 'b1', components: [{ id: 'L1', type: 'bulb' }, { id: 'L2', type: 'bulb' }] },
      ],
    },
  },
]

const AMP_MAX = 1

export function AmmeterShowdown() {
  const { state, dispatch } = useGame()
  const play = useSound()

  const [phase, setPhase] = useState<Phase>('brief')
  const [turn, setTurn] = useState(0)
  const [pick, setPick] = useState<string | null>(null)
  const [placementDone, setPlacementDone] = useState<TeamId[]>([])
  const [scenarioIndex, setScenarioIndex] = useState(0)
  const [guesses, setGuesses] = useState<Record<TeamId, string>>({ volt: '', ampere: '' })

  const teamId = TEAM_IDS[turn]
  const scenario = SCENARIOS[scenarioIndex]
  const trueReading = useMemo(() => simulate(scenario.circuit).totalCurrent, [scenario])

  function choosePlacement(slot: Slot) {
    if (phase !== 'placement') return
    setPick(slot.id)
    play(slot.correct ? 'correct' : 'wrong')
    if (slot.correct) {
      dispatch({
        type: 'AWARD',
        team: teamId,
        points: POINTS.ammeter.placement,
        round: 'ammeter',
        correct: true,
      })
    } else {
      dispatch({ type: 'AWARD', team: teamId, points: 0, round: 'ammeter', correct: false })
    }
    setPhase('placementReveal')
  }

  function nextAfterPlacement() {
    const done = [...placementDone, teamId]
    setPlacementDone(done)
    setPick(null)
    if (done.length < TEAM_IDS.length) {
      setTurn(turn + 1)
      setPhase('placement')
    } else {
      setPhase('predict')
    }
  }

  function revealPrediction() {
    const parsed = TEAM_IDS.map((id) => ({
      id,
      value: Number.parseFloat(guesses[id]),
    })).filter((g) => Number.isFinite(g.value))

    if (parsed.length > 0) {
      const errors = parsed.map((g) => ({ ...g, error: Math.abs(g.value - trueReading) }))
      const best = Math.min(...errors.map((e) => e.error))

      for (const e of errors) {
        if (e.error <= 0.011) {
          dispatch({ type: 'AWARD', team: e.id, points: POINTS.ammeter.exact, round: 'ammeter', correct: true })
        } else if (e.error === best) {
          dispatch({ type: 'AWARD', team: e.id, points: POINTS.ammeter.closest, round: 'ammeter', correct: true })
        } else {
          dispatch({ type: 'AWARD', team: e.id, points: 0, round: 'ammeter', correct: false })
        }
      }
    }
    play('charge')
    setPhase('predictReveal')
  }

  function nextScenario() {
    setGuesses({ volt: '', ampere: '' })
    if (scenarioIndex + 1 < SCENARIOS.length) {
      setScenarioIndex((i) => i + 1)
      setPhase('predict')
    } else {
      setPhase('results')
    }
  }

  // ---------------------------------------------------------------- render

  if (phase === 'brief') {
    return (
      <RoundShell roundId="ammeter">
        <div className="grid h-full place-items-center py-6">
          <div className="clay-chassis pop-in w-full max-w-2xl p-8 text-center bg-white shadow-2xl">
            <div className="text-6xl animate-bounce">🎛️</div>
            <h3 className="mt-4 font-display text-4xl font-black text-slate-900">Ammeter Showdown</h3>
            <p className="mt-3 text-lg font-bold text-slate-700">
              First, tell us <strong>where</strong> the ammeter connects. Then predict what current will flow before the needle swings!
            </p>
            <div className="mt-3 inline-block rounded-full bg-slate-100 px-4 py-1.5 text-xs font-bold text-slate-700 shadow-inner">
              +{POINTS.ammeter.placement} correct placement · +{POINTS.ammeter.closest} closest guess · +{POINTS.ammeter.exact} exact prediction
            </div>
            <div className="mt-8">
              <Button size="lg" variant="volt" onClick={() => setPhase('placement')}>
                {state.teams.volt.name} First →
              </Button>
            </div>
          </div>
        </div>
      </RoundShell>
    )
  }

  if (phase === 'placement' || phase === 'placementReveal') {
    const revealing = phase === 'placementReveal'
    const chosen = PLACEMENT_SLOTS.find((s) => s.id === pick)

    return (
      <RoundShell roundId="ammeter" activeTeam={teamId}>
        <div className="mx-auto flex h-full max-w-3xl flex-col justify-center">
          <div className="clay-chassis p-8 bg-white shadow-2xl">
            <h3 className="text-center font-display text-3xl font-black text-slate-900">
              Where Does The Ammeter Connect?
            </h3>
            <p className="mt-1 text-center text-sm font-bold text-slate-600">
              <span style={{ color: teamId === 'volt' ? '#b45309' : '#0e7490' }} className="font-black text-base">
                {state.teams[teamId].name}
              </span>{' '}
              — You are measuring the current through the bulb!
            </p>

            <div className="mt-6 space-y-3">
              {PLACEMENT_SLOTS.map((slot) => {
                const isPick = pick === slot.id
                return (
                  <button
                    key={slot.id}
                    onClick={() => choosePlacement(slot)}
                    disabled={revealing}
                    className={`clay-card w-full border-2 p-4 text-left transition-all ${
                      revealing && slot.correct
                        ? 'border-emerald-500 bg-emerald-50/90 shadow-md scale-[1.01]'
                        : revealing && isPick
                          ? 'border-rose-500 bg-rose-50 shadow-md'
                          : 'border-slate-200 bg-white hover:border-amber-400'
                    }`}
                  >
                    <span className="font-display text-base font-bold text-slate-900">{slot.label}</span>
                  </button>
                )
              })}
            </div>

            {revealing && chosen && (
              <div className="rise-in mt-6 text-center">
                <div className={`mx-auto max-w-xl rounded-2xl p-4 text-sm font-bold shadow-sm ${
                  chosen.correct ? 'bg-emerald-50 text-emerald-900 border-2 border-emerald-300' : 'bg-rose-50 text-rose-900 border-2 border-rose-300'
                }`}>
                  {chosen.correct ? '✔' : '✘'} {chosen.outcome}
                </div>
                <div className="mt-5">
                  <Button size="lg" onClick={nextAfterPlacement}>
                    {placementDone.length + 1 < TEAM_IDS.length
                      ? `${state.teams[TEAM_IDS[turn + 1]].name}'s Turn →`
                      : 'On To The Current Predictions →'}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </RoundShell>
    )
  }

  if (phase === 'predict' || phase === 'predictReveal') {
    const revealing = phase === 'predictReveal'

    return (
      <RoundShell
        roundId="ammeter"
        headerRight={
          <span className="font-display text-xs font-black uppercase tracking-widest text-slate-700">
            Reading {scenarioIndex + 1} / {SCENARIOS.length}
          </span>
        }
      >
        <div className="mx-auto flex h-full max-w-4xl flex-col justify-center">
          <div className="clay-chassis p-6 bg-white shadow-2xl">
            <h3 className="text-center font-display text-2xl font-black text-slate-900">{scenario.description}</h3>
            <p className="text-center text-sm font-bold text-slate-600">
              What will the ammeter read, in amperes (A)?
            </p>

            <div className="mt-4 grid gap-4 md:grid-cols-[1fr_260px]">
              <div className="h-48 rounded-2xl border-2 border-slate-200 bg-white p-2 shadow-inner">
                <CircuitCanvas circuit={scenario.circuit} sim={simulate(scenario.circuit)} />
              </div>
              <AmmeterDial value={revealing ? trueReading : null} max={AMP_MAX} />
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {TEAM_IDS.map((id) => {
                const isVolt = id === 'volt'
                const guess = Number.parseFloat(guesses[id])
                const error = Number.isFinite(guess) ? Math.abs(guess - trueReading) : null

                return (
                  <div
                    key={id}
                    className={`rounded-2xl border-2 p-4 ${isVolt ? 'clay-card-volt' : 'clay-card-amp'}`}
                  >
                    <div className="font-display text-base font-black" style={{ color: isVolt ? '#78350f' : '#164e63' }}>
                      {state.teams[id].name}
                    </div>
                    {revealing ? (
                      <div className="mt-2 text-sm font-bold text-slate-800">
                        Predicted: <strong>{Number.isFinite(guess) ? guess.toFixed(2) : '—'} A</strong>
                        {error !== null && (
                          <span className={error <= 0.011 ? ' text-emerald-700 font-black' : ' text-slate-600'}>
                            {' '}
                            (off by {error.toFixed(2)} A)
                          </span>
                        )}
                      </div>
                    ) : (
                      <input
                        type="number"
                        step="0.05"
                        min="0"
                        max="5"
                        value={guesses[id]}
                        onChange={(e) => setGuesses((g) => ({ ...g, [id]: e.target.value }))}
                        placeholder="0.00"
                        className="mt-2 w-full rounded-xl border-2 border-white bg-white/90 px-4 py-2 font-display text-2xl font-black text-slate-900 shadow-inner outline-none focus:border-amber-400"
                      />
                    )}
                  </div>
                )
              })}
            </div>

            <div className="mt-5 text-center">
              {revealing ? (
                <div className="rise-in">
                  <p className="font-display text-xl font-black text-emerald-600">
                    The needle reads {trueReading.toFixed(2)} A!
                  </p>
                  <Button className="mt-3" size="lg" onClick={nextScenario}>
                    {scenarioIndex + 1 < SCENARIOS.length ? 'Next Reading →' : 'View Round Results →'}
                  </Button>
                </div>
              ) : (
                <Button
                  size="lg"
                  onClick={revealPrediction}
                  disabled={!TEAM_IDS.some((id) => Number.isFinite(Number.parseFloat(guesses[id])))}
                >
                  Lock In Predictions & Swing The Needle! ⚡
                </Button>
              )}
            </div>
          </div>
        </div>
      </RoundShell>
    )
  }

  return (
    <RoundShell roundId="ammeter">
      <div className="grid h-full place-items-center py-6">
        <div className="clay-chassis rise-in w-full max-w-2xl p-8 text-center bg-white shadow-2xl">
          <h3 className="font-display text-3xl font-black text-slate-900">Meters Down!</h3>
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
                  +{state.scoreLog.ammeter[id]}
                </div>
                <div className="text-xs font-bold uppercase tracking-widest text-slate-600">
                  Points This Round
                </div>
              </div>
            ))}
          </div>
          <div className="mt-8">
            <Button size="lg" onClick={() => dispatch({ type: 'COMPLETE_ROUND', round: 'ammeter' })}>
              Back to Tournament Board →
            </Button>
          </div>
        </div>
      </div>
    </RoundShell>
  )
}

function AmmeterDial({ value, max }: { value: number | null; max: number }) {
  const targetFrac = value === null ? 0 : Math.max(0, Math.min(1, value / max))
  const targetAngle = -90 + targetFrac * 180
  const [angle, setAngle] = useState(-90)

  useEffect(() => {
    let animId: number
    let pos = angle
    let vel = 0
    const k = 0.08
    const damping = 0.8

    const step = () => {
      const force = (targetAngle - pos) * k
      vel = (vel + force) * damping
      pos += vel

      if (Math.abs(vel) < 0.02 && Math.abs(targetAngle - pos) < 0.05) {
        setAngle(targetAngle)
        return
      }
      setAngle(pos)
      animId = requestAnimationFrame(step)
    }

    animId = requestAnimationFrame(step)
    return () => cancelAnimationFrame(animId)
  }, [targetAngle])

  const ticks = Array.from({ length: 11 }, (_, i) => i / 10)

  return (
    <div className="clay-card border-2 border-slate-300 bg-white p-3.5 flex flex-col justify-between shadow-md">
      <svg viewBox="0 0 200 130" className="w-full">
        {/* Arc Background */}
        <path d="M 20 110 A 80 80 0 0 1 180 110" fill="none" stroke="#cbd5e1" strokeWidth={5} />
        {ticks.map((t) => {
          const a = (-90 + t * 180) * (Math.PI / 180)
          const x1 = 100 + Math.sin(a) * 68
          const y1 = 110 - Math.cos(a) * 68
          const x2 = 100 + Math.sin(a) * 80
          const y2 = 110 - Math.cos(a) * 80
          return (
            <g key={t}>
              <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="#334155" strokeWidth={3} strokeLinecap="round" />
              {(t * 10) % 5 === 0 && (
                <text
                  x={100 + Math.sin(a) * 54}
                  y={110 - Math.cos(a) * 54 + 4}
                  fill="#0f172a"
                  fontSize={12}
                  fontWeight={900}
                  textAnchor="middle"
                >
                  {(t * max).toFixed(1)}
                </text>
              )}
            </g>
          )
        })}

        {/* Dynamic Spring-Damped Needle */}
        <line
          x1={100}
          y1={110}
          x2={100 + Math.sin(angle * (Math.PI / 180)) * 72}
          y2={110 - Math.cos(angle * (Math.PI / 180)) * 72}
          stroke={value === null ? '#475569' : '#e11d48'}
          strokeWidth={4.5}
          strokeLinecap="round"
        />
        <circle cx={100} cy={110} r={8} fill="#0f172a" />
        <circle cx={100} cy={110} r={3} fill="#ffffff" />
        <text x={100} y={128} fill="#0f172a" fontSize={11} fontWeight={900} textAnchor="middle">
          CURRENT (A)
        </text>
      </svg>
      <div className="text-center font-display text-2xl font-black text-slate-950 tabular-nums">
        {value === null ? '– . – –' : `${value.toFixed(2)} A`}
      </div>
    </div>
  )
}
