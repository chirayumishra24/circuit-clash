import { useCallback, useEffect, useRef, useState } from 'react'
import { TEAM_THEME } from '../constants'
import type { TeamId } from '../types'

interface Options {
  /** When false, key presses are ignored. */
  armed: boolean
  onBuzz?: (team: TeamId) => void
}

/**
 * Both teams buzz from the one classroom keyboard: A for Volt, L for Ampere.
 * First key in locks the other team out until `reset()` is called.
 */
export function useBuzzer({ armed, onBuzz }: Options) {
  const [lockedBy, setLockedBy] = useState<TeamId | null>(null)
  const lockedRef = useRef<TeamId | null>(null)
  const armedRef = useRef(armed)
  const onBuzzRef = useRef(onBuzz)
  armedRef.current = armed
  onBuzzRef.current = onBuzz

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (!armedRef.current || lockedRef.current) return
      // Don't hijack the keyboard while a teacher is typing a team name.
      const el = e.target as HTMLElement | null
      if (el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable)) return

      const team = (Object.keys(TEAM_THEME) as TeamId[]).find(
        (id) => TEAM_THEME[id].keyCode === e.code,
      )
      if (!team) return

      e.preventDefault()
      lockedRef.current = team
      setLockedBy(team)
      onBuzzRef.current?.(team)
    }

    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  const reset = useCallback(() => {
    lockedRef.current = null
    setLockedBy(null)
  }, [])

  return { lockedBy, reset }
}
