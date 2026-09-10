import { useGame } from './context/GameContext'
import { HostBar } from './components/HostBar'
import { SetupScreen } from './screens/SetupScreen'
import { RoundMap } from './screens/RoundMap'
import { WinScreen } from './screens/WinScreen'
import { DebriefScreen } from './screens/DebriefScreen'
import { CloseTheLoop } from './rounds/CloseTheLoop'
import { SortingBelt } from './rounds/SortingBelt'
import { LightningRound } from './rounds/LightningRound'
import { BuildBattle } from './rounds/BuildBattle'
import { AmmeterShowdown } from './rounds/AmmeterShowdown'
import { SabotageRepair } from './rounds/SabotageRepair'
import { Circuit3DBackground } from './components/Circuit3DBackground'
import { ArcadeUtilityBar } from './components/ArcadeUtilityBar'
import { CelebrationToast } from './components/CelebrationToast'
import { RickAndMortyReactions } from './components/RickAndMortyReactions'
import { useBackgroundMusic } from './hooks/useBackgroundMusic'
import type { RoundId } from './types'

function Round({ id }: { id: RoundId }) {
  switch (id) {
    case 'loop':
      return <CloseTheLoop />
    case 'build':
      return <BuildBattle />
    case 'ammeter':
      return <AmmeterShowdown />
    case 'belt':
      return <SortingBelt />
    case 'sabotage':
      return <SabotageRepair />
    case 'lightning':
      return <LightningRound />
  }
}

export default function App() {
  const { state } = useGame()
  useBackgroundMusic()
  const key = state.screen === 'round' ? `round-${state.currentRound}` : state.screen

  return (
    <div className="relative h-full overflow-hidden">
      {/* Interactive 3D WebGL Circuit Trace Background */}
      <Circuit3DBackground />

      {/* Keyed on the screen so each one animates in. Deliberately a CSS animation and not
          an AnimatePresence transition: a stalled exit would leave the previous screen up on
          the projector, and a stalled entrance would leave it blank. */}
      <div key={key} className="rise-in relative z-10 h-full">
        {state.screen === 'setup' && <SetupScreen />}
        {state.screen === 'map' && <RoundMap />}
        {state.screen === 'round' && <Round id={state.currentRound} />}
        {state.screen === 'win' && <WinScreen />}
        {state.screen === 'debrief' && <DebriefScreen />}
      </div>

      {state.screen !== 'setup' && <HostBar />}
      <ArcadeUtilityBar />
      <CelebrationToast />
      <RickAndMortyReactions />
    </div>
  )
}
