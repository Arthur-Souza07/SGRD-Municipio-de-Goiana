import test from 'node:test';
import assert from 'node:assert/strict';
import { gerarFamiliasDemo } from '../src/features/mapa/lib/gerador-familias';
import { criarCadastroDemonstrativo } from '../src/features/mapa/lib/familias';
import { normalizarPontos } from '../src/features/mapa/lib/pontos';
import { calcularIdade } from '../src/features/mapa/lib/integrantes';
import { cpfValido } from '../src/features/mapa/lib/familias';
import { dentroDeGoiana } from '../src/features/mapa/lib/territorio';

function emAnel([x, y]: [number, number], anel: [number, number][]): boolean {
  let dentro = false;
  for (let i = 0, j = anel.length - 1; i < anel.length; j = i++) {
    const [xi, yi] = anel[i];
    const [xj, yj] = anel[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi)
      dentro = !dentro;
  }
  return dentro;
}

function emGeometria(posicao: [number, number], geometria: {
  type: 'Polygon' | 'MultiPolygon';
  coordinates: [number, number][][] | [number, number][][][];
}): boolean {
  const poligonos =
    geometria.type === 'Polygon'
      ? [geometria.coordinates as [number, number][][]]
      : (geometria.coordinates as [number, number][][][]);
  return poligonos.some(
    (poligono) =>
      emAnel(posicao, poligono[0]) &&
      !poligono.slice(1).some((anel) => emAnel(posicao, anel)),
  );
}

// Converte data DD/MM/AAAA para AAAA-MM-DD para calcularIdade
function dataParaISO(dataBR: string): string {
  if (!dataBR) return '';
  const parts = dataBR.split('/');
  if (parts.length === 3) {
    return `${parts[2]}-${parts[1]}-${parts[0]}`;
  }
  return dataBR;
}

test('gerarFamiliasDemo produz 50 famílias com seed reprodutível', () => {
  const familias1 = gerarFamiliasDemo(50, 20261030);
  const familias2 = gerarFamiliasDemo(50, 20261030);

  assert.equal(familias1.length, 50);
  assert.equal(familias2.length, 50);

  // Verify reproducibility - same seed produces same data
  for (let i = 0; i < 50; i++) {
    assert.equal(familias1[i].nomeRepresentante, familias2[i].nomeRepresentante);
    assert.equal(familias1[i].cpf, familias2[i].cpf);
    assert.equal(familias1[i].latitude, familias2[i].latitude);
    assert.equal(familias1[i].longitude, familias2[i].longitude);
    assert.equal(familias1[i].nivelRisco, familias2[i].nivelRisco);
  }
});

test('famílias geradas têm todos os campos obrigatórios do template Excel', () => {
  const familias = gerarFamiliasDemo(10, 20261030);

  for (const familia of familias) {
    // Campos básicos
    assert.ok(familia.nomeRepresentante.length >= 3);
    assert.ok(familia.cpf.length === 11); // apenas dígitos
    assert.ok(familia.telefone.length >= 10);
    assert.ok(familia.logradouro.length > 0);
    assert.ok(familia.numero.length > 0);
    assert.ok(familia.bairro.length > 0);
    assert.ok(familia.moradores >= 1 && familia.moradores <= 8);
    assert.ok(['alto', 'medio', 'baixo'].includes(familia.nivelRisco));
    // tipoOcorrencia é a chave (ex: 'inundacao'), não o rótulo de exibição
    assert.ok(typeof familia.tipoOcorrencia === 'string' && familia.tipoOcorrencia.length > 0);

    // Localização - use actual IBGE 2025 bounds for Goiana municipality
    assert.ok(familia.localizacao.latitude >= -7.7147 && familia.localizacao.latitude <= -7.4620);
    assert.ok(familia.localizacao.longitude >= -35.0778 && familia.localizacao.longitude <= -34.8067);
    // Additional check: ensure coordinates are actually inside the municipality polygon
    assert.ok(dentroDeGoiana(familia.localizacao.longitude, familia.localizacao.latitude));
    assert.ok(['gps', 'mapa', 'coordenadas'].includes(familia.localizacao.origem));

    // Seções do template Excel
    assert.ok(familia.informacaoImovel);
    assert.equal(familia.informacaoImovel?.municipio, 'GOIANA / PE');
    assert.ok(familia.informacaoImovel?.dataCadastro);
    assert.ok(familia.informacaoImovel?.tipoRisco);
    assert.ok(familia.informacaoImovel?.grauRisco);

    assert.ok(familia.caracterizacaoImovel);
    assert.ok(familia.caracterizacaoImovel?.usoImovel);
    assert.ok(familia.caracterizacaoImovel?.condicoesOcupacao);
    assert.ok(familia.caracterizacaoImovel?.areaTerreno);
    assert.ok(familia.caracterizacaoImovel?.areaConstrucao);
    assert.ok(Array.isArray(familia.caracterizacaoImovel?.comodos));

    assert.ok(familia.condicoesHabitabilidade);
    assert.ok(familia.condicoesHabitabilidade?.tipoConstrucao);
    assert.ok(familia.condicoesHabitabilidade?.padraoAcabamento);
    assert.ok(familia.condicoesHabitabilidade?.tipoCoberta);
    assert.ok(familia.condicoesHabitabilidade?.saneamentoBasico);
    assert.ok(familia.condicoesHabitabilidade?.abastecimentoAgua);
    assert.ok(familia.condicoesHabitabilidade?.aguasPluviais);
    assert.ok(familia.condicoesHabitabilidade?.pavimentacao);
    assert.ok(familia.condicoesHabitabilidade?.iluminacaoPublica);
    assert.ok(familia.condicoesHabitabilidade?.coletaResiduos);

    // Chefe da família
    assert.ok(familia.chefeFamilia);
    assert.ok(familia.chefeFamilia?.nome);
    assert.ok(familia.chefeFamilia?.cpf);
    assert.ok(familia.chefeFamilia?.rg);
    assert.ok(familia.chefeFamilia?.dataNascimento);
    assert.ok(typeof familia.chefeFamilia?.idade === 'number');
    assert.ok(familia.chefeFamilia?.telefone);
    assert.ok(familia.chefeFamilia?.estadoCivil);
    assert.ok(familia.chefeFamilia?.identidadeGenero);
    assert.ok(familia.chefeFamilia?.racaCor);
    assert.ok(familia.chefeFamilia?.possuiDeficiencia === 'sim' || familia.chefeFamilia?.possuiDeficiencia === 'nao');

    // Composição familiar
    assert.ok(Array.isArray(familia.demaisMembros));
    const totalMembros = 1 + (familia.conjuge ? 1 : 0) + familia.demaisMembros.length;
    assert.equal(familia.moradores, totalMembros);

    // Histórico de ocorrências
    assert.ok(Array.isArray(familia.historicoOcorrencias));

    // Interdições, desalojamentos, benefícios, etc.
    assert.ok(Array.isArray(familia.interdictioes));
    assert.ok(Array.isArray(familia.desalojamentos));
    assert.ok(Array.isArray(familia.beneficiosAuxilios));
    assert.ok(familia.encaminhamentoHabitacional);
    assert.ok(familia.historicoVistorias);
    assert.ok(familia.situacaoAtual);
    assert.ok(familia.documentosFotograficos);
  }
});

