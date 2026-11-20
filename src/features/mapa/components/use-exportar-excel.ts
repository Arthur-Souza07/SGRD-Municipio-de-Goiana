import { useCallback } from 'react';
import * as XLSX from 'xlsx';
import type { CadastroFamilia } from '@/features/mapa/lib/familias';
import { nomeDaFamilia } from '@/features/mapa/lib/pontos';

interface OpcoesExportacao {
  prefixoArquivo?: string;
  incluirBairro?: boolean;
}

const BAIRROS_GOIANA = [
  'Centro', 'Impoeira', 'Curtume', 'Bom Tempo', 'Bom Jesus',
  'Cidade Nova', 'Barro Vermelho', 'Substação', 'Sitio dos Bragas',
  'Portelinha', 'Nova Goiana', 'Multirão', 'Paraíso',
  'Vila Castelo Branco', 'Flexeira', 'Bela Vista', 'Boa Vista',
  'Tanquinho', 'Northville', 'Núcleo Industrial', 'Matadouro',
  'Vista Plena', 'Novo Horizonte', 'Distrito Industrial', 'Portal Goiana'
] as const;

export function useExportarExcel(opcoes: OpcoesExportacao = {}) {
  const { prefixoArquivo = 'DefesaCivil_Goiana_CadastroSocial', incluirBairro = true } = opcoes;

  const exportar = useCallback((
    familias: readonly CadastroFamilia[],
    bairroSelecionado?: string
  ) => {
    if (!familias.length) {
      alert('Não há famílias para exportar.');
      return;
    }

    // Extrair bairro do endereço/dados da família se disponível
    const extrairBairro = (familia: CadastroFamilia): string => {
      if (familia.dados?.bairro) return familia.dados.bairro;
      // Tentar inferir do nome ou outros campos
      return 'Não informado';
    };

    const extrairEndereco = (familia: CadastroFamilia): string => {
      if (familia.dados?.logradouro && familia.dados?.numero) {
        return `${familia.dados.logradouro}, ${familia.dados.numero}`;
      }
      if (familia.dados?.logradouro) return familia.dados.logradouro;
      return 'Não informado';
    };

    const extrairTipoMoradia = (_familia: CadastroFamilia): string => {
      // Inferir do nível de risco ou deixar genérico
      return 'Não informado';
    };

    const extrairExposicaoInundacao = (familia: CadastroFamilia): string => {
      // Verificar se está em área de inundação baseado no risco
      return familia.nivelRisco === 'alto' ? 'Sim' : 'Não';
    };

    const formatarGrauRisco = (nivel: string): string => {
      switch (nivel) {
        case 'alto': return 'Crítico';
        case 'medio': return 'Atenção';
        case 'baixo': return 'Baixo';
        default: return 'Não informado';
      }
    };

    const formatarStatus = (familia: CadastroFamilia): string => {
      if (familia.id.startsWith('demo-')) return 'Demonstração';
      if (familia.criadoEm) return 'Cadastrado';
      return 'Pendente';
    };

    const formatarData = (familia: CadastroFamilia): string => {
      if (familia.criadoEm) {
        try {
          return new Date(familia.criadoEm).toLocaleDateString('pt-BR');
        } catch {
          return '—';
        }
      }
      return '—';
    };

    const dadosFormatados = familias.map((familia) => ({
      'Cód. Família': familia.id,
      'Representante da Família': nomeDaFamilia(familia),
      'CPF': familia.dados?.cpf ? `${familia.dados.cpf.slice(0, 3)}.***.***-${familia.dados.cpf.slice(-2)}` : '—',
      'Município': 'Goiana',
      ...(incluirBairro ? { 'Bairro': extrairBairro(familia) } : {}),
      'Endereço / Rua': extrairEndereco(familia),
      'Nº Integrantes': familia.dados?.moradores ?? '—',
      'Tipo de Moradia': extrairTipoMoradia(familia),
      'Exposição à Inundação': extrairExposicaoInundacao(familia),
      'Grau de Risco': formatarGrauRisco(familia.nivelRisco),
      'Status do Cadastro': formatarStatus(familia),
      'Data do Cadastro': formatarData(familia),
    }));

    const worksheet = XLSX.utils.json_to_sheet(dadosFormatados);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Cadastro Social Famílias');

    const dataAtual = new Date().toLocaleDateString('pt-BR').replace(/\//g, '-');
    const sufixoBairro = bairroSelecionado && bairroSelecionado !== 'Todos'
      ? bairroSelecionado.replace(/\s+/g, '_')
      : 'Geral';

    const nomeArquivo = `${prefixoArquivo}_${sufixoBairro}_${dataAtual}.xlsx`;
    XLSX.writeFile(workbook, nomeArquivo);
  }, [prefixoArquivo, incluirBairro]);

  return { exportar, bairrosDisponiveis: BAIRROS_GOIANA };
}