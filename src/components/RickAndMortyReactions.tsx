import { useEffect, useRef, useState } from 'react'
import { useGame } from '../context/GameContext'
import type { RoundId } from '../types'

interface RoundTip {
  roundId: RoundId
  character: string
  title: string
  image: string
  badge: string
  tip: string
  accentColor: string
}

const ROUND_TIPS: Record<RoundId, RoundTip> = {
  loop: {
    roundId: 'loop',
    character: 'Rick Sanchez',
    title: 'ROUND 1: CLOSED CIRCUIT LOOPS',
    image: '/assets/rick_and_morty/rick_close_loop.jpg',
    badge: '⚡ ZAP!',
    tip: '“Listen up, Morty! Electricity only flows when there is an unbroken, continuous loop from battery (+) to (-)! Rotate the tiles to bridge every single gap!”',
    accentColor: '#10b981',
  },
  build: {
    roundId: 'build',
    character: 'Rick Sanchez',
    title: 'ROUND 2: SERIES VS PARALLEL BLUEPRINT',
    image: '/assets/rick_and_morty/rick_blueprint.jpg',
    badge: '📐 SCHEMATIC',
    tip: '“Series circuits share voltage across bulbs and dim them down! Parallel circuits give EVERY branch full battery voltage! Check your target specs before wiring!”',
    accentColor: '#0284c7',
  },
  ammeter: {
    roundId: 'ammeter',
    character: 'Morty Smith',
    title: 'ROUND 3: AMMETERS GO IN SERIES',
    image: '/assets/rick_and_morty/morty_shock.jpg',
    badge: '⚠️ AW GEEZ!',
    tip: '“Aw geez, Rick says NEVER connect an ammeter straight across the battery! Ammeters have near-zero resistance and will short out! Always wire it IN-LINE (series)!”',
    accentColor: '#f59e0b',
  },
  belt: {
    roundId: 'belt',
    character: 'Rick & Morty',
    title: 'ROUND 4: CONDUCTORS VS INSULATORS',
    image: '/assets/rick_and_morty/rick_morty_bench.jpg',
    badge: '🔬 ELECTRONS',
    tip: '“Conductors like copper, aluminum, and brass have free sea of electrons that flow easily! Insulators like rubber and plastic block electron flow completely!”',
    accentColor: '#8b5cf6',
  },
  sabotage: {
    roundId: 'sabotage',
    character: 'Rick Sanchez',
    title: 'ROUND 5: CIRCUIT DIAGNOSTICS & REPAIR',
    image: '/assets/rick_and_morty/rick_repair.jpg',
    badge: '🔧 REPAIR',
    tip: '“Trace current step-by-step, Morty! Don’t guess blindly! Look for opened knife switches, short-circuited paths, and burnt bulb filaments!”',
    accentColor: '#ef4444',
  },
  lightning: {
    roundId: 'lightning',
    character: 'Rick Sanchez',
    title: 'ROUND 6: BUZZER LOCK-IN & FINAL WAGER',
    image: '/assets/rick_and_morty/rick_experiment.jpg',
    badge: '⚡ HIGH VOLTAGE',
    tip: '“Slap your on-screen team buzzer on the Smart Board to lock in first! Miss it, and opponents can steal! Save your stored charge for The Final Charge wager!”',
    accentColor: '#f59e0b',
  },
}

