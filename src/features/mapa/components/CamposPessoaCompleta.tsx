import { Trash2 } from 'lucide-react';
import {
  formatarCpf,
  type PessoaCompleta,
  type MembroFamilia,
} from '@/features/mapa/lib/familias';
import {
  hojeCivil,
  PARENTESCOS,
} from '@/features/mapa/lib/integrantes';

interface Props {
  titulo: string;
  pessoa: PessoaCompleta | MembroFamilia | undefined;
  aoAlterar: (pessoa: PessoaCompleta | MembroFamilia) => void;
  erros?: Partial<Record<string, string>>;
  mostrarVinculo?: boolean;
  indice?: number;
  aoRemover?: () => void;
  apenasLeitura?: boolean;
}

const OPCOES_ESTADO_CIVIL = {
  solteiro: 'Solteiro(a)',
  casado: 'Casado(a)',
  divorciado: 'Divorciado(a)',
  viuvo: 'Viúvo(a)',
  uniao_estavel: 'União estável',
  outro: 'Outro',
} as const;

const OPCOES_GENERO = {
  masculino: 'Masculino',
  feminino: 'Feminino',
  transgenero: 'Transgênero',
  nao_binario: 'Não binário',
  outro: 'Outro',
  prefiro_nao_dizer: 'Prefiro não dizer',
} as const;

const OPCOES_RACA = {
  branca: 'Branca',
  preta: 'Preta',
  parda: 'Parda',
  amarela: 'Amarela',
  indigena: 'Indígena',
  nao_declarada: 'Não declarada',
} as const;

const OPCOES_DEFICIENCIA = {
  sim: 'Sim',
  nao: 'Não',
  nao_informado: 'Não informado',
} as const;

