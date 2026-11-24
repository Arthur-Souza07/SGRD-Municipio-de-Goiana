import type {
  DadosFamilia,
  InformacaoImovel,
  CaracterizacaoImovel,
  CondicoesHabitabilidade,
  ChefeFamilia,
  Conjuge,
  MembroFamilia,
  HistoricoOcorrencia,
  Interdicao,
  DesalojamentoDesabrigo,
  BeneficioAuxilio,
  EncaminhamentoHabitacional,
  HistoricoVistorias,
  SituacaoAtual,
  DocumentosFotograficos,
  Comodo,
  LocalizacaoFamilia,
  NivelRisco,
  TipoOcorrencia,
} from './familias';
import { TIPOS_OCORRENCIA } from './familias';
import { centroideBairro, validarLocalizacaoGoiana } from './territorio';
import {
  calcularRiscoTerritorial,
  sortearPontoEmAreaSuscetibilidade,
} from './risco-territorial';

// ============================================================
// SEEDABLE PRNG (Mulberry32)
// ============================================================
class SeededRandom {
  private seed: number;

  constructor(seed: number) {
    this.seed = seed >>> 0;
  }

  next(): number {
    this.seed += 0x6d2b79f5;
    let t = Math.imul(this.seed ^ (this.seed >>> 15), 1 | this.seed);
    t = Math.imul(t ^ (t >>> 7), 61 | t);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  nextInt(min: number, max: number): number {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }

  nextFloat(min: number, max: number): number {
    return this.next() * (max - min) + min;
  }

  choice<T>(arr: T[]): T {
    return arr[this.nextInt(0, arr.length - 1)];
  }

  shuffle<T>(arr: T[]): T[] {
    const copy = [...arr];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = this.nextInt(0, i);
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }

  bool(probability = 0.5): boolean {
    return this.next() < probability;
  }
}

// ============================================================
// CONSTANT DATA POOLS
// ============================================================
const NOMES_MASCULINOS = [
  'José', 'João', 'Antônio', 'Francisco', 'Carlos', 'Paulo', 'Pedro', 'Lucas', 'Luiz', 'Marcos',
  'Gabriel', 'Rafael', 'Daniel', 'Marcelo', 'Bruno', 'Eduardo', 'Felipe', 'Rodrigo', 'Adriano', 'Ricardo',
  'André', 'Alexandre', 'Fabio', 'Vinicius', 'Diego', 'Leonardo', 'Gustavo', 'Fernando', 'Roberto', 'Sérgio',
  'Igor', 'Thiago', 'Matheus', 'Guilherme', 'Enzo', 'Nicolas', 'Miguel', 'Arthur', 'Heitor', 'Bernardo',
  'Davi', 'Lorenzo', 'Théo', 'Noah', 'Isaac', 'Benício', 'Pedro Henrique', 'João Pedro', 'João Lucas', 'João Gabriel',
];

const NOMES_FEMININOS = [
  'Maria', 'Ana', 'Francisca', 'Antônia', 'Adriana', 'Juliana', 'Márcia', 'Fernanda', 'Patrícia', 'Aline',
  'Sandra', 'Camila', 'Amanda', 'Bruna', 'Jessica', 'Letícia', 'Júlia', 'Luciana', 'Vanessa', 'Mariana',
  'Gabriela', 'Rafaela', 'Daniela', 'Marcela', 'Bianca', 'Eduarda', 'Felipe', 'Roberta', 'Adriana', 'Priscila',
  'Isabela', 'Manuela', 'Alice', 'Laura', 'Valentina', 'Sophia', 'Helena', 'Lorena', 'Lara', 'Beatriz',
  'Maria Eduarda', 'Maria Luiza', 'Ana Clara', 'Ana Julia', 'Ana Laura', 'Maria Alice', 'Maria Cecília', 'Maria Helena', 'Maria Fernanda', 'Maria Vitória',
];

const SOBRENOMES = [
  'Silva', 'Santos', 'Oliveira', 'Souza', 'Rodrigues', 'Ferreira', 'Almeida', 'Costa', 'Pereira', 'Lima',
  'Gomes', 'Martins', 'Ribeiro', 'Carvalho', 'Alves', 'Rocha', 'Nascimento', 'Araujo', 'Monteiro', 'Cardoso',
  'Melo', 'Barbosa', 'Freitas', 'Barros', 'Cavalcanti', 'Azevedo', 'Moraes', 'Machado', 'Vieira', 'Correia',
  'Farias', 'Moreira', 'Nunes', 'Cunha', 'Macedo', 'Borges', 'Batista', 'Moraes', 'Santana', 'Andrade',
  'Dias', 'Castro', 'Cruz', 'Mendonça', 'Moura', 'Neto', 'Rocha', 'Siqueira', 'Teixeira', 'Viana',
];

const RUAS_GOIANA = [
  'Rua da Matriz', 'Rua Direita', 'Rua do Sol', 'Rua Nova', 'Rua da Aurora', 'Rua do Príncipe',
  'Rua 15 de Novembro', 'Rua Padre Francisco', 'Rua Dr. José Mariano', 'Rua Coronel Alexandrino',
  'Avenida Getúlio Vargas', 'Avenida Marechal Floriano', 'Avenida Sete de Setembro', 'Avenida Doutor José Mariano',
  'Rua das Flores', 'Rua do Comércio', 'Rua da Conceição', 'Rua Santo Antônio', 'Rua São José', 'Rua São Pedro',
  'Travessa da Matriz', 'Travessa do Sol', 'Travessa das Flores', 'Beco da Aurora', 'Beco do Príncipe',
  'Rua da Paz', 'Rua da Esperança', 'Rua da Alegria', 'Rua da Liberdade', 'Rua da União',
];

const BAIRROS_GOIANA = [
  'Centro', 'Vista Plena', 'Flexeiras', 'Distrito Industrial', 'Portelinha', 'Bom Tempo',
  'Sítio dos Bragas', 'Barro Vermelho', 'Portal Goiana', 'Boa Vista', 'Paraíso',
  'Cidade Nova', 'Bom Jesus', 'Curtume', 'Subestação', 'Bela Vista', 'Vila Castelo Branco',
  'Northville', 'Mutirão', 'Nova Goiana', 'Novo Horizonte', 'Núcleo Industrial',
  'Tanquinho', 'Matadouro', 'Impoeira',
];

const OCUPACOES = [
  'Trabalhador autônomo', 'Motorista', 'Professor', 'Vendedor', 'Aposentado', 'Estudante',
  'Costureira', 'Doméstica', 'Pedreiro', 'Carpinteiro', 'Eletricista', 'Encanador',
  'Mecânico', 'Comerciante', 'Agricultor', 'Pescador', 'Vigilante', 'Cozinheiro',
  'Auxiliar de serviços gerais', 'Operador de caixa', 'Atendente', 'Recepcionista',
  'Cuidador de idosos', 'Babá', 'Jardineiro', 'Pintor', 'Soldador', 'Torneiro mecânico',
];

const DEFICIENCIAS = [
  'Mobilidade reduzida', 'Deficiência visual', 'Deficiência auditiva', 'Deficiência intelectual',
  'Deficiência múltipla', 'Transtorno do espectro autista', 'Síndrome de Down', 'Paralisia cerebral',
  'Amputação', 'Doença rara', '',
];

const BENEFICIOS = [
  'Bolsa Família', 'BPC/LOAS', 'Auxílio Aluguel', 'FGTS Calamidade', 'Auxílio Emergencial',
  'Benefício de Prestação Continuada', 'Aposentadoria', 'Pensão por Morte', 'Salário Maternidade',
  'Auxílio Doença', 'Seguro Desemprego', 'Programa Criança Feliz', 'Carteira do Idoso',
];

const DOCUMENTOS_COMUNS = [
  'RG', 'CPF', 'Comprovante de residência', 'Certidão de nascimento', 'Certidão de casamento',
  'Título de eleitor', 'Carteira de trabalho', 'Cartão SUS', 'Escritura/Contrato', 'IPTU',
  'Certidão de óbito', 'Comprovante de renda', 'Declaração de união estável',
];

const ESTADOS_CIVIS = ['solteiro', 'casado', 'divorciado', 'viuvo', 'uniao_estavel', 'outro'] as const;
const RACAS_COR = ['branca', 'preta', 'parda', 'amarela', 'indigena', 'nao_declarada'] as const;
const IDENTIDADES_GENERO = ['masculino', 'feminino', 'transgenero', 'nao_binario', 'outro', 'prefiro_nao_dizer'] as const;

type RacaCor = typeof RACAS_COR[number];
type IdentidadeGenero = typeof IDENTIDADES_GENERO[number];

// ============================================================
// HELPER FUNCTIONS
// ============================================================
function gerarCPFValido(rng: SeededRandom): string {
  // Generate 9 random digits
  const digits: number[] = [];
  for (let i = 0; i < 9; i++) {
    digits.push(rng.nextInt(0, 9));
  }

  // Calculate first check digit
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += digits[i] * (10 - i);
  }
  let remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  digits.push(remainder);

