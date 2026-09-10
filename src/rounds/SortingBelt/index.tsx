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

const TURN_SECONDS = 60
const TEST_COST_SECONDS = 3

type Phase = 'brief' | 'play' | 'handoff' | 'results'

interface TurnResult {
  correct: number
  wrong: number
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
  const [turn, setTurn] = useState(0)
  const [index, setIndex] = useState(0)
  const [revealed, setRevealed] = useState(false)
  const [correct, setCorrect] = useState(0)
  const [wrong, setWrong] = useState(0)
  const [streak, setStreak] = useState(0)
  const [bestStreak, setBestStreak] = useState(0)
  const [testedCount, setTestedCount] = useState(0)
  const [results, setResults] = useState<Partial<Record<TeamId, TurnResult>>>({})
  const [feedback, setFeedback] = useState<{ ok: boolean; material: Material } | null>(null)

  const teamId = TEAM_IDS[turn]
  const theme = TEAM_THEME[teamId]
  const material = MATERIALS[index % MATERIALS.length]

  const { remaining, setRemaining } = useCountdown({
    seconds: TURN_SECONDS,
    running: phase === 'play' && !state.paused && !feedback,
    resetKey: turn,
    onEnd: () => endTurn(),
  })

  function endTurn() {
    setResults((r) => ({
      ...r,
      [teamId]: {
        correct,
        wrong,
        best: Math.max(streak, bestStreak),
        tested: testedCount,
      },
    }))
    setPhase(turn === 0 ? 'handoff' : 'results')
  }

  function beginTurn(nextTurn: number) {
    setTurn(nextTurn)
    setIndex(0)
    setCorrect(0)
    setWrong(0)
    setStreak(0)
    setBestStreak(0)
    setTestedCount(0)
    setRevealed(false)
    setFeedback(null)
    setRemaining(TURN_SECONDS)
    setPhase('play')
  }

  function answer(isConductor: boolean) {
    if (phase !== 'play' || feedback) return
    const ok = isConductor === material.conductor
    const mult = multiplierFor(streak)

    if (ok) {
      const nextStreak = streak + 1
      setCorrect((c) => c + 1)
      setStreak(nextStreak)
      setBestStreak((b) => Math.max(b, nextStreak))
      play(nextStreak >= POINTS.belt.streakThreshold ? 'charge' : 'correct')
      dispatch({
        type: 'AWARD',
        team: teamId,
        points: POINTS.belt.correct * mult,
        round: 'belt',
        correct: true,
      })
    } else {
      setWrong((w) => w + 1)
      setStreak(0)
      play('wrong')
      dispatch({ type: 'AWARD', team: teamId, points: POINTS.belt.wrong, round: 'belt', correct: false })
    }

    setFeedback({ ok, material })
    const delay = ok ? 850 : 1600
    window.setTimeout(() => {
      setFeedback(null)
      setRevealed(false)
      setIndex((i) => i + 1)
    }, delay)
  }

