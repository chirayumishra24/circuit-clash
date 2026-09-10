import { ROUNDS, ROUND_ORDER, TEAM_IDS, TEAM_THEME } from '../constants'
import { useGame } from '../context/GameContext'
import { Button } from '../components/ui/Button'

export function SetupScreen() {
  const { state, dispatch } = useGame()

  return (
    <div className="grid h-full place-items-center overflow-y-auto px-4 py-4 md:py-6">
      <div className="clay-chassis w-full max-w-6xl px-6 py-5 md:px-10 md:py-6 bg-white/98 shadow-2xl">
        <div className="rise-in text-center">
          <div className="font-display text-xs font-black uppercase tracking-[0.35em] text-emerald-600">
            SkilliZee Presents
          </div>
          <h1 className="mt-1 font-display text-5xl font-black leading-none tracking-tight md:text-6xl">
            <span className="text-amber-500 drop-shadow-sm">CIRCUIT</span>{' '}
            <span className="text-cyan-600 drop-shadow-sm">CLASH</span>
          </h1>
          <p className="mt-1.5 font-display text-xl font-bold text-slate-800 md:text-2xl">
            The Interactive STEM Electricity Showdown
          </p>
          <p className="mx-auto mt-1 max-w-2xl text-xs font-medium text-slate-600 md:text-sm">
            Two teams. Six rounds. One mission: Master circuits and charge your team's battery to victory!
          </p>
        </div>

        {/* Dimension C-137 Lab Banner */}
        <div className="rise-in mt-3.5 flex items-center gap-3.5 rounded-2xl border-2 border-emerald-300 bg-emerald-50/70 p-3 shadow-xs">
          <img
            src="/assets/rick_and_morty/rick_morty_bench.jpg"
            alt="Rick and Morty Science Lab"
            className="h-14 w-14 rounded-xl object-cover border-2 border-emerald-500 shadow-sm shrink-0"
          />
          <div className="min-w-0">
            <div className="font-display text-xs font-black uppercase tracking-wider text-emerald-900">
              🧪 Dimension C-137 Laboratory Active
            </div>
            <p className="text-xs font-bold text-slate-700 mt-0.5">
              “Listen to me, Morty! Electricity isn’t magic, it’s voltage pushing electrons through circuit loops! Name your squads and prepare for battle!”
            </p>
          </div>
        </div>

        <div className="mt-3.5 grid gap-4 sm:grid-cols-2">
          {TEAM_IDS.map((id, i) => {
            const theme = TEAM_THEME[id]
            const isVolt = id === 'volt'
            return (
              <div
                key={id}
                className={`rise-in rounded-2xl p-4 ${isVolt ? 'clay-card-volt' : 'clay-card-amp'}`}
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
                    Smart Board Buzzer:
                    <span
                      className="grid h-6 px-2.5 place-items-center rounded-lg font-display text-[11px] font-black text-white shadow-sm select-none"
                      style={{ background: theme.accent }}
                    >
                      {isVolt ? 'LEFT TOUCH' : 'RIGHT TOUCH'}
                    </span>
                  </span>
                </div>
                <input
                  value={state.teams[id].name}
                  onChange={(e) =>
                    dispatch({ type: 'SET_TEAM_NAME', team: id, name: e.target.value })
                  }
                  maxLength={22}
                  className="mt-2 w-full rounded-xl border-2 border-white bg-white/90 px-3.5 py-2 font-display text-xl font-black text-slate-900 shadow-inner outline-none transition focus:border-amber-400 focus:bg-white"
                  placeholder={theme.defaultName}
                />
              </div>
            )
          })}
        </div>

        <div className="mt-4">
          <div className="mb-2 text-center font-display text-[11px] font-black uppercase tracking-[0.25em] text-slate-700">
            Tournament Rounds
          </div>
          <div className="grid gap-2 grid-cols-2 sm:grid-cols-3 lg:grid-cols-6">
            {ROUND_ORDER.map((id) => {
              const r = ROUNDS[id]
              return (
                <div
                  key={id}
                  className="clay-card flex flex-col justify-center px-3 py-2 bg-slate-50 border border-slate-300 shadow-xs text-center"
                >
                  <div className="flex items-center justify-center gap-1.5">
                    <span className="text-lg">{r.icon}</span>
                    <span className="font-display text-xs font-black text-slate-900 leading-tight">
                      {r.title}
                    </span>
                  </div>
                  <div className="mt-0.5 text-[9px] font-black uppercase tracking-wider text-emerald-700 truncate">
                    {r.subtopic}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <div className="mt-4 flex flex-col items-center gap-1.5">
          <Button size="lg" onClick={() => dispatch({ type: 'START_GAME' })}>
            ⚡ Begin Tournament →
          </Button>
          <p className="text-[11px] font-bold text-slate-600">
            Optimized for Smart Boards & Projectors • On-screen touch buzzers ready
          </p>
        </div>
      </div>
    </div>
  )
}
