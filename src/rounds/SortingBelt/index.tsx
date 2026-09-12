import { useEffect, useState } from 'react'
import { POINTS, ROUNDS, TEAM_IDS, TEAM_THEME } from '../../constants'
import { useGame } from '../../context/GameContext'
import { useCountdown } from '../../hooks/useCountdown'
import { useSound } from '../../hooks/useSound'
import { RoundShell } from '../../components/RoundShell'
import { Timer } from '../../components/Timer'
import { Button } from '../../components/ui/Button'
import { MATERIALS } from '../../data/materials'
import type { Material } from '../../data/materials'
import type { TeamId } from '../../types'

const TOTAL_ITEMS = 12
const CHANCE_SECONDS = 15
const TEST_COST_SECONDS = 3

type Phase = 'brief' | 'play' | 'results'

interface TeamStats {
  correct: number
  wrong: number
  streak: number
  best: number
  tested: number
}

function multiplierFor(streak: number): number {
  if (streak >= 10) return 3
  if (streak >= POINTS.belt.streakThreshold) return 2
  return 1
}

export function SortingBelt() {
  const { state, dispatch } = useGame()
  const play = useSound()

  const [phase, setPhase] = useState<Phase>('brief')
  const [index, setIndex] = useState(0)
  const [revealed, setRevealed] = useState(false)
  const [stats, setStats] = useState<Record<TeamId, TeamStats>>({
    volt: { correct: 0, wrong: 0, streak: 0, best: 0, tested: 0 },
    ampere: { correct: 0, wrong: 0, streak: 0, best: 0, tested: 0 },
  })
  const [feedback, setFeedback] = useState<{ ok: boolean; material: Material; timeout?: boolean } | null>(null)
  const [remaining, setRemaining] = useState(CHANCE_SECONDS)

  // Pick exactly TOTAL_ITEMS unique materials
  const [items] = useState(() => [...MATERIALS].sort(() => Math.random() - 0.5).slice(0, TOTAL_ITEMS))

  const teamId = TEAM_IDS[index % 2]
  const theme = TEAM_THEME[teamId]
  const material = items[index] ?? items[0]

  function advanceToNextItem(nextIdx: number) {
    if (nextIdx < TOTAL_ITEMS) {
      setIndex(nextIdx)
      setRevealed(false)
      setFeedback(null)
      setRemaining(CHANCE_SECONDS)
      play('switch')
    } else {
      setFeedback(null)
      setPhase('results')
    }
  }

  function handleTimeout() {
    play('wrong')
    setStats((prev) => ({
      ...prev,
      [teamId]: {
        ...prev[teamId],
        wrong: prev[teamId].wrong + 1,
        streak: 0,
      },
    }))
    dispatch({
      type: 'AWARD',
      team: teamId,
      points: POINTS.belt.wrong,
      round: 'belt',
      correct: false,
    })
    setFeedback({ ok: false, material, timeout: true })
    window.setTimeout(() => {
      advanceToNextItem(index + 1)
    }, 1400)
  }

  useEffect(() => {
    if (phase !== 'play' || state.paused || feedback) return
    if (remaining <= 0) {
      handleTimeout()
      return
    }
    const t = setInterval(() => setRemaining((s) => s - 1), 1000)
    return () => clearInterval(t)
  }, [phase, state.paused, feedback, remaining])

  function beginGame() {
    setPhase('play')
    setIndex(0)
    setRemaining(CHANCE_SECONDS)
    play('switch')
  }

  function answer(isConductor: boolean) {
    if (phase !== 'play' || feedback) return
    const ok = isConductor === material.conductor
    const currentStreak = stats[teamId].streak
    const mult = multiplierFor(currentStreak)

    if (ok) {
      const nextStreak = currentStreak + 1
      setStats((prev) => ({
        ...prev,
        [teamId]: {
          ...prev[teamId],
          correct: prev[teamId].correct + 1,
          streak: nextStreak,
          best: Math.max(prev[teamId].best, nextStreak),
        },
      }))
      play(nextStreak >= POINTS.belt.streakThreshold ? 'charge' : 'correct')
      dispatch({
        type: 'AWARD',
        team: teamId,
        points: POINTS.belt.correct * mult,
        round: 'belt',
        correct: true,
      })
    } else {
      setStats((prev) => ({
        ...prev,
        [teamId]: {
          ...prev[teamId],
          wrong: prev[teamId].wrong + 1,
          streak: 0,
        },
      }))
      play('wrong')
      dispatch({
        type: 'AWARD',
        team: teamId,
        points: POINTS.belt.wrong,
        round: 'belt',
        correct: false,
      })
    }

    setFeedback({ ok, material })
    const delay = ok ? 850 : 1600
    window.setTimeout(() => {
      advanceToNextItem(index + 1)
    }, delay)
  }

  function testIt() {
    if (phase !== 'play' || revealed || feedback) return
    setRevealed(true)
    setStats((prev) => ({
      ...prev,
      [teamId]: {
        ...prev[teamId],
        tested: prev[teamId].tested + 1,
      },
    }))
    setRemaining((s) => Math.max(0, s - TEST_COST_SECONDS))
    play(material.conductor ? 'charge' : 'buzz')
  }

  useEffect(() => {
    if (phase !== 'play') return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowUp') answer(true)
      else if (e.key === 'ArrowDown') answer(false)
      else if (e.key === ' ') {
        e.preventDefault()
        testIt()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  // ---------------------------------------------------------------- render

  if (phase === 'brief') {
    return (
      <RoundShell roundId="belt">
        <div className="grid h-full place-items-center py-6">
          <div className="clay-chassis pop-in w-full max-w-2xl p-8 text-center bg-white shadow-2xl">
            <div className="text-6xl animate-bounce">🧲</div>
            <h3 className="mt-4 font-display text-4xl font-black text-slate-900">
              Sorting Belt — Chance Wise!
            </h3>
            <p className="mt-3 text-lg font-bold text-slate-700">
              <strong>{TOTAL_ITEMS} items on the conveyor belt ({TOTAL_ITEMS / 2} chances per team).</strong>{' '}
              Teams take turns chance-by-chance! Every item is either a{' '}
              <span className="text-emerald-600 font-black">conductor</span> or an{' '}
              <span className="text-amber-600 font-black">insulator</span>.
            </p>
            <div className="mt-3 inline-block rounded-full bg-slate-100 px-4 py-1.5 text-xs font-bold text-slate-700 shadow-inner">
              ↑ Conductor · ↓ Insulator · Spacebar to test (−{TEST_COST_SECONDS}s) · Multipliers at {POINTS.belt.streakThreshold} streak!
            </div>

            <div className="mt-8">
              <Button
                size="lg"
                variant="volt"
                onClick={beginGame}
              >
                Start Activity →
              </Button>
            </div>
          </div>
        </div>
      </RoundShell>
    )
  }

  if (phase === 'results') {
    return (
      <RoundShell roundId="belt">
        <div className="grid h-full place-items-center py-6">
          <div className="clay-chassis rise-in w-full max-w-2xl p-8 bg-white shadow-2xl">
            <h3 className="text-center font-display text-3xl font-black text-slate-900">Belt Stopped!</h3>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              {TEAM_IDS.map((id) => {
                const res = stats[id]
                const isVolt = id === 'volt'
                return (
                  <div
                    key={id}
                    className={`rounded-3xl p-5 ${isVolt ? 'clay-card-volt' : 'clay-card-amp'}`}
                  >
                    <div
                      className="font-display text-2xl font-black"
                      style={{ color: isVolt ? '#78350f' : '#164e63' }}
                    >
                      {state.teams[id].name}
                    </div>
                    <div className="mt-3 space-y-1.5 text-sm font-bold text-slate-700">
                      <div className="flex justify-between">
                        <span>Correct:</span>
                        <strong className="text-emerald-700">{res.correct}</strong>
                      </div>
                      <div className="flex justify-between">
                        <span>Mistakes:</span>
                        <strong className="text-rose-700">{res.wrong}</strong>
                      </div>
                      <div className="flex justify-between">
                        <span>Best streak:</span>
                        <strong className="text-slate-900">🔥 {res.best}</strong>
                      </div>
                      <div className="flex justify-between border-t border-slate-300 pt-2 font-display text-lg font-black text-slate-900">
                        <span>Round Total:</span>
                        <strong className="text-emerald-600">+{state.scoreLog.belt[id]}</strong>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
            <p className="mt-5 text-center text-xs font-bold text-slate-500">💡 {ROUNDS.belt.objective}</p>
            <div className="mt-6 flex justify-center">
              <Button size="lg" onClick={() => dispatch({ type: 'COMPLETE_ROUND', round: 'belt' })}>
                Back to Tournament Board →
              </Button>
            </div>
          </div>
        </div>
      </RoundShell>
    )
  }

  const currentStreak = stats[teamId].streak
  const mult = multiplierFor(currentStreak)

  return (
    <RoundShell
      roundId="belt"
      activeTeam={teamId}
      headerRight={
        <div className="flex items-center gap-2 text-xs font-black">
          <span
            className={`flex items-center gap-1 rounded-full px-2.5 py-0.5 shadow-xs border transition-all ${
              teamId === 'volt'
                ? 'bg-amber-100 border-amber-400 text-amber-950 ring-1 ring-amber-400/40'
                : 'bg-white/80 border-slate-300 text-slate-700'
            }`}
          >
            ⚡ {state.teams.volt.name}: ✔ {stats.volt.correct}
          </span>
          <span
            className={`flex items-center gap-1 rounded-full px-2.5 py-0.5 shadow-xs border transition-all ${
              teamId === 'ampere'
                ? 'bg-cyan-100 border-cyan-400 text-cyan-950 ring-1 ring-cyan-400/40'
                : 'bg-white/80 border-slate-300 text-slate-700'
            }`}
          >
            ⚡ {state.teams.ampere.name}: ✔ {stats.ampere.correct}
          </span>
          {mult > 1 && (
            <span className="rounded-full bg-amber-500 px-2 py-0.5 font-display text-[11px] font-black text-white shadow-xs animate-bounce">
              🔥 ×{mult}
            </span>
          )}
          <span className="rounded-full bg-slate-900 px-2.5 py-0.5 text-xs font-black text-white shadow-xs">
            {index + 1}/{TOTAL_ITEMS}
          </span>
          <Timer remaining={remaining} total={CHANCE_SECONDS} />
        </div>
      }
    >
      <div className="mx-auto flex min-h-full max-w-2xl flex-col justify-center py-1 gap-2.5">
        {/* Conductor Button */}
        <button
          onClick={() => answer(true)}
          disabled={!!feedback}
          className="clay-card group border-2 border-emerald-500 bg-emerald-100/90 py-2.5 px-4 transition-all hover:scale-[1.01] hover:bg-emerald-200 disabled:opacity-60 cursor-pointer text-center shadow-sm"
        >
          <div className="font-display text-2xl font-black text-emerald-950 leading-tight">▲ CONDUCTOR</div>
          <div className="text-xs font-black text-emerald-900">Lets electrical current flow through</div>
        </button>

        {/* Central Material Test Card */}
        <div className="clay-chassis relative grid place-items-center bg-white py-4 md:py-5 px-6 shadow-xl border-2 border-slate-200">
          <div className="text-6xl md:text-7xl drop-shadow-sm">{material.icon}</div>
          <div className="mt-1 font-display text-3xl md:text-4xl font-black text-slate-950 leading-tight">{material.name}</div>

          {revealed && !feedback && (
            <div className="pop-in mt-2.5 flex items-center gap-2.5 rounded-xl border border-slate-300 bg-slate-100 px-4 py-1.5 shadow-xs">
              <span className="text-2xl">{material.conductor ? '💡' : '🌑'}</span>
              <span className="text-xs md:text-sm font-bold text-slate-900">
                Bench Test: The test bulb{' '}
                <strong className={material.conductor ? 'text-emerald-700 font-black' : 'text-rose-700 font-black'}>
                  {material.conductor ? 'lights up bright!' : 'stays completely dark.'}
                </strong>
              </span>
            </div>
          )}

          {!revealed && !feedback && (
            <button
              onClick={testIt}
              className="clay-btn mt-2.5 bg-slate-900 hover:bg-slate-800 border border-slate-900 px-4 py-1.5 text-xs font-black text-white cursor-pointer shadow-sm"
            >
              🔬 Test on Bench Circuit (−{TEST_COST_SECONDS}s)
            </button>
          )}

          {/* Opaque Explanation Overlay */}
          {feedback && (
            <div
              className={`pop-in absolute inset-0 grid place-items-center rounded-3xl border-4 bg-white p-4 text-center shadow-2xl z-20 ${
                feedback.ok ? 'border-emerald-500' : 'border-rose-500'
              }`}
            >
              <div className="flex flex-col items-center">
                <img
                  src={feedback.ok ? '/assets/rick_and_morty/rick_experiment.jpg' : '/assets/rick_and_morty/morty_shock.jpg'}
                  alt="Reaction"
                  className="h-16 w-16 rounded-xl object-cover border border-slate-900 shadow-xs mb-1.5"
                />
                <div className="font-display text-2xl md:text-3xl font-black text-slate-950">
                  {feedback.timeout ? '⚠️ Time Up!' : feedback.ok ? '✔ Correct!' : '✘ Not quite!'} —{' '}
                  <span className={feedback.material.conductor ? 'text-emerald-700' : 'text-amber-700'}>
                    {feedback.material.conductor ? 'CONDUCTOR' : 'INSULATOR'}
                  </span>
                </div>
                <p className="mx-auto mt-1 max-w-md text-xs md:text-sm font-black text-slate-900">
                  {feedback.material.why}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Insulator Button */}
        <button
          onClick={() => answer(false)}
          disabled={!!feedback}
          className="clay-card group border-2 border-amber-500 bg-amber-100/90 py-2.5 px-4 transition-all hover:scale-[1.01] hover:bg-amber-200 disabled:opacity-60 cursor-pointer text-center shadow-sm"
        >
          <div className="font-display text-2xl font-black text-amber-950 leading-tight">▼ INSULATOR</div>
          <div className="text-xs font-black text-amber-900">Blocks electrical current from passing</div>
        </button>

        <div
          className={`text-center text-xs md:text-sm font-black py-1.5 px-5 rounded-full border-2 mx-auto w-fit shadow-xs transition-all ${
            teamId === 'volt'
              ? 'border-amber-400 bg-amber-50/95 text-amber-950'
              : 'border-cyan-400 bg-cyan-50/95 text-cyan-950'
          }`}
        >
          <span>Chance {index + 1} of {TOTAL_ITEMS}: </span>
          <span style={{ color: theme.accent }} className="font-display font-black uppercase">
            ⚡ {state.teams[teamId].name}'s Turn
          </span>{' '}
          <span className="text-slate-600 font-bold ml-1">• [↑] Conductor · [↓] Insulator</span>
        </div>
      </div>
    </RoundShell>
  )
}
