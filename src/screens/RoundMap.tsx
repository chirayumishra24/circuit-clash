import { ROUNDS, ROUND_ORDER } from '../constants'
import { useGame } from '../context/GameContext'
import { Scoreboard } from '../components/Scoreboard'
import { Button } from '../components/ui/Button'

export function RoundMap() {
  const { state, dispatch } = useGame()
  const nextRound = ROUND_ORDER.find((id) => !state.completedRounds.includes(id))
  const allDone = !nextRound

  return (
    <div className="flex h-full flex-col overflow-y-auto px-6 py-5">
      <Scoreboard />

      <div className="mt-5 text-center">
        <h2 className="font-display text-4xl font-black text-slate-900">Tournament Board</h2>
        <p className="mt-1 text-base font-bold text-slate-600">
          {allDone
            ? 'All 6 rounds complete! Ready to crown the electricity champion.'
            : 'Select the next round or continue in sequence.'}
        </p>
      </div>

      <div className="mx-auto mt-6 grid w-full max-w-5xl gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {ROUND_ORDER.map((id, i) => {
          const r = ROUNDS[id]
          const done = state.completedRounds.includes(id)
          const isNext = id === nextRound
          const voltPts = state.scoreLog[id].volt
          const ampPts = state.scoreLog[id].ampere

          return (
            <button
              key={id}
              style={{ animationDelay: `${i * 60}ms` }}
              onClick={() => dispatch({ type: 'START_ROUND', round: id })}
              className={`clay-card rise-in group relative overflow-hidden p-5 text-left transition-all duration-200 ${
                done
                  ? 'bg-slate-50/80 opacity-75 hover:opacity-100'
                  : isNext
                    ? 'border-3 border-emerald-400 ring-4 ring-emerald-300/40 shadow-xl'
                    : 'bg-white hover:border-amber-400'
              }`}
            >
              {isNext && (
                <span className="absolute right-4 top-4 rounded-full bg-emerald-500 px-3 py-0.5 text-[10px] font-black uppercase tracking-wider text-white shadow-sm">
                  Up Next
                </span>
              )}
              {done && (
                <span className="absolute right-4 top-4 text-xl" title="Played">
                  ✅
                </span>
              )}

              <div className="flex items-center gap-2">
                <span className="font-display text-xs font-black uppercase tracking-wider text-slate-700">
                  ROUND {r.index}
                </span>
              </div>
              <div className="mt-1.5 flex items-center gap-2.5">
                <span className="text-3xl">{r.icon}</span>
                <span className="font-display text-2xl font-black text-slate-900 leading-tight">{r.title}</span>
              </div>
              <div className="mt-1 text-[11px] font-black uppercase tracking-wider text-emerald-700">
                {r.subtopic}
              </div>
              <p className="mt-2 text-xs font-bold text-slate-800">{r.subtitle}</p>

              {done && (
                <div className="mt-4 flex items-center justify-between border-t border-slate-200 pt-2 text-xs font-black">
                  <span className="text-amber-700">
                    {state.teams.volt.name}: <strong>+{voltPts}</strong>
                  </span>
                  <span className="text-cyan-700">
                    {state.teams.ampere.name}: <strong>+{ampPts}</strong>
                  </span>
                </div>
              )}
            </button>
          )
        })}
      </div>

      <div className="mt-8 mb-16 flex justify-center gap-3">
        {nextRound ? (
          <Button size="lg" onClick={() => dispatch({ type: 'START_ROUND', round: nextRound })}>
            {ROUNDS[nextRound].icon} Play Round {ROUNDS[nextRound].index}: {ROUNDS[nextRound].title} →
          </Button>
        ) : (
          <Button size="lg" onClick={() => dispatch({ type: 'GO_TO', screen: 'win' })}>
            🏆 Crown Champion & View Results →
          </Button>
        )}
      </div>
    </div>
  )
}
