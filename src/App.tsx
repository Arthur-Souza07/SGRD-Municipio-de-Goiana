import { useState } from 'react'
import Login from './Login'
import Register from './Register'

// As duas telas possíveis
type Screen = 'login' | 'register'

function App() {
  // Guarda qual tela está aberta (começa no login)
  const [screen, setScreen] = useState<Screen>('login')

  // Troca de tela e volta para o topo da página
  function goTo(next: Screen) {
    setScreen(next)
    window.scrollTo({ top: 0 })
  }

  if (screen === 'register') {
    return <Register onBackToLogin={() => goTo('login')} />
  }

  return <Login onRequestAccess={() => goTo('register')} />
}

export default App