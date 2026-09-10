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

  // Round Tip Pop-up State
  const [isTipExpanded, setIsTipExpanded] = useState(true)
  const [activeTipRound, setActiveTipRound] = useState<RoundId>('loop')
  const prevRound = useRef<RoundId | null>(null)

  const voltStreak = state.teams.volt.streak
  const ampStreak = state.teams.ampere.streak
  const hasSurge = state.teams.volt.activeSurge || state.teams.ampere.activeSurge

  // Auto-pop the round tip whenever a new round starts or screen switches to round
  useEffect(() => {
    if (state.screen === 'round') {
      setActiveTipRound(state.currentRound)
      if (prevRound.current !== state.currentRound) {
        setIsTipExpanded(true)
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

  const currentTip = ROUND_TIPS[activeTipRound] || ROUND_TIPS.loop

  const cycleNextRoundTip = () => {
    const roundIds: RoundId[] = ['loop', 'build', 'ammeter', 'belt', 'sabotage', 'lightning']
    const idx = roundIds.indexOf(activeTipRound)
    const nextId = roundIds[(idx + 1) % roundIds.length]
    setActiveTipRound(nextId)
    setIsTipExpanded(true)
  }

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

      {/* 2. Round-by-Round Rick & Morty Science Tip Card */}
      {state.screen !== 'setup' && (
        <div className="fixed bottom-4 left-5 z-40 max-w-md select-none transition-all">
          {isTipExpanded ? (
            /* Expanded Full Tip Card */
            <div className="rise-in clay-card relative flex items-start gap-3.5 bg-white/98 p-4 rounded-3xl border-3 border-emerald-400 shadow-2xl">
              {/* Character Avatar with Badge */}
              <div className="relative shrink-0">
                <img
                  src={currentTip.image}
                  alt={currentTip.character}
                  className="h-20 w-20 rounded-2xl object-cover border-2 border-slate-900 shadow-md"
                />
                <span className="absolute -top-2 -left-1 rounded-full bg-emerald-600 px-2 py-0.5 text-[9px] font-black uppercase text-white shadow-sm">
                  {currentTip.badge}
                </span>
              </div>

              {/* Tip Content */}
              <div className="min-w-0 flex-1 pr-4">
                <div className="flex items-center justify-between gap-1">
                  <span className="font-display text-[11px] font-black uppercase tracking-wider text-emerald-800">
                    🔬 {currentTip.title}
                  </span>
                </div>
                <p className="mt-1 text-xs font-bold text-slate-900 leading-snug">
                  {currentTip.tip}
                </p>
                <div className="mt-2.5 flex items-center gap-3">
                  <button
                    type="button"
                    onClick={cycleNextRoundTip}
                    className="clay-btn bg-emerald-100 hover:bg-emerald-200 px-2.5 py-1 rounded-xl text-[10px] font-black text-emerald-900 transition cursor-pointer"
                  >
                    Next Lab Tip ↻
                  </button>
                  <span className="text-[10px] font-bold text-slate-400">
                    {currentTip.character}
                  </span>
                </div>
              </div>

              {/* Dismiss / Minimize Button */}
              <button
                type="button"
                onClick={() => setIsTipExpanded(false)}
                className="absolute top-3 right-3 text-slate-400 hover:text-slate-800 text-sm font-black p-1 cursor-pointer transition"
                title="Minimize Tip"
              >
                ✕
              </button>
            </div>
          ) : (
            /* Minimized Pill Mascot Icon */
            <button
              type="button"
              onClick={() => setIsTipExpanded(true)}
              className="pop-in clay-btn flex items-center gap-2.5 rounded-full border-2 border-emerald-400 bg-white/95 px-3 py-1.5 shadow-lg hover:scale-105 transition cursor-pointer"
              title="Show Round Lab Tip"
            >
              <img
                src={currentTip.image}
                alt="Tip mascot"
                className="h-8 w-8 rounded-full object-cover border border-emerald-500 shadow-xs"
              />
              <span className="font-display text-xs font-black text-emerald-950">
                💡 {currentTip.character}'s Tip
              </span>
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
            </button>
          )}
        </div>
      )}
    </>
  )
}