export default function CamposPessoaCompleta({
  titulo,
  pessoa,
  aoAlterar,
  erros = {},
  mostrarVinculo = false,
  indice,
  aoRemover,
  apenasLeitura = false,
}: Props) {
  const p = pessoa || {} as PessoaCompleta & Partial<MembroFamilia>;

  function alterar(campo: string, valor: string | number | undefined) {
    const novo = { ...p, [campo]: valor };
    // Ensure id is preserved
    if (p.id) novo.id = p.id;
    aoAlterar(novo as PessoaCompleta | MembroFamilia);
  }

  const propsCampo = (campo: string) => ({
    'aria-invalid': !!erros[campo],
    'aria-describedby': erros[campo] ? `erro-${campo}` : undefined,
    disabled: apenasLeitura,
  });

  const ajuda = (campo: string) =>
    erros[campo] ? (
      <span id={`erro-${campo}`} className="erro-campo">
        {erros[campo]}
      </span>
    ) : null;

  
  return (
    <section className="ficha-familiar" aria-label={titulo}>
      <header>
        <strong>{titulo}{indice !== undefined ? ` ${indice + 1}` : ''}</strong>
        {aoRemover && !apenasLeitura && (
          <button
            type="button"
            className="remover-familiar"
            aria-label={`Remover ${titulo}`}
            onClick={aoRemover}
          >
            <Trash2 size={14} />
            Remover
          </button>
        )}
      </header>

      <label className="campo">
        Nome completo *
        <input
          name={`nome-${p.nome || 'novo'}`}
          autoComplete="off"
          maxLength={120}
          value={p.nome || ''}
          onChange={(e) => alterar('nome', e.target.value)}
          {...propsCampo('nome')}
        />
        {ajuda('nome')}
      </label>

      <label className="campo">
        Apelido / Nome social <span className="opcional">(opcional)</span>
        <input
          name={`apelido-${p.nome || 'novo'}`}
          autoComplete="off"
          maxLength={120}
          value={p.apelidoNomeSocial || ''}
          onChange={(e) => alterar('apelidoNomeSocial', e.target.value)}
          {...propsCampo('apelidoNomeSocial')}
        />
      </label>

      <div className="grade-campos">
        <label className="campo">
          Telefone com DDD <span className="opcional">(opcional)</span>
          <input
            name={`telefone-${p.nome || 'novo'}`}
            type="tel"
            inputMode="tel"
            autoComplete="off"
            maxLength={20}
            placeholder="(81) 90000-0000"
            value={p.telefone || ''}
            onChange={(e) => alterar('telefone', e.target.value)}
            {...propsCampo('telefone')}
          />
        </label>
        <label className="campo">
          CPF <span className="opcional">(opcional)</span>
          <input
            name={`cpf-${p.nome || 'novo'}`}
            inputMode="numeric"
            autoComplete="off"
            maxLength={14}
            placeholder="000.000.000-00"
            value={p.cpf || ''}
            onChange={(e) => alterar('cpf', formatarCpf(e.target.value))}
            {...propsCampo('cpf')}
          />
          {ajuda('cpf')}
        </label>
      </div>

      <div className="grade-campos">
        <label className="campo">
          RG <span className="opcional">(opcional)</span>
          <input
            name={`rg-${p.nome || 'novo'}`}
            autoComplete="off"
            maxLength={20}
            placeholder="00.000.000-0"
            value={p.rg || ''}
            onChange={(e) => alterar('rg', e.target.value)}
            {...propsCampo('rg')}
          />
        </label>
        <label className="campo">
          Data de nascimento *
          <input
            name={`nascimento-${p.nome || 'novo'}`}
            type="date"
            max={hojeCivil()}
            value={p.dataNascimento || ''}
            onChange={(e) => alterar('dataNascimento', e.target.value)}
            {...propsCampo('dataNascimento')}
          />
          {ajuda('dataNascimento')}
        </label>
      </div>

      <div className="grade-campos">
        <label className="campo">
          Idade
          <input
            name={`idade-${p.nome || 'novo'}`}
            type="number"
            min="0"
            max="120"
            inputMode="numeric"
            value={p.idade !== undefined ? String(p.idade) : ''}
            onChange={(e) => alterar('idade', e.target.value ? Number(e.target.value) : undefined)}
            {...propsCampo('idade')}
            readOnly
          />
          <small>Calculada automaticamente</small>
        </label>
        <label className="campo">
          Estado civil *
          <select
            name={`estadoCivil-${p.nome || 'novo'}`}
            value={p.estadoCivil || ''}
            onChange={(e) => alterar('estadoCivil', e.target.value)}
            {...propsCampo('estadoCivil')}
          >
            <option value="">Selecione</option>
            {Object.entries(OPCOES_ESTADO_CIVIL).map(([valor, nome]) => (
              <option key={valor} value={valor}>
                {nome}
              </option>
            ))}
          </select>
          {ajuda('estadoCivil')}
        </label>
      </div>

      <div className="grade-campos">
        <label className="campo">
          NIS/PIS <span className="opcional">(opcional)</span>
          <input
            name={`nis-${p.nome || 'novo'}`}
            inputMode="numeric"
            autoComplete="off"
            maxLength={15}
            placeholder="000.00000.00-0"
            value={p.nisPis || ''}
            onChange={(e) => alterar('nisPis', e.target.value)}
            {...propsCampo('nisPis')}
          />
        </label>
        <label className="campo">
          Identidade de gênero *
          <select
            name={`genero-${p.nome || 'novo'}`}
            value={p.identidadeGenero || ''}
            onChange={(e) => alterar('identidadeGenero', e.target.value)}
            {...propsCampo('identidadeGenero')}
          >
            <option value="">Selecione</option>
            {Object.entries(OPCOES_GENERO).map(([valor, nome]) => (
              <option key={valor} value={valor}>
                {nome}
              </option>
            ))}
          </select>
          {ajuda('identidadeGenero')}
        </label>
      </div>

      <div className="grade-campos">
        <label className="campo">
          Raça / Cor *
          <select
            name={`raca-${p.nome || 'novo'}`}
            value={p.racaCor || ''}
            onChange={(e) => alterar('racaCor', e.target.value)}
            {...propsCampo('racaCor')}
          >
            <option value="">Selecione</option>
            {Object.entries(OPCOES_RACA).map(([valor, nome]) => (
              <option key={valor} value={valor}>
                {nome}
              </option>
            ))}
          </select>
          {ajuda('racaCor')}
        </label>
      </div>

      <label className="campo">
        Ocupação profissional <span className="opcional">(opcional)</span>
        <input
          name={`ocupacao-${p.nome || 'novo'}`}
          autoComplete="off"
          maxLength={100}
          placeholder="Ex.: trabalhador autônomo, motorista, estudante, aposentado"
          value={p.ocupacaoProfissional || ''}
          onChange={(e) => alterar('ocupacaoProfissional', e.target.value)}
          {...propsCampo('ocupacaoProfissional')}
        />
      </label>

      <div className="grade-campos">
        <label className="campo">
          Renda familiar individual (R$) <span className="opcional">(opcional)</span>
          <input
            name={`renda-${p.nome || 'novo'}`}
            inputMode="decimal"
            autoComplete="off"
            maxLength={15}
            placeholder="0,00"
            value={p.rendaFamiliar || ''}
            onChange={(e) => alterar('rendaFamiliar', e.target.value)}
            {...propsCampo('rendaFamiliar')}
          />
        </label>
        <label className="campo">
          Benefícios socioassistenciais <span className="opcional">(opcional)</span>
          <input
            name={`beneficios-${p.nome || 'novo'}`}
            autoComplete="off"
            maxLength={200}
            placeholder="Ex.: Bolsa Família, BPC/LOAS, Auxílio Gás"
            value={p.beneficiosSocioassistenciais || ''}
            onChange={(e) => alterar('beneficiosSocioassistenciais', e.target.value)}
            {...propsCampo('beneficiosSocioassistenciais')}
          />
        </label>
      </div>

      <div className="grade-campos">
        <label className="campo">
          Possui deficiência? *
          <select
            name={`deficiencia-${p.nome || 'novo'}`}
            value={p.possuiDeficiencia || ''}
            onChange={(e) => alterar('possuiDeficiencia', e.target.value)}
            {...propsCampo('possuiDeficiencia')}
          >
            <option value="">Selecione</option>
            {Object.entries(OPCOES_DEFICIENCIA).map(([valor, nome]) => (
              <option key={valor} value={valor}>
                {nome}
              </option>
            ))}
          </select>
          {ajuda('possuiDeficiencia')}
        </label>
        <label className="campo">
          Qual deficiência? <span className="opcional">(opcional)</span>
          <input
            name={`deficiencia-qual-${p.nome || 'novo'}`}
            autoComplete="off"
            maxLength={200}
            placeholder="Descreva a deficiência"
            value={p.deficienciaQual || ''}
            onChange={(e) => alterar('deficienciaQual', e.target.value)}
            {...propsCampo('deficienciaQual')}
            disabled={p.possuiDeficiencia !== 'sim' && !apenasLeitura}
          />
        </label>
      </div>

      {mostrarVinculo && (
        <div className="grade-campos">
          <label className="campo">
            Vínculo social / Parentesco *
            <select
              name={`vinculo-${p.nome || 'novo'}`}
              value={(p as MembroFamilia).vinculoSocialParentesco || ''}
              onChange={(e) => alterar('vinculoSocialParentesco', e.target.value)}
              {...propsCampo('vinculoSocialParentesco')}
            >
              <option value="">Selecione</option>
              {Object.entries(PARENTESCOS).map(([valor, nome]) => (
                <option key={valor} value={valor}>
                  {nome}
                </option>
              ))}
            </select>
            {ajuda('vinculoSocialParentesco')}
          </label>
          <label className="campo">
            Raça/Cor específica <span className="opcional">(opcional)</span>
            <input
              name={`cor-${p.nome || 'novo'}`}
              autoComplete="off"
              maxLength={50}
              value={(p as MembroFamilia).cor || ''}
              onChange={(e) => alterar('cor', e.target.value)}
              {...propsCampo('cor')}
            />
          </label>
        </div>
      )}

      <label className="campo">
        Observações <span className="opcional">(opcional)</span>
        <textarea
          name={`obs-${p.nome || 'novo'}`}
          rows={2}
          maxLength={300}
          placeholder="Informações adicionais sobre esta pessoa"
          value={p.observacao || ''}
          onChange={(e) => alterar('observacao', e.target.value)}
          {...propsCampo('observacao')}
        />
        {ajuda('observacao')}
      </label>
    </section>
  );
}