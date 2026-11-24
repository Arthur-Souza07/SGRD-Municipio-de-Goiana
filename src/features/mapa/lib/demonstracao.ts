import type { CadastroFamilia } from './familias';
import { gerarFamiliasDemo } from './gerador-familias';
import { criarCadastroDemonstrativo } from './familias';
import { inicializarRiscoTerritorial } from './risco-territorial';

/**
 * Gera famílias de demonstração usando o gerador procedural.
 * Substitui o carregamento do JSON estático por dados gerados dinamicamente
 * com seed fixa para reprodutibilidade.
 */
export async function carregarDemonstracao(
  _endereco: string,
  _signal?: AbortSignal,
) {
  await inicializarRiscoTerritorial();

  // Usar a mesma seed do fontes.json (20261030) para consistência
  const familiasDados = gerarFamiliasDemo(50, 20261030);

  const pontos: CadastroFamilia[] = familiasDados.map((dados) =>
    criarCadastroDemonstrativo(dados),
  );

  return {
    descartados: 0,
    pontos,
  };
}

/**
 * Função auxiliar para obter famílias de demonstração de forma síncrona
 * (útil para testes ou uso imediato sem await)
 */
export function obterFamiliasDemo(): CadastroFamilia[] {
  const familiasDados = gerarFamiliasDemo(50, 20261030);
  return familiasDados.map((dados) => criarCadastroDemonstrativo(dados));
}
