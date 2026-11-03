export type Registro = Record<string, string>;
export interface Campo {
  id: string;
  titulo: string;
  tipo?: string;
  opcoes?: string[];
  obrigatorio?: boolean;
}

// Configuração básica do formulário existente; a equipe do RF02 pode ampliá-la.
export const secoes: { titulo: string; campos: Campo[] }[] = [
  {
    titulo: 'Residência e localização',
    campos: [
      { id: 'municipio', titulo: 'Município' },
      { id: 'dataCadastro', titulo: 'Data do cadastro', tipo: 'date' },
      {
        id: 'logradouro',
        titulo: 'Rua ou acesso à residência',
        obrigatorio: true,
      },
      { id: 'numero', titulo: 'Número ou S/N', obrigatorio: true },
      { id: 'bairro', titulo: 'Bairro / localidade', obrigatorio: true },
      { id: 'complemento', titulo: 'Complemento / referência' },
    ],
  },
  {
    titulo: 'Responsável familiar',
    campos: [
      { id: 'nome', titulo: 'Nome completo', obrigatorio: true },
      { id: 'cpf', titulo: 'CPF', obrigatorio: true },
      { id: 'dataNascimento', titulo: 'Data de nascimento', tipo: 'date' },
      { id: 'telefone', titulo: 'Telefone com DDD', tipo: 'tel' },
    ],
  },
  {
    titulo: 'Composição do domicílio',
    campos: [
      {
        id: 'moradores',
        titulo: 'Total de moradores, incluindo o responsável',
        tipo: 'number',
        obrigatorio: true,
      },
    ],
  },
  {
    titulo: 'Necessidades de atendimento',
    campos: [
      {
        id: 'apoio',
        titulo: 'Apoio necessário ao responsável para atendimento ou evacuação',
        tipo: 'textarea',
      },
    ],
  },
  {
    titulo: 'Avaliação registrada',
    campos: [
      {
        id: 'nivelRisco',
        titulo: 'Nível de risco informado',
        tipo: 'select',
        opcoes: ['Não informado', 'Baixo', 'Médio', 'Alto'],
      },
      {
        id: 'tipoOcorrencia',
        titulo: 'Tipo de ocorrência',
        tipo: 'select',
        opcoes: [
          'Não informado',
          'Inundação de rio',
          'Alagamento',
          'Deslizamento',
          'Erosão',
          'Outro',
        ],
      },
      { id: 'observacoes', titulo: 'Observações da equipe', tipo: 'textarea' },
    ],
  },
];
export const pessoaCampos: Campo[] = [
  { id: 'nome', titulo: 'Nome completo', obrigatorio: true },
  { id: 'cpf', titulo: 'CPF, se informado' },
  {
    id: 'dataNascimento',
    titulo: 'Data de nascimento',
    tipo: 'date',
    obrigatorio: true,
  },
  {
    id: 'parentesco',
    titulo: 'Parentesco',
    tipo: 'select',
    obrigatorio: true,
    opcoes: [
      'Cônjuge / companheiro(a)',
      'Filho(a)',
      'Pai / mãe',
      'Avô / avó',
      'Neto(a)',
      'Irmão / irmã',
      'Outro vínculo',
    ],
  },
  { id: 'apoio', titulo: 'Necessidades de apoio', tipo: 'textarea' },
];
export const ocorrenciaCampos: Campo[] = [
  { id: 'data', titulo: 'Data da ocorrência', tipo: 'date' },
  { id: 'tipo', titulo: 'Tipo de ocorrência' },
  { id: 'descricao', titulo: 'Descrição', tipo: 'textarea' },
];
export interface CadastroPessoaDados {
  dados: Registro;
  familia: Registro[];
  ocorrencias: Registro[];
  latitude: number;
  longitude: number;
}
