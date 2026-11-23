import { useCallback, useMemo } from 'react';
import XlsxPopulate from 'xlsx-populate';
import type { Sheet, Workbook } from 'xlsx-populate';
import type { CadastroFamilia, DadosFamilia } from '@/features/mapa/lib/familias';
import { nomeDaFamilia } from '@/features/mapa/lib/pontos';
import { TIPOS_OCORRENCIA } from '@/features/mapa/lib/familias';
import { carregarDetalhe } from '@/features/mapa/lib/familias';
import {
  getRacaCorLabel,
  getEstadoCivilLabel,
  getIdentidadeGeneroLabel,
  getParentescoLabel,
  getTipoConstrucaoLabel,
  getPadraoAcabamentoLabel,
  getTipoCobertaLabel,
  getSaneamentoLabel,
  getAbastecimentoLabel,
  getAguasPluviaisLabel,
  getPavimentacaoLabel,
  getCondicaoOcupacaoLabel,
  getUsoImovelLabel,
  getSimNao,
  getDanosEdificacaoLabel,
  formatarCpfComMascara,
  formatarDataBR,
  calcularIdade,
  getGrauRiscoTemplate,
  getTipoOcorrenciaLabel,
} from '@/features/mapa/lib/exportacao-labels';

interface ExportacaoHistoricoItem {
  id: string;
  familiaId: string;
  nomeFamilia: string;
  dataExportacao: string;
  arquivoNome: string;
  blobBase64: string;
}

/**
 * Converte blob para base64 para armazenar no localStorage
 */
async function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/**
 * Salva exportação no histórico do localStorage
 */
async function salvarHistorico(
  blobs: Array<{ familia: CadastroFamilia; blob: Blob; nomeArquivo: string }>
): Promise<void> {
  try {
    const salvo = localStorage.getItem('exportacoes-familias');
    const atual: ExportacaoHistoricoItem[] = salvo ? JSON.parse(salvo) : [];

    for (const { familia, blob, nomeArquivo } of blobs) {
      const base64 = await blobToBase64(blob);

      const novoItem: ExportacaoHistoricoItem = {
        id: `${familia.id}_${Date.now()}`,
        familiaId: familia.id,
        nomeFamilia: nomeDaFamilia(familia),
        dataExportacao: new Date().toISOString(),
        arquivoNome: nomeArquivo,
        blobBase64: base64,
      };

      atual.unshift(novoItem);
    }

    const atualizado = atual.slice(0, 50);
    localStorage.setItem('exportacoes-familias', JSON.stringify(atualizado));
  } catch (e) {
    if (e instanceof DOMException && e.name === 'QuotaExceededError') {
      // Try to free space by removing oldest items and retry once
      try {
        const salvo = localStorage.getItem('exportacoes-familias');
        if (salvo) {
          const atual: ExportacaoHistoricoItem[] = JSON.parse(salvo);
          // Remove half the items (oldest) and retry
          const reduzido = atual.slice(0, Math.floor(atual.length / 2));
          localStorage.setItem('exportacoes-familias', JSON.stringify(reduzido));
          // Retry saving
          return salvarHistorico(blobs);
        }
      } catch {
        // If still fails, warn user
        console.warn('localStorage quota exceeded. Export history could not be saved.');
        alert('Aviso: O histórico de exportações está cheio. As exportações mais antigas foram removidas para dar espaço às novas.');
        return salvarHistorico(blobs);
      }
    }
    console.error('Erro ao salvar histórico:', e);
  }
}

interface OpcoesExportacao {
  prefixoArquivo?: string;
  umaPastaPorFamilia?: boolean;
  endpoint?: string; // API endpoint para carregar detalhes completos
}

/**
 * Garante que todas as famílias tenham seus dados completos carregados.
 * Para famílias sem 'dados', busca os detalhes na API.
 */
async function garantirDadosCompletos(
  familias: readonly CadastroFamilia[],
  endpoint?: string
): Promise<CadastroFamilia[]> {
  if (!endpoint) return [...familias];

  const familiasComDados = await Promise.all(
    familias.map(async (familia) => {
      // Se já tem dados ou é demonstração, retorna como está
      if (familia.dados || familia.resumoDemonstrativo) {
        return familia;
      }
      try {
        // Buscar detalhes completos da API
        const dadosCompletos = await carregarDetalhe(endpoint, familia.id);
        return { ...familia, dados: dadosCompletos };
      } catch (error) {
        console.warn(`Não foi possível carregar detalhes da família ${familia.id}:`, error);
        // Retorna a família sem dados completos - a exportação tentará mesmo assim
        return familia;
      }
    })
  );

  return familiasComDados;
}

interface BairroInfo {
  nome: string;
  contagem: number;
}

function extrairBairro(familia: CadastroFamilia): string {
  return familia.dados?.bairro?.trim()
    || familia.dados?.informacaoImovel?.bairro?.trim()
    || 'Não informado';
}


