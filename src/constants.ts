import type { PowerUpId, RoundId, RoundMeta, TeamId } from './types'

/** Charge needed to fill a team battery to 100%. Scores above this simply cap the meter. */
export const TARGET_CHARGE = 2000

export const TEAM_IDS: TeamId[] = ['volt', 'ampere']

export const TEAM_THEME: Record<
  TeamId,
  {
    label: string
    defaultName: string
    key: string
    keyCode: string
    accent: string
    accentSoft: string
    ring: string
    text: string
    bg: string
    border: string
    fill: string
  }
> = {
  volt: {
    label: 'Team Volt',
    defaultName: 'Team Volt',
    key: 'A',
    keyCode: 'KeyA',
    accent: '#f59e0b',
    accentSoft: 'rgba(245, 158, 11, 0.18)',
    ring: 'ring-volt-500',
    text: 'text-volt-400',
    bg: 'bg-volt-500',
    border: 'border-volt-500',
    fill: 'from-volt-600 to-volt-300',
  },
  ampere: {
    label: 'Team Ampere',
    defaultName: 'Team Ampere',
    key: 'L',
    keyCode: 'KeyL',
    accent: '#06b6d4',
    accentSoft: 'rgba(6, 182, 212, 0.18)',
    ring: 'ring-amp-500',
    text: 'text-amp-400',
    bg: 'bg-amp-500',
    border: 'border-amp-500',
    fill: 'from-amp-600 to-amp-300',
  },
}

export const ROUND_ORDER: RoundId[] = ['loop', 'build', 'ammeter', 'belt', 'sabotage', 'lightning']

export const ROUNDS: Record<RoundId, RoundMeta> = {
  loop: {
    id: 'loop',
    index: 1,
    title: 'Close the Loop',
    subtitle: 'Rotate the wires. Complete the circuit.',
    subtopic: 'Flow of Electricity',
    objective: 'Current only flows in a complete, closed path.',
    icon: '🔌',
  },
  build: {
    id: 'build',
    index: 2,
    title: 'Build Battle',
    subtitle: 'Wire it to the brief. Fewest parts wins.',
    subtopic: 'Electrical Circuits',
    objective: 'Series and parallel behave differently when one bulb fails.',
    icon: '🔋',
  },
  ammeter: {
    index: 3,
    id: 'ammeter',
    title: 'Ammeter Showdown',
    subtitle: 'Place the meter. Predict the reading.',
    subtopic: 'Measuring the Flow of Current',
    objective: 'An ammeter goes in series, and current is measured in amperes.',
    icon: '🎛️',
  },
  belt: {
    id: 'belt',
    index: 4,
    title: 'Sorting Belt',
    subtitle: 'Sixty seconds. Conductor or insulator.',
    subtopic: 'Conductors and Insulators',
    objective: 'Some materials let current through; some block it — and some surprise you.',
    icon: '🧲',
  },
  sabotage: {
    id: 'sabotage',
    index: 5,
    title: 'Sabotage & Repair',
    subtitle: 'Break theirs. Fix yours.',
    subtopic: 'Adding or Removing a Component',
    objective: 'Every component you add or remove changes the whole circuit.',
    icon: '🛠️',
  },
  lightning: {
    id: 'lightning',
    index: 6,
    title: 'Lightning Round',
    subtitle: 'Wager your charge. Buzz to answer.',
    subtopic: 'All Subtopics',
    objective: 'Recall across everything, under pressure.',
    icon: '⚡',
  },
}

export const POINTS = {
  loop: { solve: 100, speedMax: 50, hintPenalty: 25 },
  build: { solve: 150, elegance: 50, steal: 150 },
  ammeter: { placement: 100, closest: 100, exact: 200 },
  belt: { correct: 25, wrong: -15, streakThreshold: 5 },
  sabotage: { sabotageWins: 150, prediction: 100, repair: 150 },
} as const

export const POWER_UPS: Record<PowerUpId, { name: string; icon: string; blurb: string }> = {
  surge: { name: 'Surge', icon: '⚡', blurb: 'Click to arm — your next points are doubled.' },
}

/** Streak length that earns a power-up. */
export const STREAK_FOR_POWERUP = 3
