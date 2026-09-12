import { useEffect, useState } from 'react'
import confetti from 'canvas-confetti'
import { TARGET_CHARGE, TEAM_IDS, TEAM_THEME } from '../constants'
import { useGame } from '../context/GameContext'
import { useSound } from '../hooks/useSound'
import { Button } from '../components/ui/Button'

export function WinScreen() {
  const { state, dispatch } = useGame()
  const play = useSound()
  const winner = state.winner

  const [charged, setCharged] = useState(false)
  useEffect(() => {
    const t = window.setTimeout(() => setCharged(true), 60)
    return () => window.clearTimeout(t)
  }, [])

  useEffect(() => {
    play('victory')
    const colors =
      winner === 'tie'
        ? [TEAM_THEME.volt.accent, TEAM_THEME.ampere.accent]
        : winner
          ? [TEAM_THEME[winner].accent, '#16a34a']
          : ['#16a34a']

    const bursts = [0, 350, 700, 1100]
    const timers = bursts.map((delay) =>
      window.setTimeout(() => {
        confetti({ particleCount: 90, spread: 78, origin: { y: 0.6 }, colors })
        confetti({ particleCount: 45, angle: 60, spread: 60, origin: { x: 0, y: 0.7 }, colors })
        confetti({ particleCount: 45, angle: 120, spread: 60, origin: { x: 1, y: 0.7 }, colors })
      }, delay),
    )
    return () => timers.forEach((t) => window.clearTimeout(t))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const headline =
    winner === 'tie'
      ? 'Dead Heat — The Circuit Is Balanced!'
      : winner
        ? `${state.teams[winner].name} Wins The Championship!`
        : 'Tournament Complete'

  return (
    <div className="grid h-full place-items-center overflow-y-auto px-6 py-8">
      <div className="clay-chassis w-full max-w-4xl p-10 text-center bg-white shadow-2xl">
        <div className="pop-in">
          <div className="text-8xl animate-bounce">🏆</div>
          <h1
            className="mt-4 font-display text-5xl font-black leading-tight tracking-tight sm:text-6xl"
            style={{
              color: winner && winner !== 'tie' ? (winner === 'volt' ? '#b45309' : '#0e7490') : '#0f172a',
            }}
          >
            {headline}
          </h1>
          <p className="mt-2 text-base font-bold text-slate-600">
            Congratulations to both teams for mastering electrical circuitry!
          </p>

          <div className="mt-6 flex flex-col items-center justify-center">
            <img
              src="/assets/rick_and_morty/rick_victory.jpg"
              alt="Rick Victory Wubba Lubba Dub Dub"
              className="h-44 w-44 rounded-3xl object-cover border-4 border-emerald-400 shadow-2xl animate-pulse"
            />
            <span className="mt-2 font-display text-xs font-black uppercase tracking-wider text-emerald-800 bg-emerald-100 px-3 py-1 rounded-full">
              WUBBA LUBBA DUB DUB · MASTER OF VOLTS & AMPS
            </span>
          </div>
        </div>

        <div className="mt-8 grid gap-5 sm:grid-cols-2">
          {TEAM_IDS.map((id, i) => {
            const team = state.teams[id]
            const pct = Math.min(100, (team.score / TARGET_CHARGE) * 100)
            const isWinner = winner === id
            const isVolt = id === 'volt'

            return (
              <div
                key={id}
                className={`rise-in rounded-3xl p-6 ${isVolt ? 'clay-card-volt' : 'clay-card-amp'} ${
                  isWinner ? 'ring-4 ring-amber-400 shadow-2xl scale-[1.02]' : ''
                }`}
                style={{ animationDelay: `${250 + i * 120}ms` }}
              >
                <div
                  className="font-display text-2xl font-black"
                  style={{ color: isVolt ? '#78350f' : '#164e63' }}
                >
                  {team.name} {isWinner && '👑'}
                </div>
                <div className="mt-2 font-display text-6xl font-black tabular-nums text-slate-900">
                  {team.score}
                </div>
                <div className="text-xs font-bold uppercase tracking-widest text-slate-600">
                  Total Stored Battery Charge
                </div>

                {/* Fluid Liquid Battery Tank */}
                <div className="clay-liquid-tank mt-4 h-6 overflow-hidden p-1">
                  <div
                    className={`h-full rounded-full transition-[width] duration-1000 ease-out relative ${
                      isVolt
                        ? 'bg-gradient-to-r from-amber-400 to-amber-500 shadow-[0_0_12px_rgba(245,158,11,0.6)]'
                        : 'bg-gradient-to-r from-cyan-400 to-cyan-500 shadow-[0_0_12px_rgba(6,182,212,0.6)]'
                    }`}
                    style={{
                      width: charged ? `${Math.max(4, pct)}%` : '4%',
                      transitionDelay: `${500 + i * 120}ms`,
                    }}
                  >
                    <div className="absolute inset-x-1 top-0.5 h-1 rounded-full bg-white/60" />
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        <div className="mt-10 flex flex-wrap justify-center gap-4">
          <button
            onClick={() => dispatch({ type: 'GO_TO', screen: 'map' })}
            className="clay-btn bg-slate-100 hover:bg-slate-200 border border-slate-300 px-6 py-3 font-display text-base font-black text-slate-800 cursor-pointer"
            title="Return to tournament board without resetting scores"
          >
            ← Back to Board
          </button>
          <Button size="lg" onClick={() => dispatch({ type: 'GO_TO', screen: 'debrief' })}>
            📊 View Learning Debrief →
          </Button>
          <button
            onClick={() => {
              if (window.confirm('Start a new match? Both team scores will reset to zero.')) {
                dispatch({ type: 'RESTART' })
              }
            }}
            className="clay-btn bg-rose-50 hover:bg-rose-100 border border-rose-200 px-6 py-3 font-display text-base font-black text-rose-700 cursor-pointer"
          >
            ↺ Play New Match
          </button>
        </div>
      </div>
    </div>
  )
}
