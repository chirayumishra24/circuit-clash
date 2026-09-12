import { useEffect, useState } from 'react'
import { useGame } from '../context/GameContext'

export function ArcadeUtilityBar() {
  const { state, dispatch } = useGame()
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [showControls, setShowControls] = useState(false)

  useEffect(() => {
    const onFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }
    document.addEventListener('fullscreenchange', onFullscreenChange)
    return () => document.removeEventListener('fullscreenchange', onFullscreenChange)
  }, [])

  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen()
      } else {
        await document.exitFullscreen()
      }
    } catch (err) {
      console.error('Fullscreen toggle error:', err)
    }
  }

  return (
    <>
      {/* Top Left Stage Back Pod */}
      {state.screen !== 'setup' && (
        <div className="fixed top-3 left-3 z-50 flex items-center gap-1.5 rounded-full border-2 border-slate-300 bg-white/95 p-1 shadow-md backdrop-blur-xs">
          <button
            onClick={() => dispatch({ type: 'GO_BACK' })}
            className="clay-btn flex items-center gap-1.5 rounded-full bg-slate-100 hover:bg-slate-200 px-3.5 py-1 text-xs font-black text-slate-900 transition cursor-pointer shadow-xs"
            title={
              state.screen === 'round'
                ? 'Go back to Tournament Board (keeps scores)'
                : state.screen === 'map'
                  ? 'Go back to Team Setup'
                  : state.screen === 'win'
                    ? 'Go back to Tournament Board'
                    : 'Go back to Champion Screen'
            }
          >
            <span className="text-sm font-black">←</span>
            <span>
              {state.screen === 'round'
                ? 'Back to Board'
                : state.screen === 'map'
                  ? 'Back to Setup'
                  : state.screen === 'win'
                    ? 'Back to Board'
                    : 'Back to Winners'}
            </span>
          </button>
        </div>
      )}

      {/* Top Right Arcade Pod */}
      <div className="fixed top-3 right-3 z-50 flex items-center gap-1.5 rounded-full border-2 border-slate-300 bg-white/95 p-1 shadow-md backdrop-blur-xs">
        {/* Audio Mute Toggle */}
        <button
          onClick={() => dispatch({ type: 'TOGGLE_MUTE' })}
          className="clay-btn flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 hover:bg-slate-200 text-sm font-black text-slate-800 transition cursor-pointer"
          title={state.muted ? 'Unmute Sound FX' : 'Mute Sound FX'}
        >
          {state.muted ? '🔇' : '🔊'}
        </button>

        {/* Keyboard Shortcuts Modal Button */}
        <button
          onClick={() => setShowControls(true)}
          className="clay-btn flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 hover:bg-slate-200 font-display text-xs font-black text-slate-800 transition cursor-pointer"
          title="Keyboard Controls & Rules Guide"
        >
          ?
        </button>

        <div className="h-4 w-px bg-slate-200" />

        {/* Fullscreen Button */}
        <button
          onClick={toggleFullscreen}
          className="clay-btn flex items-center gap-1 rounded-full bg-slate-100 hover:bg-slate-200 px-3 py-1 text-xs font-black text-slate-900 transition cursor-pointer"
          title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
        >
          <span className="text-sm">{isFullscreen ? '🗗' : '⛶'}</span>
          <span>{isFullscreen ? 'Exit' : 'Fullscreen'}</span>
        </button>
      </div>

      {/* Controls & Shortcuts Cheatsheet Modal */}
      {showControls && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="clay-chassis pop-in w-full max-w-lg border-3 border-slate-200 bg-white p-7 shadow-2xl">
            <div className="flex items-center justify-between border-b-2 border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="text-2xl">🎮</span>
                <h3 className="font-display text-2xl font-black text-slate-900">Game Show Controls</h3>
              </div>
              <button
                onClick={() => setShowControls(false)}
                className="clay-btn flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 hover:bg-slate-200 text-xs font-black text-slate-700 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="mt-4 space-y-3">
              <div className="rounded-2xl border-2 border-amber-300 bg-amber-50/80 p-3.5 flex items-center justify-between">
                <div>
                  <div className="font-display text-base font-black text-amber-950">Team Volt Buzzer</div>
                  <div className="text-xs font-bold text-amber-800">Tap on-screen Left Buzzer (or press [A])</div>
                </div>
                <div className="rounded-xl border-2 border-amber-400 bg-amber-500 px-3 py-1 font-display text-sm font-black text-white shadow-md">
                  TOUCH / [A]
                </div>
              </div>

              <div className="rounded-2xl border-2 border-cyan-300 bg-cyan-50/80 p-3.5 flex items-center justify-between">
                <div>
                  <div className="font-display text-base font-black text-cyan-950">Team Ampere Buzzer</div>
                  <div className="text-xs font-bold text-cyan-800">Tap on-screen Right Buzzer (or press [L])</div>
                </div>
                <div className="rounded-xl border-2 border-cyan-500 bg-cyan-600 px-3 py-1 font-display text-sm font-black text-white shadow-md">
                  TOUCH / [L]
                </div>
              </div>

              <div className="rounded-2xl border-2 border-slate-200 bg-slate-50 p-3.5">
                <div className="font-display text-sm font-black text-slate-900">Sorting Belt Keys (Round 4)</div>
                <div className="mt-2 grid grid-cols-3 gap-2 text-center text-xs font-black">
                  <div className="rounded-xl border border-emerald-300 bg-emerald-50 py-1.5 text-emerald-950">
                    <kbd className="bg-emerald-600 text-white px-2 py-0.5 rounded-md">↑</kbd> Conductor
                  </div>
                  <div className="rounded-xl border border-amber-300 bg-amber-50 py-1.5 text-amber-950">
                    <kbd className="bg-amber-600 text-white px-2 py-0.5 rounded-md">↓</kbd> Insulator
                  </div>
                  <div className="rounded-xl border border-slate-300 bg-white py-1.5 text-slate-800">
                    <kbd className="bg-slate-700 text-white px-2 py-0.5 rounded-md">Space</kbd> Test (−3s)
                  </div>
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowControls(false)}
              className="clay-btn mt-6 w-full bg-slate-900 py-3 text-sm font-black text-white hover:bg-slate-800 cursor-pointer shadow-md"
            >
              Got It, Back to The Game! ⚡
            </button>
          </div>
        </div>
      )}
    </>
  )
}
