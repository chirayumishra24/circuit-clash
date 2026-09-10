import { useEffect, useState } from 'react'
import { POINTS, ROUNDS, TEAM_IDS, TEAM_THEME } from '../../constants'
import { useGame } from '../../context/GameContext'
import { useCountdown } from '../../hooks/useCountdown'
import { useSound } from '../../hooks/useSound'
import { RoundShell } from '../../components/RoundShell'
import { Timer } from '../../components/Timer'
import { Button } from '../../components/ui/Button'
import { BUZZER_QUESTIONS, FINAL_QUESTIONS } from '../../data/questions'
import type { Question } from '../../data/questions'
import type { TeamId } from '../../types'

const BUZZ_WINDOW_SECONDS = 15
const ANSWER_WINDOW_SECONDS = 8
const CORRECT_POINTS = 50
const WRONG_PENALTY = 25

type Phase = 'brief' | 'buzzer' | 'answering' | 'reveal' | 'wagerIntro' | 'wager' | 'final' | 'finalReveal'

export function LightningRound() {
  const { state, dispatch } = useGame()
  const play = useSound()

  const [phase, setPhase] = useState<Phase>('brief')
  const [qIndex, setQIndex] = useState(0)
  const [answering, setAnswering] = useState<TeamId | null>(null)
  const [lockedOut, setLockedOut] = useState<TeamId[]>([])
  const [picked, setPicked] = useState<number | null>(null)

  const [wagers, setWagers] = useState<Record<TeamId, number>>({
    volt: Math.min(100, state.teams.volt.score),
    ampere: Math.min(100, state.teams.ampere.score),
  })
  const [finalPicks, setFinalPicks] = useState<Partial<Record<TeamId, number>>>({})

  const questions = BUZZER_QUESTIONS
  const question: Question = questions[qIndex]
  const finalQuestion = FINAL_QUESTIONS[0]

  const clockTotal = phase === 'answering' ? ANSWER_WINDOW_SECONDS : BUZZ_WINDOW_SECONDS

  const { remaining, setRemaining } = useCountdown({
    seconds: clockTotal,
    running: (phase === 'buzzer' || phase === 'answering') && !state.paused,
    resetKey: `${qIndex}-${phase}`,
    onEnd: () => {
      if (phase === 'answering') {
        timeOutAnswer()
      } else if (phase === 'buzzer') {
        timeOutBuzzer()
      }
    },
  })

  function buzz(team: TeamId) {
    if (phase !== 'buzzer' || lockedOut.includes(team)) return
    play('buzz')
    setAnswering(team)
    setPhase('answering')
    setRemaining(ANSWER_WINDOW_SECONDS)
  }

  function pickOption(index: number) {
    if (phase !== 'answering' || !answering) return
    setPicked(index)
    const right = index === question.answer

    play(right ? 'charge' : 'wrong')
    dispatch({
      type: 'AWARD',
      team: answering,
      points: right ? CORRECT_POINTS : -WRONG_PENALTY,
      round: 'lightning',
      correct: right,
    })

    if (right) {
      setPhase('reveal')
    } else {
      const nextLocked = [...lockedOut, answering]
      setLockedOut(nextLocked)
      setAnswering(null)
      setPicked(null)

      if (nextLocked.length < TEAM_IDS.length) {
        setPhase('buzzer')
        setRemaining(BUZZ_WINDOW_SECONDS)
      } else {
        setPhase('reveal')
      }
    }
  }

  function timeOutAnswer() {
    if (!answering) return
    play('wrong')
    dispatch({
      type: 'AWARD',
      team: answering,
      points: -WRONG_PENALTY,
      round: 'lightning',
      correct: false,
    })
    const nextLocked = [...lockedOut, answering]
    setLockedOut(nextLocked)
    setAnswering(null)
    setPicked(null)

    if (nextLocked.length < TEAM_IDS.length) {
      setPhase('buzzer')
      setRemaining(BUZZ_WINDOW_SECONDS)
    } else {
      setPhase('reveal')
    }
  }

  function timeOutBuzzer() {
    play('wrong')
    setPhase('reveal')
  }

  function nextQuestion() {
    if (qIndex + 1 < questions.length) {
      setQIndex(qIndex + 1)
      setAnswering(null)
      setLockedOut([])
      setPicked(null)
      setPhase('buzzer')
      setRemaining(BUZZ_WINDOW_SECONDS)
    } else {
      setPhase('wagerIntro')
    }
  }

  useEffect(() => {
    if (phase !== 'buzzer') return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'a' || e.key === 'A') buzz('volt')
      if (e.key === 'l' || e.key === 'L') buzz('ampere')
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  function submitFinal(team: TeamId, option: number) {
    setFinalPicks((p) => ({ ...p, [team]: option }))
  }

  function scoreFinal() {
    play('charge')
    for (const id of TEAM_IDS) {
      const pick = finalPicks[id]
      const wager = wagers[id]
      if (wager === 0) continue
      const right = pick === finalQuestion.answer
      dispatch({
        type: 'AWARD',
        team: id,
        points: right ? wager : -wager,
        round: 'lightning',
        correct: right,
      })
    }
    setPhase('finalReveal')
  }

  useEffect(() => {
    setWagers((w) => ({
      volt: Math.min(w.volt, state.teams.volt.score),
      ampere: Math.min(w.ampere, state.teams.ampere.score),
    }))
  }, [state.teams.volt.score, state.teams.ampere.score])

  // ---------------------------------------------------------------- render

  if (phase === 'brief') {
    return (
      <RoundShell roundId="lightning">
        <div className="grid h-full place-items-center py-6">
          <div className="clay-chassis pop-in w-full max-w-2xl p-8 text-center bg-white shadow-2xl">
            <div className="text-6xl animate-bounce">⚡</div>
            <h3 className="mt-4 font-display text-4xl font-black text-slate-900">Lightning Round</h3>
            <p className="mt-3 text-lg font-bold text-slate-700">
              {questions.length} rapid-fire buzzer questions, followed by <strong>The Final Charge</strong> wager!
            </p>
            <div className="mx-auto mt-6 w-fit rounded-2xl border-2 border-slate-200 bg-slate-50 px-6 py-3.5 text-center text-sm font-bold text-slate-800 shadow-sm">
              <div className="flex items-center justify-center gap-3">
                <span className="rounded-xl bg-amber-500 px-2.5 py-1 font-black text-white shadow-sm">⚡ Left Buzzer: {state.teams.volt.name}</span>
                <span className="text-slate-400">·</span>
                <span className="rounded-xl bg-cyan-600 px-2.5 py-1 font-black text-white shadow-sm">⚡ Right Buzzer: {state.teams.ampere.name}</span>
              </div>
              <div className="mt-2 text-xs font-bold text-slate-600">
                Tap on-screen buzzers on the Smart Board to lock in! (+{CORRECT_POINTS} pts / −{WRONG_PENALTY} pts)
              </div>
            </div>
            <div className="mt-8">
              <Button size="lg" onClick={() => setPhase('buzzer')}>
                ⚡ Arm The Buzzers →
              </Button>
            </div>
          </div>
        </div>
      </RoundShell>
    )
  }

  if (phase === 'buzzer' || phase === 'answering' || phase === 'reveal') {
    const revealing = phase === 'reveal'

    return (
      <RoundShell
        roundId="lightning"
        activeTeam={answering}
        headerRight={
          <div className="flex items-center gap-3">
            <span className="font-display text-xs font-black uppercase tracking-widest text-slate-700">
              Question {qIndex + 1} of {questions.length}
            </span>
            {!revealing && <Timer remaining={remaining} total={clockTotal} />}
          </div>
        }
      >
        <div className="mx-auto flex h-full max-w-3xl flex-col justify-center">
          <div className="clay-chassis p-8 bg-white shadow-2xl flex flex-col gap-4">
            <div className="text-center">
              <span className="rounded-full bg-emerald-100 px-3 py-1 text-[11px] font-black uppercase tracking-wider text-emerald-800">
                {question.subtopic}
              </span>
              <h3 className="mt-3 font-display text-2xl font-black leading-snug text-slate-900">
                {question.prompt}
              </h3>
            </div>

            <div className="mt-2 grid gap-3 sm:grid-cols-2">
              {question.options.map((opt, i) => {
                const isAnswer = i === question.answer
                const isPicked = picked === i
                return (
                  <button
                    key={i}
                    onClick={() => pickOption(i)}
                    disabled={revealing || !answering}
                    className={`clay-card border-2 p-4 text-left transition-all ${
                      revealing && isAnswer
                        ? 'border-emerald-500 bg-emerald-50 shadow-md scale-[1.01]'
                        : revealing && isPicked
                          ? 'border-rose-500 bg-rose-50 shadow-md'
                          : 'border-slate-200 bg-white hover:border-amber-400'
                    } ${answering && !revealing ? 'cursor-pointer hover:bg-slate-50' : ''}`}
                  >
                    <span className="mr-2 font-display font-black text-amber-700">
                      [{String.fromCharCode(65 + i)}]
                    </span>
                    <span className="font-bold text-slate-900 text-base">{opt}</span>
                  </button>
                )
              })}
            </div>

            <div className="mt-3 min-h-[64px] text-center">
              {revealing ? (
                <div className="rise-in flex flex-col items-center">
                  <div className="flex items-center gap-3 max-w-xl text-left bg-slate-50 p-3.5 rounded-2xl border-2 border-slate-200 shadow-sm">
                    <img
                      src={picked === question.answer ? '/assets/rick_and_morty/rick_experiment.jpg' : '/assets/rick_and_morty/morty_shock.jpg'}
                      alt="Rick & Morty reaction"
                      className="h-14 w-14 rounded-xl object-cover border border-slate-900 shadow-xs shrink-0"
                    />
                    <div>
                      <span className="font-display text-xs font-black uppercase text-slate-800">
                        {picked === question.answer ? '🧪 Rick: Correct!' : '⚠️ Morty: Aw Geez!'}
                      </span>
                      <p className="text-sm font-bold text-slate-700">💡 {question.explain}</p>
                    </div>
                  </div>
                  <Button className="mt-3" size="lg" onClick={nextQuestion}>
                    {qIndex + 1 < questions.length ? 'Next Question →' : 'On To The Final Charge Wager →'}
                  </Button>
                </div>
              ) : answering ? (
                <div
                  className="pop-in font-display text-2xl font-black"
                  style={{ color: answering === 'volt' ? '#b45309' : '#0e7490' }}
                >
                  ⚡ {state.teams[answering].name} buzzed in! Pick your answer!
                </div>
              ) : (
                <div className="rise-in flex flex-col items-center gap-3">
                  <div className="font-display text-sm md:text-base font-black uppercase tracking-wider text-slate-700">
                    {lockedOut.length > 0 ? '⚡ OPPONENT STEAL CHANCE — TAP YOUR BUZZER!' : '⚡ TAP YOUR TEAM BUZZER TO LOCK IN!'}
                  </div>
                  <div className="grid w-full grid-cols-2 gap-4 pt-1">
                    {/* Team Volt Smartboard Buzzer */}
                    <button
                      type="button"
                      onClick={() => buzz('volt')}
                      disabled={lockedOut.includes('volt')}
                      style={{ touchAction: 'manipulation' }}
                      className={`group relative flex flex-col items-center justify-center rounded-3xl p-5 md:p-6 transition-all active:scale-95 active:translate-y-1 select-none border-4 ${
                        lockedOut.includes('volt')
                          ? 'opacity-30 cursor-not-allowed bg-slate-200 border-slate-300 shadow-none'
                          : 'cursor-pointer border-amber-300 bg-gradient-to-b from-amber-400 via-amber-500 to-amber-600 text-white shadow-[0_12px_24px_rgba(217,119,6,0.45),inset_0_3px_6px_rgba(255,255,255,0.8),inset_0_-4px_6px_rgba(0,0,0,0.3)] hover:brightness-105 ring-4 ring-amber-400/50 animate-pulse'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-3xl md:text-4xl drop-shadow-md">⚡</span>
                        <span className="font-display text-2xl md:text-3xl font-black tracking-tight drop-shadow-sm text-white">
                          {state.teams.volt.name}
                        </span>
                      </div>
                      <div className="mt-2 rounded-full bg-white/25 px-4 py-1 font-display text-xs md:text-sm font-black tracking-wider uppercase text-white shadow-inner">
                        {lockedOut.includes('volt') ? '🔒 LOCKED OUT' : '🚨 SLAP BUZZER'}
                      </div>
                    </button>

                    {/* Team Ampere Smartboard Buzzer */}
                    <button
                      type="button"
                      onClick={() => buzz('ampere')}
                      disabled={lockedOut.includes('ampere')}
                      style={{ touchAction: 'manipulation' }}
                      className={`group relative flex flex-col items-center justify-center rounded-3xl p-5 md:p-6 transition-all active:scale-95 active:translate-y-1 select-none border-4 ${
                        lockedOut.includes('ampere')
                          ? 'opacity-30 cursor-not-allowed bg-slate-200 border-slate-300 shadow-none'
                          : 'cursor-pointer border-cyan-300 bg-gradient-to-b from-cyan-400 via-cyan-500 to-cyan-600 text-white shadow-[0_12px_24px_rgba(8,145,178,0.45),inset_0_3px_6px_rgba(255,255,255,0.8),inset_0_-4px_6px_rgba(0,0,0,0.3)] hover:brightness-105 ring-4 ring-cyan-400/50 animate-pulse'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-3xl md:text-4xl drop-shadow-md">⚡</span>
                        <span className="font-display text-2xl md:text-3xl font-black tracking-tight drop-shadow-sm text-white">
                          {state.teams.ampere.name}
                        </span>
                      </div>
                      <div className="mt-2 rounded-full bg-white/25 px-4 py-1 font-display text-xs md:text-sm font-black tracking-wider uppercase text-white shadow-inner">
                        {lockedOut.includes('ampere') ? '🔒 LOCKED OUT' : '🚨 SLAP BUZZER'}
                      </div>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </RoundShell>
    )
  }

  if (phase === 'wagerIntro' || phase === 'wager') {
    const ready = phase === 'wager'
    return (
      <RoundShell roundId="lightning">
        <div className="grid h-full place-items-center py-6">
          <div className="clay-chassis pop-in w-full max-w-3xl p-8 text-center bg-white shadow-2xl">
            <div className="text-6xl animate-bounce">🎲</div>
            <h3 className="mt-3 font-display text-4xl font-black text-slate-900">The Final Charge</h3>
            <p className="mt-2 text-base font-bold text-slate-700">
              Wager any portion of your team's stored battery points on one final challenge question!
            </p>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              {TEAM_IDS.map((id) => {
                const team = state.teams[id]
                const isVolt = id === 'volt'
                return (
                  <div
                    key={id}
                    className={`rounded-3xl p-5 border-2 ${isVolt ? 'clay-card-volt' : 'clay-card-amp'}`}
                  >
                    <div
                      className="font-display text-xl font-black"
                      style={{ color: isVolt ? '#78350f' : '#164e63' }}
                    >
                      {team.name}
                    </div>
                    <div className="text-xs font-bold uppercase tracking-widest text-slate-600">
                      Battery Charge: {team.score} PTS
                    </div>
                    <div className="mt-3 font-display text-4xl font-black tabular-nums text-slate-900">
                      {wagers[id]} <span className="text-sm font-bold">PTS</span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={team.score}
                      step={25}
                      value={wagers[id]}
                      onChange={(e) =>
                        setWagers((w) => ({ ...w, [id]: Number(e.target.value) }))
                      }
                      className="mt-3 w-full accent-amber-500 cursor-pointer"
                      disabled={team.score === 0}
                    />
                    <div className="mt-2 flex justify-center gap-2">
                      {[0, 0.25, 0.5, 1].map((f) => (
                        <button
                          key={f}
                          onClick={() =>
                            setWagers((w) => ({
                              ...w,
                              [id]: Math.round((team.score * f) / 25) * 25,
                            }))
                          }
                          className="clay-btn bg-white hover:bg-slate-50 border border-slate-200 px-3 py-1 text-xs font-black text-slate-800"
                        >
                          {f === 0 ? 'None' : f === 1 ? 'All In' : `${f * 100}%`}
                        </button>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>

            <div className="mt-8">
              {!ready ? (
                <Button size="lg" onClick={() => setPhase('wager')}>
                  Lock In Wagers 🔒
                </Button>
              ) : (
                <Button size="lg" onClick={() => setPhase('final')}>
                  Reveal The Final Question →
                </Button>
              )}
            </div>
          </div>
        </div>
      </RoundShell>
    )
  }

  if (phase === 'final' || phase === 'finalReveal') {
    const revealing = phase === 'finalReveal'
    const bothIn = TEAM_IDS.every((id) => finalPicks[id] !== undefined || wagers[id] === 0)

    return (
      <RoundShell roundId="lightning">
        <div className="mx-auto flex h-full max-w-3xl flex-col justify-center">
          <div className="clay-chassis p-8 bg-white shadow-2xl flex flex-col gap-4">
            <div className="text-center">
              <span className="rounded-full bg-amber-100 px-3 py-1 text-[11px] font-black uppercase tracking-wider text-amber-800">
                ⚡ FINAL CHARGE
              </span>
              <h3 className="mt-3 font-display text-2xl font-black text-slate-900 leading-snug">
                {finalQuestion.prompt}
              </h3>
            </div>

            <div className="mt-2 grid gap-3">
              {finalQuestion.options.map((opt, i) => {
                const isAnswer = i === finalQuestion.answer
                const chosenBy = TEAM_IDS.filter((id) => finalPicks[id] === i)
                return (
                  <div
                    key={i}
                    className={`clay-card flex items-center justify-between border-2 p-4 ${
                      revealing && isAnswer
                        ? 'border-emerald-500 bg-emerald-50 shadow-md'
                        : 'border-slate-200 bg-white'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="font-display font-black text-amber-700">
                        [{String.fromCharCode(65 + i)}]
                      </span>
                      <span className="font-bold text-slate-900 text-base">{opt}</span>
                    </div>
                    <div className="flex gap-1.5">
                      {chosenBy.map((id) => (
                        <span
                          key={id}
                          className={`rounded-xl px-2.5 py-1 text-xs font-black text-white shadow-sm ${
                            id === 'volt' ? 'bg-amber-500' : 'bg-cyan-600'
                          }`}
                        >
                          {state.teams[id].name}
                        </span>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>

            {!revealing && (
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                {TEAM_IDS.map((id) => (
                  <div
                    key={id}
                    className={`rounded-2xl border-2 p-4 text-center ${
                      id === 'volt' ? 'clay-card-volt' : 'clay-card-amp'
                    }`}
                  >
                    <div className="font-display text-sm font-black" style={{ color: id === 'volt' ? '#78350f' : '#164e63' }}>
                      {state.teams[id].name} · Bet: {wagers[id]} PTS
                    </div>
                    <div className="mt-3 flex justify-center gap-2">
                      {finalQuestion.options.map((_, i) => (
                        <button
                          key={i}
                          onClick={() => submitFinal(id, i)}
                          disabled={wagers[id] === 0}
                          className={`clay-btn h-10 w-10 text-sm font-black transition disabled:opacity-40 ${
                            finalPicks[id] === i
                              ? 'bg-slate-900 text-white shadow-md scale-105'
                              : 'bg-white border border-slate-300 text-slate-800 hover:bg-slate-100'
                          }`}
                        >
                          {String.fromCharCode(65 + i)}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="mt-4 text-center">
              {revealing ? (
                <div className="rise-in">
                  <p className="mx-auto max-w-xl text-base font-bold text-slate-800">
                    💡 {finalQuestion.explain}
                  </p>
                  <Button
                    size="lg"
                    className="mt-5"
                    onClick={() => dispatch({ type: 'COMPLETE_ROUND', round: 'lightning' })}
                  >
                    🏆 View Championship Results →
                  </Button>
                </div>
              ) : (
                <Button size="lg" onClick={scoreFinal} disabled={!bothIn}>
                  {bothIn ? 'Lock In & Reveal Champion! ⚡' : 'Both teams must pick an answer'}
                </Button>
              )}
            </div>
          </div>
        </div>
      </RoundShell>
    )
  }

  return null
}
