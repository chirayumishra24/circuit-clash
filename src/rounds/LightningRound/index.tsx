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

const TOTAL_QUESTIONS = 6 // Even number of questions: exactly 3 for Volt, 3 for Ampere
const QUESTION_SECONDS = 15
const STEAL_SECONDS = 12
const CORRECT_POINTS = 50
const STEAL_POINTS = 30

type Phase = 'brief' | 'question' | 'steal' | 'reveal' | 'wagerIntro' | 'wager' | 'final' | 'finalReveal'

export function LightningRound() {
  const { state, dispatch } = useGame()
  const play = useSound()

  const [phase, setPhase] = useState<Phase>('brief')
  const [qIndex, setQIndex] = useState(0)
  const [wrongPicks, setWrongPicks] = useState<number[]>([])
  const [picked, setPicked] = useState<number | null>(null)
  const [stealInfo, setStealInfo] = useState<{
    primaryTeam: TeamId
    opponentTeam: TeamId
    solvedBy?: TeamId | 'none'
  } | null>(null)

  const [wagers, setWagers] = useState<Record<TeamId, number>>({
    volt: Math.min(100, state.teams.volt.score),
    ampere: Math.min(100, state.teams.ampere.score),
  })
  const [finalPicks, setFinalPicks] = useState<Partial<Record<TeamId, number>>>({})

  // Distinct questions with an even count (3 for Team Volt, 3 for Team Ampere)
  const questions = BUZZER_QUESTIONS.slice(0, TOTAL_QUESTIONS)
  const question: Question = questions[qIndex]
  const finalQuestion = FINAL_QUESTIONS[0]

  const primaryTeam: TeamId = TEAM_IDS[qIndex % 2]
  const opponentTeam: TeamId = TEAM_IDS[(qIndex + 1) % 2]
  const activeTeam: TeamId = phase === 'steal' ? opponentTeam : primaryTeam

  const clockTotal = phase === 'steal' ? STEAL_SECONDS : QUESTION_SECONDS

  const { remaining, setRemaining } = useCountdown({
    seconds: clockTotal,
    running: (phase === 'question' || phase === 'steal') && !state.paused,
    resetKey: `${qIndex}-${phase}`,
    onEnd: () => {
      if (phase === 'question') {
        play('wrong')
        setStealInfo({ primaryTeam, opponentTeam })
        setPhase('steal')
        setRemaining(STEAL_SECONDS)
      } else if (phase === 'steal') {
        play('wrong')
        setStealInfo((prev) => ({
          primaryTeam: prev?.primaryTeam ?? primaryTeam,
          opponentTeam: prev?.opponentTeam ?? opponentTeam,
          solvedBy: 'none',
        }))
        setPhase('reveal')
      }
    },
  })

  function pickOption(index: number) {
    if (phase === 'question') {
      setPicked(index)
      const right = index === question.answer
      if (right) {
        play('charge')
        dispatch({
          type: 'AWARD',
          team: primaryTeam,
          points: CORRECT_POINTS,
          round: 'lightning',
          correct: true,
        })
        setStealInfo({
          primaryTeam,
          opponentTeam,
          solvedBy: primaryTeam,
        })
        setPhase('reveal')
      } else {
        // Wrong answer: DO NOT reveal answer! Pass to opponent team for steal!
        play('wrong')
        setWrongPicks([index])
        setStealInfo({
          primaryTeam,
          opponentTeam,
        })
        setPhase('steal')
        setRemaining(STEAL_SECONDS)
      }
    } else if (phase === 'steal') {
      if (wrongPicks.includes(index)) return
      setPicked(index)
      const right = index === question.answer
      if (right) {
        play('charge')
        dispatch({
          type: 'AWARD',
          team: opponentTeam,
          points: STEAL_POINTS,
          round: 'lightning',
          correct: true,
        })
        setStealInfo({
          primaryTeam,
          opponentTeam,
          solvedBy: opponentTeam,
        })
        setPhase('reveal')
      } else {
        // Opponent also missed: NOW reveal answer!
        play('wrong')
        setWrongPicks((prev) => [...prev, index])
        setStealInfo({
          primaryTeam,
          opponentTeam,
          solvedBy: 'none',
        })
        setPhase('reveal')
      }
    }
  }

  function nextQuestion() {
    if (qIndex + 1 < questions.length) {
      setQIndex(qIndex + 1)
      setWrongPicks([])
      setPicked(null)
      setStealInfo(null)
      setPhase('question')
      setRemaining(QUESTION_SECONDS)
    } else {
      setPhase('wagerIntro')
    }
  }

  useEffect(() => {
    if (phase !== 'question' && phase !== 'steal') return
    const onKey = (e: KeyboardEvent) => {
      const map: Record<string, number> = {
        '1': 0, 'a': 0, 'A': 0,
        '2': 1, 'b': 1, 'B': 1,
        '3': 2, 'c': 2, 'C': 2,
        '4': 3, 'd': 3, 'D': 3,
      }
      if (e.key in map) {
        pickOption(map[e.key])
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [phase, qIndex, wrongPicks])

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
              {questions.length} turn-wise questions, followed by <strong>The Final Charge</strong> wager!
            </p>
            <div className="mx-auto mt-6 w-fit rounded-2xl border-2 border-slate-200 bg-slate-50 px-6 py-3.5 text-center text-sm font-bold text-slate-800 shadow-sm">
              <div className="flex items-center justify-center gap-3">
                <span className="rounded-xl bg-amber-500 px-3 py-1 font-black text-white shadow-sm">
                  ⚡ Turns 1, 3, 5: {state.teams.volt.name}
                </span>
                <span className="text-slate-400">·</span>
                <span className="rounded-xl bg-cyan-600 px-3 py-1 font-black text-white shadow-sm">
                  ⚡ Turns 2, 4, 6: {state.teams.ampere.name}
                </span>
              </div>
              <div className="mt-2 text-xs font-bold text-slate-600">
                +{CORRECT_POINTS} pts for correct answer • If incorrect, opponent gets a chance to STEAL (+{STEAL_POINTS} pts)!
              </div>
            </div>
            <div className="mt-8">
              <Button
                size="lg"
                onClick={() => {
                  setPhase('question')
                  setRemaining(QUESTION_SECONDS)
                }}
              >
                ⚡ Begin Turn 1: {state.teams.volt.name} →
              </Button>
            </div>
          </div>
        </div>
      </RoundShell>
    )
  }

  if (phase === 'question' || phase === 'steal' || phase === 'reveal') {
    const revealing = phase === 'reveal'
    const displayActiveTeam = revealing
      ? (stealInfo?.solvedBy === 'none' ? null : stealInfo?.solvedBy)
      : activeTeam

    return (
      <RoundShell
        roundId="lightning"
        activeTeam={displayActiveTeam}
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
            {/* Header Stage & Turn Status */}
            <div className="flex flex-col items-center justify-center gap-1.5 text-center">
              {phase === 'question' && (
                <div className="flex items-center gap-2">
                  <span
                    className={`rounded-full px-4 py-1 font-display text-xs font-black uppercase tracking-wider text-white shadow-sm ${
                      primaryTeam === 'volt' ? 'bg-amber-500' : 'bg-cyan-600'
                    }`}
                  >
                    ⚡ Turn {qIndex + 1} of {questions.length} • {state.teams[primaryTeam].name}'s Question
                  </span>
                  <span className="rounded-full bg-slate-100 px-3 py-1 font-display text-xs font-black text-slate-700 shadow-inner">
                    +{CORRECT_POINTS} PTS
                  </span>
                </div>
              )}

              {phase === 'steal' && (
                <div className="pop-in flex flex-col items-center gap-1">
                  <span
                    className={`rounded-full px-5 py-1.5 font-display text-sm font-black uppercase tracking-wider text-white shadow-md animate-pulse ${
                      opponentTeam === 'volt' ? 'bg-amber-500' : 'bg-cyan-600'
                    }`}
                  >
                    🚨 STEAL OPPORTUNITY: {state.teams[opponentTeam].name}
                  </span>
                  <span className="text-xs font-extrabold text-rose-600">
                    {state.teams[primaryTeam].name} missed! Can {state.teams[opponentTeam].name} steal for +{STEAL_POINTS} pts?
                  </span>
                </div>
              )}

              {phase === 'reveal' && (
                <div className="pop-in">
                  {stealInfo?.solvedBy === 'none' ? (
                    <span className="rounded-full bg-slate-200 px-4 py-1.5 font-display text-xs font-black uppercase text-slate-700">
                      ❌ Neither team got it right • Correct answer revealed
                    </span>
                  ) : stealInfo?.solvedBy === primaryTeam ? (
                    <span className="rounded-full bg-emerald-500 px-4 py-1.5 font-display text-xs font-black uppercase text-white shadow-md">
                      ✔ Correct! {state.teams[primaryTeam].name} (+{CORRECT_POINTS} pts)
                    </span>
                  ) : (
                    <span className="rounded-full bg-emerald-600 px-4 py-1.5 font-display text-xs font-black uppercase text-white shadow-md">
                      ⚡ STEAL SUCCESS! {state.teams[opponentTeam].name} (+{STEAL_POINTS} pts)
                    </span>
                  )}
                </div>
              )}

              <span className="rounded-full bg-emerald-100 px-3 py-0.5 text-[10px] font-black uppercase tracking-wider text-emerald-800">
                {question.subtopic}
              </span>
              <h3 className="mt-1 font-display text-2xl font-black leading-snug text-slate-900">
                {question.prompt}
              </h3>
            </div>

            <div className="mt-2 grid gap-3 sm:grid-cols-2">
              {question.options.map((opt, i) => {
                const isAnswer = i === question.answer
                const isWrong = wrongPicks.includes(i)

                let style = 'border-slate-200 bg-white hover:border-amber-400 cursor-pointer'

                if (revealing) {
                  if (isAnswer) {
                    style = 'border-emerald-500 bg-emerald-50 shadow-md scale-[1.01] cursor-default'
                  } else if (isWrong) {
                    style = 'border-rose-400 bg-rose-50/60 opacity-60 line-through cursor-default'
                  } else {
                    style = 'border-slate-200 bg-slate-50 opacity-40 cursor-default'
                  }
                } else if (phase === 'steal') {
                  if (isWrong) {
                    style = 'border-rose-300 bg-rose-50/60 opacity-40 line-through cursor-not-allowed'
                  } else {
                    style = 'border-slate-200 bg-white hover:border-cyan-400 hover:bg-cyan-50/40 cursor-pointer shadow-xs'
                  }
                } else if (phase === 'question') {
                  style = primaryTeam === 'volt'
                    ? 'border-slate-200 bg-white hover:border-amber-400 hover:bg-amber-50/40 cursor-pointer shadow-xs'
                    : 'border-slate-200 bg-white hover:border-cyan-400 hover:bg-cyan-50/40 cursor-pointer shadow-xs'
                }

                return (
                  <button
                    key={i}
                    onClick={() => pickOption(i)}
                    disabled={revealing || (phase === 'steal' && isWrong)}
                    className={`clay-card border-2 p-4 text-left transition-all relative ${style}`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-display font-black text-amber-700">
                          [{String.fromCharCode(65 + i)}]
                        </span>
                        <span className="font-bold text-slate-900 text-base">{opt}</span>
                      </div>
                      {revealing && isAnswer && (
                        <span className="shrink-0 rounded-full bg-emerald-500 px-2.5 py-0.5 text-[10px] font-black text-white">
                          ✔ Correct
                        </span>
                      )}
                      {isWrong && (
                        <span className="shrink-0 text-rose-600 font-black text-sm">
                          ❌
                        </span>
                      )}
                    </div>
                  </button>
                )
              })}
            </div>

            <div className="mt-3 min-h-[64px] text-center">
              {revealing ? (
                <div className="rise-in flex flex-col items-center">
                  <div className="flex items-center gap-3 max-w-xl text-left bg-slate-50 p-3.5 rounded-2xl border-2 border-slate-200 shadow-sm">
                    <img
                      src={
                        stealInfo?.solvedBy && stealInfo.solvedBy !== 'none'
                          ? '/assets/rick_and_morty/rick_experiment.jpg'
                          : '/assets/rick_and_morty/morty_shock.jpg'
                      }
                      alt="Rick & Morty reaction"
                      className="h-14 w-14 rounded-xl object-cover border border-slate-900 shadow-xs shrink-0"
                    />
                    <div>
                      <span className="font-display text-xs font-black uppercase text-slate-800">
                        {stealInfo?.solvedBy && stealInfo.solvedBy !== 'none'
                          ? '🧪 Rick: Science confirms it!'
                          : '⚠️ Morty: Aw Geez!'}
                      </span>
                      <p className="text-sm font-bold text-slate-700">💡 {question.explain}</p>
                    </div>
                  </div>
                  <Button className="mt-3" size="lg" onClick={nextQuestion}>
                    {qIndex + 1 < questions.length ? 'Next Question →' : 'On To The Final Charge Wager →'}
                  </Button>
                </div>
              ) : (
                <div className="font-display text-sm font-black text-slate-600">
                  {phase === 'question' ? (
                    <span>👉 {state.teams[primaryTeam].name}, select your answer!</span>
                  ) : (
                    <span>👉 {state.teams[opponentTeam].name}, choose from the remaining options to steal!</span>
                  )}
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
