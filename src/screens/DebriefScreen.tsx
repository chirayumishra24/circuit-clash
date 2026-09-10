import { ROUNDS, ROUND_ORDER, TEAM_IDS, TEAM_THEME } from '../constants'
import { useGame } from '../context/GameContext'
import { Button } from '../components/ui/Button'

/**
 * The teaching payoff: which subtopic each team actually struggled with, so the lesson
 * after the game targets the right gap.
 */
export function DebriefScreen() {
  const { state, dispatch } = useGame()

  const weakest = (team: (typeof TEAM_IDS)[number]) => {
    const scored = ROUND_ORDER.filter((id) => state.completedRounds.includes(id))
    if (scored.length === 0) return null
    return scored.reduce((min, id) =>
      state.scoreLog[id][team] < state.scoreLog[min][team] ? id : min,
    )
  }

  return (
    <div className="h-full overflow-y-auto px-6 pb-24 pt-6 print:overflow-visible print:pb-6">
      <div className="clay-chassis mx-auto max-w-4xl p-8 bg-white shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b-2 border-slate-100 pb-4">
          <div>
            <h1 className="font-display text-4xl font-black text-slate-900">Class Learning Debrief</h1>
            <p className="mt-1 text-sm font-bold text-slate-600">
              Points earned per curriculum topic. Use lower scores to guide post-game discussion!
            </p>
          </div>
          <div className="flex gap-2.5 print:hidden">
            <button
              onClick={() => window.print()}
              className="clay-btn bg-slate-100 hover:bg-slate-200 border border-slate-300 px-4 py-2 text-xs font-black text-slate-800"
            >
              🖨 Print Report
            </button>
            <Button variant="ghost" size="sm" onClick={() => dispatch({ type: 'GO_TO', screen: 'win' })}>
              ← Back to Winners
            </Button>
          </div>
        </div>

        <div className="mt-6 overflow-hidden rounded-3xl border-2 border-slate-200 bg-white">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="bg-slate-50 border-b-2 border-slate-200">
                <th className="px-5 py-3.5 font-display text-xs font-black uppercase tracking-wider text-slate-700">
                  Curriculum Topic
                </th>
                {TEAM_IDS.map((id) => (
                  <th
                    key={id}
                    className="px-5 py-3.5 text-right font-display text-xs font-black uppercase tracking-wider"
                    style={{ color: id === 'volt' ? '#b45309' : '#0e7490' }}
                  >
                    {state.teams[id].name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {ROUND_ORDER.map((id) => {
                const r = ROUNDS[id]
                const played = state.completedRounds.includes(id)
                return (
                  <tr key={id} className="hover:bg-slate-50/60 transition">
                    <td className="px-5 py-3.5">
                      <div className="font-display text-base font-black text-slate-900">
                        {r.icon} {r.subtopic}
                      </div>
                      <div className="text-xs font-bold text-slate-700">
                        Round {r.index}: {r.title} — {r.objective}
                      </div>
                    </td>
                    {TEAM_IDS.map((tid) => (
                      <td
                        key={tid}
                        className="px-5 py-3.5 text-right font-display text-xl font-black tabular-nums text-slate-900"
                      >
                        {played ? (
                          <span className="text-emerald-700">+{state.scoreLog[id][tid]}</span>
                        ) : (
                          <span className="text-xs font-black text-slate-500">Not Played</span>
                        )}
                      </td>
                    ))}
                  </tr>
                )
              })}
              <tr className="border-t-3 border-slate-300 bg-slate-100 font-black">
                <td className="px-5 py-4 font-display text-sm font-black uppercase tracking-wider text-slate-900">
                  Total Match Points
                </td>
                {TEAM_IDS.map((id) => (
                  <td
                    key={id}
                    className="px-5 py-4 text-right font-display text-3xl font-black tabular-nums"
                    style={{ color: id === 'volt' ? '#b45309' : '#0e7490' }}
                  >
                    {state.teams[id].score}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {TEAM_IDS.map((id) => {
            const weak = weakest(id)
            const isVolt = id === 'volt'
            return (
              <div
                key={id}
                className={`rounded-3xl border-2 p-5 ${isVolt ? 'clay-card-volt' : 'clay-card-amp'}`}
              >
                <div
                  className="font-display text-base font-black"
                  style={{ color: isVolt ? '#78350f' : '#164e63' }}
                >
                  {state.teams[id].name} — Recommended Focus
                </div>
                <div className="mt-2 text-sm font-bold text-slate-800">
                  {weak ? (
                    <>
                      <div className="text-base font-black text-slate-900">
                        {ROUNDS[weak].icon} {ROUNDS[weak].subtopic}
                      </div>
                      <div className="mt-1 text-xs text-slate-700 font-bold">
                        {ROUNDS[weak].objective}
                      </div>
                    </>
                  ) : (
                    <span className="text-slate-600 font-bold">No rounds completed yet.</span>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        <div className="mt-8 flex justify-center print:hidden">
          <Button size="lg" onClick={() => dispatch({ type: 'RESTART' })}>
            ↺ Start New Classroom Game
          </Button>
        </div>
      </div>
    </div>
  )
}
