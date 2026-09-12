import { createContext, useContext, useMemo, useReducer } from 'react'
import type { ReactNode } from 'react'
import { ROUND_ORDER, STREAK_FOR_POWERUP, TEAM_THEME } from '../constants'
import type { GameState, PowerUpId, RoundId, ScoreLog, ScreenId, TeamId } from '../types'

const emptyScoreLog = (): ScoreLog =>
  ROUND_ORDER.reduce((acc, id) => {
    acc[id] = { volt: 0, ampere: 0 }
    return acc
  }, {} as ScoreLog)

const initialState: GameState = {
  screen: 'setup',
  teams: {
    volt: {
      id: 'volt',
      name: TEAM_THEME.volt.defaultName,
      score: 0,
      streak: 0,
      powerUps: [],
      activeSurge: false,
    },
    ampere: {
      id: 'ampere',
      name: TEAM_THEME.ampere.defaultName,
      score: 0,
      streak: 0,
      powerUps: [],
      activeSurge: false,
    },
  },
  currentRound: 'loop',
  completedRounds: [],
  scoreLog: emptyScoreLog(),
  paused: false,
  muted: false,
  winner: null,
  stageHistory: ['setup'],
}

type Action =
  | { type: 'SET_TEAM_NAME'; team: TeamId; name: string }
  | { type: 'START_GAME' }
  /** Scoring play. `correct` drives streaks; omit for neutral adjustments. */
  | { type: 'AWARD'; team: TeamId; points: number; round: RoundId; correct?: boolean }
  | { type: 'ADJUST_SCORE'; team: TeamId; delta: number }
  | { type: 'USE_POWERUP'; team: TeamId; powerUp: PowerUpId }
  | { type: 'GRANT_POWERUP'; team: TeamId; powerUp: PowerUpId }
  | { type: 'GO_TO'; screen: ScreenId }
  | { type: 'GO_BACK' }
  | { type: 'START_ROUND'; round: RoundId }
  | { type: 'COMPLETE_ROUND'; round: RoundId }
  | { type: 'TOGGLE_PAUSE' }
  | { type: 'TOGGLE_MUTE' }
  | { type: 'RESTART' }

const POWERUP_POOL: PowerUpId[] = ['surge']

function decideWinner(state: GameState): TeamId | 'tie' {
  const { volt, ampere } = state.teams
  if (volt.score === ampere.score) return 'tie'
  return volt.score > ampere.score ? 'volt' : 'ampere'
}

function reducer(state: GameState, action: Action): GameState {
  switch (action.type) {
    case 'SET_TEAM_NAME':
      return {
        ...state,
        teams: {
          ...state.teams,
          [action.team]: { ...state.teams[action.team], name: action.name },
        },
      }

    case 'START_GAME':
      return {
        ...state,
        screen: 'map',
        currentRound: ROUND_ORDER[0],
        stageHistory: ['setup', 'map'],
      }

    case 'AWARD': {
      const team = state.teams[action.team]
      const multiplier = team.activeSurge && action.points > 0 ? 2 : 1
      const points = action.points * multiplier
      const streak = action.correct === undefined ? team.streak : action.correct ? team.streak + 1 : 0

      // A clean streak earns a random power-up the team does not already hold.
      let powerUps = team.powerUps
      if (streak > 0 && streak % STREAK_FOR_POWERUP === 0) {
        const available = POWERUP_POOL.filter((p) => !powerUps.includes(p))
        if (available.length > 0) {
          powerUps = [...powerUps, available[Math.floor(Math.random() * available.length)]]
        }
      }

      return {
        ...state,
        teams: {
          ...state.teams,
          [action.team]: {
            ...team,
            score: Math.max(0, team.score + points),
            streak,
            powerUps,
            activeSurge: multiplier === 2 ? false : team.activeSurge,
          },
        },
        scoreLog: {
          ...state.scoreLog,
          [action.round]: {
            ...state.scoreLog[action.round],
            [action.team]: state.scoreLog[action.round][action.team] + points,
          },
        },
      }
    }

    case 'ADJUST_SCORE': {
      const team = state.teams[action.team]
      return {
        ...state,
        teams: {
          ...state.teams,
          [action.team]: { ...team, score: Math.max(0, team.score + action.delta) },
        },
      }
    }

    case 'USE_POWERUP': {
      const team = state.teams[action.team]
      if (!team.powerUps.includes(action.powerUp)) return state
      return {
        ...state,
        teams: {
          ...state.teams,
          [action.team]: {
            ...team,
            powerUps: team.powerUps.filter((p) => p !== action.powerUp),
            activeSurge: action.powerUp === 'surge' ? true : team.activeSurge,
          },
        },
      }
    }

    case 'GRANT_POWERUP': {
      const team = state.teams[action.team]
      if (team.powerUps.includes(action.powerUp)) return state
      return {
        ...state,
        teams: {
          ...state.teams,
          [action.team]: { ...team, powerUps: [...team.powerUps, action.powerUp] },
        },
      }
    }

    case 'GO_TO': {
      const history = state.stageHistory || ['setup']
      const stageHistory = history[history.length - 1] === action.screen
        ? history
        : [...history, action.screen]
      return {
        ...state,
        screen: action.screen,
        stageHistory,
        winner: action.screen === 'win' ? decideWinner(state) : state.winner,
      }
    }

    case 'GO_BACK': {
      if (state.screen === 'debrief') {
        return { ...state, screen: 'win' }
      }
      if (state.screen === 'win') {
        return { ...state, screen: 'map' }
      }
      if (state.screen === 'round') {
        return { ...state, screen: 'map', paused: false }
      }
      if (state.screen === 'map') {
        return { ...state, screen: 'setup' }
      }
      return state
    }

    case 'START_ROUND': {
      const history = state.stageHistory || ['setup']
      return {
        ...state,
        screen: 'round',
        currentRound: action.round,
        paused: false,
        stageHistory: [...history, 'round'],
      }
    }

    case 'COMPLETE_ROUND': {
      const completedRounds = state.completedRounds.includes(action.round)
        ? state.completedRounds
        : [...state.completedRounds, action.round]
      const allDone = completedRounds.length >= ROUND_ORDER.length
      const nextScreen: ScreenId = allDone ? 'win' : 'map'
      const history = state.stageHistory || ['setup']
      const next: GameState = {
        ...state,
        completedRounds,
        screen: nextScreen,
        stageHistory: [...history, nextScreen],
      }
      if (allDone) next.winner = decideWinner(next)
      return next
    }

    case 'TOGGLE_PAUSE':
      return { ...state, paused: !state.paused }

    case 'TOGGLE_MUTE':
      return { ...state, muted: !state.muted }

    case 'RESTART':
      return {
        ...initialState,
        teams: {
          volt: { ...initialState.teams.volt, name: state.teams.volt.name },
          ampere: { ...initialState.teams.ampere, name: state.teams.ampere.name },
        },
        scoreLog: emptyScoreLog(),
        muted: state.muted,
      }

    default:
      return state
  }
}

interface GameContextValue {
  state: GameState
  dispatch: React.Dispatch<Action>
}

const GameContext = createContext<GameContextValue | null>(null)

export function GameProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState)
  const value = useMemo(() => ({ state, dispatch }), [state])
  return <GameContext.Provider value={value}>{children}</GameContext.Provider>
}

export function useGame() {
  const ctx = useContext(GameContext)
  if (!ctx) throw new Error('useGame must be used inside a GameProvider')
  return ctx
}

export type { Action as GameAction }
