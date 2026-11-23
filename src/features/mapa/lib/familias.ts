import { cpfValido } from './documentos';
export { cpfValido, formatarCpf } from './documentos';
import {
  coordenadasValidas,
  normalizarPontos,
  type NivelRisco,
  type PontoRisco,
} from './pontos';
import {
  calcularIdade,
  lerFamiliares,
  type Familiar,
  type PessoaDemonstrativa,
} from './integrantes';
import { dentroDeGoiana } from './territorio';
// Lazy-loaded demo data - only imported when needed
// import { exemploCadastro } from './exemplo-cadastro';

export const TIPOS_OCORRENCIA = {
  nao_informado: 'Não informado',
  inundacao: 'Inundação de rio',
  alagamento: 'Alagamento',
  deslizamento: 'Deslizamento',
  erosao: 'Erosão',
  outro: 'Outro',
} as const;
export type TipoOcorrencia = keyof typeof TIPOS_OCORRENCIA;

// Re-exportar PontoRisco, NivelRisco e nomeDaFamilia para compatibilidade
export type { PontoRisco, NivelRisco } from './pontos';
export { nomeDaFamilia } from './pontos';

export interface LocalizacaoFamilia {
  latitude: number;
  longitude: number;
  origem: 'gps' | 'mapa' | 'coordenadas';
  precisaoMetros?: number;
}

// ========== Tipos para o Template Excel (Ficha Cadastral) ==========

// Seção 1: Informação do Imóvel
export interface InformacaoImovel {
  municipio?: string; // GOIANA / PE
  dataCadastro?: string; // DD/MM/AAAA
  dataUltimaAtualizacao?: string; // DD/MM/AAAA ou '-'
  comunidade?: string;
  endereco?: string;
  numero?: string;
  complemento?: string;
  bairro?: string;
  distrito?: string;
  longitude?: string; // LONGITUDE (S)
  latitude?: string; // LATITUDE (W)
  tipoRisco?: string; // Ex: Inundação, Deslizamento
  grauRisco?: string; // Alto, Médio, Baixo
}

// Seção 2: Caracterização do Imóvel
export interface CaracterizacaoImovel {
  usoImovel?: string; // Residencial, Comercial, Misto, Institucional
  condicoesOcupacao?: 'proprio' | 'alugado' | 'cedido' | 'invasao' | 'outro';
  valorAluguel?: string; // Se alugado
  nomeLocador?: string; // Se alugado
  imovelVerticalizado?: 'sim' | 'nao';
  numeroPavimentos?: string; // Se sim
  pavimentosOcupa?: string; // Se sim
  areaTerreno?: string; // m²
  areaConstrucao?: string; // m²
  comodos?: Comodo[]; // Lista de cômodos
}

export interface Comodo {
  nome: string;
  quantidade: number;
}

// Seção 2.1: Quantidade de dependências
export type ComodosResidenciais = {
  quartos: number;
  salas: number;
  cozinhas: number;
  banheiros: number;
  areasServico: number;
  garagens: number;
  outros: Comodo[];
};

// Seção 3: Condições de Habitabilidade
export interface CondicoesHabitabilidade {
  tipoConstrucao?: 'alvenaria' | 'madeira' | 'mista' | 'taipa' | 'container' | 'outro';
  padraoAcabamento?: 'alto' | 'medio' | 'baixo' | 'sem_acabamento';
  tipoCoberta?: 'laje' | 'telha_ceramica' | 'telha_metalica' | 'telha_fibrocimento' | 'palha' | 'outro';
  saneamentoBasico?: 'rede_coletora' | 'fossa_setica' | 'fossa_rudimentar' | 'valao' | 'inexistente';
  abastecimentoAgua?: 'rede_publica' | 'poco_artesiano' | 'cisterna' | 'carro_pipa' | 'outro';
  aguasPluviais?: 'rede_coletora' | 'valao' | 'superficial' | 'inexistente';
  pavimentacao?: 'asfalto' | 'paralelepipedo' | 'bloquete' | 'terra' | 'outro';
  iluminacaoPublica?: 'sim' | 'nao' | 'parcial';
  coletaResiduos?: 'sim' | 'nao';
}