export function RickAndMortyReactions() {
  const { state } = useGame()
  const [activeReaction, setActiveReaction] = useState<{
    image: string
    title: string
    caption: string
  } | null>(null)

  // Round Tip Pop-up State (1 tip per round in center modal)
  const [isTipOpen, setIsTipOpen] = useState(true)
  const prevRound = useRef<RoundId | null>(null)

  const voltStreak = state.teams.volt.streak
  const ampStreak = state.teams.ampere.streak
  const hasSurge = state.teams.volt.activeSurge || state.teams.ampere.activeSurge

  // Auto-pop the round tip in center whenever a round starts
  useEffect(() => {
    if (state.screen === 'round') {
      if (prevRound.current !== state.currentRound) {
        setIsTipOpen(true)
        prevRound.current = state.currentRound
      }
    }
  }, [state.screen, state.currentRound])

  // Watch for Surge / Streak situational popups
  useEffect(() => {
    if (hasSurge || voltStreak >= 3 || ampStreak >= 3) {
      setActiveReaction({
        image: '/assets/rick_and_morty/rick_experiment.jpg',
        title: '⚡ 2× SURGE OVERLOAD!',
        caption: '“I turned myself into a high-voltage surge, Morty! 2X points!”',
      })
      const t = window.setTimeout(() => setActiveReaction(null), 4000)
      return () => window.clearTimeout(t)
    }
  }, [hasSurge, voltStreak, ampStreak])

  // Watch for Win Screen
  useEffect(() => {
    if (state.screen === 'win') {
      setActiveReaction({
        image: '/assets/rick_and_morty/rick_victory.jpg',
        title: '🏆 WUBBA LUBBA DUB DUB!',
        caption: '“Dimension C-137 Circuit Clash Champions!”',
      })
    }
  }, [state.screen])

  const currentTip = ROUND_TIPS[state.currentRound] || ROUND_TIPS.loop

  return (
    <>
      {/* 1. Situation Streak / Surge Toast */}
      {activeReaction && (
        <div className="fixed top-20 right-6 z-50 animate-bounce pointer-events-none">
          <div className="clay-chassis flex items-center gap-4 bg-white/95 p-4 pr-6 shadow-2xl border-4 border-amber-400 rounded-3xl max-w-md">
            <img
              src={activeReaction.image}
              alt="Rick & Morty Situation Reaction"
              className="h-24 w-24 rounded-2xl object-cover shadow-md border-2 border-slate-900 shrink-0"
            />
            <div>
              <div className="font-display text-lg font-black text-amber-950 leading-tight">
                {activeReaction.title}
              </div>
              <p className="mt-1 text-xs font-bold text-slate-800 leading-snug">
                {activeReaction.caption}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 2. Round-by-Round Rick & Morty Science Tip: 3D Centered Pop-up Modal */}
      {state.screen === 'round' && isTipOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 backdrop-blur-xs p-4 select-none">
          {/* 3D Clay Chassis Modal Card */}
          <div
            className="pop-in clay-chassis relative w-full max-w-xl bg-white p-6 sm:p-8 rounded-[36px] border-4 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.35),0_0_0_1px_rgba(255,255,255,0.9)] transition-all"
            style={{ borderColor: currentTip.accentColor }}
          >
            {/* 3D Cross Button */}
            <button
              type="button"
              onClick={() => setIsTipOpen(false)}
              className="clay-btn absolute -top-3.5 -right-3.5 flex h-10 w-10 items-center justify-center rounded-full bg-white text-slate-600 shadow-xl border-2 border-slate-300 hover:text-rose-600 hover:border-rose-400 hover:scale-110 active:scale-95 transition-all cursor-pointer z-10"
              title="Close Tip"
              aria-label="Close Tip"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Top Badge & Character Identity */}
            <div className="flex items-center gap-2 mb-4">
              <span
                className="rounded-full px-3 py-1 text-xs font-black uppercase text-white shadow-sm"
                style={{ backgroundColor: currentTip.accentColor }}
              >
                {currentTip.badge}
              </span>
              <span className="font-display text-xs font-black tracking-wider text-slate-500 uppercase">
                Dimension C-137 Lab Tip • {currentTip.character}
              </span>
            </div>

            {/* Content: Avatar & Tip Text */}
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
              <div className="relative shrink-0">
                <div
                  className="absolute -inset-1 rounded-3xl opacity-40 blur-sm"
                  style={{ backgroundColor: currentTip.accentColor }}
                />
                <img
                  src={currentTip.image}
                  alt={currentTip.character}
                  className="relative h-28 w-28 sm:h-32 sm:w-32 rounded-2xl object-cover border-3 border-slate-900 shadow-xl"
                />
              </div>

              <div className="flex-1 text-center sm:text-left min-w-0">
                <h3 className="font-display text-lg sm:text-xl font-black text-slate-900 leading-tight">
                  {currentTip.title}
                </h3>
                <p className="mt-3 text-sm sm:text-base font-bold text-slate-800 leading-relaxed bg-slate-50 p-4 rounded-2xl border border-slate-200/80 shadow-inner">
                  {currentTip.tip}
                </p>
              </div>
            </div>

            {/* Footer Action Button */}
            <div className="mt-6 flex items-center justify-end pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsTipOpen(false)}
                className="clay-btn px-6 py-2.5 rounded-full font-display text-sm font-black text-white shadow-lg hover:scale-105 active:scale-95 transition cursor-pointer flex items-center gap-2"
                style={{ backgroundColor: currentTip.accentColor }}
              >
                <span>Got it, let&apos;s experiment!</span>
                <span>⚡</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Minimized Pill to Re-open if closed */}
      {state.screen === 'round' && !isTipOpen && (
        <div className="fixed bottom-4 left-5 z-40 select-none">
          <button
            type="button"
            onClick={() => setIsTipOpen(true)}
            className="pop-in clay-btn flex items-center gap-2.5 rounded-full border-2 bg-white/95 px-3.5 py-1.5 shadow-lg hover:scale-105 transition cursor-pointer"
            style={{ borderColor: currentTip.accentColor }}
            title="Open Lab Tip"
          >
            <img
              src={currentTip.image}
              alt="Tip mascot"
              className="h-8 w-8 rounded-full object-cover border border-slate-800 shadow-xs"
            />
            <span className="font-display text-xs font-black text-slate-800">
              💡 {currentTip.character}&apos;s Tip
            </span>
          </button>
        </div>
      )}
    </>
  )
}