  function testIt() {
    if (phase !== 'play' || revealed || feedback) return
    setRevealed(true)
    setTestedCount((n) => n + 1)
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

  if (phase === 'brief' || phase === 'handoff') {
    const nextTurn = phase === 'brief' ? 0 : 1
    const nextTeam = state.teams[TEAM_IDS[nextTurn]]
    const prev = results[TEAM_IDS[0]]

    return (
      <RoundShell roundId="belt">
        <div className="grid h-full place-items-center py-6">
          <div className="clay-chassis pop-in w-full max-w-2xl p-8 text-center bg-white shadow-2xl">
            <div className="text-6xl animate-bounce">🧲</div>
            <h3 className="mt-4 font-display text-4xl font-black text-slate-900">
              {phase === 'brief' ? 'Sorting Belt' : 'Switching Teams'}
            </h3>
            <p className="mt-3 text-lg font-bold text-slate-700">
              <strong>{TURN_SECONDS} seconds on the clock.</strong> Every item on the conveyor belt is either a{' '}
              <span className="text-emerald-600 font-black">conductor</span> or an{' '}
              <span className="text-amber-600 font-black">insulator</span>. Sort as many as you can!
            </p>
            <div className="mt-3 inline-block rounded-full bg-slate-100 px-4 py-1.5 text-xs font-bold text-slate-700 shadow-inner">
              ↑ Conductor · ↓ Insulator · Spacebar to test (−{TEST_COST_SECONDS}s) · Multipliers at {POINTS.belt.streakThreshold} streak!
            </div>

            {phase === 'handoff' && prev && (
              <div className="mx-auto mt-6 w-fit rounded-2xl border-2 border-amber-300 bg-amber-50 px-6 py-3 text-sm font-bold text-amber-950 shadow-sm">
                <span>{state.teams.volt.name}</span> sorted{' '}
                <strong className="text-emerald-700">{prev.correct}</strong> items with a best streak of{' '}
                <strong className="text-amber-700">{prev.best}</strong>! Same belt order for the other side!
              </div>
            )}

            <div className="mt-8">
              <Button
                size="lg"
                variant={nextTurn === 0 ? 'volt' : 'ampere'}
                onClick={() => beginTurn(nextTurn)}
              >
                {nextTeam.name} — Start the Belt →
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
                const res = results[id]
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
                        <strong className="text-emerald-700">{res?.correct ?? 0}</strong>
                      </div>
                      <div className="flex justify-between">
                        <span>Mistakes:</span>
                        <strong className="text-rose-700">{res?.wrong ?? 0}</strong>
                      </div>
                      <div className="flex justify-between">
                        <span>Best streak:</span>
                        <strong className="text-slate-900">🔥 {res?.best ?? 0}</strong>
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

  const mult = multiplierFor(streak)

  return (
    <RoundShell
      roundId="belt"
      activeTeam={teamId}
      headerRight={
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2.5 text-sm font-black">
            <span className="text-emerald-700 bg-emerald-100 px-3 py-1 rounded-full shadow-xs">✔ {correct}</span>
            <span className="text-rose-700 bg-rose-100 px-3 py-1 rounded-full shadow-xs">✘ {wrong}</span>
            {mult > 1 && (
              <span className="rounded-full bg-amber-500 px-3 py-1 font-display text-xs font-black text-white shadow-sm animate-bounce">
                🔥 ×{mult} COMBO
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={endTurn}
            disabled={phase !== 'play'}
            className="clay-btn bg-white hover:bg-slate-100 border border-slate-300 px-3 py-1 text-xs font-black text-slate-700 shadow-xs cursor-pointer disabled:opacity-40"
            title={turn === 0 ? 'Finish turn early and hand over to Team Ampere' : 'Finish turn early and see results'}
          >
            ⏭ End Turn
          </button>
          <Timer remaining={remaining} total={TURN_SECONDS} />
        </div>
      }
    >
      <div className="mx-auto flex h-full max-w-3xl flex-col justify-center gap-3.5">
        {/* Conductor Button */}
        <button
          onClick={() => answer(true)}
          disabled={!!feedback}
          className="clay-card group border-3 border-emerald-500 bg-emerald-100/90 py-4 transition-all hover:scale-[1.01] hover:bg-emerald-200 disabled:opacity-60 cursor-pointer text-center shadow-md"
        >
          <div className="font-display text-3xl font-black text-emerald-950">▲ CONDUCTOR</div>
          <div className="text-sm font-black text-emerald-900 mt-0.5">Lets electrical current flow through</div>
        </button>

        {/* Central Material Test Card */}
        <div className="clay-chassis relative grid place-items-center bg-white py-8 px-6 shadow-2xl border-2 border-slate-200">
          <div className="text-8xl drop-shadow-sm">{material.icon}</div>
          <div className="mt-3 font-display text-5xl font-black text-slate-950">{material.name}</div>

          {revealed && !feedback && (
            <div className="pop-in mt-4 flex items-center gap-3 rounded-2xl border-2 border-slate-300 bg-slate-100 px-6 py-3 shadow-sm">
              <span className="text-3xl">{material.conductor ? '💡' : '🌑'}</span>
              <span className="text-base font-bold text-slate-900">
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
              className="clay-btn mt-4 bg-slate-900 hover:bg-slate-800 border-2 border-slate-900 px-5 py-2.5 text-xs font-black text-white cursor-pointer shadow-md"
            >
              🔬 Test on Bench Circuit (−{TEST_COST_SECONDS}s)
            </button>
          )}

          {/* Opaque Explanation Overlay */}
          {feedback && (
            <div
              className={`pop-in absolute inset-0 grid place-items-center rounded-3xl border-4 bg-white p-6 text-center shadow-2xl z-20 ${
                feedback.ok ? 'border-emerald-500' : 'border-rose-500'
              }`}
            >
              <div className="flex flex-col items-center">
                <img
                  src={feedback.ok ? '/assets/rick_and_morty/rick_experiment.jpg' : '/assets/rick_and_morty/morty_shock.jpg'}
                  alt="Reaction"
                  className="h-20 w-20 rounded-2xl object-cover border-2 border-slate-900 shadow-md mb-2"
                />
                <div className="font-display text-4xl font-black text-slate-950">
                  {feedback.ok ? '✔ Correct!' : '✘ Not quite!'} —{' '}
                  <span className={feedback.material.conductor ? 'text-emerald-700' : 'text-amber-700'}>
                    {feedback.material.conductor ? 'CONDUCTOR' : 'INSULATOR'}
                  </span>
                </div>
                <p className="mx-auto mt-2 max-w-md text-base font-black text-slate-900">
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
          className="clay-card group border-3 border-amber-500 bg-amber-100/90 py-4 transition-all hover:scale-[1.01] hover:bg-amber-200 disabled:opacity-60 cursor-pointer text-center shadow-md"
        >
          <div className="font-display text-3xl font-black text-amber-950">▼ INSULATOR</div>
          <div className="text-sm font-black text-amber-900 mt-0.5">Blocks electrical current from passing</div>
        </button>

        <div className="text-center text-sm font-black text-slate-900 bg-white/95 py-2 px-5 rounded-full border border-slate-300 mx-auto w-fit shadow-xs">
          Turn:{' '}
          <span style={{ color: theme.accent }} className="font-black text-base">
            {state.teams[teamId].name}
          </span>{' '}
          • Press [↑] for Conductor or [↓] for Insulator
        </div>
      </div>
    </RoundShell>
  )
}
