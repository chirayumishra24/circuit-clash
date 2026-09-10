export type TeamId = 'volt' | 'ampere'

export type PowerUpId = 'surge'

export type RoundId = 'loop' | 'build' | 'ammeter' | 'belt' | 'sabotage' | 'lightning'

export type ScreenId = 'setup' | 'map' | 'round' | 'win' | 'debrief'

export interface Team {
  id: TeamId
  name: string
  score: number
  streak: number
  powerUps: PowerUpId[]
  activeSurge: boolean
}

/** Points each team earned, broken down by round — drives the debrief screen. */
export type ScoreLog = Record<RoundId, Record<TeamId, number>>

export interface GameState {
  screen: ScreenId
  teams: Record<TeamId, Team>
  currentRound: RoundId
  completedRounds: RoundId[]
  scoreLog: ScoreLog
  paused: boolean
  muted: boolean
  winner: TeamId | 'tie' | null
}

export interface RoundMeta {
  id: RoundId
  index: number
  title: string
  subtitle: string
  subtopic: string
  objective: string
  icon: string
}
