import { useCallback, useRef } from 'react'
import { useGame } from '../context/GameContext'

export type SoundName = 'buzz' | 'correct' | 'wrong' | 'tick' | 'charge' | 'victory' | 'spark'

type Tone = { freq: number; dur: number; type?: OscillatorType; gain?: number; delay?: number }

/**
 * Sounds are synthesised with the Web Audio API rather than loaded as files — it keeps the
 * activity a single deployable bundle with no audio assets to ship or license.
 */
const RECIPES: Record<SoundName, Tone[]> = {
  buzz: [{ freq: 180, dur: 0.28, type: 'square', gain: 0.16 }],
  correct: [
    { freq: 660, dur: 0.11, type: 'triangle' },
    { freq: 880, dur: 0.16, type: 'triangle', delay: 0.1 },
  ],
  wrong: [
    { freq: 220, dur: 0.16, type: 'sawtooth', gain: 0.12 },
    { freq: 150, dur: 0.24, type: 'sawtooth', gain: 0.12, delay: 0.14 },
  ],
  tick: [{ freq: 1200, dur: 0.04, type: 'square', gain: 0.05 }],
  charge: [
    { freq: 420, dur: 0.1, type: 'sine' },
    { freq: 620, dur: 0.1, type: 'sine', delay: 0.08 },
    { freq: 880, dur: 0.14, type: 'sine', delay: 0.16 },
  ],
  victory: [
    { freq: 523, dur: 0.14, type: 'triangle' },
    { freq: 659, dur: 0.14, type: 'triangle', delay: 0.13 },
    { freq: 784, dur: 0.14, type: 'triangle', delay: 0.26 },
    { freq: 1047, dur: 0.3, type: 'triangle', delay: 0.39 },
  ],
  spark: [{ freq: 2000, dur: 0.05, type: 'square', gain: 0.06 }],
}

export function useSound() {
  const { state } = useGame()
  const ctxRef = useRef<AudioContext | null>(null)
  const mutedRef = useRef(state.muted)
  mutedRef.current = state.muted

  return useCallback((name: SoundName) => {
    if (mutedRef.current) return
    try {
      if (!ctxRef.current) {
        ctxRef.current = new AudioContext()
      }
      const ctx = ctxRef.current
      if (ctx.state === 'suspended') void ctx.resume()

      for (const tone of RECIPES[name]) {
        const start = ctx.currentTime + (tone.delay ?? 0)
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.type = tone.type ?? 'sine'
        osc.frequency.setValueAtTime(tone.freq, start)
        gain.gain.setValueAtTime(0.0001, start)
        gain.gain.exponentialRampToValueAtTime(tone.gain ?? 0.1, start + 0.012)
        gain.gain.exponentialRampToValueAtTime(0.0001, start + tone.dur)
        osc.connect(gain).connect(ctx.destination)
        osc.start(start)
        osc.stop(start + tone.dur + 0.02)
      }
    } catch {
      // Audio is a nicety — never let it break the game.
    }
  }, [])
}