function mapearFamiliares(familiares?: DadosFamilia['familiares']): Array<{
    nome?: string;
    cpf?: string;
    rg?: string;
    dataNascimento?: string;
    idade?: number;
    estadoCivil?: string;
    nisPis?: string;
    identidadeGenero?: string;
    racaCor?: string;
    ocupacaoProfissional?: string;
    rendaFamiliar?: string;
    beneficiosSocioassistenciais?: string;
    possuiDeficiencia?: 'sim' | 'nao' | 'nao_informado' | boolean | string;
    deficienciaQual?: string;
    observacao?: string;
    vinculoSocialParentesco?: string;
    cor?: string;
    apelidoNomeSocial?: string;
    telefone?: string;
  }> {
  if (!familiares?.length) return [];
  return familiares.map(f => ({
    nome: f.nomeCompleto,
    apelidoNomeSocial: '',
    cpf: f.cpf || undefined,
    rg: '',
    dataNascimento: f.dataNascimento ? formatarDataBR(f.dataNascimento) : '',
    idade: f.dataNascimento ? calcularIdade(f.dataNascimento) : undefined,
    estadoCivil: 'solteiro',
    nisPis: '',
    identidadeGenero: 'prefiro_nao_dizer',
    racaCor: 'nao_declarada',
    ocupacaoProfissional: '',
    rendaFamiliar: '',
    beneficiosSocioassistenciais: '',
    possuiDeficiencia: f.apoio ? 'sim' : 'nao',
    deficienciaQual: f.apoio || '',
    observacao: f.apoio || '',
    vinculoSocialParentesco: f.parentesco,
    cor: '',
    telefone: '',
  }));
}

// Cache para o template carregado (ArrayBuffer bruto)
let templateCache: ArrayBuffer | null = null;

/**
 * Carrega o template .xlsm uma única vez e retorna o ArrayBuffer em cache
 */
async function carregarTemplateBuffer(): Promise<ArrayBuffer> {
  if (templateCache) {
    return templateCache;
  }
  try {
    const response = await fetch('/MODELO%20(1).xlsm');
    if (!response.ok) throw new Error(`Template não encontrado: ${response.status} ${response.statusText}`);
    const arrayBuffer = await response.arrayBuffer();
    console.log('[xlsx-populate] Template carregado, tamanho:', arrayBuffer.byteLength, 'bytes');
    templateCache = arrayBuffer;
    return arrayBuffer;
  } catch (error) {
    console.error('Erro ao carregar template:', error);
    throw error;
  }
}

/**
 * Cria um novo Workbook a partir do template em cache
 * Mais rápido que recarregar o arquivo a cada vez
 */
async function criarWorkbookDoTemplate(): Promise<Workbook> {
  const buffer = await carregarTemplateBuffer();
  const workbook = await XlsxPopulate.fromDataAsync(buffer);
  console.log('[xlsx-populate] Workbook criado do cache, planilhas:', workbook.sheets().map(s => s.name()));
  return workbook;
}

/**
 * Escreve valor em célula preservando formatação original do template
 */
function writeCell(sheet: Sheet, cellRef: string, value: string | number | boolean | null | undefined): void {
  if (value === undefined || value === null || value === '') return;
  const cell = sheet.cell(cellRef);
  cell.value(value);
}

/**
 * Preenche uma planilha com os dados da família
 * Mapeamento baseado no template "MODELO (1).xlsm" - aba CAD
 */
