import { FormEvent, ReactNode, useState } from 'react'
import './Login.css' // estilos compartilhados: cabeçalho, rodapé, campos, botões
import './Register.css' // estilos exclusivos desta tela

/* ============================================================
   TIPOS (descrevem o formato dos dados)
   ============================================================ */

// Dados que serão enviados para o sistema quando a API existir
type RegisterData = {
  fullName: string
  registration: string // matrícula funcional (RM)
  cpf: string // só números
  unit: string // unidade ou órgão
  email: string
  phone: string // só números (opcional)
  password: string
  deviceId: string // identifica o aparelho, para a coordenação autorizar
  deviceInfo: string // modelo/navegador do aparelho
}

type RegisterProps = {
  // Conecte este callback ao envio real quando a API estiver disponível.
  onRegister?: (data: RegisterData) => void
  // Chamado ao clicar em "Acessar login" (volta para a tela de login)
  onBackToLogin?: () => void
}

// Valores digitados nos campos (todos em texto, como o usuário digita)
type FormValues = {
  fullName: string
  registration: string
  cpf: string
  unit: string
  email: string
  phone: string
  password: string
  confirmPassword: string
}

// Mensagem de erro de cada campo (só existe quando há erro)
type FormErrors = Partial<Record<keyof FormValues | 'consent', string>>

// Estado inicial: todos os campos vazios
const emptyForm: FormValues = {
  fullName: '',
  registration: '',
  cpf: '',
  unit: '',
  email: '',
  phone: '',
  password: '',
  confirmPassword: '',
}

/* ============================================================
   FUNÇÕES AUXILIARES (mesma lógica usada no Login)
   ============================================================ */

// Gera um ID único do aparelho na primeira vez e reaproveita depois
function getDeviceId(): string {
  const key = 'agent-device-id'
  try {
    let id = localStorage.getItem(key)
    if (!id) {
      id = crypto.randomUUID() // só funciona em HTTPS ou localhost
      localStorage.setItem(key, id)
    }
    return id
  } catch {
    return 'indisponivel'
  }
}

// Remove tudo que não for número ("123.456-78" vira "12345678")
function onlyDigits(value: string): string {
  return value.replace(/\D/g, '')
}

// Validação de CPF pelos dígitos verificadores
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

