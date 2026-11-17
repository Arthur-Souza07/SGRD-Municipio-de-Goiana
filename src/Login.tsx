import { useState } from 'react'
import type { FormEvent } from 'react'
import './Login.css'
import {
  getDeviceId,
  isValidCpf,
  onlyDigits,
} from './utils/auth'
import { LockIcon, EyeIcon } from './utils/icons'

export type LoginCredentials = {
  identifier: string // RM ou CPF (só números, no caso do CPF)
  identifierType: 'cpf' | 'rm'
  password: string
  remember: boolean
  deviceId: string // identifica o aparelho
  deviceInfo: string // modelo/navegador, ajuda a coordenação
}

export type LoginProps = {
  // Conecte este callback à autenticação real quando a API estiver disponível.
  onLogin?: (credentials: LoginCredentials) => void
  onForgotPassword?: () => void
  onRequestAccess?: () => void
}

export default function Login({
  onLogin,
  onForgotPassword,
  onRequestAccess,
}: LoginProps) {
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [remember, setRemember] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [message, setMessage] = useState('')
  const [deviceId] = useState(getDeviceId)

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setMessage('')

    const value = identifier.trim()
    if (!value || !password) {
      setMessage('Informe seu RM ou CPF e sua senha.')
      return
    }

    // Se tiver 11 dígitos (mesmo com pontos/traço), tratamos como CPF.
    const digitsOnly = onlyDigits(value)
    const looksLikeCpf = digitsOnly.length === 11

    if (looksLikeCpf && !isValidCpf(digitsOnly)) {
      setMessage('CPF inválido. Confira os números digitados.')
      return
    }

    if (!looksLikeCpf && digitsOnly.length < 3) {
      // Ajuste esta regra para o formato real do RM de vocês
      setMessage('RM inválido. Confira o número digitado.')
      return
    }

    if (onLogin) {
      onLogin({
        identifier: looksLikeCpf ? digitsOnly : value,
        identifierType: looksLikeCpf ? 'cpf' : 'rm',
        password,
        remember,
        deviceId,
        deviceInfo: navigator.userAgent,
      })
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
    <div className="agent-page">
      <header className="agent-site-header">
        <div className="agent-site-header__brand">
          <span className="agent-site-header__org">Prefeitura de Goiana</span>
          <strong className="agent-site-header__name">Defesa Civil</strong>
          <span className="agent-site-header__tagline">Acesso institucional · missão em campo</span>
        </div>
        <span className="agent-site-header__role">Agente de Campo</span>
      </header>

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
                <span>RM ou CPF</span>
                <input
                  type="text"
                  name="username"
                  inputMode="text"
                  autoComplete="username"
                  autoCapitalize="none"
                  autoCorrect="off"
                  placeholder="Informe seu RM ou CPF"
                  value={identifier}
                  onChange={(event) => setIdentifier(event.target.value)}
                  aria-label="RM ou CPF"
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
                  <span>Manter conectado neste dispositivo</span>
                </label>
                <button className="agent-login__text-button" type="button" onClick={handleForgotPassword}>
                  Recuperar acesso
                </button>
              </div>

              {message && <p className="agent-login__message" role="status">{message}</p>}

              <button className="agent-login__submit" type="submit">Entrar</button>

              <p className="agent-login__device">
                Dispositivo: <strong>{deviceId.slice(-8).toUpperCase()}</strong>
              </p>

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
                Somente agentes autorizados da Defesa Civil. Sua conta e este dispositivo
                precisam ser habilitados pela coordenação antes do primeiro acesso.
              </p>
            </aside>
          </div>
        </div>
      </main>

      <footer className="agent-site-footer">
        <p>Prefeitura de Goiana · Defesa Civil</p>
        <p>© {new Date().getFullYear()} Prefeitura de Goiana. Todos os direitos reservados.</p>
      </footer>
    </div>
  )
}