function preencherPlanilha(sheet: Sheet, familia: CadastroFamilia): void {
  const dados = familia.dados;
  const demo = familia.resumoDemonstrativo;

  if (!dados && !demo) return;

  // Converter resumoDemonstrativo para estrutura compatível com o template
  // Isso permite exportar famílias de demonstração com dados dos familiares
  const demoChefeFamilia = demo?.integrantes?.find(p => p.parentesco === 'representante');
  const demoConjuge = demo?.integrantes?.find(p => p.parentesco === 'conjuge');
  const demoDemaisMembros = demo?.integrantes?.filter(p => p.parentesco !== 'representante' && p.parentesco !== 'conjuge') || [];

  const get = <T>(path: string, fallback?: T): T | undefined => {
    if (!dados) return fallback as T | undefined;
    const parts = path.split('.');
    let val: unknown = dados;
    for (const part of parts) {
      if (val === undefined || val === null) break;
      if (typeof val === 'object' && val !== null && part in val) {
        val = (val as Record<string, unknown>)[part];
      } else {
        val = undefined;
      }
    }
    if (val !== undefined && val !== null && val !== '') return val as T;
    return fallback as T | undefined;
  };

  // ============================================================
  // SEÇÃO 1: INFORMAÇÃO DO IMÓVEL (linhas 1-14 do template)
  // ============================================================
  writeCell(sheet, 'G1', familia.id);
  writeCell(sheet, 'F4', formatarDataBR(get('informacaoImovel.dataCadastro')) || formatarDataBR(familia.criadoEm) || new Date().toLocaleDateString('pt-BR'));
  writeCell(sheet, 'B5', get('informacaoImovel.comunidade') || get('bairro') || '');
  writeCell(sheet, 'F5', formatarDataBR(get('informacaoImovel.dataUltimaAtualizacao')) || '-');
  writeCell(sheet, 'A10', get('informacaoImovel.endereco') || get('logradouro') || '');
  writeCell(sheet, 'F10', get('informacaoImovel.numero') || get('numero') || '');
  writeCell(sheet, 'A11', get('informacaoImovel.complemento') || get('complemento') || '');
  writeCell(sheet, 'F11', get('informacaoImovel.longitude') || String(familia.longitude) || '');
  writeCell(sheet, 'A12', get('informacaoImovel.bairro') || get('bairro') || '');
  writeCell(sheet, 'C12', get('informacaoImovel.distrito') || '');
  writeCell(sheet, 'F12', get('informacaoImovel.latitude') || String(familia.latitude) || '');
  writeCell(sheet, 'A14', get('informacaoImovel.tipoRisco') || (dados ? TIPOS_OCORRENCIA[dados.tipoOcorrencia] : '') || '');
  writeCell(sheet, 'F14', get('informacaoImovel.grauRisco') || (dados ? getGrauRiscoTemplate(dados.nivelRisco) : ''));

  // ============================================================
  // SEÇÃO 2: CARACTERIZAÇÃO DO IMÓVEL (linhas 16-21)
  // ============================================================
  const imovel = dados?.caracterizacaoImovel;
  if (imovel) {
    writeCell(sheet, 'A17', getUsoImovelLabel(imovel.usoImovel) || '');
    writeCell(sheet, 'C17', getCondicaoOcupacaoLabel(imovel.condicoesOcupacao) || '');
    writeCell(sheet, 'F17', imovel.imovelVerticalizado === 'sim' ? 'SIM' : 'NÃO');
    writeCell(sheet, 'A18', imovel.areaTerreno || '');
    writeCell(sheet, 'C18', imovel.valorAluguel || '');
    writeCell(sheet, 'F18', imovel.numeroPavimentos || '');
    writeCell(sheet, 'A19', imovel.areaConstrucao || '');
    writeCell(sheet, 'C19', imovel.nomeLocador || '');
    writeCell(sheet, 'F19', imovel.pavimentosOcupa || '');
    if (imovel.comodos && imovel.comodos.length > 0) {
      imovel.comodos.forEach((comodo, index) => {
        const row = 21 + index;
        writeCell(sheet, `A${row}`, comodo.nome);
        writeCell(sheet, `B${row}`, comodo.quantidade);
      });
    }
  }

  // ============================================================
  // SEÇÃO 3: CONDIÇÕES DE HABITABILIDADE (linhas 23-26)
  // ============================================================
  const hab = dados?.condicoesHabitabilidade;
  if (hab) {
    writeCell(sheet, 'A24', getTipoConstrucaoLabel(hab.tipoConstrucao) || '');
    writeCell(sheet, 'C24', getPadraoAcabamentoLabel(hab.padraoAcabamento) || '');
    writeCell(sheet, 'F24', getTipoCobertaLabel(hab.tipoCoberta) || '');
    writeCell(sheet, 'A25', getSaneamentoLabel(hab.saneamentoBasico) || '');
    writeCell(sheet, 'C25', getAbastecimentoLabel(hab.abastecimentoAgua) || '');
    writeCell(sheet, 'F25', getAguasPluviaisLabel(hab.aguasPluviais) || '');
    writeCell(sheet, 'A26', getPavimentacaoLabel(hab.pavimentacao) || '');
    writeCell(sheet, 'C26', getSimNao(hab.iluminacaoPublica));
    writeCell(sheet, 'F26', getSimNao(hab.coletaResiduos));
  }

  // ============================================================
  // SEÇÃO 4: RESPONSÁVEL E COMPOSIÇÃO FAMILIAR (linhas 28-108)
  // ============================================================

  // Helper para preencher dados de uma pessoa (chefe, cônjuge)
  // Template usa: labels nas colunas C e F, valores nas colunas D, E, G
  const preencherPessoa = (
    sheet: Sheet,
    pessoa: {
      nome?: string;
      apelidoNomeSocial?: string;
      telefone?: string;
      cpf?: string;
      rg?: string;
      dataNascimento?: string;
      idade?: number;
      estadoCivil?: string;
      nisPis?: string;
      identidadeGenero?: string;
      racaCor?: string;
      ocupacaoProfissional?: string;
      rendaFamiliar?: string;
      beneficiosSocioassistenciais?: string;
      possuiDeficiencia?: 'sim' | 'nao' | 'nao_informado' | boolean | string;
      deficienciaQual?: string;
      observacao?: string;
      vinculoSocialParentesco?: string;
      cor?: string;
    } | undefined,
    isChefe: boolean = false
  ) => {
    if (!pessoa) return;

    // Linhas base para chefe (30-39) e cônjuge (42-51)
    const baseRow = isChefe ? 30 : 42;

    // Mapeamento: label col -> value cols
    // Row base (nome): C=label -> D,E=value
    writeCell(sheet, `D${baseRow}`, pessoa.nome || '');
    writeCell(sheet, `E${baseRow}`, ''); // segundo campo nome se houver

    // Row base+1 (apelido/fone): C=label, F=label -> D,E,G=value
    writeCell(sheet, `D${baseRow + 1}`, pessoa.apelidoNomeSocial || '');
    writeCell(sheet, `E${baseRow + 1}`, '');
    writeCell(sheet, `G${baseRow + 1}`, pessoa.telefone || '');

    // Row base+2 (cpf/rg): C=label, F=label -> D,E,G=value
    writeCell(sheet, `D${baseRow + 2}`, pessoa.cpf ? formatarCpfComMascara(pessoa.cpf) : '');
    writeCell(sheet, `E${baseRow + 2}`, '');
    writeCell(sheet, `G${baseRow + 2}`, pessoa.rg || '');

    // Row base+3 (nascimento/idade): C=label, F=label -> D,E,G=value
    writeCell(sheet, `D${baseRow + 3}`, formatarDataBR(pessoa.dataNascimento) || '');
    writeCell(sheet, `E${baseRow + 3}`, '');
    const idadeVal = pessoa.idade !== undefined ? String(pessoa.idade) : (pessoa.dataNascimento ? String(calcularIdade(pessoa.dataNascimento)) : '');
    writeCell(sheet, `G${baseRow + 3}`, idadeVal);

    // Row base+4 (estado civil/nis): C=label, F=label -> D,E,G=value
    writeCell(sheet, `D${baseRow + 4}`, getEstadoCivilLabel(pessoa.estadoCivil) || '');
    writeCell(sheet, `E${baseRow + 4}`, '');
    writeCell(sheet, `G${baseRow + 4}`, pessoa.nisPis || '');

    // Row base+5 (identidade/raca): C=label, F=label -> D,E,G=value
    writeCell(sheet, `D${baseRow + 5}`, getIdentidadeGeneroLabel(pessoa.identidadeGenero) || '');
    writeCell(sheet, `E${baseRow + 5}`, '');
    writeCell(sheet, `G${baseRow + 5}`, getRacaCorLabel(pessoa.racaCor) || '');

    // Row base+6 (ocupacao/renda): C=label, F=label -> D,E,G=value
    writeCell(sheet, `D${baseRow + 6}`, pessoa.ocupacaoProfissional || '');
    writeCell(sheet, `E${baseRow + 6}`, '');
    writeCell(sheet, `G${baseRow + 6}`, pessoa.rendaFamiliar || '');

    // Row base+7 (beneficios): C=label -> D,E,G=value
    writeCell(sheet, `D${baseRow + 7}`, pessoa.beneficiosSocioassistenciais || '');
    writeCell(sheet, `E${baseRow + 7}`, '');
    writeCell(sheet, `G${baseRow + 7}`, '');

    // Row base+8 (deficiencia/qual): C=label, F=label -> D,E,G=value
    writeCell(sheet, `D${baseRow + 8}`, getSimNao(pessoa.possuiDeficiencia as 'sim' | 'nao' | 'nao_informado' | 'parcial' | boolean | undefined));
    writeCell(sheet, `E${baseRow + 8}`, '');
    writeCell(sheet, `G${baseRow + 8}`, pessoa.deficienciaQual || '');

    // Row base+9 (observacao): C=label -> D,E,G=value
    writeCell(sheet, `D${baseRow + 9}`, pessoa.observacao || '');
    writeCell(sheet, `E${baseRow + 9}`, '');
    writeCell(sheet, `G${baseRow + 9}`, '');
  };

  // CHEFE DA FAMÍLIA
  const chefe = dados?.chefeFamilia;
  if (chefe) {
    preencherPessoa(sheet, chefe, true);
  } else if (demoChefeFamilia) {
    // Usar dados do demo
    preencherPessoa(sheet, {
      nome: demoChefeFamilia.nomeCompleto,
      cpf: demoChefeFamilia.cpf || undefined,
      dataNascimento: demoChefeFamilia.dataNascimento,
      observacao: demoChefeFamilia.apoio || '',
      rg: '',
      idade: demoChefeFamilia.dataNascimento ? calcularIdade(demoChefeFamilia.dataNascimento) : undefined,
      estadoCivil: 'casado',
      identidadeGenero: 'prefiro_nao_dizer',
      racaCor: 'nao_declarada',
    }, true);
  } else {
    // Fallback para campos básicos do dados
    writeCell(sheet, 'C30', get('nomeRepresentante') || '');
    writeCell(sheet, 'C32', formatarCpfComMascara(get('cpf') || ''));
    writeCell(sheet, 'C33', formatarDataBR(get('nascimentoRepresentante') || ''));
  }

  // CÔNJUGE
  const conjuge = dados?.conjuge;
  if (conjuge) {
    preencherPessoa(sheet, conjuge, false);
  } else if (demoConjuge) {
    preencherPessoa(sheet, {
      nome: demoConjuge.nomeCompleto,
      cpf: demoConjuge.cpf || undefined,
      dataNascimento: demoConjuge.dataNascimento,
      observacao: demoConjuge.apoio || '',
      rg: '',
      idade: demoConjuge.dataNascimento ? calcularIdade(demoConjuge.dataNascimento) : undefined,
      estadoCivil: 'casado',
      identidadeGenero: 'prefiro_nao_dizer',
      racaCor: 'nao_declarada',
    }, false);
  }

  // DEMAIS MEMBROS
  let membros: Array<{
    nome?: string;
    cpf?: string;
    rg?: string;
    dataNascimento?: string;
    idade?: number;
    estadoCivil?: string;
    nisPis?: string;
    identidadeGenero?: string;
    racaCor?: string;
    ocupacaoProfissional?: string;
    rendaFamiliar?: string;
    beneficiosSocioassistenciais?: string;
    possuiDeficiencia?: 'sim' | 'nao' | 'nao_informado' | boolean | string;
    deficienciaQual?: string;
    observacao?: string;
    vinculoSocialParentesco?: string;
    cor?: string;
    apelidoNomeSocial?: string;
    telefone?: string;
  }> = [];

  const demaisMembros = dados?.demaisMembros;
  if (demaisMembros && Array.isArray(demaisMembros) && demaisMembros.length > 0) {
    membros = demaisMembros as unknown as typeof membros;
  } else if (dados?.familiares && Array.isArray(dados.familiares) && dados.familiares.length > 0) {
    membros = mapearFamiliares(dados.familiares);
  } else if (demoDemaisMembros.length > 0) {
    // Converter membros do demo
    membros = demoDemaisMembros.map(m => ({
      nome: m.nomeCompleto,
      cpf: m.cpf || undefined,
      rg: '',
      dataNascimento: m.dataNascimento,
      idade: m.dataNascimento ? calcularIdade(m.dataNascimento) : undefined,
      estadoCivil: 'solteiro',
      nisPis: '',
      identidadeGenero: 'prefiro_nao_dizer',
      racaCor: 'nao_declarada',
      ocupacaoProfissional: '',
      rendaFamiliar: '',
      beneficiosSocioassistenciais: '',
      possuiDeficiencia: m.apoio ? 'sim' : 'nao',
      deficienciaQual: m.apoio || '',
      observacao: m.apoio || '',
      vinculoSocialParentesco: m.parentesco,
      cor: '',
      apelidoNomeSocial: '',
      telefone: '',
    }));
  }

  // Linhas base para cada membro (linha do "NOME:"): 53, 60, 67, 74, 81, 88, 95, 102
  const linhasMembros = [53, 60, 67, 74, 81, 88, 95, 102];
  membros.forEach((membro, idx) => {
    if (idx >= linhasMembros.length) return;
    const baseRow = linhasMembros[idx];

    // Row 0: NOME (A), CPF (D), RG (G) -> values in B,C, E,F, H,I
    writeCell(sheet, `B${baseRow}`, membro.nome || '');
    writeCell(sheet, `C${baseRow}`, '');
    writeCell(sheet, `E${baseRow}`, membro.cpf ? formatarCpfComMascara(membro.cpf) : '');
    writeCell(sheet, `F${baseRow}`, '');
    writeCell(sheet, `H${baseRow}`, membro.rg || '');
    writeCell(sheet, `I${baseRow}`, '');

    // Row 1: APELIDO/NOME SOCIAL (A), FONE (D), COR (G) -> values in B,C, E,F, H,I
    writeCell(sheet, `B${baseRow + 1}`, membro.apelidoNomeSocial || '');
    writeCell(sheet, `C${baseRow + 1}`, '');
    writeCell(sheet, `E${baseRow + 1}`, membro.telefone || '');
    writeCell(sheet, `F${baseRow + 1}`, '');
    writeCell(sheet, `H${baseRow + 1}`, membro.cor || '');
    writeCell(sheet, `I${baseRow + 1}`, '');

    // Row 2: VÍNCULO (A), DATA NASC (C), IDADE (G) -> values in B, D,E,F, H
    writeCell(sheet, `B${baseRow + 2}`, getParentescoLabel(membro.vinculoSocialParentesco) || '');
    writeCell(sheet, `D${baseRow + 2}`, formatarDataBR(membro.dataNascimento) || '');
    writeCell(sheet, `E${baseRow + 2}`, '');
    writeCell(sheet, `F${baseRow + 2}`, '');
    const idadeVal = membro.idade !== undefined ? String(membro.idade) : (membro.dataNascimento ? String(calcularIdade(membro.dataNascimento)) : '');
    writeCell(sheet, `H${baseRow + 2}`, idadeVal);

    // Row 3: IDENTIDADE GÊNERO (A), DEFICIÊNCIA (C), QUAL (G) -> values in B, D,E,F, H
    writeCell(sheet, `B${baseRow + 3}`, getIdentidadeGeneroLabel(membro.identidadeGenero) || '');
    writeCell(sheet, `D${baseRow + 3}`, getSimNao(membro.possuiDeficiencia as 'sim' | 'nao' | 'nao_informado' | 'parcial' | boolean | undefined));
    writeCell(sheet, `E${baseRow + 3}`, '');
    writeCell(sheet, `F${baseRow + 3}`, '');
    writeCell(sheet, `H${baseRow + 3}`, membro.deficienciaQual || '');

    // Row 4: ESTADO CIVIL (A), OCUPAÇÃO (C), NIS/PIS (G) -> values in B, D,E,F, H
    writeCell(sheet, `B${baseRow + 4}`, getEstadoCivilLabel(membro.estadoCivil) || '');
    writeCell(sheet, `D${baseRow + 4}`, membro.ocupacaoProfissional || '');
    writeCell(sheet, `E${baseRow + 4}`, '');
    writeCell(sheet, `F${baseRow + 4}`, '');
    writeCell(sheet, `H${baseRow + 4}`, membro.nisPis || '');

    // Row 5: RENDA FAMILIAR (A), BENEFÍCIOS (C) -> values in B, D,E,F
    writeCell(sheet, `B${baseRow + 5}`, membro.rendaFamiliar || '');
    writeCell(sheet, `D${baseRow + 5}`, membro.beneficiosSocioassistenciais || '');
    writeCell(sheet, `E${baseRow + 5}`, '');
    writeCell(sheet, `F${baseRow + 5}`, '');

    // Row 6: OBSERVAÇÃO (A) -> values in B,C,D,E,F,G
    writeCell(sheet, `B${baseRow + 6}`, membro.observacao || '');
    writeCell(sheet, `C${baseRow + 6}`, '');
    writeCell(sheet, `D${baseRow + 6}`, '');
    writeCell(sheet, `E${baseRow + 6}`, '');
    writeCell(sheet, `F${baseRow + 6}`, '');
    writeCell(sheet, `G${baseRow + 6}`, '');
  });

  // ============================================================
  // SEÇÃO 5: HISTÓRICO E EVOLUÇÃO
  // ============================================================
  const ocorrencias = dados?.historicoOcorrencias || [];
  // Template: row 112 is header "5.1 HISTÓRICO DE OCORRÊNCIAS", first data at row 113
  const linhasOcorrencias = [113, 116, 119, 122, 125, 128, 131];
  ocorrencias.forEach((oc, idx) => {
    if (idx >= linhasOcorrencias.length) return;
    const baseRow = linhasOcorrencias[idx];
    writeCell(sheet, `A${baseRow}`, getSimNao(oc.jaFoiAtingido));
    writeCell(sheet, `C${baseRow}`, getTipoOcorrenciaLabel(oc.tipoOcorrencia));
    writeCell(sheet, `F${baseRow}`, oc.dataAnoOcorrencia || '');
    writeCell(sheet, `A${baseRow + 1}`, getDanosEdificacaoLabel(oc.houveDanosEdificacao));
    writeCell(sheet, `C${baseRow + 1}`, getSimNao(oc.houvePerdaBens));
    writeCell(sheet, `F${baseRow + 1}`, oc.houvePerdaTotalParcialImovel || '');
    writeCell(sheet, `A${baseRow + 2}`, oc.observacao || '');
  });

  const interdictioes = dados?.interdictioes || [];
  // Template: row 131 is header "5.2 INTERDIÇÃO", first data at row 132, then 135, 138
  const linhasInterdictioes = [132, 135, 138];
  interdictioes.forEach((int, idx) => {
    if (idx >= linhasInterdictioes.length) return;
    const baseRow = linhasInterdictioes[idx];
    writeCell(sheet, `A${baseRow}`, getSimNao(int.imovelJaFoiInterditado));
    writeCell(sheet, `C${baseRow}`, int.tipo || '');
    writeCell(sheet, `F${baseRow}`, formatarDataBR(int.dataInterdicao) || '');
    writeCell(sheet, `A${baseRow + 1}`, getSimNao(int.houveEvacuacaoDesocupacao));
    writeCell(sheet, `C${baseRow + 1}`, getSimNao(int.houveRecomendacaoRemocaoDefinitiva));
    writeCell(sheet, `F${baseRow + 1}`, int.observacao || '');
  });

  const desalojamentos = dados?.desalojamentos || [];
  // Template: row 138 is header "5.3 DESALOJAMENTO", first data at row 139, then 142, 145, 148
  const linhasDesalojamentos = [139, 142, 145, 148];
  desalojamentos.forEach((des, idx) => {
    if (idx >= linhasDesalojamentos.length) return;
    const baseRow = linhasDesalojamentos[idx];
    writeCell(sheet, `A${baseRow}`, getSimNao(des.familiaJaFicouDesalojada));
    writeCell(sheet, `C${baseRow}`, getSimNao(des.familiaJaFicouDesabrigada));
    writeCell(sheet, `F${baseRow}`, des.periodo || '');
    writeCell(sheet, `G${baseRow}`, des.localAcolhimento || '');
    writeCell(sheet, `I${baseRow}`, getSimNao(des.retornouAoImovel));
  });

  const beneficios = dados?.beneficiosAuxilios || [];
  if (beneficios.length > 0) {
    const b = beneficios[0];
    writeCell(sheet, 'A148', getSimNao(b.jaRecebeuBeneficioAuxilio));
    writeCell(sheet, 'C148', b.tipoBeneficio || '');
    writeCell(sheet, 'G148', formatarDataBR(b.data) || '');
    writeCell(sheet, 'C158', b.observacao || '');
  }

  const encaminhamento = dados?.encaminhamentoHabitacional;
  if (encaminhamento) {
    writeCell(sheet, 'A159', getSimNao(encaminhamento.jaFoiEncaminhado));
    writeCell(sheet, 'C159', formatarDataBR(encaminhamento.data) || '');
    writeCell(sheet, 'F159', encaminhamento.observacao || '');
  }

  const vistorias = dados?.historicoVistorias;
  if (vistorias) {
    writeCell(sheet, 'A161', getSimNao(vistorias.jaFoiAtendidaAssistenciaSocial));
    writeCell(sheet, 'C161', formatarDataBR(vistorias.dataUltimaVistoriaAssistencia) || '');
    writeCell(sheet, 'F161', vistorias.assistenteSocialResponsavel || '');
    writeCell(sheet, 'A171', getSimNao(vistorias.jaFoiRealizadaVistoriaTecnicaDefesaCivil));
    writeCell(sheet, 'C171', formatarDataBR(vistorias.dataUltimaVistoriaDefesaCivil) || '');
    writeCell(sheet, 'F171', vistorias.tecnicoResponsavel || '');
  }

  const situacao = dados?.situacaoAtual;
  if (situacao) {
    writeCell(sheet, 'A182', getSimNao(situacao.emAcompanhamentoDefesaCivil));
    writeCell(sheet, 'A183', situacao.observacao || '');
  }

  const docs = dados?.documentosFotograficos;
  if (docs) {
    writeCell(sheet, 'A185', getSimNao(docs.possuiDocumentos));
    writeCell(sheet, 'C185', docs.listaDocumentos?.join(', ') || '');
    writeCell(sheet, 'A186', getSimNao(docs.possuiRegistroFotografico));
    writeCell(sheet, 'C186', docs.descricaoFotos || '');
  }
}

