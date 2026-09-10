import { useEffect, useRef, useState } from 'react'
import { BreadboardLeaderCircuit3D } from './BreadboardLeaderCircuit3D'
import { POWER_UPS, TARGET_CHARGE, TEAM_THEME } from '../constants'
import { useGame } from '../context/GameContext'
import type { TeamId } from '../types'

function useScoreDelta(score: number) {
  const [delta, setDelta] = useState<{ value: number; id: number } | null>(null)
  const prev = useRef(score)

  useEffect(() => {
    const diff = score - prev.current
    prev.current = score
    if (diff !== 0) {
      const entry = { value: diff, id: Date.now() + Math.random() }
      setDelta(entry)
      const t = window.setTimeout(() => setDelta((d) => (d?.id === entry.id ? null : d)), 1400)
      return () => window.clearTimeout(t)
    }
  }, [score])

  return delta
}

function TeamPod({ teamId, active }: { teamId: TeamId; active: boolean }) {
  const { state, dispatch } = useGame()
  const team = state.teams[teamId]
  const theme = TEAM_THEME[teamId]
  const pct = Math.min(100, Math.max(0, (team.score / TARGET_CHARGE) * 100))
  const delta = useScoreDelta(team.score)
  const isVolt = teamId === 'volt'

  return (
    <div
      className={`relative flex-1 rounded-[28px] p-4 transition-all duration-300 ${
        isVolt ? 'clay-card-volt' : 'clay-card-amp'
      } ${
        active
          ? 'scale-[1.01] ring-4 ' +
            (isVolt ? 'ring-amber-400/80 shadow-[0_16px_32px_rgba(245,158,11,0.28)]' : 'ring-cyan-400/80 shadow-[0_16px_32px_rgba(6,182,212,0.28)]')
          : 'opacity-90 hover:opacity-100'
      }`}
    >
      <div className="flex items-center justify-between gap-4">
        {/* Team Avatar Badge & Name */}
        <div className="flex items-center gap-3.5 min-w-0">
          <div
            className={`relative grid h-12 w-12 shrink-0 place-items-center rounded-2xl font-display text-xl font-black text-white select-none transition-transform active:scale-90 ${
              isVolt
                ? 'bg-gradient-to-b from-amber-400 via-amber-500 to-amber-600 shadow-[0_8px_16px_rgba(217,119,6,0.4),inset_0_3px_5px_rgba(255,255,255,0.85),inset_0_-3px_5px_rgba(0,0,0,0.25)]'
                : 'bg-gradient-to-b from-cyan-400 via-cyan-500 to-cyan-600 shadow-[0_8px_16px_rgba(8,145,178,0.4),inset_0_3px_5px_rgba(255,255,255,0.85),inset_0_-3px_5px_rgba(0,0,0,0.25)]'
            }`}
          >
            {theme.key}
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h3
                className="truncate font-display text-2xl font-black tracking-tight leading-none"
                style={{ color: isVolt ? '#78350f' : '#164e63' }}
              >
                {team.name}
              </h3>
              {team.activeSurge && (
                <span className="shrink-0 rounded-full bg-amber-500 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-white shadow-[0_4px_8px_rgba(245,158,11,0.5),inset_0_1px_2px_rgba(255,255,255,0.8)] animate-bounce">
                  ⚡ 2× SURGE
                </span>
              )}
            </div>
            <div className="mt-1 flex items-center gap-2 text-xs font-bold" style={{ color: isVolt ? '#92400e' : '#0e7490' }}>
              <span>⚡ BUZZER: {isVolt ? 'LEFT' : 'RIGHT'}</span>
              {team.streak >= 2 && (
                <span className="rounded-full bg-orange-100 px-2 py-0.2 text-[11px] font-black text-orange-700">
                  🔥 {team.streak} STREAK
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Large Score Counter */}
        <div className="relative shrink-0 text-right">
          <div className="font-display text-4xl font-black tabular-nums leading-none text-slate-900 drop-shadow-xs">
            {team.score}
          </div>
          <div className="mt-0.5 text-[10px] font-black uppercase tracking-widest text-slate-800">
            POINTS
          </div>
          {delta && (
            <div
              key={delta.id}
              className={`float-up pointer-events-none absolute right-0 -top-2 font-display text-lg font-black ${
                delta.value > 0 ? 'text-emerald-600' : 'text-rose-600'
              }`}
            >
              {delta.value > 0 ? '+' : ''}
              {delta.value}
            </div>
          )}
        </div>
      </div>

      {/* Fluid Glowing Energy Tank */}
      <div className="mt-3 flex items-center gap-2">
        <div className="clay-liquid-tank relative flex h-6 flex-1 items-center overflow-hidden p-1">
          <div
            className={`h-full rounded-full transition-all duration-500 ease-out relative overflow-hidden ${
              isVolt
                ? 'bg-gradient-to-r from-amber-400 via-amber-500 to-amber-300 shadow-[0_0_14px_rgba(245,158,11,0.6)]'
                : 'bg-gradient-to-r from-cyan-400 via-cyan-500 to-teal-300 shadow-[0_0_14px_rgba(6,182,212,0.6)]'
            }`}
            style={{ width: `${Math.max(4, pct)}%` }}
          >
            {/* Fluid Highlight Stripe */}
            <div className="absolute inset-x-1 top-0.5 h-1 rounded-full bg-white/60" />
          </div>
        </div>
        {/* Terminal Cap */}
        <div
          className={`h-4 w-2 rounded-r-md ${
            isVolt ? 'bg-amber-500 shadow-[2px_0_4px_rgba(217,119,6,0.4)]' : 'bg-cyan-500 shadow-[2px_0_4px_rgba(8,145,178,0.4)]'
          }`}
        />
      </div>

      {/* Power-ups Row */}
      {team.powerUps.length > 0 && (
        <div className="mt-2.5 flex flex-wrap items-center gap-2">
          {team.powerUps.map((p) => (
            <button
              key={p}
              title={`${POWER_UPS[p].name} — ${POWER_UPS[p].blurb}`}
              onClick={() => dispatch({ type: 'USE_POWERUP', team: teamId, powerUp: p })}
              className="clay-btn bg-gradient-to-b from-emerald-500 to-emerald-600 px-3 py-1 text-xs font-black text-white shadow-[0_4px_10px_rgba(16,185,129,0.4)] cursor-pointer"
            >
              {POWER_UPS[p].icon} {POWER_UPS[p].name}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export function Scoreboard({ activeTeam }: { activeTeam?: TeamId | null }) {
  const { state } = useGame()

  return (
    <div className="mx-auto flex w-full max-w-5xl items-center gap-4">
      <TeamPod teamId="volt" active={activeTeam === 'volt'} />
      <BreadboardLeaderCircuit3D
        voltScore={state.teams.volt.score}
        ampScore={state.teams.ampere.score}
        voltName={state.teams.volt.name}
        ampName={state.teams.ampere.name}
      />
      <TeamPod teamId="ampere" active={activeTeam === 'ampere'} />
    </div>
  )
}
