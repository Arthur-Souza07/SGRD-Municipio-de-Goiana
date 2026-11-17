import { useState } from 'react'
import Login, { type LoginCredentials } from './Login'
import Register, { type RegisterData } from './Register'

// As duas telas possíveis
type Screen = 'login' | 'register'

// Mock handler para visualizar dados do cadastro no console/alert
function handleRegister(data: RegisterData): Promise<void> {
  console.log('=== DADOS ENVIADOS PARA CADASTRO ===')
  console.table(data)
  alert(`Cadastro enviado!\n\n${JSON.stringify(data, null, 2)}`)
  // Simula delay de rede
  return new Promise<void>(resolve => setTimeout(resolve, 500))
}

// Mock handler para visualizar login
function handleLogin(creds: LoginCredentials): Promise<void> {
  console.log('=== LOGIN ENVIADO ===')
  console.table(creds)
  alert(`Login tentado:\n${creds.identifierType.toUpperCase()}: ${creds.identifier}`)
  return new Promise<void>(resolve => setTimeout(resolve, 500))
}

function App() {
  // Guarda qual tela está aberta (começa no login)
  const [screen, setScreen] = useState<Screen>('login')

  // Troca de tela e volta para o topo da página
  function goTo(next: Screen) {
    setScreen(next)
    // Usa setTimeout para garantir que o scroll aconteça depois que o React
    // terminar de renderizar a nova tela (state flush + commit)
    setTimeout(() => window.scrollTo({ top: 0 }), 0)
  }

  if (screen === 'register') {
    return <Register onBackToLogin={() => goTo('login')} onRegister={handleRegister} />
  }

  return <Login onRequestAccess={() => goTo('register')} onLogin={handleLogin} />
}

export default App