/**
 * Exporta múltiplas famílias para arquivos .xlsm separados (uma aba por arquivo)
 * USA xlsx-populate que PRESERVA VBA, STYLES, IMAGES, DRAWINGS nativamente
 * OTIMIZAÇÃO: Carrega o template uma única vez e reutiliza o ArrayBuffer em cache
 */
async function exportarMultiplasAbas(
  familias: readonly CadastroFamilia[],
  prefixoArquivo: string,
  endpoint?: string
): Promise<Array<{ familia: CadastroFamilia; blob: Blob; nomeArquivo: string }>> {
  if (!familias.length) return [];

  // Garantir que todas as famílias tenham dados completos
  const familiasCompletas = await garantirDadosCompletos(familias, endpoint);

  const familiasComDados = familiasCompletas.filter(f => f.dados || f.resumoDemonstrativo);
  const resultados: Array<{ familia: CadastroFamilia; blob: Blob; nomeArquivo: string }> = [];

  // OTIMIZAÇÃO: Criar workbook do template em cache (evita fetch repetido)
  for (let i = 0; i < familiasComDados.length; i++) {
    const familia = familiasComDados[i];

    // Usar template em cache - muito mais rápido que recarregar do servidor
    const wb: Workbook = await criarWorkbookDoTemplate();
    const sheet: Sheet = wb.sheet('CAD');

    if (!sheet) {
      throw new Error('Planilha "CAD" não encontrada no template');
    }

    // Renomear aba
    const nomeAba = nomeDaFamilia(familia)
      .replace(/[[\]]\\*?:]/g, '_')
      .substring(0, 31) || `Familia_${i + 1}`;
    sheet.name(nomeAba);

    // Preencher dados
    preencherPlanilha(sheet, familia);

    // REMOVER ABAS INDESEJADAS
    removerAbasIndesejadas(wb);

    // Gerar buffer .xlsm
    const arrayBuffer = await wb.outputAsync('arraybuffer');
    console.log(`[xlsx-populate] ${nomeAba}: ${arrayBuffer.byteLength} bytes`);

    const blob = new Blob([arrayBuffer], { type: 'application/vnd.ms-excel.sheet.macroEnabled.12' });
    const dataAtual = new Date().toLocaleDateString('pt-BR').replace(/\//g, '-');
    const nomeArquivo = `${prefixoArquivo}_${nomeAba}_${dataAtual}.xlsm`;

    // Baixar
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = nomeArquivo;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    // Defer revocation to allow browser to start download
    setTimeout(() => URL.revokeObjectURL(url), 1000);

    resultados.push({ familia, blob, nomeArquivo });
    await new Promise(r => setTimeout(r, 50));
  }

  return resultados;
}