// Seção 4: Responsável pelo Imóvel e Composição Familiar
export interface PessoaCompleta {
  id?: string; // ID único para uso em listas React
  nome: string;
  apelidoNomeSocial?: string;
  telefone?: string;
  cpf?: string;
  rg?: string;
  dataNascimento?: string; // DD/MM/AAAA
  idade?: number;
  estadoCivil?: 'solteiro' | 'casado' | 'divorciado' | 'viuvo' | 'uniao_estavel' | 'outro';
  nisPis?: string;
  identidadeGenero?: 'masculino' | 'feminino' | 'transgenero' | 'nao_binario' | 'outro' | 'prefiro_nao_dizer';
  racaCor?: 'branca' | 'preta' | 'parda' | 'amarela' | 'indigena' | 'nao_declarada';
  ocupacaoProfissional?: string;
  rendaFamiliar?: string; // Valor em reais
  beneficiosSocioassistenciais?: string; // Lista de benefícios
  possuiDeficiencia: 'sim' | 'nao' | 'nao_informado';
  deficienciaQual?: string;
  observacao?: string;
}

// Chefe da Família (Representante) - usa os mesmos campos de PessoaCompleta
export type ChefeFamilia = PessoaCompleta;

// Cônjuge - usa os mesmos campos de PessoaCompleta
export type Conjuge = PessoaCompleta;

// Demais Membros da Composição Familiar
export interface MembroFamilia extends PessoaCompleta {
  vinculoSocialParentesco: 'conjuge' | 'filho' | 'pai_mae' | 'avo' | 'neto' | 'irmao' | 'outro';
  cor?: string; // Raça/cor específica do membro
}

// Seção 5: Histórico e Evolução dos Dados Familiares
// 5.1 Histórico de Ocorrências
export interface HistoricoOcorrencia {
  jaFoiAtingido: 'sim' | 'nao' | 'nao_informado';
  tipoOcorrencia?: string;
  dataAnoOcorrencia?: string;
  houveDanosEdificacao?: 'sim' | 'nao' | 'parcial' | 'nao_informado';
  houvePerdaBens?: 'sim' | 'nao' | 'nao_informado';
  houvePerdaTotalParcialImovel?: 'sim' | 'nao' | 'parcial' | 'total' | 'nao_informado';
  observacao?: string;
}

// 5.2 Interdição e Medidas de Segurança
export interface Interdicao {
  imovelJaFoiInterditado: 'sim' | 'nao' | 'nao_informado';
  tipo?: 'total' | 'parcial' | 'preventiva' | 'outro';
  dataInterdicao?: string;
  houveEvacuacaoDesocupacao?: 'sim' | 'nao' | 'nao_informado';
  houveRecomendacaoRemocaoDefinitiva?: 'sim' | 'nao' | 'nao_informado';
  observacao?: string;
}

// 5.3 Desalojamento e Desabrigo
export interface DesalojamentoDesabrigo {
  familiaJaFicouDesalojada: 'sim' | 'nao' | 'nao_informado';
  familiaJaFicouDesabrigada: 'sim' | 'nao' | 'nao_informado';
  periodo?: string;
  localAcolhimento?: string;
  retornouAoImovel?: 'sim' | 'nao' | 'nao_informado';
}

// 5.4 Benefícios e Auxílios
export interface BeneficioAuxilio {
  jaRecebeuBeneficioAuxilio: 'sim' | 'nao' | 'nao_informado';
  tipoBeneficio?: string;
  data?: string;
  observacao?: string;
}

// 5.5 Encaminhamento Habitacional
export interface EncaminhamentoHabitacional {
  jaFoiEncaminhado: 'sim' | 'nao' | 'nao_informado';
  data?: string;
  observacao?: string;
}

