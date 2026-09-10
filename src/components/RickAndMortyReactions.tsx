import { useEffect, useState } from 'react'
import { useGame } from '../context/GameContext'

const SCIENCE_QUOTES = [
  { char: 'Rick', text: '“Ohm’s Law, Morty! V = I × R! It’s the fundamental law of the universe!”' },
  { char: 'Morty', text: '“Aw geez, Rick! Don’t put the ammeter straight across the battery!”' },
  { char: 'Rick', text: '“Parallel branches get FULL voltage across every loop, you glip-glops!”' },
  { char: 'Morty', text: '“Aw man, conductors let current flow, but insulators block it completely!”' },
  { char: 'Rick', text: '“Wubba Lubba Dub Dub! That circuit was built with 100% pure genius!”' },
]

export function RickAndMortyReactions() {
  const { state } = useGame()
  const [activeReaction, setActiveReaction] = useState<{
    image: string
    title: string
    caption: string
    type: 'surge' | 'shock' | 'victory'
  } | null>(null)

  const [quoteIndex, setQuoteIndex] = useState(0)
  const [showMascot, setShowMascot] = useState(true)

  const voltStreak = state.teams.volt.streak
  const ampStreak = state.teams.ampere.streak
  const hasSurge = state.teams.volt.activeSurge || state.teams.ampere.activeSurge

  // Watch for game situations
  useEffect(() => {
    if (hasSurge || voltStreak >= 3 || ampStreak >= 3) {
      setActiveReaction({
        image: '/assets/rick_and_morty/rick_experiment.jpg',
        title: '⚡ 2× SURGE OVERLOAD!',
        caption: '“I turned myself into a high-voltage surge, Morty! 2X points!”',
        type: 'surge',
      })
      const t = window.setTimeout(() => setActiveReaction(null), 4500)
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
        type: 'victory',
      })
    }
  }, [state.screen])

  const nextQuote = () => {
    setQuoteIndex((prev) => (prev + 1) % SCIENCE_QUOTES.length)
  }

  const currentQuote = SCIENCE_QUOTES[quoteIndex]

  return (
    <>
      {/* 1. Situation Reaction Popup Toast */}
      {activeReaction && (
        <div className="fixed top-20 right-6 z-50 animate-bounce pointer-events-none">
          <div className="clay-chassis flex items-center gap-4 bg-white/95 p-4 pr-6 shadow-2xl border-4 border-amber-400 rounded-3xl max-w-md">
            <img
              src={activeReaction.image}
              alt="Rick and Morty Situation Reaction"
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

      {/* 2. Laboratory Assistant Mascot Card (Bottom Left, toggleable) */}
      {showMascot && state.screen !== 'setup' && (
        <div className="fixed bottom-14 left-6 z-40 hidden md:block">
          <div
            onClick={nextQuote}
            title="Click for Rick & Morty Science Advice"
            className="clay-card group relative flex items-center gap-3 bg-white/95 p-3 pr-4 rounded-3xl border-2 border-emerald-300 shadow-xl cursor-pointer transition-all hover:scale-105 active:scale-95 select-none max-w-sm"
          >
            <div className="relative shrink-0">
              <img
                src="/assets/rick_and_morty/rick_morty_bench.jpg"
                alt="Rick and Morty Lab"
                className="h-14 w-14 rounded-2xl object-cover border-2 border-emerald-500 shadow-sm"
              />
              <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 text-[10px] text-white font-black animate-ping" />
              <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 text-[10px] text-white font-black">
                💡
              </span>
            </div>

            <div className="min-w-0">
              <div className="flex items-center justify-between gap-1">
                <span className="font-display text-xs font-black uppercase tracking-wider text-emerald-800">
                  🔬 {currentQuote.char}'s Lab Note
                </span>
                <span className="text-[10px] text-slate-400 font-bold">TAP TO CYCLE</span>
              </div>
              <p className="mt-0.5 text-xs font-bold text-slate-800 truncate max-w-[200px]">
                {currentQuote.text}
              </p>
            </div>

            <button
              onClick={(e) => {
                e.stopPropagation()
                setShowMascot(false)
              }}
              className="text-slate-400 hover:text-slate-700 text-xs font-black px-1"
              title="Dismiss Mascot"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </>
  )
}