// Máscara de CPF enquanto o usuário digita: 000.000.000-00
function formatCpf(value: string): string {
  return onlyDigits(value)
    .slice(0, 11)
    .replace(/^(\d{3})(\d)/, '$1.$2')
    .replace(/^(\d{3})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1-$2')
}

// Máscara de telefone enquanto digita: (81) 99999-9999
function formatPhone(value: string): string {
  const d = onlyDigits(value).slice(0, 11)
  if (d.length <= 2) return d
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`
}

// Verificação simples de e-mail: algo@algo.algo
function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

/* ============================================================
   ÍCONES (SVG simples)
   ============================================================ */

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

function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M5 12.5 10 17.5 19 7.5" />
    </svg>
  )
}

/* ============================================================
   COMPONENTE DE CAMPO (evita repetir o mesmo bloco várias vezes)
   Mostra: rótulo + campo + dica ou mensagem de erro
   ============================================================ */

type TextFieldProps = {
  label: string
  name: string
  value: string
  onChange: (value: string) => void
  error?: string // se existir, o campo fica vermelho e mostra a mensagem
  hint?: string // texto de ajuda (some quando há erro)
  required?: boolean // mostra o asterisco *
  optional?: boolean // mostra "(opcional)"
  type?: string
  placeholder?: string
  autoComplete?: string
  inputMode?: 'text' | 'numeric' | 'email' | 'tel'
  className?: string // ex.: "agent-register__full" ocupa a linha toda
  trailing?: ReactNode // elemento dentro do campo, à direita (ex.: botão do olho)
}

function TextField({
  label,
  name,
  value,
  onChange,
  error,
  hint,
  required,
  optional,
  type = 'text',
  placeholder,
  autoComplete,
  inputMode,
  className = '',
  trailing,
}: TextFieldProps) {
  const input = (
    <input
      type={type}
      name={name}
      value={value}
      placeholder={placeholder}
      autoComplete={autoComplete}
      inputMode={inputMode}
      aria-invalid={Boolean(error)}
      onChange={(event) => onChange(event.target.value)}
    />
  )

  return (
    <label className={`agent-login__field ${className}`}>
      <span>
        {label}
        {required && ' *'}
        {optional && <span className="agent-register__optional"> (opcional)</span>}
      </span>

      {/* Se tiver "trailing", o campo ganha um espaço à direita para o botão */}
      {trailing ? (
        <span className="agent-login__password">
          {input}
          {trailing}
        </span>
      ) : (
        input
      )}

      {hint && !error && <small className="agent-register__hint">{hint}</small>}
      {error && (
        <small className="agent-register__error" role="alert">
          {error}
        </small>
      )}
    </label>
  )
}

/* ============================================================
   TELA DE CADASTRO
   ============================================================ */

export default function Register({ onRegister, onBackToLogin }: RegisterProps) {
  // Estados (memória da tela)
  const [values, setValues] = useState<FormValues>(emptyForm) // o que foi digitado
  const [errors, setErrors] = useState<FormErrors>({}) // erros de cada campo
  const [consent, setConsent] = useState(false) // checkbox de privacidade
  const [showPasswords, setShowPasswords] = useState(false) // mostrar/ocultar senhas
  const [formMessage, setFormMessage] = useState('') // aviso geral acima do botão
  const [submitted, setSubmitted] = useState(false) // true depois de enviar
  const [deviceId] = useState(getDeviceId) // ID do aparelho

  // Atualiza UM campo e limpa o erro dele (o resto continua igual)
  function updateField(name: keyof FormValues, value: string) {
    setValues((current) => ({ ...current, [name]: value }))
    setErrors((current) => ({ ...current, [name]: undefined }))
  }

  // Confere todos os campos e devolve a lista de erros encontrados
  function validate(): FormErrors {
    const newErrors: FormErrors = {}

    // Nome: pelo menos duas palavras (nome e sobrenome)
    if (values.fullName.trim().split(/\s+/).length < 2) {
      newErrors.fullName = 'Informe seu nome completo (nome e sobrenome).'
    }

    if (!values.registration.trim()) {
      newErrors.registration = 'Informe sua matrícula funcional.'
    }

    if (!isValidCpf(onlyDigits(values.cpf))) {
      newErrors.cpf = 'Informe um CPF válido.'
    }

    if (!values.unit.trim()) {
      newErrors.unit = 'Informe a unidade ou órgão.'
    }

    // Se houver domínio institucional (ex.: @orgao.gov.br), valide aqui
    if (!isValidEmail(values.email.trim())) {
      newErrors.email = 'Informe um e-mail válido.'
    }

    // Telefone é opcional, mas se preenchido precisa estar completo (DDD + número)
    const phoneDigits = onlyDigits(values.phone)
    if (phoneDigits && phoneDigits.length < 10) {
      newErrors.phone = 'Telefone incompleto. Use DDD + número.'
    }

    // Senha: mínimo de 8 caracteres, com letras e números
    if (
      values.password.length < 8 ||
      !/[A-Za-z]/.test(values.password) ||
      !/\d/.test(values.password)
    ) {
      newErrors.password = 'Use pelo menos 8 caracteres, com letras e números.'
    }

    if (values.confirmPassword !== values.password || !values.confirmPassword) {
      newErrors.confirmPassword = 'As senhas não são iguais.'
    }

    if (!consent) {
      newErrors.consent = 'É necessário aceitar para continuar.'
    }

    return newErrors
  }

  // Roda quando o usuário clica em "Solicitar cadastro"
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault() // impede a página de recarregar
    setFormMessage('')

    const newErrors = validate()
    setErrors(newErrors)

    // Se existe algum erro, para aqui e avisa o usuário
    if (Object.keys(newErrors).length > 0) {
      setFormMessage('Revise os campos destacados antes de enviar.')
      return
    }

    // Tudo certo: monta os dados (já "limpos") para enviar
    const data: RegisterData = {
      fullName: values.fullName.trim(),
      registration: values.registration.trim(),
      cpf: onlyDigits(values.cpf),
      unit: values.unit.trim(),
      email: values.email.trim().toLowerCase(),
      phone: onlyDigits(values.phone),
      password: values.password,
      deviceId,
      deviceInfo: navigator.userAgent,
    }

    // Com a API pronta, aqui você esperaria a resposta e trataria erros.
    // A senha deve ser guardada com hash no servidor, nunca em texto puro.
    onRegister?.(data)
    setSubmitted(true)
    window.scrollTo({ top: 0 })
  }

  return (
    <div className="agent-page">
      {/* ---------- Cabeçalho institucional (igual ao do login) ---------- */}
      <header className="agent-site-header">
        <div className="agent-site-header__brand">
          <span className="agent-site-header__org">Prefeitura de Goiana</span>
          <strong className="agent-site-header__name">Defesa Civil</strong>
          <span className="agent-site-header__tagline">Acesso institucional · missão em campo</span>
        </div>
        <span className="agent-site-header__role">Agente de Campo</span>
      </header>

      <main className="agent-login agent-register">
        <div className="agent-register__content">
          {/* ---------- Título da página ---------- */}
          <header className="agent-login__header">
            <p className="agent-login__eyebrow">CONTA INSTITUCIONAL</p>
            <h1>Cadastro de agente de campo</h1>
            <p className="agent-login__description">
              Solicite sua conta para atuar pela Defesa Civil de Goiana. Este formulário não
              é o cadastro de famílias.
            </p>
            <p className="agent-register__required-note">Os campos com * são obrigatórios.</p>
          </header>

          {submitted ? (
            /* ---------- Tela de sucesso (depois de enviar) ---------- */
            <div className="agent-login__card agent-register__success">
              <span className="agent-register__success-icon">
                <CheckIcon />
              </span>
              <h2>Solicitação enviada</h2>
              <p>
                A coordenação da Defesa Civil vai analisar seus dados e o seu dispositivo.
                Você só poderá entrar depois da habilitação.
              </p>
              <p className="agent-login__device">
                Código do dispositivo: <strong>{deviceId.slice(-8).toUpperCase()}</strong>
              </p>
              <button className="agent-login__submit" type="button" onClick={onBackToLogin}>
                Voltar para o login
              </button>
            </div>
          ) : (
            /* ---------- Formulário ---------- */
            <form className="agent-login__card" onSubmit={handleSubmit} noValidate>
              {/* Seção 1: identificação */}
              <section className="agent-register__section">
                <h3>Identificação institucional</h3>
                <div className="agent-register__grid">
                  <TextField
                    className="agent-register__full"
                    label="Nome completo"
                    name="fullName"
                    required
                    autoComplete="name"
                    placeholder="Informe seu nome completo"
                    value={values.fullName}
                    onChange={(value) => updateField('fullName', value)}
                    error={errors.fullName}
                  />
                  <TextField
                    label="Matrícula funcional (RM)"
                    name="registration"
                    required
                    autoComplete="off"
                    placeholder="Informe sua matrícula"
                    value={values.registration}
                    onChange={(value) => updateField('registration', value)}
                    error={errors.registration}
                  />
                  <TextField
                    label="CPF"
                    name="cpf"
                    required
                    inputMode="numeric"
                    autoComplete="off"
                    placeholder="000.000.000-00"
                    value={values.cpf}
                    onChange={(value) => updateField('cpf', formatCpf(value))}
                    error={errors.cpf}
                  />
                  <TextField
                    className="agent-register__full"
                    label="Unidade ou órgão"
                    name="unit"
                    required
                    placeholder="Ex.: Defesa Civil de Goiana"
                    value={values.unit}
                    onChange={(value) => updateField('unit', value)}
                    error={errors.unit}
                  />
                </div>
              </section>

              {/* Seção 2: contato */}
              <section className="agent-register__section">
                <h3>Contato institucional</h3>
                <div className="agent-register__grid">
                  <TextField
                    label="E-mail institucional"
                    name="email"
                    type="email"
                    required
                    inputMode="email"
                    autoComplete="email"
                    placeholder="nome@orgao.gov.br"
                    hint="Use o e-mail da instituição, para a coordenação confirmar quem é você."
                    value={values.email}
                    onChange={(value) => updateField('email', value)}
                    error={errors.email}
                  />
                  <TextField
                    label="Telefone de contato"
                    name="phone"
                    optional
                    inputMode="tel"
                    autoComplete="tel"
                    placeholder="(81) 90000-0000"
                    value={values.phone}
                    onChange={(value) => updateField('phone', formatPhone(value))}
                    error={errors.phone}
                  />
                </div>
              </section>

              {/* Seção 3: senha */}
              <section className="agent-register__section">
                <h3>Crie suas credenciais</h3>
                <div className="agent-register__grid">
                  <TextField
                    label="Senha"
                    name="password"
                    required
                    type={showPasswords ? 'text' : 'password'}
                    autoComplete="new-password"
                    placeholder="Crie uma senha"
                    hint="Mínimo de 8 caracteres, com letras e números."
                    value={values.password}
                    onChange={(value) => updateField('password', value)}
                    error={errors.password}
                    trailing={
                      // Botão do olho: mostra ou oculta as DUAS senhas
                      <button
                        className="agent-login__eye"
                        type="button"
                        onClick={() => setShowPasswords((current) => !current)}
                        aria-label={showPasswords ? 'Ocultar senhas' : 'Mostrar senhas'}
                      >
                        <EyeIcon hidden={showPasswords} />
                      </button>
                    }
                  />
                  <TextField
                    label="Confirmar senha"
                    name="confirmPassword"
                    required
                    type={showPasswords ? 'text' : 'password'}
                    autoComplete="new-password"
                    placeholder="Repita a senha"
                    value={values.confirmPassword}
                    onChange={(value) => updateField('confirmPassword', value)}
                    error={errors.confirmPassword}
                  />
                </div>
              </section>

              {/* Seção 4: aviso sobre a habilitação */}
              <section className="agent-register__section">
                <div className="agent-login__notice" role="note">
                  <div className="agent-login__notice-title">
                    <span className="agent-login__notice-icon">
                      <LockIcon />
                    </span>
                    <strong>Habilitação pela coordenação</strong>
                  </div>
                  <p>
                    Esta solicitação ficará em análise. Sua conta e o dispositivo usado precisam
                    ser aprovados pela coordenação antes do primeiro acesso.
                  </p>
                </div>
              </section>

              {/* Seção 5: passo a passo */}
              <section className="agent-register__section">
                <h3>Como funciona</h3>
                <ol className="agent-register__steps">
                  <li className="agent-register__step">
                    <span className="agent-register__step-number">1</span>
                    <div>
                      <strong>Envio da solicitação</strong>
                      <p>Você preenche e envia este formulário à coordenação.</p>
                    </div>
                  </li>
                  <li className="agent-register__step">
                    <span className="agent-register__step-number">2</span>
                    <div>
                      <strong>Aguarde a autorização</strong>
                      <p>A coordenação confere seus dados e o dispositivo.</p>
                    </div>
                  </li>
                  <li className="agent-register__step">
                    <span className="agent-register__step-number">3</span>
                    <div>
                      <strong>Acesso após a habilitação</strong>
                      <p>Com a conta liberada, entre pelo login e cadastre famílias em campo.</p>
                    </div>
                  </li>
                </ol>
              </section>

              {/* Seção 6: privacidade e aceite */}
              <section className="agent-register__section">
                <h3>Privacidade e responsabilidade</h3>
                <p className="agent-register__text">
                  Seus dados serão usados pela Defesa Civil de Goiana para identificar o agente e
                  controlar o acesso ao cadastro de famílias. Você é responsável pelas informações
                  registradas com a sua conta.
                </p>

                {/* <details> abre e fecha sozinho, sem precisar de JavaScript */}
                <details className="agent-register__details">
                  <summary>Consultar aviso de privacidade</summary>
                  <p>Substitua este texto pelo aviso de privacidade oficial da Defesa Civil.</p>
                </details>

                <label className="agent-register__consent">
                  <input
                    type="checkbox"
                    checked={consent}
                    onChange={(event) => {
                      setConsent(event.target.checked)
                      setErrors((current) => ({ ...current, consent: undefined }))
                    }}
                  />
                  <span>
                    Li e aceito o aviso de privacidade e confirmo que sou o próprio agente
                    responsável por este cadastro.
                  </span>
                </label>
                {errors.consent && (
                  <small className="agent-register__error" role="alert">
                    {errors.consent}
                  </small>
                )}
              </section>

              {/* Aviso geral (aparece só quando há erro) */}
              {formMessage && (
                <p className="agent-login__message" role="alert">
                  {formMessage}
                </p>
              )}

              <button className="agent-login__submit" type="submit">
                Solicitar cadastro
              </button>

              <p className="agent-login__device">
                Dispositivo: <strong>{deviceId.slice(-8).toUpperCase()}</strong>
              </p>

              <p className="agent-login__register">
                Já possui conta? <button type="button" onClick={onBackToLogin}>Acessar login</button>
              </p>
            </form>
          )}
        </div>
      </main>

      {/* ---------- Rodapé institucional (igual ao do login) ---------- */}
      <footer className="agent-site-footer">
        <p>Prefeitura de Goiana · Defesa Civil</p>
        <p>© {new Date().getFullYear()} Prefeitura de Goiana. Todos os direitos reservados.</p>
      </footer>
    </div>
  )
}