import { useEffect, useRef, useState } from 'react'

interface Options {
  seconds: number
  running: boolean
  onEnd?: () => void
  /** Bump this to restart the clock from `seconds`. */
  resetKey?: string | number
}

export function useCountdown({ seconds, running, onEnd, resetKey }: Options) {
  const [remaining, setRemaining] = useState(seconds)
  const onEndRef = useRef(onEnd)
  onEndRef.current = onEnd

  useEffect(() => {
    setRemaining(seconds)
  }, [seconds, resetKey])

  useEffect(() => {
    if (!running) return
    if (remaining <= 0) return

    const id = window.setInterval(() => {
      setRemaining((r) => {
        if (r <= 0.1) {
          window.clearInterval(id)
          return 0
        }
        return Math.round((r - 0.1) * 10) / 10
      })
    }, 100)

    return () => window.clearInterval(id)
  }, [running, remaining <= 0])

  const firedRef = useRef(false)
  useEffect(() => {
    if (remaining > 0) {
      firedRef.current = false
      return
    }
    if (firedRef.current) return
    firedRef.current = true
    onEndRef.current?.()
  }, [remaining])

  return { remaining, setRemaining }
}