// 5.6 Histórico de Vistorias
export interface HistoricoVistorias {
  jaFoiAtendidaAssistenciaSocial: 'sim' | 'nao' | 'nao_informado';
  dataUltimaVistoriaAssistencia?: string;
  assistenteSocialResponsavel?: string;
  jaFoiRealizadaVistoriaTecnicaDefesaCivil: 'sim' | 'nao' | 'nao_informado';
  dataUltimaVistoriaDefesaCivil?: string;
  tecnicoResponsavel?: string;
}

// 5.6 Situação Atual
export interface SituacaoAtual {
  emAcompanhamentoDefesaCivil: 'sim' | 'nao' | 'nao_informado';
  observacao?: string;
}

// Seção 6: Documentos e Registro Fotográfico
export interface DocumentosFotograficos {
  possuiDocumentos: 'sim' | 'nao' | 'parcial';
  listaDocumentos?: string[]; // RG, CPF, Comprovante residência, etc.
  possuiRegistroFotografico: 'sim' | 'nao';
  descricaoFotos?: string;
}

// ========== Interface Principal Estendida ==========
export interface DadosFamilia {
  // Identificação básica (campos existentes)
  nomeRepresentante: string;
  cpf: string;
  telefone: string;
  logradouro: string;
  numero: string;
  bairro: string;
  complemento: string;
  moradores: number;
  nivelRisco: NivelRisco;
  tipoOcorrencia: TipoOcorrencia;
  observacoes: string;
  localizacao: LocalizacaoFamilia;
  nascimentoRepresentante?: string;
  apoioRepresentante?: string;
  familiares?: Familiar[];

  // Novos campos do template Excel
  informacaoImovel?: InformacaoImovel;
  caracterizacaoImovel?: CaracterizacaoImovel;
  condicoesHabitabilidade?: CondicoesHabitabilidade;
  chefeFamilia?: ChefeFamilia;
  conjuge?: Conjuge;
  demaisMembros?: MembroFamilia[];
  historicoOcorrencias?: HistoricoOcorrencia[];
  interdictioes?: Interdicao[];
  desalojamentos?: DesalojamentoDesabrigo[];
  beneficiosAuxilios?: BeneficioAuxilio[];
  encaminhamentoHabitacional?: EncaminhamentoHabitacional;
  historicoVistorias?: HistoricoVistorias;
  situacaoAtual?: SituacaoAtual;
  documentosFotograficos?: DocumentosFotograficos;
}
export interface CadastroFamilia extends PontoRisco {
  dados?: DadosFamilia;
  criadoEm?: string;
  resumoDemonstrativo?: ResumoDemonstrativo;
}
export interface ResumoDemonstrativo {
  moradores: number;
  integrantes: PessoaDemonstrativa[];
  referenciaLocal: string;
  nucleo: string;
  areaSgb: {
    id: string;
    classe: 'Alta' | 'Média';
    camada: 'inundacao' | 'movimento';
  };
}
export type CamposCadastro = Omit<DadosFamilia, 'moradores' | 'localizacao'> & {
  moradores: string;
  localizacao: LocalizacaoFamilia | null;
};
export type ErrosCadastro = Partial<Record<keyof CamposCadastro, string>>;
export const FORMULARIO_VAZIO: CamposCadastro = {
  nomeRepresentante: '',
  cpf: '',
  telefone: '',
  logradouro: '',
  numero: '',
  bairro: '',
  complemento: '',
  moradores: '1',
  nivelRisco: 'nao_informado',
  tipoOcorrencia: 'nao_informado',
  observacoes: '',
  localizacao: null,
  nascimentoRepresentante: '',
  apoioRepresentante: '',
  familiares: [],

  // Novos campos opcionais do template Excel
  informacaoImovel: undefined,
  caracterizacaoImovel: undefined,
  condicoesHabitabilidade: undefined,
  chefeFamilia: undefined,
  conjuge: undefined,
  demaisMembros: undefined,
  historicoOcorrencias: undefined,
  interdictioes: undefined,
  desalojamentos: undefined,
  beneficiosAuxilios: undefined,
  encaminhamentoHabitacional: undefined,
  historicoVistorias: undefined,
  situacaoAtual: undefined,
  documentosFotograficos: undefined,
};
export function gerarIdentificador(): string {
  if (typeof crypto.randomUUID === 'function') return crypto.randomUUID();
  return [...crypto.getRandomValues(new Uint8Array(16))]
    .map((n) => n.toString(16).padStart(2, '0'))
    .join('');
}
const limpar = (s: string) => s.replace(/\s+/g, ' ').trim();
const digitos = (s: string) => s.replace(/\D/g, '');

