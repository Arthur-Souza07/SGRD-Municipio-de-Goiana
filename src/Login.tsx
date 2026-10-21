import { FormEvent, useState } from 'react'
import './Login.css'

type LoginCredentials = {
  username: string
  password: string
  remember: boolean
}

type LoginProps = {
  // Conecte este callback à autenticação real quando a API estiver disponível.
  onLogin?: (credentials: LoginCredentials) => void
  onForgotPassword?: () => void
  onRequestAccess?: () => void
}

function LockIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <rect x="4" y="10" width="16" height="11" rx="2" />
      <path d="M8 10V7a4 4 0 0 1 8 0v3" />
    </svg>
  )
}

function EyeIcon({ hidden }: { hidden: boolean }) {
  return hidden ? (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M3 3 21 21M10.6 10.6a2 2 0 0 0 2.8 2.8" />
      <path d="M9.9 5.2A10.8 10.8 0 0 1 12 5c5.5 0 9 7 9 7a14.8 14.8 0 0 1-3.1 3.8M6.2 6.2C4.1 7.5 3 12 3 12s3.5 7 9 7a9.7 9.7 0 0 0 3-.5" />
    </svg>
  ) : (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M3 12s3.5-7 9-7 9 7 9 7-3.5 7-9 7-9-7-9-7Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  )
}

export default function Login({
  onLogin,
  onForgotPassword,
  onRequestAccess,
}: LoginProps) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [remember, setRemember] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [message, setMessage] = useState('')

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setMessage('')

    if (!username.trim() || !password) {
      setMessage('Informe sua matrícula ou e-mail e sua senha.')
      return
    }

    if (onLogin) {
      onLogin({ username: username.trim(), password, remember })
      return
    }

    setMessage('Interface pronta para integração com a autenticação do sistema.')
  }

  function handleForgotPassword() {
    if (onForgotPassword) {
      onForgotPassword()
      return
    }
    setMessage('A recuperação de acesso deverá ser disponibilizada pela coordenação.')
  }

  function handleRequestAccess() {
    if (onRequestAccess) {
      onRequestAccess()
      return
    }
    setMessage('Para solicitar acesso, entre em contato com a coordenação da Defesa Civil.')
  }

  return (
    <main className="agent-login">
      <div className="agent-login__content">
        <header className="agent-login__header">
          <p className="agent-login__eyebrow">CONTA INSTITUCIONAL</p>
          <h1>Login do agente</h1>
          <p className="agent-login__description">
            Entre no ambiente de campo para cadastrar famílias pela Defesa Civil de Goiana.
          </p>
        </header>

        <div className="agent-login__layout">
          <form className="agent-login__card" onSubmit={handleSubmit} noValidate>
            <h2>Acesse sua conta</h2>

            <label className="agent-login__field">
              <span>Matrícula ou e-mail institucional</span>
              <input
                type="text"
                name="username"
                autoComplete="username"
                placeholder="Informe sua matrícula ou e-mail"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                aria-label="Matrícula ou e-mail institucional"
              />
            </label>

            <label className="agent-login__field">
              <span>Senha</span>
              <span className="agent-login__password">
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  autoComplete="current-password"
                  placeholder="Digite sua senha"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  aria-label="Senha"
                />
                <button
                  className="agent-login__eye"
                  type="button"
                  onClick={() => setShowPassword((current) => !current)}
                  aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                >
                  <EyeIcon hidden={showPassword} />
                </button>
              </span>
            </label>

            <div className="agent-login__options">
              <label className="agent-login__remember">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(event) => setRemember(event.target.checked)}
                />
                <span>Mostrar senha</span>
              </label>
              <button className="agent-login__text-button" type="button" onClick={handleForgotPassword}>
                Recuperar acesso
              </button>
            </div>

            {message && <p className="agent-login__message" role="status">{message}</p>}

            <button className="agent-login__submit" type="submit">Entrar</button>

            <p className="agent-login__register">
              Ainda não tem conta?{' '}
              <button type="button" onClick={handleRequestAccess}>Solicitar cadastro</button>
            </p>
          </form>

          <aside className="agent-login__notice" aria-label="Aviso de acesso exclusivo">
            <div className="agent-login__notice-title">
              <span className="agent-login__notice-icon"><LockIcon /></span>
              <strong>Acesso exclusivo</strong>
            </div>
            <p>
              Somente agentes autorizados. Contas aguardando autorização precisam de habilitação da coordenação.
            </p>
          </aside>
        </div>
      </div>
    </main>
  )
}
