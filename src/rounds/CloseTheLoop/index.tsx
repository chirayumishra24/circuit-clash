import { useEffect, useMemo, useRef, useState } from 'react'
import { POINTS, ROUNDS, TEAM_IDS, TEAM_THEME } from '../../constants'
import { useGame } from '../../context/GameContext'
import { useCountdown } from '../../hooks/useCountdown'
import { useSound } from '../../hooks/useSound'
import { RoundShell } from '../../components/RoundShell'
import { Timer } from '../../components/Timer'
import { Button } from '../../components/ui/Button'
import { Tile } from './Tile'
import { PUZZLES, cloneCells, isRotatable, solve, wrongCells } from './puzzles'
import type { Cell } from './puzzles'
import type { TeamId } from '../../types'

const TURN_SECONDS = 90
const SPEED_BONUS_CAP = POINTS.loop.speedMax

type Phase = 'brief' | 'play' | 'solved' | 'handoff' | 'results'

interface TurnResult {
  solved: number
  bonus: number
  hints: number
}

export function CloseTheLoop() {
  const { state, dispatch } = useGame()
  const play = useSound()

  const [phase, setPhase] = useState<Phase>('brief')
  const [turn, setTurn] = useState(0)
  const [levelIndex, setLevelIndex] = useState(0)
  const [cells, setCells] = useState<Cell[][]>(() => cloneCells(PUZZLES[0].cells))
  const [hintAt, setHintAt] = useState<string | null>(null)
  const [hintsUsed, setHintsUsed] = useState(0)
  const [solvedCount, setSolvedCount] = useState(0)
  const [results, setResults] = useState<Partial<Record<TeamId, TurnResult>>>({})

  const teamId = TEAM_IDS[turn]
  const team = state.teams[teamId]
  const theme = TEAM_THEME[teamId]
  const puzzle = PUZZLES[levelIndex]

  const result = useMemo(() => solve(cells), [cells])
  const livePath = useMemo(() => new Set(result.path), [result])

  const { remaining, setRemaining } = useCountdown({
    seconds: TURN_SECONDS,
    running: phase === 'play' && !state.paused,
    resetKey: turn,
    onEnd: () => endTurn(0),
  })

  const remainingRef = useRef(remaining)
  remainingRef.current = remaining

  const solvedCountRef = useRef(0)
  const solvedRef = useRef(false)

  function advanceLevel() {
    if (levelIndex + 1 < PUZZLES.length) {
      const nextIdx = levelIndex + 1
      setLevelIndex(nextIdx)
      setCells(cloneCells(PUZZLES[nextIdx].cells))
      setHintAt(null)
      solvedRef.current = false
      setPhase('play')
    } else {
      endTurn(remainingRef.current)
    }
  }

  function prevLevel() {
    if (levelIndex > 0) {
      const prevIdx = levelIndex - 1
      setLevelIndex(prevIdx)
      setCells(cloneCells(PUZZLES[prevIdx].cells))
      setHintAt(null)
      solvedRef.current = false
      setPhase('play')
    }
  }

  useEffect(() => {
    if (phase !== 'play') return
    if (!result.closed || solvedRef.current) return

    solvedRef.current = true
    play('charge')
    dispatch({
      type: 'AWARD',
      team: teamId,
      points: POINTS.loop.solve,
      round: 'loop',
      correct: true,
    })
    solvedCountRef.current += 1
    setSolvedCount(solvedCountRef.current)
    setPhase('solved')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [result.closed, phase])

  useEffect(() => {
    if (phase !== 'solved') return
    const t = window.setTimeout(() => {
      advanceLevel()
    }, 3000)
    return () => window.clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, levelIndex])

  function endTurn(secondsLeft: number) {
    const bonus = Math.min(SPEED_BONUS_CAP, Math.round(secondsLeft))
    if (bonus > 0) {
      dispatch({ type: 'AWARD', team: teamId, points: bonus, round: 'loop' })
    }
    setResults((r) => ({
      ...r,
      [teamId]: { solved: solvedCountRef.current, bonus, hints: hintsUsed },
    }))
    setPhase(turn === 0 ? 'handoff' : 'results')
  }

  function beginTurn(nextTurn: number) {
    setTurn(nextTurn)
    setLevelIndex(0)
    setCells(cloneCells(PUZZLES[0].cells))
    setHintAt(null)
    setHintsUsed(0)
    setSolvedCount(0)
    solvedCountRef.current = 0
    solvedRef.current = false
    setRemaining(TURN_SECONDS)
    setPhase('play')
  }

  function rotate(r: number, c: number) {
    if (phase !== 'play') return
    play('spark')
    setHintAt(null)
    setCells((prev) => {
      const next = cloneCells(prev)
      const cell = next[r][c]
      if (!isRotatable(cell)) return prev
      if (cell.type === 'switch') cell.closed = cell.closed === false
      else cell.rot = (cell.rot + 1) % 4
      return next
    })
  }

  function useHint() {
    if (phase !== 'play') return
    const wrong = wrongCells(cells)
    if (wrong.length === 0) return
    const [r, c] = wrong[Math.floor(Math.random() * wrong.length)]
    setHintAt(`${r},${c}`)
    setHintsUsed((n) => n + 1)
    dispatch({ type: 'AWARD', team: teamId, points: -POINTS.loop.hintPenalty, round: 'loop' })
    play('wrong')
  }

  // ---------------------------------------------------------------- render

  if (phase === 'brief' || phase === 'handoff') {
    const nextTurn = phase === 'brief' ? 0 : 1
    const nextTeam = state.teams[TEAM_IDS[nextTurn]]
    const nextTheme = TEAM_THEME[TEAM_IDS[nextTurn]]
    const prev = results[TEAM_IDS[0]]

    return (
      <RoundShell roundId="loop">
        <div className="grid h-full place-items-center py-6">
          <div className="clay-chassis pop-in w-full max-w-2xl p-8 text-center bg-white shadow-2xl">
            <div className="text-6xl animate-bounce">🔌</div>
            <h3 className="mt-4 font-display text-4xl font-black text-slate-900">
              {phase === 'brief' ? 'Close the Loop' : 'Hand Over the Controls'}
            </h3>
            <p className="mt-3 text-lg font-medium text-slate-700">
              Three circuits. <strong>{TURN_SECONDS} seconds.</strong> Click wires to rotate them,
              and connect the battery through the lightbulb and back!
            </p>
            <div className="mt-3 inline-block rounded-full bg-slate-100 px-4 py-1.5 text-xs font-bold text-slate-600 shadow-inner">
              +{POINTS.loop.solve} pts per circuit · up to +{SPEED_BONUS_CAP} speed bonus · −{POINTS.loop.hintPenalty} per hint
            </div>

            {phase === 'handoff' && prev && (
              <div className="mx-auto mt-6 w-fit rounded-2xl border-2 border-amber-300 bg-amber-50 px-6 py-3 text-sm font-bold text-amber-950 shadow-sm">
                <span>{state.teams.volt.name}</span> solved{' '}
                <strong className="text-amber-700">{prev.solved}</strong> of {PUZZLES.length} with{' '}
                <strong className="text-amber-700">{prev.bonus}</strong> bonus points!
              </div>
            )}

            <div className="mt-8">
              <Button
                size="lg"
                variant={nextTurn === 0 ? 'volt' : 'ampere'}
                onClick={() => beginTurn(nextTurn)}
              >
                {nextTeam.name} — Start Your Turn →
              </Button>
              <p className="mt-2 text-xs font-bold text-slate-500">
                Turn:{' '}
                <span style={{ color: nextTheme.accent }} className="font-black">
                  {nextTeam.name}
                </span>
              </p>
            </div>
          </div>
        </div>
      </RoundShell>
    )
  }

  if (phase === 'results') {
    const a = results.volt
    const b = results.ampere
    return (
      <RoundShell roundId="loop">
        <div className="grid h-full place-items-center py-6">
          <div className="clay-chassis rise-in w-full max-w-2xl p-8 bg-white shadow-2xl">
            <h3 className="text-center font-display text-3xl font-black text-slate-900">
              ⚡ Round 1 Results
            </h3>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              {TEAM_IDS.map((id) => {
                const res = id === 'volt' ? a : b
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
                        <span>Circuits closed:</span>
                        <strong className="text-slate-900">{res?.solved ?? 0} / {PUZZLES.length}</strong>
                      </div>
                      <div className="flex justify-between">
                        <span>Speed bonus:</span>
                        <strong className="text-emerald-700">+{res?.bonus ?? 0}</strong>
                      </div>
                      <div className="flex justify-between">
                        <span>Hints used:</span>
                        <strong className="text-rose-700">−{res?.hints ?? 0}</strong>
                      </div>
                      <div className="flex justify-between border-t border-slate-300 pt-2 font-display text-lg font-black text-slate-900">
                        <span>Round Total:</span>
                        <strong className="text-emerald-600">+{state.scoreLog.loop[id]}</strong>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
            <p className="mt-5 text-center text-xs font-bold text-slate-500">
              💡 {ROUNDS.loop.objective}
            </p>
            <div className="mt-6 flex justify-center">
              <Button size="lg" onClick={() => dispatch({ type: 'COMPLETE_ROUND', round: 'loop' })}>
                Back to Tournament Board →
              </Button>
            </div>
          </div>
        </div>
      </RoundShell>
    )
  }

  return (
    <RoundShell
      roundId="loop"
      activeTeam={teamId}
      headerRight={
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            {PUZZLES.map((p, i) => (
              <button
                key={p.id}
                type="button"
                onClick={() => {
                  if (phase === 'play' && i !== levelIndex) {
                    setLevelIndex(i)
                    setCells(cloneCells(PUZZLES[i].cells))
                    setHintAt(null)
                    solvedRef.current = false
                  }
                }}
                disabled={phase !== 'play'}
                className={`h-2.5 w-8 rounded-full transition-all duration-300 ${
                  phase === 'play' ? 'cursor-pointer hover:opacity-90' : 'cursor-default'
                } ${
                  i < solvedCount
                    ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]'
                    : i === levelIndex
                      ? 'bg-amber-400 ring-2 ring-amber-300'
                      : 'bg-slate-200'
                }`}
                title={`Jump to ${p.label}`}
              />
            ))}
          </div>
          <Timer remaining={remaining} total={TURN_SECONDS} label={puzzle.label} />
        </div>
      }
    >
      {/* The Clay Breadboard Console */}
      <div className="mx-auto flex h-full max-w-3xl flex-col justify-center">
        <div className="clay-chassis relative flex flex-col p-6 shadow-2xl">
          {/* Console Header Bar */}
          <div className="flex items-center justify-between border-b-2 border-slate-100 pb-3">
            <div className="flex items-center gap-2.5">
              <span
                className={`rounded-full px-3 py-1 font-display text-xs font-black uppercase tracking-wider text-white shadow-sm ${
                  turn === 0 ? 'bg-amber-500' : 'bg-cyan-600'
                }`}
              >
                {team.name}
              </span>
              <h4 className="font-display text-lg font-black text-slate-800">
                {puzzle.label}: {puzzle.brief}
              </h4>
            </div>

            <div className="flex items-center gap-2">
              {levelIndex > 0 && (
                <button
                  onClick={prevLevel}
                  disabled={phase !== 'play'}
                  className="clay-btn bg-slate-100 hover:bg-slate-200 border border-slate-300 px-3 py-1.5 text-xs font-black text-slate-700 shadow-sm disabled:opacity-40 cursor-pointer"
                  title="Go back to previous circuit level"
                >
                  ← Prev Circuit
                </button>
              )}
              <button
                onClick={useHint}
                disabled={phase !== 'play'}
                className="clay-btn bg-white hover:bg-slate-50 border border-slate-200 px-3.5 py-1.5 text-xs font-black text-slate-700 shadow-sm disabled:opacity-40 cursor-pointer"
              >
                🔍 Hint (−{POINTS.loop.hintPenalty})
              </button>
              <button
                onClick={() => endTurn(remainingRef.current)}
                disabled={phase !== 'play'}
                className="clay-btn bg-slate-100 hover:bg-slate-200 border border-slate-300 px-3 py-1.5 text-xs font-black text-slate-600 shadow-sm disabled:opacity-40 cursor-pointer"
                title={turn === 0 ? 'End turn early and hand over to Team Ampere' : 'End turn early and view results'}
              >
                ⏭ End Turn Early
              </button>
            </div>
          </div>

          {/* Breadboard Grid Well */}
          <div className="relative mt-4 flex items-center justify-center">
            <div
              className="clay-inset grid gap-2.5 p-4"
              style={{
                gridTemplateColumns: `repeat(${puzzle.cols}, minmax(0, 1fr))`,
                width: `min(100%, ${puzzle.cols * 116}px)`,
              }}
            >
              {cells.map((row, r) =>
                row.map((cell, c) => (
                  <Tile
                    key={`${r},${c}`}
                    cell={cell}
                    live={livePath.has(`${r},${c}`)}
                    hinted={hintAt === `${r},${c}`}
                    disabled={phase !== 'play'}
                    onClick={() => rotate(r, c)}
                  />
                )),
              )}
            </div>

            {/* Celebratory Victory Medal Popup with Direct Smart Board Click Button */}
            {phase === 'solved' && (
              <div className="pop-in absolute inset-0 grid place-items-center bg-slate-900/40 backdrop-blur-xs rounded-3xl z-30 p-4">
                <div className="clay-card border-4 border-emerald-400 bg-white px-8 py-6 text-center shadow-[0_24px_48px_rgba(16,185,129,0.35)] max-w-sm w-full">
                  <div className="text-5xl animate-bounce">💡</div>
                  <div className="mt-2 font-display text-2xl font-black text-emerald-600">
                    CIRCUIT CLOSED!
                  </div>
                  <div className="mt-1.5 inline-block rounded-full bg-emerald-100 px-4 py-1 font-display text-sm font-black text-emerald-800 shadow-[inset_0_1px_2px_rgba(255,255,255,0.9)]">
                    +{POINTS.loop.solve} PTS
                  </div>

                  <div className="mt-5">
                    <button
                      type="button"
                      onClick={advanceLevel}
                      className="clay-btn w-full bg-emerald-500 hover:bg-emerald-600 text-white font-display text-sm font-black py-2.5 px-4 rounded-xl shadow-lg hover:scale-[1.02] active:scale-95 transition cursor-pointer flex items-center justify-center gap-2"
                    >
                      {levelIndex + 1 < PUZZLES.length ? (
                        <>
                          <span>Next Circuit (Level {levelIndex + 2} of {PUZZLES.length})</span>
                          <span>→</span>
                        </>
                      ) : (
                        <>
                          <span>Complete Turn & Hand Over Controls</span>
                          <span>⚡</span>
                        </>
                      )}
                    </button>
                    <div className="mt-1.5 text-[10px] font-bold text-slate-400">
                      Auto-advancing or tap above to jump in!
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Console Footer Guidance */}
          <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 text-xs font-bold text-slate-600">
            <span>
              {result.loopMissesBulb
                ? '⚠ The loop closes, but misses the bulb — route the wire through it!'
                : '👉 Click any wire tile to rotate and close the electrical loop.'}
            </span>
            <span className="text-slate-400">
              Round 1 of {ROUNDS.loop.index}
            </span>
          </div>
        </div>
      </div>
    </RoundShell>
  )
}
