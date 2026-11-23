import { PARENTESCOS } from './integrantes';
import type { NivelRisco } from './familias';
import { TIPOS_OCORRENCIA } from './familias';

/**
 * Constantes de rótulos para exportação Excel.
 * Extraídas do hook para evitar recriação a cada render.
 * São puras funções/objetos sem dependências de React.
 */

// ============================================================
// RÓTULOS DE ENUMERAÇÕES (lookup tables)
// ============================================================

export const RACA_COR_LABELS: Record<string, string> = {
  branca: 'Branca',
  preta: 'Preta',
  parda: 'Parda',
  amarela: 'Amarela',
  indigena: 'Indígena',
  nao_declarada: 'Não declarada',
};

export const ESTADO_CIVIL_LABELS: Record<string, string> = {
  solteiro: 'Solteiro(a)',
  casado: 'Casado(a)',
  divorciado: 'Divorciado(a)',
  viuvo: 'Viúvo(a)',
  uniao_estavel: 'União Estável',
  outro: 'Outro',
};

export const IDENTIDADE_GENERO_LABELS: Record<string, string> = {
  masculino: 'Masculino',
  feminino: 'Feminino',
  transgenero: 'Transgênero',
  nao_binario: 'Não-binário',
  outro: 'Outro',
  prefiro_nao_dizer: 'Prefiro não dizer',
};

export const PARENTESCO_LABELS: Record<string, string> = { ...PARENTESCOS };

export const TIPO_CONSTRUCAO_LABELS: Record<string, string> = {
  alvenaria: 'Alvenaria',
  madeira: 'Madeira',
  mista: 'Mista',
  taipa: 'Taipa',
  container: 'Container',
  outro: 'Outro',
};

export const PADRAO_ACABAMENTO_LABELS: Record<string, string> = {
  alto: 'Alto',
  medio: 'Médio',
  baixo: 'Baixo',
  sem_acabamento: 'Sem acabamento',
};

export const TIPO_COBERTA_LABELS: Record<string, string> = {
  laje: 'Laje',
  telha_ceramica: 'Telha cerâmica',
  telha_metalica: 'Telha metálica',
  telha_fibrocimento: 'Telha fibrocimento',
  palha: 'Palha',
  outro: 'Outro',
};

export const SANEAMENTO_LABELS: Record<string, string> = {
  rede_coletora: 'Rede coletora',
  fossa_setica: 'Fossa séptica',
  fossa_rudimentar: 'Fossa rudimentar',
  valao: 'Valão',
  inexistente: 'Inexistente',
};

export const ABASTECIMENTO_LABELS: Record<string, string> = {
  rede_publica: 'Rede pública',
  poco_artesiano: 'Poço artesiano',
  cisterna: 'Cisterna',
  carro_pipa: 'Carro-pipa',
  outro: 'Outro',
};

export const AGUAS_PLUVIAIS_LABELS: Record<string, string> = {
  rede_coletora: 'Rede coletora',
  valao: 'Valão',
  superficial: 'Superficial',
  inexistente: 'Inexistente',
};

export const PAVIMENTACAO_LABELS: Record<string, string> = {
  asfalto: 'Asfalto',
  paralelepipedo: 'Paralelepípedo',
  bloquete: 'Bloquete',
  terra: 'Terra',
  outro: 'Outro',
};

export const CONDICAO_OCUPACAO_LABELS: Record<string, string> = {
  proprio: 'Próprio',
  alugado: 'Alugado',
  cedido: 'Cedido',
  invasao: 'Invasão',
  outro: 'Outro',
};

export const GRAU_RISCO_LABELS: Record<NivelRisco, string> = {
  alto: 'Alto',
  medio: 'Médio',
  baixo: 'Baixo',
  nao_informado: 'Não informado',
};

// ============================================================
// FUNÇÕES AUXILIARES PURAS
// ============================================================

export function getRacaCorLabel(racaCor?: string): string {
  if (!racaCor) return '';
  return RACA_COR_LABELS[racaCor] || racaCor;
}

