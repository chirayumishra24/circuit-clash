import { ROUNDS, ROUND_ORDER, TEAM_IDS, TEAM_THEME } from '../constants'
import { useGame } from '../context/GameContext'
import { Button } from '../components/ui/Button'

export function SetupScreen() {
  const { state, dispatch } = useGame()

  return (
    <div className="grid h-full place-items-center overflow-y-auto px-6 py-10">
      <div className="clay-chassis w-full max-w-4xl p-8 bg-white/98 shadow-2xl">
        <div className="rise-in text-center">
          <div className="font-display text-sm font-black uppercase tracking-[0.35em] text-emerald-600">
            SkilliZee Presents
          </div>
          <h1 className="mt-2 font-display text-6xl font-black leading-none tracking-tight sm:text-7xl">
            <span className="text-amber-500 drop-shadow-sm">CIRCUIT</span>{' '}
            <span className="text-cyan-600 drop-shadow-sm">CLASH</span>
          </h1>
          <p className="mt-2 font-display text-2xl font-bold text-slate-800">
            The Interactive STEM Electricity Showdown
          </p>
          <p className="mx-auto mt-2 max-w-xl text-base font-medium text-slate-600">
            Two teams. Six rounds. One mission: Master circuits and charge your team's battery to victory!
          </p>
        </div>

        <div className="mt-8 grid gap-5 sm:grid-cols-2">
          {TEAM_IDS.map((id, i) => {
            const theme = TEAM_THEME[id]
            const isVolt = id === 'volt'
            return (
              <div
                key={id}
                className={`rise-in rounded-3xl p-6 ${isVolt ? 'clay-card-volt' : 'clay-card-amp'}`}
                style={{ animationDelay: `${100 + i * 80}ms` }}
              >
                <div className="flex items-center justify-between">
                  <span
                    className="font-display text-xs font-black uppercase tracking-widest"
                    style={{ color: isVolt ? '#b45309' : '#0e7490' }}
                  >
                    Team {i + 1}
                  </span>
                  <span className="flex items-center gap-1.5 text-xs font-bold text-slate-600">
                    Buzzer Key:
                    <kbd
                      className="grid h-7 w-7 place-items-center rounded-xl font-black text-white shadow-md select-none"
                      style={{ background: theme.accent }}
                    >
                      {theme.key}
                    </kbd>
                  </span>
                </div>
                <input
                  value={state.teams[id].name}
                  onChange={(e) =>
                    dispatch({ type: 'SET_TEAM_NAME', team: id, name: e.target.value })
                  }
                  maxLength={22}
                  className="mt-3 w-full rounded-2xl border-2 border-white bg-white/90 px-4 py-3 font-display text-2xl font-black text-slate-900 shadow-inner outline-none transition focus:border-amber-400 focus:bg-white"
                  placeholder={theme.defaultName}
                />
              </div>
            )
          })}
        </div>

        <div className="mt-8">
          <div className="mb-3 text-center font-display text-xs font-black uppercase tracking-[0.25em] text-slate-800">
            Tournament Rounds
          </div>
          <div className="grid gap-2.5 sm:grid-cols-3">
            {ROUND_ORDER.map((id) => {
              const r = ROUNDS[id]
              return (
                <div
                  key={id}
                  className="clay-card flex items-center gap-3 px-4 py-2.5 bg-slate-50 border border-slate-300 shadow-xs"
                >
                  <span className="text-2xl">{r.icon}</span>
                  <div>
                    <div className="font-display text-sm font-black text-slate-900 leading-none">
                      {r.title}
                    </div>
                    <div className="mt-0.5 text-[10px] font-black uppercase tracking-wider text-emerald-700">
                      {r.subtopic}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <div className="mt-8 flex flex-col items-center gap-2">
          <Button size="lg" onClick={() => dispatch({ type: 'START_GAME' })}>
            ⚡ Begin Tournament →
          </Button>
          <p className="text-xs font-bold text-slate-700">
            Optimized for classroom projectors • Buzz with <kbd className="font-black text-slate-900 bg-slate-200 px-1.5 py-0.5 rounded-md">[A]</kbd> and <kbd className="font-black text-slate-900 bg-slate-200 px-1.5 py-0.5 rounded-md">[L]</kbd>
          </p>
        </div>
      </div>
    </div>
  )
}
