import { useEffect, useRef, useState } from 'react'
import { useGame } from '../context/GameContext'

/**
 * Procedural Retro Sci-Fi Lab Background Music synthesizer using Web Audio API.
 * Synthesizes a melodic arpeggiated synthwave loop with zero external asset dependencies.
 */
export function useBackgroundMusic() {
  const { state } = useGame()
  const [bgmEnabled, setBgmEnabled] = useState(true)
  const ctxRef = useRef<AudioContext | null>(null)
  const timerRef = useRef<number | null>(null)
  const isPlayingRef = useRef(false)

  const isMuted = state.muted || !bgmEnabled

  useEffect(() => {
    // If muted or disabled, suspend audio context
    if (isMuted) {
      if (ctxRef.current && ctxRef.current.state === 'running') {
        void ctxRef.current.suspend()
      }
      return
    }

    // Resume or start music
    const startAudio = async () => {
      try {
        if (!ctxRef.current) {
          const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
          ctxRef.current = new AudioContextClass()
        }

        const ctx = ctxRef.current
        if (ctx.state === 'suspended') {
          await ctx.resume()
        }

        if (isPlayingRef.current) return
        isPlayingRef.current = true

        // Master BGM Gain (Soft background level)
        const masterGain = ctx.createGain()
        masterGain.gain.value = 0.055
        masterGain.connect(ctx.destination)

        // Lowpass filter for warm analog laboratory tone
        const filter = ctx.createBiquadFilter()
        filter.type = 'lowpass'
        filter.frequency.value = 1400
        filter.Q.value = 2.5
        filter.connect(masterGain)

        // Sci-Fi Lab chord progression arpeggio notes (Hz)
        // Am -> F -> C -> G chords
        const chords = [
          [220.0, 261.63, 329.63, 440.0], // A minor
          [174.61, 220.0, 261.63, 349.23], // F major
          [261.63, 329.63, 392.0, 523.25], // C major
          [196.0, 246.94, 293.66, 392.0],  // G major
        ]

        let step = 0
        const tempo = 126 // BPM
        const stepTime = 60 / tempo / 2 // 1/8th notes

        const scheduleNote = () => {
          if (!isPlayingRef.current || !ctxRef.current || ctxRef.current.state !== 'running') return

          const chordIndex = Math.floor(step / 8) % chords.length
          const noteIndex = step % 4
          const freq = chords[chordIndex][noteIndex]

          const now = ctx.currentTime
          const osc = ctx.createOscillator()
          const noteGain = ctx.createGain()

          osc.type = step % 2 === 0 ? 'sawtooth' : 'triangle'
          osc.frequency.setValueAtTime(freq, now)

          noteGain.gain.setValueAtTime(0.001, now)
          noteGain.gain.exponentialRampToValueAtTime(0.08, now + 0.02)
          noteGain.gain.exponentialRampToValueAtTime(0.0001, now + stepTime * 0.9)

          osc.connect(noteGain).connect(filter)
          osc.start(now)
          osc.stop(now + stepTime)

          // Soft sub-bass pulse on beat 0 and 4
          if (step % 4 === 0) {
            const bassOsc = ctx.createOscillator()
            const bassGain = ctx.createGain()
            bassOsc.type = 'sine'
            const rootFreq = chords[chordIndex][0] / 2
            bassOsc.frequency.setValueAtTime(rootFreq, now)
            bassGain.gain.setValueAtTime(0.001, now)
            bassGain.gain.exponentialRampToValueAtTime(0.12, now + 0.03)
            bassGain.gain.exponentialRampToValueAtTime(0.0001, now + stepTime * 1.8)
            bassOsc.connect(bassGain).connect(masterGain)
            bassOsc.start(now)
            bassOsc.stop(now + stepTime * 2)
          }

          step = (step + 1) % 32
        }

        const intervalId = window.setInterval(scheduleNote, stepTime * 1000)
        timerRef.current = intervalId
      } catch {
        // Audio is a nicety
      }
    }

    const onUserGesture = () => {
      void startAudio()
      window.removeEventListener('click', onUserGesture)
      window.removeEventListener('keydown', onUserGesture)
      window.removeEventListener('touchstart', onUserGesture)
    }

    if (ctxRef.current?.state === 'running') {
      void startAudio()
    } else {
      window.addEventListener('click', onUserGesture)
      window.addEventListener('keydown', onUserGesture)
      window.addEventListener('touchstart', onUserGesture)
    }

    return () => {
      isPlayingRef.current = false
      if (timerRef.current) {
        window.clearInterval(timerRef.current)
        timerRef.current = null
      }
    }
  }, [isMuted])

  const toggleBgm = () => {
    setBgmEnabled((prev) => !prev)
  }

  return { bgmEnabled, toggleBgm }
}
