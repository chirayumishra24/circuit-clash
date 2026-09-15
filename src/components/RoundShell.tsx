import { useEffect, useRef, useState, type ReactNode } from 'react'
import { ROUNDS } from '../constants'
import { useGame } from '../context/GameContext'
import { useSound } from '../hooks/useSound'
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
  const { state } = useGame()
  const play = useSound()
  const round = ROUNDS[roundId]
  const [turnAlert, setTurnAlert] = useState<{ id: number; teamId: TeamId } | null>(null)
  const prevTeam = useRef<TeamId | null | undefined>(undefined)

  useEffect(() => {
    if (activeTeam && prevTeam.current !== activeTeam) {
      const alert = { id: Date.now(), teamId: activeTeam }
      setTurnAlert(alert)
      play('switch')
      const t = window.setTimeout(() => {
        setTurnAlert((curr) => (curr?.id === alert.id ? null : curr))
      }, 2000)
      return () => window.clearTimeout(t)
    }
    prevTeam.current = activeTeam
  }, [activeTeam, play])

  return (
    <div className="flex h-full flex-col px-4 md:px-6 py-2 md:py-3">
      {turnAlert && (
        <div
          key={turnAlert.id}
          className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center p-4"
        >
          <div
            className={`absolute inset-0 transition-opacity duration-500 animate-pulse opacity-15 ${
              turnAlert.teamId === 'volt' ? 'bg-amber-400' : 'bg-cyan-400'
            }`}
          />
          <div
            className={`pop-in relative flex items-center gap-5 rounded-3xl border-4 p-6 shadow-[0_24px_60px_rgba(0,0,0,0.3)] backdrop-blur-md ${
              turnAlert.teamId === 'volt'
                ? 'border-amber-400 bg-white/95 text-amber-950 shadow-amber-500/30'
                : 'border-cyan-400 bg-white/95 text-cyan-950 shadow-cyan-500/30'
            }`}
          >
            <div
              className={`grid h-16 w-16 place-items-center rounded-2xl text-3xl font-black text-white shadow-lg ${
                turnAlert.teamId === 'volt'
                  ? 'bg-gradient-to-br from-amber-400 to-amber-600 shadow-amber-500/50'
                  : 'bg-gradient-to-br from-cyan-400 to-cyan-600 shadow-cyan-500/50'
              }`}
            >
              {turnAlert.teamId === 'volt' ? '⚡' : '🔋'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span
                  className={`rounded-full px-2.5 py-0.5 font-display text-[11px] font-black uppercase tracking-wider text-white ${
                    turnAlert.teamId === 'volt' ? 'bg-amber-500' : 'bg-cyan-600'
                  }`}
                >
                  {turnAlert.teamId === 'volt' ? 'TEAM A' : 'TEAM B'}
                </span>
                <span className="font-display text-xs font-black uppercase tracking-wider text-slate-500">
                  TURN SWITCH
                </span>
              </div>
              <h2
                className="mt-0.5 font-display text-3xl md:text-4xl font-black leading-tight"
                style={{ color: turnAlert.teamId === 'volt' ? '#b45309' : '#0e7490' }}
              >
                {state.teams[turnAlert.teamId].name}
              </h2>
              <p className="mt-0.5 font-sans text-xs font-bold text-slate-600">
                {turnAlert.teamId === 'volt' ? 'Left Buzzer (Key A)' : 'Right Buzzer (Key L)'} · Active Turn!
              </p>
            </div>
          </div>
        </div>
      )}
      <Scoreboard activeTeam={activeTeam} />

      {/* Center Tournament Marquee Banner */}
      <div className="clay-card mx-auto mt-2 flex w-full max-w-5xl items-center justify-between gap-2 px-4 md:px-6 py-2">
        <div className="flex items-center gap-3.5">
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