export function lerCoordenada(valor: string): number | null {
  const texto = valor.trim().replace(',', '.');
  return /^-?\d+(\.\d+)?$/.test(texto) && Number.isFinite(Number(texto))
    ? Number(texto)
    : null;
}
export function validarCadastro(campos: CamposCadastro): ErrosCadastro {
  const erros: ErrosCadastro = {};
  const nome = limpar(campos.nomeRepresentante);
  if (nome.length < 3 || nome.length > 120)
    erros.nomeRepresentante =
      'Informe o nome do representante, entre 3 e 120 caracteres.';
  if (!cpfValido(campos.cpf))
    erros.cpf =
      'Confira o CPF: são 11 dígitos e os verificadores devem ser válidos.';
  if (campos.telefone.trim() && !/^\d{10,11}$/.test(digitos(campos.telefone)))
    erros.telefone = 'Informe o telefone com DDD (10 ou 11 dígitos).';
  if (!limpar(campos.logradouro) || campos.logradouro.length > 160)
    erros.logradouro =
      'Informe a rua ou o acesso à residência (até 160 caracteres).';
  if (!limpar(campos.numero) || campos.numero.length > 20)
    erros.numero = 'Informe o número ou S/N.';
  if (!limpar(campos.bairro) || campos.bairro.length > 100)
    erros.bairro = 'Informe o bairro ou a comunidade (até 100 caracteres).';
  if (campos.complemento.length > 160)
    erros.complemento = 'Use até 160 caracteres.';
  if (
    !/^\d+$/.test(campos.moradores) ||
    Number(campos.moradores) < 1 ||
    Number(campos.moradores) > 99
  )
    erros.moradores = 'Informe entre 1 e 99 moradores.';
  if (
    campos.nascimentoRepresentante &&
    calcularIdade(campos.nascimentoRepresentante) === null
  )
    erros.nascimentoRepresentante =
      'Informe uma data de nascimento válida, sem data futura.';
  if ((campos.apoioRepresentante?.length || 0) > 300)
    erros.apoioRepresentante = 'Use até 300 caracteres.';
  const familiares = lerFamiliares(campos.familiares ?? []);
  if (!familiares || familiares.some((p) => p.cpf.trim() && !cpfValido(p.cpf)))
    erros.familiares =
      'Confira nome, nascimento, parentesco e CPF dos familiares. O CPF pode ficar em branco quando não informado.';
  else {
    const cpfs = [
      digitos(campos.cpf),
      ...familiares.map((p) => digitos(p.cpf)).filter(Boolean),
    ];
    if (new Set(cpfs).size !== cpfs.length)
      erros.familiares =
        'Um mesmo CPF não pode identificar duas pessoas da família.';
    if (familiares.length + 1 > Number(campos.moradores))
      erros.familiares =
        'Há mais familiares identificados do que o número de moradores informado. Ajuste a lista de familiares ou o total de moradores.';
  }
  if (!['baixo', 'medio', 'alto', 'nao_informado'].includes(campos.nivelRisco))
    erros.nivelRisco = 'Selecione uma classificação válida.';
  if (!Object.hasOwn(TIPOS_OCORRENCIA, campos.tipoOcorrencia))
    erros.tipoOcorrencia = 'Selecione um tipo de ocorrência válido.';
  if (campos.observacoes.length > 1000)
    erros.observacoes = 'Use até 1.000 caracteres.';
  const local = campos.localizacao;
  if (
    !local ||
    !coordenadasValidas(local.latitude, local.longitude) ||
    !['gps', 'mapa', 'coordenadas'].includes(local.origem)
  )
    erros.localizacao =
      'Marque a residência no mapa, use o GPS ou confirme as coordenadas antes de cadastrar.';
  else if (!dentroDeGoiana(local.longitude, local.latitude))
    erros.localizacao =
      'O ponto está fora do limite municipal de Goiana–PE (IBGE 2025). Confira o GPS ou ajuste a marcação da residência.';
  return erros;
}
export function prepararCadastro(campos: CamposCadastro): DadosFamilia {
  if (Object.keys(validarCadastro(campos)).length)
    throw new Error('Revise os campos do cadastro.');
  const local = campos.localizacao!;
  return {
    nomeRepresentante: limpar(campos.nomeRepresentante),
    cpf: digitos(campos.cpf),
    telefone: digitos(campos.telefone),
    logradouro: limpar(campos.logradouro),
    numero: limpar(campos.numero),
    bairro: limpar(campos.bairro),
    complemento: limpar(campos.complemento),
    moradores: Number(campos.moradores),
    nivelRisco: campos.nivelRisco,
    tipoOcorrencia: campos.tipoOcorrencia,
    observacoes: campos.observacoes.trim(),
    ...(campos.nascimentoRepresentante
      ? { nascimentoRepresentante: campos.nascimentoRepresentante }
      : {}),
    ...(campos.apoioRepresentante?.trim()
      ? { apoioRepresentante: campos.apoioRepresentante.trim() }
      : {}),
    ...(campos.familiares?.length
      ? {
          familiares: lerFamiliares(campos.familiares)!.map((p) => ({
            ...p,
            cpf: digitos(p.cpf),
          })),
        }
      : {}),
    localizacao: {
      latitude: local.latitude,
      longitude: local.longitude,
      origem: local.origem,
      ...(local.origem === 'gps' &&
      Number.isFinite(local.precisaoMetros) &&
      local.precisaoMetros! >= 0
        ? { precisaoMetros: local.precisaoMetros }
        : {}),
    },

    // Novos campos opcionais do template Excel (passados diretamente se existirem)
    ...(campos.informacaoImovel ? { informacaoImovel: campos.informacaoImovel } : {}),
    ...(campos.caracterizacaoImovel ? { caracterizacaoImovel: campos.caracterizacaoImovel } : {}),
    ...(campos.condicoesHabitabilidade ? { condicoesHabitabilidade: campos.condicoesHabitabilidade } : {}),
    ...(campos.chefeFamilia ? { chefeFamilia: campos.chefeFamilia } : {}),
    ...(campos.conjuge ? { conjuge: campos.conjuge } : {}),
    ...(campos.demaisMembros ? { demaisMembros: campos.demaisMembros } : {}),
    ...(campos.historicoOcorrencias ? { historicoOcorrencias: campos.historicoOcorrencias } : {}),
    ...(campos.interdictioes ? { interdictioes: campos.interdictioes } : {}),
    ...(campos.desalojamentos ? { desalojamentos: campos.desalojamentos } : {}),
    ...(campos.beneficiosAuxilios ? { beneficiosAuxilios: campos.beneficiosAuxilios } : {}),
    ...(campos.encaminhamentoHabitacional ? { encaminhamentoHabitacional: campos.encaminhamentoHabitacional } : {}),
    ...(campos.historicoVistorias ? { historicoVistorias: campos.historicoVistorias } : {}),
    ...(campos.situacaoAtual ? { situacaoAtual: campos.situacaoAtual } : {}),
    ...(campos.documentosFotograficos ? { documentosFotograficos: campos.documentosFotograficos } : {}),
  };
}
export function criarCadastroDemonstrativo(
  dados: DadosFamilia,
): CadastroFamilia {
  return {
    id: `demo-${gerarIdentificador()}`,
    nomeRepresentante: dados.nomeRepresentante,
    latitude: dados.localizacao.latitude,
    longitude: dados.localizacao.longitude,
    nivelRisco: dados.nivelRisco,
    dados,
    criadoEm: new Date().toISOString(),
  };
}

