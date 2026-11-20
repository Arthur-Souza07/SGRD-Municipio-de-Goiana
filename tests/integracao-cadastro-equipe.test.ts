import test from 'node:test';
import assert from 'node:assert/strict';
import { converterCadastroEquipe } from '../src/features/mapa/lib/cadastro-equipe';
import type { CadastroPessoaDados } from '../src/components/cadastro/campos';

function ficha(): CadastroPessoaDados {
  return {
    dados: {
      nome: 'Família de teste',
      cpf: '11144477735',
      telefone: '',
      logradouro: 'Rua de demonstração',
      numero: '10',
      bairro: 'Centro',
      complemento: '',
      moradores: '2',
      dataNascimento: '1988-04-12',
      apoio: '',
      nivelRisco: 'Médio',
      tipoOcorrencia: 'Inundação de rio',
      observacoes: 'Registro fictício',
    },
    familia: [
      {
        nome: 'Pessoa de teste',
        cpf: '',
        dataNascimento: '2018-03-20',
        parentesco: 'Filho(a)',
        apoio: 'Acompanhamento de responsável',
      },
    ],
    ocorrencias: [
      {
        data: '2026-05-20',
        tipo: 'Alagamento',
        descricao: 'Histórico fictício para integração',
      },
    ],
    latitude: -7.5608,
    longitude: -35.0009,
  };
}

test('a ficha da equipe produz o mesmo contrato de família usado pelo mapa', () => {
  const entrada = ficha();
  const dados = converterCadastroEquipe(entrada);
  assert.equal(dados.nomeRepresentante, entrada.dados.nome);
  assert.equal(dados.cpf, '11144477735');
  assert.equal(dados.nivelRisco, 'medio');
  assert.equal(dados.tipoOcorrencia, 'inundacao');
  assert.equal(dados.moradores, 2);
  assert.equal(dados.familiares?.[0].parentesco, 'filho');
  assert.equal(dados.familiares?.[0].cpf, '');
  assert.equal(dados.localizacao.origem, 'gps');
  assert.match(dados.observacoes, /Histórico fictício para integração/);
  assert.equal(entrada.familia[0].parentesco, 'Filho(a)');
});

test('a integração bloqueia documentos inválidos, moradores inconsistentes e local fora de Goiana', () => {
  const documento = ficha();
  documento.dados.cpf = '123';
  assert.throws(() => converterCadastroEquipe(documento), /CPF/);
  const moradores = ficha();
  moradores.dados.moradores = '1';
  assert.throws(
    () => converterCadastroEquipe(moradores),
    /moradores|composição|pessoas/i,
  );
  const fora = ficha();
  fora.latitude = -7.77;
  fora.longitude = -34.89;
  assert.throws(() => converterCadastroEquipe(fora), /Goiana/);
  const semParentesco = ficha();
  semParentesco.familia[0].parentesco = '';
  assert.throws(() => converterCadastroEquipe(semParentesco), /parentesco/);
});
