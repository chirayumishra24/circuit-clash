import { useEffect, useRef, useState } from 'react'
import { useGame } from '../context/GameContext'

interface Toast {
  id: number
  title: string
  subtitle: string
  teamColor: string
  badge: string
}

export function CelebrationToast() {
  const { state } = useGame()
  const [toast, setToast] = useState<Toast | null>(null)

  const prevVoltStreak = useRef(state.teams.volt.streak)
  const prevAmpStreak = useRef(state.teams.ampere.streak)
  const prevVoltSurge = useRef(state.teams.volt.activeSurge)
  const prevAmpSurge = useRef(state.teams.ampere.activeSurge)

  useEffect(() => {
    // Check Volt Surge
    if (state.teams.volt.activeSurge && !prevVoltSurge.current) {
      showToast({
        title: '2× SURGE ACTIVATED!',
        subtitle: `${state.teams.volt.name} doubled their point output!`,
        teamColor: '#d97706',
        badge: '⚡',
      })
    }
    prevVoltSurge.current = state.teams.volt.activeSurge

    // Check Amp Surge
    if (state.teams.ampere.activeSurge && !prevAmpSurge.current) {
      showToast({
        title: '2× SURGE ACTIVATED!',
        subtitle: `${state.teams.ampere.name} doubled their point output!`,
        teamColor: '#0891b2',
        badge: '⚡',
      })
    }
    prevAmpSurge.current = state.teams.ampere.activeSurge

    // Check Volt Streak >= 3
    if (state.teams.volt.streak >= 3 && state.teams.volt.streak > prevVoltStreak.current) {
      showToast({
        title: `${state.teams.volt.streak}× STREAK COMBO!`,
        subtitle: `${state.teams.volt.name} is on electrical fire!`,
        teamColor: '#d97706',
        badge: '🔥',
      })
    }
    prevVoltStreak.current = state.teams.volt.streak

    // Check Amp Streak >= 3
    if (state.teams.ampere.streak >= 3 && state.teams.ampere.streak > prevAmpStreak.current) {
      showToast({
        title: `${state.teams.ampere.streak}× STREAK COMBO!`,
        subtitle: `${state.teams.ampere.name} is on electrical fire!`,
        teamColor: '#0891b2',
        badge: '🔥',
      })
    }
    prevAmpStreak.current = state.teams.ampere.streak
  }, [
    state.teams.volt.streak,
    state.teams.ampere.streak,
    state.teams.volt.activeSurge,
    state.teams.ampere.activeSurge,
    state.teams.volt.name,
    state.teams.ampere.name,
  ])

  function showToast(t: Omit<Toast, 'id'>) {
    const id = Date.now()
    setToast({ ...t, id })
    window.setTimeout(() => {
      setToast((curr) => (curr?.id === id ? null : curr))
    }, 2200)
  }

  if (!toast) return null

  return (
    <div className="pointer-events-none fixed top-16 left-1/2 -translate-x-1/2 z-50">
      <div className="pop-in flex items-center gap-3 rounded-3xl border-3 border-slate-900 bg-white px-7 py-3 shadow-[0_16px_36px_rgba(0,0,0,0.22)]">
        <span className="text-4xl animate-bounce">{toast.badge}</span>
        <div>
          <div className="font-display text-2xl font-black leading-none" style={{ color: toast.teamColor }}>
            {toast.title}
          </div>
          <div className="mt-1 text-xs font-black text-slate-800">{toast.subtitle}</div>
        </div>
      </div>
    </div>
  )
}
