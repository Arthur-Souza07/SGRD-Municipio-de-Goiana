/* ============================================================
   Utilitários compartilhados de autenticação
   ============================================================ */

// Gera um ID único do aparelho na primeira vez e reaproveita depois
// Fallback para ambientes não-seguros (HTTP) onde crypto.randomUUID não está disponível
export function getDeviceId(): string {
  const key = 'agent-device-id'
  try {
    let id = localStorage.getItem(key)
    if (!id) {
      id = generateUUID()
      localStorage.setItem(key, id)
    }
    return id
  } catch {
    return 'indisponivel'
  }
}

// Gera UUID v4 compatível com ambientes não-seguros
function generateUUID(): string {
  // Tenta usar crypto.randomUUID se disponível (HTTPS/localhost)
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    try {
      return crypto.randomUUID()
    } catch {
      // Ignora erro e cai no fallback
    }
  }
  // Fallback: implementação RFC 4122 v4
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

// Remove tudo que não for número ("123.456-78" vira "12345678")
export function onlyDigits(value: string): string {
  return value.replace(/\D/g, '')
}

// Validação de CPF pelos dígitos verificadores
export function isValidCpf(cpf: string): boolean {
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
export function formatCpf(value: string): string {
  return onlyDigits(value)
    .slice(0, 11)
    .replace(/^(\d{3})(\d)/, '$1.$2')
    .replace(/^(\d{3})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1-$2')
}

// Máscara de telefone enquanto digita: (81) 99999-9999
export function formatPhone(value: string): string {
  const d = onlyDigits(value).slice(0, 11)
  if (d.length <= 2) return d
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`
}

// Verificação simples de e-mail: algo@algo.algo
export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}