export function getEstadoCivilLabel(estadoCivil?: string): string {
  if (!estadoCivil) return '';
  return ESTADO_CIVIL_LABELS[estadoCivil] || estadoCivil;
}

export function getIdentidadeGeneroLabel(identidade?: string): string {
  if (!identidade) return '';
  return IDENTIDADE_GENERO_LABELS[identidade] || identidade;
}

export function getParentescoLabel(parentesco?: string): string {
  if (!parentesco) return '';
  return PARENTESCO_LABELS[parentesco] || parentesco;
}

export function getTipoConstrucaoLabel(tipo?: string): string {
  if (!tipo) return '';
  return TIPO_CONSTRUCAO_LABELS[tipo] || tipo;
}

export function getPadraoAcabamentoLabel(padrao?: string): string {
  if (!padrao) return '';
  return PADRAO_ACABAMENTO_LABELS[padrao] || padrao;
}

export function getTipoCobertaLabel(tipo?: string): string {
  if (!tipo) return '';
  return TIPO_COBERTA_LABELS[tipo] || tipo;
}

export function getSaneamentoLabel(saneamento?: string): string {
  if (!saneamento) return '';
  return SANEAMENTO_LABELS[saneamento] || saneamento;
}

export function getAbastecimentoLabel(abastecimento?: string): string {
  if (!abastecimento) return '';
  return ABASTECIMENTO_LABELS[abastecimento] || abastecimento;
}

export function getAguasPluviaisLabel(aguas?: string): string {
  if (!aguas) return '';
  return AGUAS_PLUVIAIS_LABELS[aguas] || aguas;
}

export function getPavimentacaoLabel(pavimentacao?: string): string {
  if (!pavimentacao) return '';
  return PAVIMENTACAO_LABELS[pavimentacao] || pavimentacao;
}

export function getCondicaoOcupacaoLabel(condicao?: string): string {
  if (!condicao) return '';
  return CONDICAO_OCUPACAO_LABELS[condicao] || condicao;
}

export function getUsoImovelLabel(uso?: string): string {
  return uso || '';
}

export function getGrauRiscoTemplate(nivel: NivelRisco): string {
  return GRAU_RISCO_LABELS[nivel] || 'Não informado';
}

export function getSimNao(
  valor: 'sim' | 'nao' | 'nao_informado' | 'parcial' | boolean | undefined
): string {
  if (valor === true || valor === 'sim') return 'SIM';
  if (valor === false || valor === 'nao') return 'NÃO';
  if (valor === 'parcial') return 'PARCIAL';
  return '';
}

export function getDanosEdificacaoLabel(valor?: string): string {
  if (valor === 'parcial') return 'Parcial';
  if (valor === 'sim') return 'Sim';
  if (valor === 'nao') return 'Não';
  return '';
}

export function formatarCpfComMascara(cpf: string): string {
  const limpo = cpf.replace(/\D/g, '');
  if (limpo.length !== 11) return cpf;
  return `${limpo.slice(0, 3)}.${limpo.slice(3, 6)}.${limpo.slice(6, 9)}-${limpo.slice(9)}`;
}

export function formatarDataBR(data?: string): string {
  if (!data) return '';
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(data)) return data;
  try {
    const d = new Date(data);
    if (isNaN(d.getTime())) return '';
    return d.toLocaleDateString('pt-BR');
  } catch {
    return '';
  }
}

export function calcularIdade(nascimento: string): number {
  const hoje = new Date();
  const [ano, mes, dia] = nascimento.split('-').map(Number);
  const dataNasc = new Date(ano, mes - 1, dia);
  let idade = hoje.getFullYear() - dataNasc.getFullYear();
  const m = hoje.getMonth() - dataNasc.getMonth();
  if (m < 0 || (m === 0 && hoje.getDate() < dataNasc.getDate())) idade--;
  return idade;
}

export function getTipoOcorrenciaLabel(tipo?: string): string {
  if (!tipo) return '';
  return TIPOS_OCORRENCIA[tipo as keyof typeof TIPOS_OCORRENCIA] || tipo;
}