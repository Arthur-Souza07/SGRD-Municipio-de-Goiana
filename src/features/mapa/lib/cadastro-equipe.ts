import type { CadastroPessoaDados } from '../../../components/cadastro/campos';
import {
  FORMULARIO_VAZIO,
  gerarIdentificador,
  prepararCadastro,
  TIPOS_OCORRENCIA,
  validarCadastro,
} from './familias';
import { PARENTESCOS, type Parentesco } from './integrantes';
import { normalizarNivel } from './pontos';

/** Traduz a ficha da equipe para o contrato usado pelo mapa e pelos detalhes. */
export function converterCadastroEquipe(registro: CadastroPessoaDados) {
  const { dados, familia, ocorrencias } = registro;
  const historico = ocorrencias
    .map((item) =>
      [item.data, item.tipo, item.descricao].filter(Boolean).join(' · '),
    )
    .filter(Boolean);
  const campos = {
    ...FORMULARIO_VAZIO,
    nomeRepresentante: dados.nome || '',
    cpf: dados.cpf || '',
    telefone: dados.telefone || '',
    logradouro: dados.logradouro || '',
    numero: dados.numero || '',
    bairro: dados.bairro || '',
    complemento: dados.complemento || '',
    moradores: dados.moradores || String(familia.length + 1),
    nascimentoRepresentante: dados.dataNascimento || '',
    apoioRepresentante: dados.apoio || '',
    nivelRisco: normalizarNivel(dados.nivelRisco),
    tipoOcorrencia:
      (Object.entries(TIPOS_OCORRENCIA).find(
        ([, rotulo]) => rotulo === dados.tipoOcorrencia,
      )?.[0] as keyof typeof TIPOS_OCORRENCIA) || 'nao_informado',
    observacoes: [
      dados.observacoes,
      ...(historico.length ? ['Histórico de ocorrências:', ...historico] : []),
    ]
      .filter(Boolean)
      .join('\n'),
    localizacao: {
      latitude: registro.latitude,
      longitude: registro.longitude,
      origem: 'gps' as const,
    },
    familiares: familia.map((pessoa) => {
      const parentesco = Object.entries(PARENTESCOS).find(
        ([, rotulo]) => rotulo === pessoa.parentesco,
      )?.[0];
      if (!parentesco)
        throw new Error('Informe o parentesco de cada integrante da família.');
      return {
        id: gerarIdentificador(),
        nomeCompleto: pessoa.nome || '',
        cpf: pessoa.cpf || '',
        dataNascimento: pessoa.dataNascimento || '',
        apoio: pessoa.apoio || '',
        parentesco: parentesco as Parentesco,
      };
    }),
  };
  const erros = validarCadastro(campos);
  if (Object.keys(erros).length)
    throw new Error(Object.values(erros).filter(Boolean).join(' '));
  return prepararCadastro(campos);
}
