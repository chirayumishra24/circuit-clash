import type { ReactNode } from 'react'
import { ROUNDS } from '../constants'
import { useGame } from '../context/GameContext'
import { Scoreboard } from './Scoreboard'
import type { RoundId, TeamId } from '../types'

interface Props {
  roundId: RoundId
  /** Team currently on the clock — highlighted on the scoreboard. */
  activeTeam?: TeamId | null
  headerRight?: ReactNode
  children: ReactNode
}

export function RoundShell({ roundId, activeTeam, headerRight, children }: Props) {
  const { state, dispatch } = useGame()
  const round = ROUNDS[roundId]

  return (
    <div className="flex h-full flex-col px-6 py-4">
      <Scoreboard activeTeam={activeTeam} />

      {/* Center Tournament Marquee Banner */}
      <div className="clay-card mx-auto mt-3 flex w-full max-w-5xl flex-wrap items-center justify-between gap-3 px-6 py-2.5">
        <div className="flex items-center gap-3.5">
          <button
            onClick={() => dispatch({ type: 'GO_TO', screen: 'map' })}
            className="clay-btn flex items-center gap-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-300 px-3 py-1.5 text-xs font-black text-slate-700 transition shadow-xs cursor-pointer"
            title="Return to Tournament Board without losing scores"
          >
            <span className="text-sm font-black">←</span>
            <span>Board</span>
          </button>
          <span className="clay-inset grid h-10 w-10 place-items-center text-xl">
            {round.icon}
          </span>
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-slate-900 px-2.5 py-0.5 font-display text-[10px] font-black uppercase tracking-wider text-white shadow-[0_2px_4px_rgba(0,0,0,0.2)]">
                ROUND {round.index}
              </span>
              <h2 className="font-display text-xl font-black leading-none text-slate-900">{round.title}</h2>
            </div>
            <div className="mt-0.5 text-[11px] font-extrabold uppercase tracking-wider text-emerald-700">
              {round.subtopic}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-4">{headerRight}</div>
      </div>

      <div className="relative min-h-0 flex-1 overflow-y-auto pb-16 pt-3">
        {children}

        {state.paused && (
          <div className="rise-in absolute inset-0 z-30 grid place-items-center bg-slate-900/75 backdrop-blur-xs">
            <div className="clay-card border-4 border-slate-700 bg-white p-8 text-center shadow-2xl">
              <div className="font-display text-5xl font-black text-slate-900">⏸ PAUSED</div>
              <p className="mt-2 font-bold text-slate-600">Resume from the host bar below.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
