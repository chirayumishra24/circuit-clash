import { allBulbs, simulate, survivesRemoval } from '../../sim/circuit'
import type { Circuit } from '../../sim/circuit'

export interface Brief {
  id: string
  text: string
  hint: string
  /** Component budget for the elegance bonus. */
  target: number
  validate: (circuit: Circuit) => { ok: boolean; reason: string }
}

const countComponents = (c: Circuit) =>
  c.main.length + c.branches.reduce((n, b) => n + b.components.length, 0)

export const componentCount = countComponents

const allLit = (circuit: Circuit) => {
  const sim = simulate(circuit)
  const bulbs = allBulbs(circuit)
  return bulbs.length > 0 && bulbs.every((b) => (sim.brightness[b.id] ?? 0) > 0.05)
}

/**
 * The two briefs are deliberately mirror images — one can only be solved in parallel, the
 * other only in series. Each team gets one, so neither can copy the other's answer, and the
 * results screen puts the two solutions side by side to make the contrast the lesson.
 */
export const BRIEFS: Brief[] = [
  {
    id: 'parallel',
    text: 'Wire 3 bulbs to the battery so that unscrewing any ONE bulb leaves the other two lit.',
    hint: 'Each bulb needs its own path back to the battery.',
    target: 3,
    validate: (circuit) => {
      const bulbs = allBulbs(circuit)
      if (bulbs.length !== 3) return { ok: false, reason: `The brief asks for exactly 3 bulbs — you have ${bulbs.length}.` }
      if (simulate(circuit).shortCircuit) return { ok: false, reason: 'That rail has nothing on it — the battery is shorted.' }
      if (!allLit(circuit)) return { ok: false, reason: 'All three bulbs must be lit to start with.' }

      for (const b of bulbs) {
        const survivors = survivesRemoval(circuit, b.id)
        if (survivors.length !== 2) {
          return {
            ok: false,
            reason: `Unscrew one bulb and ${survivors.length} stay lit — the brief needs 2.`,
          }
        }
      }
      return { ok: true, reason: 'Three independent paths — a parallel circuit.' }
    },
  },
  {
    id: 'series',
    text: 'Wire 3 bulbs to the battery so that unscrewing any ONE bulb turns ALL of them off.',
    hint: 'Give the current one single path to follow.',
    target: 3,
    validate: (circuit) => {
      const bulbs = allBulbs(circuit)
      if (bulbs.length !== 3) return { ok: false, reason: `The brief asks for exactly 3 bulbs — you have ${bulbs.length}.` }
      if (simulate(circuit).shortCircuit) return { ok: false, reason: 'That rail has nothing on it — the battery is shorted.' }
      if (!allLit(circuit)) return { ok: false, reason: 'All three bulbs must be lit to start with.' }

      for (const b of bulbs) {
        const survivors = survivesRemoval(circuit, b.id)
        if (survivors.length !== 0) {
          return {
            ok: false,
            reason: `Unscrew one bulb and ${survivors.length} stay lit — the brief needs all of them out.`,
          }
        }
      }
      return { ok: true, reason: 'One single path — a series circuit.' }
    },
  },
]
