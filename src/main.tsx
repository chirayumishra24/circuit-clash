import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'
import { GameProvider } from './context/GameContext'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <GameProvider>
      <App />
    </GameProvider>
  </StrictMode>,
)

const hotMeta = import.meta as unknown as { hot?: { accept: (cb: () => void) => void } }
if (hotMeta.hot) {
  hotMeta.hot.accept(() => {
    window.location.reload()
  })
}
