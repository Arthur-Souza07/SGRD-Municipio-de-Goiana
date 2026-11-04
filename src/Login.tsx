import { FormEvent, useState } from 'react'
import './Login.css'

type LoginCredentials = {
  identifier: string // RM ou CPF (só números, no caso do CPF)
  identifierType: 'cpf' | 'rm'
  password: string
  remember: boolean
  deviceId: string // identifica o aparelho
  deviceInfo: string // modelo/navegador, ajuda a coordenação
}

type LoginProps = {
  // Conecte este callback à autenticação real quando a API estiver disponível.
  onLogin?: (credentials: LoginCredentials) => void
  onForgotPassword?: () => void
  onRequestAccess?: () => void
}

// Gera um ID único na primeira vez e reaproveita nas próximas
function getDeviceId(): string {
  const key = 'agent-device-id'
  try {
    let id = localStorage.getItem(key)
    if (!id) {
      id = crypto.randomUUID()
      localStorage.setItem(key, id)
    }
    return id
  } catch {
    return 'indisponivel'
  }
}

// Validação padrão de CPF (dígitos verificadores)
function isValidCpf(cpf: string): boolean {
  if (cpf.length !== 11 || /^(\d)\1+$/.test(cpf)) return false

  const calcDigit = (base: string, factor: number) => {
    let sum = 0
    for (const digit of base) {
      sum += Number(digit) * factor--
    }
    const rest = (sum * 10) % 11
    return rest === 10 ? 0 : rest
  }

  const d1 = calcDigit(cpf.slice(0, 9), 10)
  const d2 = calcDigit(cpf.slice(0, 10), 11)
  return d1 === Number(cpf[9]) && d2 === Number(cpf[10])
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
    const onlyDigits = value.replace(/\D/g, '')
    const looksLikeCpf = onlyDigits.length === 11

    if (looksLikeCpf && !isValidCpf(onlyDigits)) {
      setMessage('CPF inválido. Confira os números digitados.')
      return
    }

    if (!looksLikeCpf && value.length < 3) {
      // Ajuste esta regra para o formato real do RM de vocês
      setMessage('RM inválido. Confira o número digitado.')
      return
    }

    if (onLogin) {
      onLogin({
        identifier: looksLikeCpf ? onlyDigits : value,
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
  )
}