  // Calculate second check digit
  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += digits[i] * (11 - i);
  }
  remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  digits.push(remainder);

  // Format as XXX.XXX.XXX-XX
  return `${digits[0]}${digits[1]}${digits[2]}.${digits[3]}${digits[4]}${digits[5]}.${digits[6]}${digits[7]}${digits[8]}-${digits[9]}${digits[10]}`;
}

function formatarDataBR(dataISO: string): string {
  if (!dataISO) return '';
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(dataISO)) return dataISO;
  const parts = dataISO.split('-');
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return dataISO;
}

function calcularIdade(dataNascISO: string): number {
  const hoje = new Date();
  const [ano, mes, dia] = dataNascISO.split('-').map(Number);
  const dataNasc = new Date(ano, mes - 1, dia);
  let idade = hoje.getFullYear() - dataNasc.getFullYear();
  const m = hoje.getMonth() - dataNasc.getMonth();
  if (m < 0 || (m === 0 && hoje.getDate() < dataNasc.getDate())) idade--;
  return idade;
}

function gerarDataNascimento(rng: SeededRandom, idadeMin: number, idadeMax: number): string {
  const hoje = new Date();
  const idade = rng.nextInt(idadeMin, idadeMax);
  const ano = hoje.getFullYear() - idade;
  const mes = rng.nextInt(1, 12);
  const diasNoMes = new Date(ano, mes, 0).getDate();
  const dia = rng.nextInt(1, diasNoMes);
  return `${ano}-${String(mes).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;
}

function gerarTelefone(rng: SeededRandom): string {
  const prefixo = rng.choice(['99', '98', '97', '96', '95', '94', '93', '92', '91']);
  const parte1 = rng.nextInt(1000, 9999);
  const parte2 = rng.nextInt(1000, 9999);
  return `(81) ${prefixo}${parte1}-${parte2}`;
}

function gerarNomeCompleto(rng: SeededRandom, genero?: 'M' | 'F'): string {
  const primeiroNome = genero === 'F'
    ? rng.choice(NOMES_FEMININOS)
    : genero === 'M'
      ? rng.choice(NOMES_MASCULINOS)
      : rng.choice([...NOMES_MASCULINOS, ...NOMES_FEMININOS]);
  const sobrenome1 = rng.choice(SOBRENOMES);
  const sobrenome2 = rng.choice(SOBRENOMES.filter(s => s !== sobrenome1));
  return `${primeiroNome} ${sobrenome1} ${sobrenome2}`;
}

function gerarEndereco(rng: SeededRandom): { logradouro: string; numero: string; complemento: string; bairro: string } {
  const logradouro = rng.choice(RUAS_GOIANA);
  const numero = rng.choice(['S/N', String(rng.nextInt(1, 999)), `${rng.nextInt(1, 500)}A`, `${rng.nextInt(1, 500)}B`]);
  const complemento = rng.bool(0.3) ? rng.choice(['Casa', 'Apto', 'Fundos', 'Frente', 'Lote', 'Quadra']) + ' ' + rng.nextInt(1, 50) : '';
  const bairro = rng.choice(BAIRROS_GOIANA);
  return { logradouro, numero, complemento, bairro };
}

function gerarCoordenadasGoiana(
  rng: SeededRandom,
  bairroAlvo?: string
): LocalizacaoFamilia {
  // Goiana bounds (from IBGE 2025 GeoJSON): lat -7.7147 to -7.4620, lon -35.0778 to -34.8067
  // Use rejection sampling to ensure points fall within the actual municipality polygon
  const MIN_LON = -35.0778;
  const MAX_LON = -34.8067;
  const MIN_LAT = -7.7147;
  const MAX_LAT = -7.4620;

  let latitude: number;
  let longitude: number;
  let attempts = 0;
  const maxAttempts = 1000;

  // If a specific bairro is requested, use its centroid as center and try to generate nearby
  if (bairroAlvo) {
    const centroide = centroideBairro(bairroAlvo);
    if (centroide) {
      // Generate points around the centroid with a smaller radius
      const raio = 0.015; // ~1.5km in degrees
      do {
        // Generate in a box around centroid
        const deltaLat = rng.nextFloat(-raio, raio);
        const deltaLon = rng.nextFloat(-raio, raio);
        latitude = centroide.latitude + deltaLat;
        longitude = centroide.longitude + deltaLon;
        attempts++;
      } while (
        !validarLocalizacaoGoiana(longitude, latitude).valido &&
        attempts < maxAttempts
      );

      if (attempts < maxAttempts) {
        return {
          latitude,
          longitude,
          origem: rng.choice(['gps', 'mapa', 'coordenadas']),
          precisaoMetros: rng.nextInt(5, 30),
        };
      }
    }
  }

  // Fallback: general rejection sampling within municipality
  do {
    latitude = rng.nextFloat(MIN_LAT, MAX_LAT);
    longitude = rng.nextFloat(MIN_LON, MAX_LON);
    attempts++;
  } while (!validarLocalizacaoGoiana(longitude, latitude).valido && attempts < maxAttempts);

  // Final fallback to a known valid point (Centro) if rejection sampling fails
  if (attempts >= maxAttempts) {
    latitude = -7.5608;
    longitude = -35.0009;
  }

  return {
    latitude,
    longitude,
    origem: rng.choice(['gps', 'mapa', 'coordenadas']),
    precisaoMetros: rng.nextInt(5, 30),
  };
}

// ============================================================
// MAIN GENERATOR FUNCTIONS
// ============================================================

// Interface kept for potential future use, but not exported to reduce bundle size
interface GeradorOpcoes {
  seed?: number;
  risco?: NivelRisco;
  bairro?: string;
  numMembros?: number;
  preferirAreaSuscetibilidade?: boolean;
}

function RiscoTipoOcorrencia(rng: SeededRandom, risco: NivelRisco): TipoOcorrencia {
  switch (risco) {
    case 'alto': return rng.bool(0.5) ? 'inundacao' : 'deslizamento';
    case 'medio': return rng.choice(['inundacao', 'alagamento', 'deslizamento', 'erosao']);
    case 'baixo': return rng.choice(['erosao', 'outro']);
    default: return 'nao_informado';
  }
}

function gerarInformacaoImovel(
  rng: SeededRandom,
  endereco: ReturnType<typeof gerarEndereco>,
  localizacao: LocalizacaoFamilia,
  risco: NivelRisco,
  avaliacaoTerritorial = calcularRiscoTerritorial(localizacao.longitude, localizacao.latitude),
): InformacaoImovel {
  const hoje = new Date();
  const dataCadastro = `${String(hoje.getDate()).padStart(2, '0')}/${String(hoje.getMonth() + 1).padStart(2, '0')}/${hoje.getFullYear()}`;
  const dataAtualizacao = rng.bool(0.7) ? dataCadastro : '-';

  const tipoRiscoLabels: Record<NivelRisco, string> = {
    alto: 'Alto',
    medio: 'Médio',
    baixo: 'Baixo',
    nao_informado: 'Não informado',
  };

  const tipoOcorrencia: TipoOcorrencia =
    avaliacaoTerritorial.tipoPrioritario === 'inundacao'
      ? 'inundacao'
      : avaliacaoTerritorial.tipoPrioritario === 'movimento'
        ? 'deslizamento'
        : RiscoTipoOcorrencia(rng, risco);

  return {
    municipio: 'GOIANA / PE',
    dataCadastro,
    dataUltimaAtualizacao: dataAtualizacao,
    comunidade: endereco.bairro,
    endereco: endereco.logradouro,
    numero: endereco.numero,
    complemento: endereco.complemento,
    bairro: endereco.bairro,
    distrito: 'Goiana',
    longitude: String(localizacao.longitude),
    latitude: String(localizacao.latitude),
    tipoRisco: TIPOS_OCORRENCIA[tipoOcorrencia] || 'Não informado',
    grauRisco: tipoRiscoLabels[risco],
  };
}

function gerarCaracterizacaoImovel(rng: SeededRandom): CaracterizacaoImovel {
  const usoImovel = rng.choice(['Residencial', 'Comercial', 'Misto', 'Institucional']);
  const condicoesOcupacao = rng.choice(['proprio', 'alugado', 'cedido', 'invasao', 'outro']) as CaracterizacaoImovel['condicoesOcupacao'];
  const imovelVerticalizado = rng.bool(0.15) ? 'sim' : 'nao';

  const comodosTipos = [
    { nome: 'Quarto', max: 4 },
    { nome: 'Sala', max: 2 },
    { nome: 'Cozinha', max: 1 },
    { nome: 'Banheiro', max: 3 },
    { nome: 'Área de serviço', max: 1 },
    { nome: 'Garagem', max: 2 },
    { nome: 'Varanda', max: 1 },
    { nome: 'Escritório', max: 1 },
    { nome: 'Despensa', max: 1 },
  ];

  const comodos: Comodo[] = [];
  for (const tipo of comodosTipos) {
    if (rng.bool(0.7)) {
      comodos.push({ nome: tipo.nome, quantidade: rng.nextInt(1, tipo.max) });
    }
  }

  return {
    usoImovel,
    condicoesOcupacao,
    valorAluguel: condicoesOcupacao === 'alugado' ? String(rng.nextInt(300, 2000)) : undefined,
    nomeLocador: condicoesOcupacao === 'alugado' ? gerarNomeCompleto(rng) : undefined,
    imovelVerticalizado,
    numeroPavimentos: imovelVerticalizado === 'sim' ? String(rng.nextInt(2, 10)) : undefined,
    pavimentosOcupa: imovelVerticalizado === 'sim' ? String(rng.nextInt(1, 3)) : undefined,
    areaTerreno: String(rng.nextInt(60, 500)),
    areaConstrucao: String(rng.nextInt(40, 300)),
    comodos,
  };
}

function gerarCondicoesHabitabilidade(rng: SeededRandom): CondicoesHabitabilidade {
  return {
    tipoConstrucao: rng.choice(['alvenaria', 'madeira', 'mista', 'taipa', 'container', 'outro']),
    padraoAcabamento: rng.choice(['alto', 'medio', 'baixo', 'sem_acabamento']),
    tipoCoberta: rng.choice(['laje', 'telha_ceramica', 'telha_metalica', 'telha_fibrocimento', 'palha', 'outro']),
    saneamentoBasico: rng.choice(['rede_coletora', 'fossa_setica', 'fossa_rudimentar', 'valao', 'inexistente']),
    abastecimentoAgua: rng.choice(['rede_publica', 'poco_artesiano', 'cisterna', 'carro_pipa', 'outro']),
    aguasPluviais: rng.choice(['rede_coletora', 'valao', 'superficial', 'inexistente']),
    pavimentacao: rng.choice(['asfalto', 'paralelepipedo', 'bloquete', 'terra', 'outro']),
    iluminacaoPublica: rng.choice(['sim', 'nao', 'parcial']),
    coletaResiduos: rng.choice(['sim', 'nao']),
  };
}

function gerarPessoaCompleta(rng: SeededRandom, genero: 'M' | 'F', idadeMin: number, idadeMax: number, isChefe = false): ChefeFamilia {
  const dataNascimento = gerarDataNascimento(rng, idadeMin, idadeMax);
  const idade = calcularIdade(dataNascimento);
  const cpf = gerarCPFValido(rng);
  const nome = gerarNomeCompleto(rng, genero);
  const telefone = gerarTelefone(rng);
  const rg = `${rng.nextInt(1000000, 9999999)}`;
  const nisPis = rng.bool(0.6) ? String(rng.nextInt(10000000000, 99999999999)) : '';
  const estadoCivil = rng.choice([...ESTADOS_CIVIS]);
  const identidadeGenero: IdentidadeGenero = genero === 'M' ? 'masculino' : 'feminino';
  const racaCor: RacaCor = rng.choice([...RACAS_COR]);
  const ocupacaoProfissional = isChefe || rng.bool(0.7) ? rng.choice(OCUPACOES) : '';
  const rendaFamiliar = isChefe || rng.bool(0.5) ? String(rng.nextInt(0, 5000)) : '';
  const beneficiosSocioassistenciais = rng.bool(0.4) ? rng.choice(BENEFICIOS) : '';
  const possuiDeficiencia = rng.bool(0.15) ? 'sim' : 'nao';
  const deficienciaQual = possuiDeficiencia === 'sim' ? rng.choice(DEFICIENCIAS.filter(d => d)) : '';
  const observacao = rng.bool(0.3) ? rng.choice([
    'Necessita cuidados especiais',
    'Acompanhamento de responsável',
    'Mobilidade reduzida; necessita acompanhamento',
    'Em tratamento de saúde',
    'Estrutura comprometida',
    '',
  ]) : '';

  return {
    nome,
    apelidoNomeSocial: rng.bool(0.2) ? rng.choice(['Neto', 'Beto', 'Duda', 'Lulu', 'Zezé', '']) : '',
    telefone,
    cpf,
    rg,
    dataNascimento: formatarDataBR(dataNascimento),
    idade,
    estadoCivil,
    nisPis,
    identidadeGenero,
    racaCor,
    ocupacaoProfissional,
    rendaFamiliar,
    beneficiosSocioassistenciais,
    possuiDeficiencia: possuiDeficiencia as 'sim' | 'nao' | 'nao_informado',
    deficienciaQual,
    observacao,
  };
}

function gerarMembroFamilia(rng: SeededRandom, parentesco: MembroFamilia['vinculoSocialParentesco']): MembroFamilia {
  let idadeMin = 0, idadeMax = 30, genero: 'M' | 'F' = rng.bool(0.5) ? 'M' : 'F';

  if (parentesco === 'pai_mae' || parentesco === 'avo') {
    idadeMin = 50;
    idadeMax = 90;
    genero = parentesco === 'pai_mae' ? (rng.bool(0.5) ? 'M' : 'F') : (parentesco === 'avo' && rng.bool(0.5) ? 'M' : 'F');
  } else if (parentesco === 'filho' || parentesco === 'neto') {
    idadeMin = 0;
    idadeMax = 30;
  } else if (parentesco === 'irmao') {
    idadeMin = 18;
    idadeMax = 60;
  } else if (parentesco === 'conjuge') {
    idadeMin = 25;
    idadeMax = 70;
  }

  const base = gerarPessoaCompleta(rng, genero, idadeMin, idadeMax);
  return {
    ...base,
    vinculoSocialParentesco: parentesco,
    cor: base.racaCor,
  };
}

function gerarHistoricoOcorrencias(rng: SeededRandom, risco: NivelRisco): HistoricoOcorrencia[] {
  const num = rng.nextInt(0, 3);
  if (num === 0) return [];

  const ocorrencias: HistoricoOcorrencia[] = [];
  for (let i = 0; i < num; i++) {
    const ano = rng.nextInt(2015, new Date().getFullYear());
    ocorrencias.push({
      jaFoiAtingido: 'sim',
      tipoOcorrencia: TIPOS_OCORRENCIA[RiscoTipoOcorrencia(rng, risco)] || 'Não informado',
      dataAnoOcorrencia: String(ano),
      houveDanosEdificacao: rng.choice(['sim', 'nao', 'parcial', 'nao_informado']),
      houvePerdaBens: rng.choice(['sim', 'nao', 'nao_informado']),
      houvePerdaTotalParcialImovel: rng.choice(['sim', 'nao', 'parcial', 'total', 'nao_informado']),
      observacao: rng.bool(0.6) ? rng.choice([
        'Enchente - água atingiu 1,2m',
        'Deslizamento de terra nos fundos',
        'Alagamento rápido',
        'Erosão na margem do rio',
        'Danos na estrutura da casa',
        'Perda de móveis e eletrodomésticos',
        'Enchente de junho/2022 - água atingiu 1,2m',
        'Danos na estrutura da casa',
        'Enchente rápida',
      ]) : '',
    });
  }
  return ocorrencias;
}

function gerarInterdictioes(rng: SeededRandom): Interdicao[] {
  if (rng.bool(0.8)) return [];

  const num = rng.nextInt(1, 2);
  const interdictioes: Interdicao[] = [];
  for (let i = 0; i < num; i++) {
    const ano = rng.nextInt(2015, new Date().getFullYear());
    const mes = rng.nextInt(1, 12);
    const dia = rng.nextInt(1, 28);
    interdictioes.push({
      imovelJaFoiInterditado: 'sim',
      tipo: rng.choice(['total', 'parcial', 'preventiva', 'outro']),
      dataInterdicao: `${String(dia).padStart(2, '0')}/${String(mes).padStart(2, '0')}/${ano}`,
      houveEvacuacaoDesocupacao: rng.choice(['sim', 'nao', 'nao_informado']),
      houveRecomendacaoRemocaoDefinitiva: rng.choice(['sim', 'nao', 'nao_informado']),
      observacao: rng.bool(0.7) ? rng.choice([
        'Estrutura comprometida',
        'Risco de deslizamento',
        'Inundação severa',
        'Condenação pela Defesa Civil',
        '',
      ]) : '',
    });
  }
  return interdictioes;
}

function gerarDesalojamentos(rng: SeededRandom): DesalojamentoDesabrigo[] {
  if (rng.bool(0.7)) return [];

  const num = rng.nextInt(1, 2);
  const desalojamentos: DesalojamentoDesabrigo[] = [];
  const locais = ['Escola Municipal', 'Igreja', 'Ginásio esportivo', 'Casa de parente', 'Abrigo público', 'Hotel social'];
  for (let i = 0; i < num; i++) {
    desalojamentos.push({
      familiaJaFicouDesalojada: 'sim',
      familiaJaFicouDesabrigada: rng.choice(['sim', 'nao', 'nao_informado']),
      periodo: `${rng.nextInt(1, 180)} dias`,
      localAcolhimento: rng.choice(locais),
      retornouAoImovel: rng.choice(['sim', 'nao', 'nao_informado']),
    });
  }
  return desalojamentos;
}

function gerarBeneficiosAuxilios(rng: SeededRandom): BeneficioAuxilio[] {
  if (rng.bool(0.5)) return [];

  const num = rng.nextInt(1, 2);
  const beneficios: BeneficioAuxilio[] = [];
  for (let i = 0; i < num; i++) {
    const mes = rng.nextInt(1, 12);
    const ano = rng.nextInt(2015, new Date().getFullYear());
    beneficios.push({
      jaRecebeuBeneficioAuxilio: 'sim',
      tipoBeneficio: rng.choice(BENEFICIOS),
      data: `${String(mes).padStart(2, '0')}/${ano}`,
      observacao: rng.bool(0.5) ? rng.choice([
        '3 parcelas de R$ 600,00',
        'Parcela única de R$ 1.000,00',
        'Auxílio emergencial COVID-19',
        'FGTS Calamidade - saque autorizado',
        'Auxílio Aluguel - 6 meses',
        '',
      ]) : '',
    });
  }
  return beneficios;
}

function gerarEncaminhamentoHabitacional(rng: SeededRandom): EncaminhamentoHabitacional {
  if (rng.bool(0.6)) {
    return { jaFoiEncaminhado: 'nao', observacao: '' };
  }
  const ano = rng.nextInt(2015, new Date().getFullYear());
  const mes = rng.nextInt(1, 12);
  return {
    jaFoiEncaminhado: 'sim',
    data: `${String(mes).padStart(2, '0')}/${ano}`,
    observacao: rng.choice([
      'Encaminhada para programa Minha Casa Minha Vida - Faixa 1',
      'Inscrita no cadastro habitacional municipal',
      'Aguardando sorteio de unidade habitacional',
      'Encaminhada para reassentamento em área segura',
      'Processo de regularização fundiária em andamento',
      '',
    ]),
  };
}

function gerarHistoricoVistorias(rng: SeededRandom): HistoricoVistorias {
  const assistentes = ['Maria Silva', 'João Santos', 'Ana Oliveira', 'Carlos Ferreira', 'Luciana Costa', 'Pedro Almeida'];
  const tecnicos = ['Eng. André Cavalcanti', 'Eng. Isabela Santana', 'Eng. João Santos', 'Eng. Maria Oliveira', 'Arq. Carlos Lima'];

  return {
    jaFoiAtendidaAssistenciaSocial: rng.choice(['sim', 'nao', 'nao_informado']),
    dataUltimaVistoriaAssistencia: rng.bool(0.7) ? `${String(rng.nextInt(1, 12)).padStart(2, '0')}/${rng.nextInt(2020, new Date().getFullYear())}` : '',
    assistenteSocialResponsavel: rng.bool(0.7) ? `${rng.choice(assistentes)} - CRAS ${rng.choice(['Centro', 'Norte', 'Sul', 'Leste'])}` : '',
    jaFoiRealizadaVistoriaTecnicaDefesaCivil: rng.choice(['sim', 'nao', 'nao_informado']),
    dataUltimaVistoriaDefesaCivil: rng.bool(0.7) ? `${String(rng.nextInt(1, 12)).padStart(2, '0')}/${rng.nextInt(2020, new Date().getFullYear())}` : '',
    tecnicoResponsavel: rng.bool(0.7) ? `${rng.choice(tecnicos)} - Defesa Civil Goiana` : '',
  };
}

function gerarSituacaoAtual(rng: SeededRandom): SituacaoAtual {
  return {
    emAcompanhamentoDefesaCivil: rng.choice(['sim', 'nao', 'nao_informado']),
    observacao: rng.bool(0.5) ? rng.choice([
      'Família em área de risco monitorada. Recomendada remoção preventiva.',
      'Aguardando reassentamento em área segura.',
      'Em acompanhamento pelo CRAS e Defesa Civil.',
      'Situação estável. Monitoramento periódico.',
      'Encaminhada para programa habitacional.',
      'Família realocada. Acompanhamento pós-desastre.',
      '',
    ]) : '',
  };
}

function gerarDocumentosFotograficos(rng: SeededRandom): DocumentosFotograficos {
  const temDocumentos = rng.choice(['sim', 'nao', 'parcial']);
  const numDocs = rng.nextInt(2, 6);
  const docsSelecionados = rng.shuffle(DOCUMENTOS_COMUNS).slice(0, numDocs);

  return {
    possuiDocumentos: temDocumentos as 'sim' | 'nao' | 'parcial',
    listaDocumentos: temDocumentos !== 'nao' ? docsSelecionados : [],
    possuiRegistroFotografico: rng.choice(['sim', 'nao']),
    descricaoFotos: rng.bool(0.6) ? rng.choice([
      'Fachada da residência, interior, danos da enchente 2022',
      'Fachada, cômodos, área externa',
      'Residência e entorno, marcas de água',
      'Imóvel, documentos, família',
      'Comunidade/Entorno',
      'Fachada da casa, danos estruturais, móveis danificados',
      '',
    ]) : '',
  };
}

// ============================================================
// MAIN EXPORT FUNCTIONS
// ============================================================

let rngGlobal: SeededRandom;

function getRng(seed?: number): SeededRandom {
  if (seed !== undefined) {
    return new SeededRandom(seed);
  }
  if (!rngGlobal) {
    rngGlobal = new SeededRandom(Date.now());
  }
  return rngGlobal;
}

function gerarFamiliaCompleta(opcoes: GeradorOpcoes = {}): DadosFamilia {
  const rng = getRng(opcoes.seed);
  const endereco = gerarEndereco(rng);
  if (opcoes.bairro) endereco.bairro = opcoes.bairro;
  const pontoSuscetibilidade = opcoes.preferirAreaSuscetibilidade
    ? sortearPontoEmAreaSuscetibilidade(() => rng.next())
    : null;
  const localizacao = pontoSuscetibilidade
    ? {
        ...pontoSuscetibilidade,
        origem: rng.choice(['gps', 'mapa', 'coordenadas'] as const),
        precisaoMetros: rng.nextInt(5, 30),
      }
    : gerarCoordenadasGoiana(rng, endereco.bairro);
  const avaliacaoTerritorial = calcularRiscoTerritorial(
    localizacao.longitude,
    localizacao.latitude,
  );
  const risco: NivelRisco = opcoes.risco
    ? opcoes.risco
    : avaliacaoTerritorial.nivel;
  const tipoOcorrencia: TipoOcorrencia =
    avaliacaoTerritorial.tipoPrioritario === 'inundacao'
      ? 'inundacao'
      : avaliacaoTerritorial.tipoPrioritario === 'movimento'
        ? 'deslizamento'
        : opcoes.risco
          ? RiscoTipoOcorrencia(rng, risco)
          : 'nao_informado';

  // Generate family composition
  const numMembros = opcoes.numMembros ?? rng.nextInt(1, 8);
  const temConjuge = rng.bool(0.7) && numMembros >= 2;

  // Chefe da família
  const idadeChefe = rng.nextInt(25, 75);
  const generoChefe = rng.choice(['M', 'F']) as 'M' | 'F';
  const chefeFamilia = gerarPessoaCompleta(rng, generoChefe, idadeChefe, idadeChefe, true);

  // Cônjuge
  let conjuge: Conjuge | undefined;
  if (temConjuge) {
    const idadeConjuge = Math.max(18, idadeChefe + rng.nextInt(-10, 10));
    const generoConjuge = generoChefe === 'M' ? 'F' : 'M';
    conjuge = gerarPessoaCompleta(rng, generoConjuge, idadeConjuge, idadeConjuge);
    conjuge.estadoCivil = 'casado';
    chefeFamilia.estadoCivil = 'casado';
  }

  // Demais membros
  const demaisMembros: MembroFamilia[] = [];
  const parentescosValidos: MembroFamilia['vinculoSocialParentesco'][] = ['filho', 'pai_mae', 'avo', 'neto', 'irmao', 'outro'];

  let membrosCriados = temConjuge ? 2 : 1;
  while (membrosCriados < numMembros) {
    const parentesco = rng.choice(parentescosValidos);
    // Avoid duplicate pai_mae or avo unless realistic
    if ((parentesco === 'pai_mae' || parentesco === 'avo') && membrosCriados > 2 && rng.bool(0.7)) continue;
    const membro = gerarMembroFamilia(rng, parentesco);
    demaisMembros.push(membro);
    membrosCriados++;
  }

  return {
    nomeRepresentante: chefeFamilia.nome,
    cpf: chefeFamilia.cpf?.replace(/\D/g, '') || '',
    telefone: chefeFamilia.telefone?.replace(/\D/g, '') || '',
    logradouro: endereco.logradouro,
    numero: endereco.numero,
    bairro: endereco.bairro,
    complemento: endereco.complemento,
    moradores: numMembros,
    nivelRisco: risco,
    tipoOcorrencia,
    observacoes: rng.bool(0.3) ? rng.choice([
      'Família em área de risco monitorada.',
      'Necessita acompanhamento prioritário.',
      'Residência em encosta instável.',
      'Próxima à margem do rio.',
      'Área de alagamento recorrente.',
      '',
    ]) : '',
    localizacao,
    nascimentoRepresentante: chefeFamilia.dataNascimento,
    apoioRepresentante: chefeFamilia.observacao,
    informacaoImovel: gerarInformacaoImovel(
      rng,
      endereco,
      localizacao,
      avaliacaoTerritorial.nivel,
      avaliacaoTerritorial,
    ),
    caracterizacaoImovel: gerarCaracterizacaoImovel(rng),
    condicoesHabitabilidade: gerarCondicoesHabitabilidade(rng),
    chefeFamilia,
    conjuge,
    demaisMembros,
    historicoOcorrencias: gerarHistoricoOcorrencias(rng, risco),
    interdictioes: gerarInterdictioes(rng),
    desalojamentos: gerarDesalojamentos(rng),
    beneficiosAuxilios: gerarBeneficiosAuxilios(rng),
    encaminhamentoHabitacional: gerarEncaminhamentoHabitacional(rng),
    historicoVistorias: gerarHistoricoVistorias(rng),
    situacaoAtual: gerarSituacaoAtual(rng),
    documentosFotograficos: gerarDocumentosFotograficos(rng),
  };
}

export function gerarFamiliasDemo(quantidade: number, seed: number = 20261030): DadosFamilia[] {
  const rng = new SeededRandom(seed);
  const familias: DadosFamilia[] = [];

  for (let i = 0; i < quantidade; i++) {
    // Use a derived seed for each family to ensure reproducibility but variety
    const familySeed = (seed + i + 1) * 1000 + rng.nextInt(1, 999);
    const familia = gerarFamiliaCompleta({
      seed: familySeed,
      preferirAreaSuscetibilidade: rng.bool(0.5),
    });
    familias.push(familia);
  }

  return familias;
}