/**
 * Dados de exemplo para demonstração - carregados sob demanda (lazy-loaded).
 * Use `import { exemploCadastro } from './exemplo-cadastro'` quando necessário.
 * Isso evita incluir 600+ linhas de dados de demo no bundle principal.
 */
export { exemploCadastro } from './exemplo-cadastro';

function erroHttp(status: number): string {
  if (status === 401 || status === 403)
    return 'Sua sessão não permite esta operação. Entre novamente pelo sistema da equipe.';
  if (status === 409)
    return 'Já existe um cadastro para esse CPF. Confira os registros antes de tentar novamente.';
  if (status === 400 || status === 422)
    return 'O servidor recusou os dados. Revise o cadastro e tente novamente.';
  if (status === 429)
    return 'Muitas tentativas em pouco tempo. Aguarde um momento para tentar novamente.';
  return 'O servidor não confirmou o cadastro. Os campos foram mantidos para você tentar novamente.';
}
/** API da equipe: POST no recurso /familias. A mesma chave deve ser reaproveitada em uma repetição de envio. */
export async function enviarCadastro(
  endereco: string,
  dados: DadosFamilia,
  chave: string,
  signal?: AbortSignal,
): Promise<CadastroFamilia> {
  const resposta = await fetch(endereco, {
    method: 'POST',
    credentials: 'include',
    signal,
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      'Idempotency-Key': chave,
    },
    body: JSON.stringify(dados),
  });
  if (!resposta.ok) throw new Error(erroHttp(resposta.status));
  const recebido: unknown = await resposta.json();
  if (
    !recebido ||
    typeof recebido !== 'object' ||
    !('id' in recebido) ||
    (typeof recebido.id !== 'string' && typeof recebido.id !== 'number') ||
    String(recebido.id).trim() === ''
  )
    throw new Error(
      'O servidor não retornou a identificação do cadastro. Confira os registros antes de repetir o envio.',
    );
  const { pontos } = normalizarPontos([recebido]);
  if (!pontos.length)
    throw new Error(
      'O servidor retornou uma localização inválida. Confira os registros antes de repetir o envio.',
    );
  return {
    ...pontos[0],
    nomeRepresentante: pontos[0].nomeRepresentante || dados.nomeRepresentante,
    dados,
    criadoEm:
      'criadoEm' in recebido && typeof recebido.criadoEm === 'string'
        ? recebido.criadoEm
        : new Date().toISOString(),
  };
}
/** Detalhes só são requisitados após uma ação explícita, nunca pelo carregamento dos pinos. */
export async function carregarDetalhe(
  endereco: string,
  id: string,
  signal?: AbortSignal,
): Promise<DadosFamilia> {
  const resposta = await fetch(
    `${endereco.replace(/\/$/, '')}/${encodeURIComponent(id)}`,
    {
      credentials: 'include',
      signal,
      cache: 'no-store',
      headers: { Accept: 'application/json' },
    },
  );
  if (!resposta.ok)
    throw new Error(
      resposta.status === 401 || resposta.status === 403
        ? erroHttp(resposta.status)
        : 'Não foi possível consultar os detalhes. Tente novamente.',
    );
  const registro: unknown = await resposta.json();
  if (
    !registro ||
    typeof registro !== 'object' ||
    !('dados' in registro) ||
    !registro.dados ||
    typeof registro.dados !== 'object'
  )
    throw new Error('Resposta do servidor inválida: estrutura de dados inesperada.');
  const dado = registro.dados as Record<string, unknown>;
  // Não se espalha conteúdo arbitrário da resposta na interface.
  const campos: CamposCadastro = { ...FORMULARIO_VAZIO };
  for (const campo of [
    'nomeRepresentante',
    'cpf',
    'telefone',
    'logradouro',
    'numero',
    'bairro',
    'complemento',
    'observacoes',
  ] as const) {
    campos[campo] = typeof dado[campo] === 'string' ? dado[campo] : '';
  }
  campos.moradores = String(dado.moradores ?? '');
  if (typeof dado.nascimentoRepresentante === 'string')
    campos.nascimentoRepresentante = dado.nascimentoRepresentante;
  if (typeof dado.apoioRepresentante === 'string')
    campos.apoioRepresentante = dado.apoioRepresentante;
  if (dado.familiares !== undefined) {
    const familiares = lerFamiliares(dado.familiares);
    if (!familiares)
      throw new Error(
        'Os dados dos familiares retornados pelo servidor estão incompletos.',
      );
    campos.familiares = familiares;
  }
  campos.nivelRisco = ['baixo', 'medio', 'alto'].includes(
    String(dado.nivelRisco),
  )
    ? (dado.nivelRisco as NivelRisco)
    : 'nao_informado';
  campos.tipoOcorrencia = Object.hasOwn(
    TIPOS_OCORRENCIA,
    String(dado.tipoOcorrencia),
  )
    ? (dado.tipoOcorrencia as TipoOcorrencia)
    : 'nao_informado';
  const local = dado.localizacao as Record<string, unknown> | undefined;
  if (local && coordenadasValidas(local.latitude, local.longitude))
    campos.localizacao = {
      latitude: local.latitude as number,
      longitude: local.longitude as number,
      origem: ['gps', 'mapa', 'coordenadas'].includes(String(local.origem))
        ? (local.origem as LocalizacaoFamilia['origem'])
        : 'coordenadas',
    };

  // Carregar novos campos do template Excel se existirem na resposta da API
  const parseOptionalObject = <T>(key: string): T | undefined => {
    const val = dado[key];
    return val && typeof val === 'object' ? (val as T) : undefined;
  };
  const parseOptionalArray = <T>(key: string): T[] | undefined => {
    const val = dado[key];
    return Array.isArray(val) ? (val as T[]) : undefined;
  };

  campos.informacaoImovel = parseOptionalObject<InformacaoImovel>('informacaoImovel');
  campos.caracterizacaoImovel = parseOptionalObject<CaracterizacaoImovel>('caracterizacaoImovel');
  campos.condicoesHabitabilidade = parseOptionalObject<CondicoesHabitabilidade>('condicoesHabitabilidade');
  campos.chefeFamilia = parseOptionalObject<ChefeFamilia>('chefeFamilia');
  campos.conjuge = parseOptionalObject<Conjuge>('conjuge');
  campos.demaisMembros = parseOptionalArray<MembroFamilia>('demaisMembros');
  campos.historicoOcorrencias = parseOptionalArray<HistoricoOcorrencia>('historicoOcorrencias');
  campos.interdictioes = parseOptionalArray<Interdicao>('interdictioes');
  campos.desalojamentos = parseOptionalArray<DesalojamentoDesabrigo>('desalojamentos');
  campos.beneficiosAuxilios = parseOptionalArray<BeneficioAuxilio>('beneficiosAuxilios');
  campos.encaminhamentoHabitacional = parseOptionalObject<EncaminhamentoHabitacional>('encaminhamentoHabitacional');
  campos.historicoVistorias = parseOptionalObject<HistoricoVistorias>('historicoVistorias');
  campos.situacaoAtual = parseOptionalObject<SituacaoAtual>('situacaoAtual');
  campos.documentosFotograficos = parseOptionalObject<DocumentosFotograficos>('documentosFotograficos');

  const erros = validarCadastro(campos);
  if (Object.keys(erros).length)
    throw new Error('Dados do cadastro inválidos: ' + Object.values(erros).join('; '));
  return prepararCadastro(campos);
}
