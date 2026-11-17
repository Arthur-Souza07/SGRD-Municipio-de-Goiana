import { useState, useCallback } from 'react'
import type { FormEvent, ReactNode } from 'react'
import './Login.css'
import './Register.css'
import {
  getDeviceId,
  isValidCpf,
  onlyDigits,
  formatCpf,
  formatPhone,
  isValidEmail,
} from './utils/auth'
import { LockIcon, EyeIcon, CheckIcon } from './utils/icons'

/* ============================================================
   TIPOS (descrevem o formato dos dados)
   ============================================================ */

// Dados que serão enviados para o sistema quando a API existir
export type RegisterData = {
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

export type RegisterProps = {
  // Conecte este callback ao envio real quando a API estiver disponível.
  onRegister?: (data: RegisterData) => Promise<void> | void
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
    <label className={`agent-register__field ${className}`}>
      <span>
        {label}
        {required && ' *'}
        {optional && <span className="agent-register__optional"> (opcional)</span>}
      </span>

      {/* Se tiver "trailing", o campo ganha um espaço à direita para o botão */}
      {trailing ? (
        <span className="agent-register__password">
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
  const [submitted, setSubmitted] = useState(false) // true depois de enviar com sucesso
  const [isSubmitting, setIsSubmitting] = useState(false) // loading durante envio
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

  // Handler para formatação de CPF preservando posição do cursor
  const handleCpfChange = useCallback((rawValue: string) => {
    const formatted = formatCpf(rawValue)
    updateField('cpf', formatted)
  }, [])

  // Handler para formatação de telefone preservando posição do cursor
  const handlePhoneChange = useCallback((rawValue: string) => {
    const formatted = formatPhone(rawValue)
    updateField('phone', formatted)
  }, [])

  // Roda quando o usuário clica em "Solicitar cadastro"
  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
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

    setIsSubmitting(true)
    try {
      await onRegister?.(data)
      setSubmitted(true)
      // Scroll to top after state update
      setTimeout(() => window.scrollTo({ top: 0 }), 0)
    } catch (error) {
      console.error('Erro ao enviar cadastro:', error)
      setFormMessage('Não foi possível enviar a solicitação. Tente novamente mais tarde.')
    } finally {
      setIsSubmitting(false)
    }
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
            <div className="agent-register__success">
              <span className="agent-register__success-icon">
                <CheckIcon />
              </span>
              <h2>Solicitação enviada</h2>
              <p>
                A coordenação da Defesa Civil vai analisar seus dados e o seu dispositivo.
                Você só poderá entrar depois da habilitação.
              </p>
              <p className="agent-register__device">
                Código do dispositivo: <strong>{deviceId.slice(-8).toUpperCase()}</strong>
              </p>
              <button className="agent-register__submit" type="button" onClick={onBackToLogin}>
                Voltar para o login
              </button>
            </div>
          ) : (
            /* ---------- Formulário ---------- */
            <form className="agent-register__card" onSubmit={handleSubmit} noValidate>
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
                    autoComplete="username"
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
                    onChange={handleCpfChange}
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
                    onChange={handlePhoneChange}
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
                        className="agent-register__eye"
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
                <div className="agent-register__notice" role="note">
                  <div className="agent-register__notice-title">
                    <span className="agent-register__notice-icon">
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
                <p className="agent-register__message" role="status">
                  {formMessage}
                </p>
              )}

              <button className="agent-register__submit" type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Enviando...' : 'Solicitar cadastro'}
              </button>

              <p className="agent-register__device">
                Dispositivo: <strong>{deviceId.slice(-8).toUpperCase()}</strong>
              </p>

              <p className="agent-register__register">
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