test('distribuição de risco segue proporções esperadas (30% alto, 40% médio, 30% baixo)', () => {
  const familias = gerarFamiliasDemo(1000, 20261030);
  const contagem = { alto: 0, medio: 0, baixo: 0 };

  for (const familia of familias) {
    contagem[familia.nivelRisco]++;
  }

  // Allow some variance due to randomness
  assert.ok(contagem.alto >= 250 && contagem.alto <= 350, `alto: ${contagem.alto}`);
  assert.ok(contagem.medio >= 350 && contagem.medio <= 450, `medio: ${contagem.medio}`);
  assert.ok(contagem.baixo >= 250 && contagem.baixo <= 350, `baixo: ${contagem.baixo}`);
});

test('criarCadastroDemonstrativo converte DadosFamilia para CadastroFamilia corretamente', () => {
  const familias = gerarFamiliasDemo(5, 20261030);

  for (const dados of familias) {
    const cadastro = criarCadastroDemonstrativo(dados);

    assert.ok(cadastro.id.startsWith('demo-'));
    assert.equal(cadastro.nomeRepresentante, dados.nomeRepresentante);
    assert.equal(cadastro.latitude, dados.localizacao.latitude);
    assert.equal(cadastro.longitude, dados.localizacao.longitude);
    assert.equal(cadastro.nivelRisco, dados.nivelRisco);
    assert.ok(cadastro.dados);
    assert.equal(cadastro.dados?.nomeRepresentante, dados.nomeRepresentante);
    assert.ok(cadastro.criadoEm);
  }
});

test('famílias de demonstração têm CPFs válidos com dígitos verificadores', () => {
  const familias = gerarFamiliasDemo(20, 20261030);

  for (const familia of familias) {
    // CPF do chefe
    assert.equal(cpfValido(familia.chefeFamilia?.cpf || ''), true);

    // CPF do cônjuge se existir
    if (familia.conjuge?.cpf) {
      assert.equal(cpfValido(familia.conjuge.cpf), true);
    }

    // CPFs dos demais membros
    for (const membro of familia.demaisMembros) {
      if (membro.cpf) {
        assert.equal(cpfValido(membro.cpf), true);
      }
    }
  }
});

test('idades calculadas corretamente baseadas na data de nascimento', () => {
  const familias = gerarFamiliasDemo(10, 20261030);

  for (const familia of familias) {
    // Chefe
    const idadeChefe = calcularIdade(dataParaISO(familia.chefeFamilia?.dataNascimento || ''));
    assert.ok(idadeChefe !== null);
    assert.equal(familia.chefeFamilia?.idade, idadeChefe);

    // Cônjuge
    if (familia.conjuge) {
      const idadeConjuge = calcularIdade(dataParaISO(familia.conjuge.dataNascimento));
      assert.ok(idadeConjuge !== null);
      assert.equal(familia.conjuge.idade, idadeConjuge);
    }

    // Demais membros
    for (const membro of familia.demaisMembros) {
      const idadeMembro = calcularIdade(dataParaISO(membro.dataNascimento));
      assert.ok(idadeMembro !== null);
      assert.equal(membro.idade, idadeMembro);
    }
  }
});

test('diferentes seeds produzem famílias diferentes', () => {
  const familias1 = gerarFamiliasDemo(10, 12345);
  const familias2 = gerarFamiliasDemo(10, 67890);

  let diferentes = 0;
  for (let i = 0; i < 10; i++) {
    if (familias1[i].nomeRepresentante !== familias2[i].nomeRepresentante) {
      diferentes++;
    }
  }
  // With different seeds, most should be different
  assert.ok(diferentes >= 8);
});

test('obterFamiliasDemo funciona de forma síncrona', async () => {
  // Import the function using dynamic import
  const { obterFamiliasDemo } = await import('../src/features/mapa/lib/demonstracao.ts');
  const pontos = obterFamiliasDemo();

  assert.equal(pontos.length, 50);
  for (const ponto of pontos) {
    assert.ok(ponto.id.startsWith('demo-'));
    assert.ok(ponto.dados);
    assert.ok(ponto.nomeRepresentante);
  }
});