/**
 * Remove abas indesejadas (ex: "Planilha Resumo", "Planilha3", etc.)
 */
function removerAbasIndesejadas(workbook: Workbook): void {
  const abasParaRemover = ['Planilha Resumo', 'Planilha3', 'Resumo', 'Summary', 'Planilha1', 'Planilha2'];
  for (const nomeAba of abasParaRemover) {
    try {
      const sheet = workbook.sheet(nomeAba);
      if (sheet) {
        workbook.deleteSheet(nomeAba);
        console.log(`[exportar] Aba "${nomeAba}" removida`);
      }
    } catch {
      // Aba não existe, ignorar
    }
  }
}

/**
 * Exporta cada família em arquivo separado (comportamento original)
 */
async function exportarArquivosSeparados(
  familias: readonly CadastroFamilia[],
  prefixoArquivo: string,
  endpoint?: string
): Promise<Array<{ familia: CadastroFamilia; blob: Blob; nomeArquivo: string }>> {
  return exportarMultiplasAbas(familias, prefixoArquivo, endpoint);
}

export function useExportarExcel(opcoes: OpcoesExportacao = {}) {
  const { prefixoArquivo = 'Ficha_Cadastral_Familia', umaPastaPorFamilia = false, endpoint } = opcoes;

  const exportar = useCallback(
    async (familia: CadastroFamilia) => {
      if (!familia.dados && !familia.resumoDemonstrativo) {
        alert('Esta família não possui dados para exportação.');
        return;
      }
      try {
        let resultados: Array<{ familia: CadastroFamilia; blob: Blob; nomeArquivo: string }> = [];
        if (umaPastaPorFamilia) {
          resultados = await exportarArquivosSeparados([familia], prefixoArquivo, endpoint);
        } else {
          resultados = await exportarMultiplasAbas([familia], prefixoArquivo, endpoint);
        }
        if (resultados.length > 0) {
          await salvarHistorico(resultados);
        }
      } catch (error) {
        console.error('Erro ao exportar:', error);
        alert('Erro ao gerar arquivo Excel. Verifique o console para detalhes.');
      }
    },
    [prefixoArquivo, umaPastaPorFamilia, endpoint],
  );

  const exportarMultiplas = useCallback(
    async (familias: readonly CadastroFamilia[]) => {
      if (!familias.length) return;
      try {
        let resultados: Array<{ familia: CadastroFamilia; blob: Blob; nomeArquivo: string }> = [];
        if (umaPastaPorFamilia) {
          resultados = await exportarArquivosSeparados(familias, prefixoArquivo, endpoint);
        } else {
          resultados = await exportarMultiplasAbas(familias, prefixoArquivo, endpoint);
        }
        if (resultados.length > 0) {
          await salvarHistorico(resultados);
        }
      } catch (error) {
        console.error('Erro ao exportar múltiplas:', error);
        alert('Erro ao gerar arquivo Excel. Verifique o console para detalhes.');
      }
    },
    [prefixoArquivo, umaPastaPorFamilia, endpoint],
  );

  const bairrosDisponiveis = useMemo(
    () => (familias: readonly CadastroFamilia[]): BairroInfo[] => {
      const contagem = new Map<string, number>();
      for (const familia of familias) {
        const bairro = extrairBairro(familia);
        if (bairro !== 'Não informado') {
          contagem.set(bairro, (contagem.get(bairro) || 0) + 1);
        }
      }
      return Array.from(contagem.entries())
        .map(([nome, contagem]) => ({ nome, contagem }))
        .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
    },
    [],
  );

  return { exportar, exportarMultiplas, bairrosDisponiveis };
}