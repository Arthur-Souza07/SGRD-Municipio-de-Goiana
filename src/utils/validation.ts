import { z } from 'zod';

/**
 * Brazilian CPF validation algorithm (official).
 * Returns true if valid, false otherwise.
 */
export function validateCPF(cpf: string): boolean {
  const cleaned = cpf.replace(/\D/g, '');
  if (cleaned.length !== 11) return false;
  if (/^(\d)\1+$/.test(cleaned)) return false; // All same digits

  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cleaned[i], 10) * (10 - i);
  }
  let rest = (sum * 10) % 11;
  if (rest === 10 || rest === 11) rest = 0;
  if (rest !== parseInt(cleaned[9], 10)) return false;

  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cleaned[i], 10) * (11 - i);
  }
  rest = (sum * 10) % 11;
  if (rest === 10 || rest === 11) rest = 0;
  if (rest !== parseInt(cleaned[10], 10)) return false;

  return true;
}

/**
 * Formats CPF as XXX.XXX.XXX-XX
 */
export function formatCPF(cpf: string): string {
  const cleaned = cpf.replace(/\D/g, '');
  if (cleaned.length <= 3) return cleaned;
  if (cleaned.length <= 6) return `${cleaned.slice(0, 3)}.${cleaned.slice(3)}`;
  if (cleaned.length <= 9) return `${cleaned.slice(0, 3)}.${cleaned.slice(3, 6)}.${cleaned.slice(6)}`;
  return `${cleaned.slice(0, 3)}.${cleaned.slice(3, 6)}.${cleaned.slice(6, 9)}-${cleaned.slice(9, 11)}`;
}

/**
 * Formats phone as (XX) XXXXX-XXXX or (XX) XXXX-XXXX
 */
export function formatPhone(phone: string): string {
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length <= 2) return `(${cleaned}`;
  if (cleaned.length <= 6) return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2)}`;
  if (cleaned.length <= 10) return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 6)}-${cleaned.slice(6)}`;
  return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 7)}-${cleaned.slice(7, 11)}`;
}

/**
 * Agent (Field Agent) registration schema
 */
export const agentRegisterSchema = z.object({
  cpf: z.string()
    .min(1, 'CPF é obrigatório')
    .refine((val) => validateCPF(val), 'CPF inválido'),
  nomeCompleto: z.string()
    .min(3, 'Nome deve ter pelo menos 3 caracteres')
    .max(120, 'Nome muito longo'),
  email: z.string()
    .min(1, 'E-mail é obrigatório')
    .email('E-mail inválido'),
  telefone: z.string()
    .min(1, 'Telefone é obrigatório')
    .refine((val) => val.replace(/\D/g, '').length >= 10, 'Telefone inválido'),
  senha: z.string()
    .min(8, 'Senha deve ter pelo menos 8 caracteres')
    .regex(/[A-Z]/, 'Senha deve ter pelo menos 1 letra maiúscula')
    .regex(/[0-9]/, 'Senha deve ter pelo menos 1 número')
    .regex(/[^A-Za-z0-9]/, 'Senha deve ter pelo menos 1 caractere especial'),
  confirmarSenha: z.string(),
  termos: z.boolean().refine((val) => val === true, 'Você deve aceitar os termos'),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
}).refine((data) => data.senha === data.confirmarSenha, {
  message: 'Senhas não conferem',
  path: ['confirmarSenha'],
}).refine((data) => data.latitude !== undefined && data.longitude !== undefined, {
  message: 'Coordenadas GPS são obrigatórias',
  path: ['latitude'],
});

/**
 * Agent login schema
 */
export const agentLoginSchema = z.object({
  identifier: z.string().min(1, 'CPF ou e-mail é obrigatório'),
  password: z.string().min(1, 'Senha é obrigatória'),
  rememberMe: z.boolean().optional(),
});

/**
 * Manager (Gestor) registration schema
 */
export const managerRegisterSchema = z.object({
  cpf: z.string()
    .min(1, 'CPF é obrigatório')
    .refine((val) => validateCPF(val), 'CPF inválido'),
  nomeCompleto: z.string()
    .min(3, 'Nome deve ter pelo menos 3 caracteres')
    .max(120, 'Nome muito longo'),
  email: z.string()
    .min(1, 'E-mail é obrigatório')
    .email('E-mail inválido')
    .refine((val) => val.endsWith('@goiana.pe.gov.br'), 'Use e-mail institucional (@goiana.pe.gov.br)'),
  cargo: z.enum(['coordenador', 'analista', 'supervisor', 'administrador'] as const),
  setor: z.enum(['defesa-civil', 'planejamento', 'operacoes', 'tecnologia', 'administracao', 'outro'] as const),
  matricula: z.string().optional(),
  senha: z.string()
    .min(12, 'Senha deve ter pelo menos 12 caracteres')
    .regex(/[A-Z]/, 'Senha deve ter pelo menos 1 letra maiúscula')
    .regex(/[a-z]/, 'Senha deve ter pelo menos 1 letra minúscula')
    .regex(/[0-9]/, 'Senha deve ter pelo menos 1 número')
    .regex(/[^A-Za-z0-9]/, 'Senha deve ter pelo menos 1 caractere especial'),
  confirmarSenha: z.string(),
  termos: z.boolean().refine((val) => val === true, 'Você deve aceitar os termos e nível de acesso'),
}).refine((data) => data.senha === data.confirmarSenha, {
  message: 'Senhas não conferem',
  path: ['confirmarSenha'],
});

/**
 * Manager login schema
 */
export const managerLoginSchema = z.object({
  identifier: z.string().min(1, 'CPF ou e-mail é obrigatório'),
  password: z.string().min(1, 'Senha é obrigatória'),
  rememberMe: z.boolean().optional(),
});

/**
 * Type inference from schemas
 */
export type AgentRegisterData = z.infer<typeof agentRegisterSchema>;
export type AgentLoginData = z.infer<typeof agentLoginSchema>;
export type ManagerRegisterData = z.infer<typeof managerRegisterSchema>;
export type ManagerLoginData = z.infer<typeof managerLoginSchema>;