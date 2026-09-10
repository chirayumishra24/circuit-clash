import { useState } from 'react'
import { TEAM_IDS, TEAM_THEME } from '../constants'
import { useGame } from '../context/GameContext'
import { ROUNDS } from '../constants'

/**
 * Teacher controls. Every classroom run needs an escape hatch: a wrong call to reverse,
 * a round to skip when the period runs short, a pause when the room gets loud.
 */
export function HostBar() {
  const { state, dispatch } = useGame()
  const [open, setOpen] = useState(false)

  return (
    <div className="pointer-events-none fixed bottom-0 left-0 right-0 z-40 flex justify-center pb-3">
      <div className="pointer-events-auto clay-card flex items-center gap-2.5 px-4 py-2 border-2 border-slate-200/80 bg-white/98 shadow-[0_12px_24px_rgba(15,23,42,0.12)]">
        <button
          onClick={() => setOpen((o) => !o)}
          className="clay-btn bg-slate-100 hover:bg-slate-200 px-3 py-1 text-xs font-black text-slate-800 transition"
          title="Host controls"
        >
          {open ? '✕ Close' : '⚙ Host Tools'}
        </button>

        {open && (
          <>
            <div className="mx-1 h-5 w-0.5 bg-slate-200" />

            {TEAM_IDS.map((id) => (
              <div key={id} className="flex items-center gap-1.5">
                <span
                  className="max-w-[90px] truncate text-xs font-black"
                  style={{ color: id === 'volt' ? '#b45309' : '#0e7490' }}
                >
                  {state.teams[id].name}
                </span>
                <button
                  onClick={() => dispatch({ type: 'ADJUST_SCORE', team: id, delta: -25 })}
                  className="clay-btn flex h-6 w-6 items-center justify-center bg-slate-100 text-xs font-black text-slate-700 hover:bg-slate-200"
                  title="Remove 25 points"
                >
                  −
                </button>
                <button
                  onClick={() => dispatch({ type: 'ADJUST_SCORE', team: id, delta: 25 })}
                  className="clay-btn flex h-6 w-6 items-center justify-center bg-slate-100 text-xs font-black text-slate-700 hover:bg-slate-200"
                  title="Add 25 points"
                >
                  +
                </button>
              </div>
            ))}

            <div className="mx-1 h-5 w-0.5 bg-slate-200" />

            <button
              onClick={() => dispatch({ type: 'TOGGLE_PAUSE' })}
              className="clay-btn bg-slate-100 px-3 py-1 text-xs font-black text-slate-800 hover:bg-slate-200"
            >
              {state.paused ? '▶ Resume' : '⏸ Pause'}
            </button>

            {state.screen === 'round' && (
              <button
                onClick={() =>
                  dispatch({ type: 'COMPLETE_ROUND', round: state.currentRound })
                }
                className="clay-btn bg-slate-100 px-3 py-1 text-xs font-black text-slate-800 hover:bg-slate-200"
                title={`Skip ${ROUNDS[state.currentRound].title}`}
              >
                ⏭ Skip
              </button>
            )}

            <button
              onClick={() => dispatch({ type: 'GO_TO', screen: 'map' })}
              className="clay-btn bg-slate-100 px-3 py-1 text-xs font-black text-slate-800 hover:bg-slate-200"
            >
              🗺 Map
            </button>

            <button
              onClick={() => dispatch({ type: 'TOGGLE_MUTE' })}
              className="clay-btn bg-slate-100 px-3 py-1 text-xs font-black text-slate-800 hover:bg-slate-200"
            >
              {state.muted ? '🔇' : '🔊'}
            </button>

            <button
              onClick={() => {
                if (window.confirm('Restart the whole game? Both scores go back to zero.')) {
                  dispatch({ type: 'RESTART' })
                }
              }}
              className="clay-btn bg-rose-50 px-3 py-1 text-xs font-black text-rose-600 hover:bg-rose-100"
            >
              ↺ Reset
            </button>
          </>
        )}
      </div>
    </div>
  )
}
