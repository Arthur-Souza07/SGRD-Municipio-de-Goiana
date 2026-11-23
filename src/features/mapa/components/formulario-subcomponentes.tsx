import { useEffect, useState } from 'react';
import { hojeCivil } from '@/features/mapa/lib/integrantes';
import type {
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
} from '@/features/mapa/lib/familias';

interface PessoaFormularioProps {
  prefixo: string;
  dados?: ChefeFamilia | Conjuge;
  aoAlterar: (dados: ChefeFamilia | Conjuge) => void;
  camposObrigatorios?: string[];
}

export function PessoaFormulario({
  prefixo,
  dados,
  aoAlterar,
  camposObrigatorios = [],
}: PessoaFormularioProps) {
  const [form, setForm] = useState<ChefeFamilia>({
    nome: dados?.nome || '',
    apelidoNomeSocial: dados?.apelidoNomeSocial || '',
    telefone: dados?.telefone || '',
    cpf: dados?.cpf || '',
    rg: dados?.rg || '',
    dataNascimento: dados?.dataNascimento || '',
    idade: dados?.idade,
    estadoCivil: dados?.estadoCivil || 'solteiro',
    nisPis: dados?.nisPis || '',
    identidadeGenero: dados?.identidadeGenero || 'prefiro_nao_dizer',
    racaCor: dados?.racaCor || 'nao_declarada',
    ocupacaoProfissional: dados?.ocupacaoProfissional || '',
    rendaFamiliar: dados?.rendaFamiliar || '',
    beneficiosSocioassistenciais: dados?.beneficiosSocioassistenciais || '',
    possuiDeficiencia: dados?.possuiDeficiencia || 'nao',
    deficienciaQual: dados?.deficienciaQual || '',
    observacao: dados?.observacao || '',
  });

  useEffect(() => {
    if (dados) {
      setForm({
        nome: dados.nome || '',
        apelidoNomeSocial: dados.apelidoNomeSocial || '',
        telefone: dados.telefone || '',
        cpf: dados.cpf || '',
        rg: dados.rg || '',
        dataNascimento: dados.dataNascimento || '',
        idade: dados.idade,
        estadoCivil: dados.estadoCivil || 'solteiro',
        nisPis: dados.nisPis || '',
        identidadeGenero: dados.identidadeGenero || 'prefiro_nao_dizer',
        racaCor: dados.racaCor || 'nao_declarada',
        ocupacaoProfissional: dados.ocupacaoProfissional || '',
        rendaFamiliar: dados.rendaFamiliar || '',
        beneficiosSocioassistenciais: dados.beneficiosSocioassistenciais || '',
        possuiDeficiencia: dados.possuiDeficiencia || 'nao',
        deficienciaQual: dados.deficienciaQual || '',
        observacao: dados.observacao || '',
      });
    }
  }, [dados]);

  const atualizar = (campo: keyof ChefeFamilia, valor: string | number | boolean | undefined) => {
    const novo = { ...form, [campo]: valor };
    setForm(novo);
    aoAlterar(novo);
  };

  return (
    <div className="grade-campos pessoa-form">
      <label className="campo">
        Nome {camposObrigatorios.includes('nome') && <span className="opcional">*</span>}
        <input
          name={`${prefixo}-nome`}
          value={form.nome}
          onChange={(e) => atualizar('nome', e.target.value)}
          required={camposObrigatorios.includes('nome')}
        />
      </label>
      <label className="campo">
        Apelido / Nome Social
        <input
          name={`${prefixo}-apelido`}
          value={form.apelidoNomeSocial}
          onChange={(e) => atualizar('apelidoNomeSocial', e.target.value)}
        />
      </label>
      <label className="campo">
        Telefone
        <input
          name={`${prefixo}-telefone`}
          type="tel"
          value={form.telefone}
          onChange={(e) => atualizar('telefone', e.target.value)}
        />
      </label>
      <label className="campo">
        CPF {camposObrigatorios.includes('cpf') && <span className="opcional">*</span>}
        <input
          name={`${prefixo}-cpf`}
          inputMode="numeric"
          maxLength={14}
          placeholder="000.000.000-00"
          value={form.cpf}
          onChange={(e) => atualizar('cpf', e.target.value)}
          required={camposObrigatorios.includes('cpf')}
        />
      </label>
      <label className="campo">
        RG
        <input
          name={`${prefixo}-rg`}
          value={form.rg}
          onChange={(e) => atualizar('rg', e.target.value)}
        />
      </label>
      <label className="campo">
        Data de Nascimento {camposObrigatorios.includes('dataNascimento') && <span className="opcional">*</span>}
        <input
          name={`${prefixo}-nascimento`}
          type="date"
          max={hojeCivil()}
          value={form.dataNascimento}
          onChange={(e) => atualizar('dataNascimento', e.target.value)}
          required={camposObrigatorios.includes('dataNascimento')}
        />
      </label>
      <label className="campo">
        Idade
        <input
          name={`${prefixo}-idade`}
          type="number"
          inputMode="numeric"
          readOnly
          value={form.idade || ''}
        />
      </label>
      <label className="campo">
        Estado Civil
        <select
          name={`${prefixo}-estadoCivil`}
          value={form.estadoCivil}
          onChange={(e) => atualizar('estadoCivil', e.target.value)}
        >
          <option value="solteiro">Solteiro(a)</option>
          <option value="casado">Casado(a)</option>
          <option value="divorciado">Divorciado(a)</option>
          <option value="viuvo">Viúvo(a)</option>
          <option value="uniao_estavel">União Estável</option>
          <option value="outro">Outro</option>
        </select>
      </label>
      <label className="campo">
        NIS/PIS
        <input
          name={`${prefixo}-nis`}
          value={form.nisPis}
          onChange={(e) => atualizar('nisPis', e.target.value)}
        />
      </label>
      <label className="campo">
        Identidade de Gênero
        <select
          name={`${prefixo}-genero`}
          value={form.identidadeGenero}
          onChange={(e) => atualizar('identidadeGenero', e.target.value)}
        >
          <option value="masculino">Masculino</option>
          <option value="feminino">Feminino</option>
          <option value="transgenero">Transgênero</option>
          <option value="nao_binario">Não-binário</option>
          <option value="outro">Outro</option>
          <option value="prefiro_nao_dizer">Prefiro não dizer</option>
        </select>
      </label>
      <label className="campo">
        Raça/Cor
        <select
          name={`${prefixo}-raca`}
          value={form.racaCor}
          onChange={(e) => atualizar('racaCor', e.target.value)}
        >
          <option value="branca">Branca</option>
          <option value="preta">Preta</option>
          <option value="parda">Parda</option>
          <option value="amarela">Amarela</option>
          <option value="indigena">Indígena</option>
          <option value="nao_declarada">Não declarada</option>
        </select>
      </label>
      <label className="campo">
        Ocupação Profissional
        <input
          name={`${prefixo}-ocupacao`}
          value={form.ocupacaoProfissional}
          onChange={(e) => atualizar('ocupacaoProfissional', e.target.value)}
        />
      </label>
      <label className="campo">
        Renda Familiar
        <input
          name={`${prefixo}-renda`}
          value={form.rendaFamiliar}
          onChange={(e) => atualizar('rendaFamiliar', e.target.value)}
        />
      </label>
      <label className="campo">
        Benefícios Socioassistenciais
        <input
          name={`${prefixo}-beneficios`}
          value={form.beneficiosSocioassistenciais}
          onChange={(e) => atualizar('beneficiosSocioassistenciais', e.target.value)}
        />
      </label>
      <label className="campo">
        Possui Deficiência
        <select
          name={`${prefixo}-deficiencia`}
          value={form.possuiDeficiencia}
          onChange={(e) => atualizar('possuiDeficiencia', e.target.value)}
        >
          <option value="sim">SIM</option>
          <option value="nao">NÃO</option>
          <option value="nao_informado">Não informado</option>
        </select>
      </label>
      <label className="campo">
        Qual Deficiência
        <input
          name={`${prefixo}-deficienciaQual`}
          value={form.deficienciaQual}
          onChange={(e) => atualizar('deficienciaQual', e.target.value)}
        />
      </label>
      <label className="campo">
        Observação
        <textarea
          name={`${prefixo}-obs`}
          rows={2}
          value={form.observacao}
          onChange={(e) => atualizar('observacao', e.target.value)}
        />
      </label>
    </div>
  );
}

interface MembrosFormularioProps {
  membros: MembroFamilia[];
  aoAlterar: (membros: MembroFamilia[]) => void;
}

export function MembrosFormulario({ membros, aoAlterar }: MembrosFormularioProps) {
  const [lista, setLista] = useState<MembroFamilia[]>(membros);

  useEffect(() => {
    setLista(membros);
  }, [membros]);

  const atualizarMembro = (index: number, campo: keyof MembroFamilia, valor: MembroFamilia[keyof MembroFamilia]) => {
    const nova = [...lista];
    nova[index] = { ...nova[index], [campo]: valor };
    setLista(nova);
    aoAlterar(nova);
  };

  const adicionar = () => {
    const novo: MembroFamilia = {
      nome: '',
      apelidoNomeSocial: '',
      cpf: '',
      rg: '',
      dataNascimento: '',
      idade: undefined,
      estadoCivil: 'solteiro',
      nisPis: '',
      identidadeGenero: 'prefiro_nao_dizer',
      racaCor: 'nao_declarada',
      ocupacaoProfissional: '',
      rendaFamiliar: '',
      beneficiosSocioassistenciais: '',
      possuiDeficiencia: 'nao',
      deficienciaQual: '',
      observacao: '',
      vinculoSocialParentesco: 'filho',
      cor: '',
    };
    const nova = [...lista, novo];
    setLista(nova);
    aoAlterar(nova);
  };

  const remover = (index: number) => {
    const nova = lista.filter((_, i) => i !== index);
    setLista(nova);
    aoAlterar(nova);
  };

  return (
    <div className="membros-form">
      {lista.map((membro, i) => (
        <section key={i} className="ficha-familiar">
          <header>
            <strong>Membro {i + 1}</strong>
            <button type="button" className="remover-familiar" onClick={() => remover(i)}>
              Remover
            </button>
          </header>
          <div className="grade-campos">
            <label className="campo">
              Nome
              <input
                value={membro.nome}
                onChange={(e) => atualizarMembro(i, 'nome', e.target.value)}
              />
            </label>
            <label className="campo">
              Apelido / Nome Social
              <input
                value={membro.apelidoNomeSocial}
                onChange={(e) => atualizarMembro(i, 'apelidoNomeSocial', e.target.value)}
              />
            </label>
            <label className="campo">
              CPF
              <input
                inputMode="numeric"
                maxLength={14}
                placeholder="000.000.000-00"
                value={membro.cpf || ''}
                onChange={(e) => atualizarMembro(i, 'cpf', e.target.value)}
              />
            </label>
            <label className="campo">
              RG
              <input
                value={membro.rg || ''}
                onChange={(e) => atualizarMembro(i, 'rg', e.target.value)}
              />
            </label>
            <label className="campo">
              Data de Nascimento
              <input
                type="date"
                max={hojeCivil()}
                value={membro.dataNascimento || ''}
                onChange={(e) => atualizarMembro(i, 'dataNascimento', e.target.value)}
              />
            </label>
            <label className="campo">
              Idade
              <input
                type="number"
                inputMode="numeric"
                readOnly
                value={membro.idade || ''}
              />
            </label>
            <label className="campo">
              Vínculo Social / Parentesco
              <select
                value={membro.vinculoSocialParentesco}
                onChange={(e) => atualizarMembro(i, 'vinculoSocialParentesco', e.target.value as MembroFamilia['vinculoSocialParentesco'])}
              >
                <option value="conjuge">Cônjuge</option>
                <option value="filho">Filho(a)</option>
                <option value="pai_mae">Pai/Mãe</option>
                <option value="avo">Avô/Ávó</option>
                <option value="neto">Neto(a)</option>
                <option value="irmao">Irmão(ã)</option>
                <option value="outro">Outro</option>
              </select>
            </label>
            <label className="campo">
              Cor / Raça
              <input
                value={membro.cor || membro.racaCor || ''}
                onChange={(e) => atualizarMembro(i, 'cor', e.target.value)}
              />
            </label>
            <label className="campo">
              Identidade de Gênero
              <select
                value={membro.identidadeGenero}
                onChange={(e) => atualizarMembro(i, 'identidadeGenero', e.target.value as MembroFamilia['identidadeGenero'])}
              >
                <option value="masculino">Masculino</option>
                <option value="feminino">Feminino</option>
                <option value="transgenero">Transgênero</option>
                <option value="nao_binario">Não-binário</option>
                <option value="outro">Outro</option>
                <option value="prefiro_nao_dizer">Prefiro não dizer</option>
              </select>
            </label>
            <label className="campo">
              Possui Deficiência
              <select
                value={membro.possuiDeficiencia}
                onChange={(e) => atualizarMembro(i, 'possuiDeficiencia', e.target.value as MembroFamilia['possuiDeficiencia'])}
              >
                <option value="sim">SIM</option>
                <option value="nao">NÃO</option>
                <option value="nao_informado">Não informado</option>
              </select>
            </label>
            <label className="campo">
              Qual Deficiência
              <input
                value={membro.deficienciaQual || ''}
                onChange={(e) => atualizarMembro(i, 'deficienciaQual', e.target.value)}
              />
            </label>
            <label className="campo">
              Estado Civil
              <select
                value={membro.estadoCivil}
                onChange={(e) => atualizarMembro(i, 'estadoCivil', e.target.value as MembroFamilia['estadoCivil'])}
              >
                <option value="solteiro">Solteiro(a)</option>
                <option value="casado">Casado(a)</option>
                <option value="divorciado">Divorciado(a)</option>
                <option value="viuvo">Viúvo(a)</option>
                <option value="uniao_estavel">União Estável</option>
                <option value="outro">Outro</option>
              </select>
            </label>
            <label className="campo">
              Ocupação Profissional
              <input
                value={membro.ocupacaoProfissional || ''}
                onChange={(e) => atualizarMembro(i, 'ocupacaoProfissional', e.target.value)}
              />
            </label>
            <label className="campo">
              NIS/PIS
              <input
                value={membro.nisPis || ''}
                onChange={(e) => atualizarMembro(i, 'nisPis', e.target.value)}
              />
            </label>
            <label className="campo">
              Renda Familiar
              <input
                value={membro.rendaFamiliar || ''}
                onChange={(e) => atualizarMembro(i, 'rendaFamiliar', e.target.value)}
              />
            </label>
            <label className="campo">
              Benefícios Socioassistenciais
              <input
                value={membro.beneficiosSocioassistenciais || ''}
                onChange={(e) => atualizarMembro(i, 'beneficiosSocioassistenciais', e.target.value)}
              />
            </label>
            <label className="campo">
              Observação
              <textarea
                rows={2}
                value={membro.observacao || ''}
                onChange={(e) => atualizarMembro(i, 'observacao', e.target.value)}
              />
            </label>
          </div>
        </section>
      ))}
      <button type="button" className="adicionar-familiar" onClick={adicionar}>
        + Adicionar membro
      </button>
    </div>
  );
}

interface HistoricoOcorrenciasFormularioProps {
  ocorrencias: HistoricoOcorrencia[];
  aoAlterar: (ocs: HistoricoOcorrencia[]) => void;
}

export function HistoricoOcorrenciasFormulario({ ocorrencias, aoAlterar }: HistoricoOcorrenciasFormularioProps) {
  const [lista, setLista] = useState<HistoricoOcorrencia[]>(ocorrencias);

  useEffect(() => setLista(ocorrencias), [ocorrencias]);

  const atualizar = (index: number, campo: keyof HistoricoOcorrencia, valor: HistoricoOcorrencia[keyof HistoricoOcorrencia]) => {
    const nova = [...lista];
    nova[index] = { ...nova[index], [campo]: valor };
    setLista(nova);
    aoAlterar(nova);
  };

  const adicionar = () => {
    const novo: HistoricoOcorrencia = { jaFoiAtingido: 'nao_informado' };
    const nova = [...lista, novo];
    setLista(nova);
    aoAlterar(nova);
  };

  return (
    <div>
      {lista.map((oc, i) => (
        <div key={i} className="grade-campos historico-item">
          <label className="campo">
            Já foi atingido?
            <select value={oc.jaFoiAtingido} onChange={(e) => atualizar(i, 'jaFoiAtingido', e.target.value as HistoricoOcorrencia['jaFoiAtingido'])}>
              <option value="sim">SIM</option>
              <option value="nao">NÃO</option>
              <option value="nao_informado">Não informado</option>
            </select>
          </label>
          <label className="campo">
            Tipo de Ocorrência
            <input value={oc.tipoOcorrencia || ''} onChange={(e) => atualizar(i, 'tipoOcorrencia', e.target.value)} />
          </label>
          <label className="campo">
            Data/Ano
            <input value={oc.dataAnoOcorrencia || ''} onChange={(e) => atualizar(i, 'dataAnoOcorrencia', e.target.value)} />
          </label>
          <label className="campo">
            Danos à Edificação
            <select value={oc.houveDanosEdificacao || 'nao_informado'} onChange={(e) => atualizar(i, 'houveDanosEdificacao', e.target.value as HistoricoOcorrencia['houveDanosEdificacao'])}>
              <option value="sim">SIM</option>
              <option value="nao">NÃO</option>
              <option value="parcial">PARCIAL</option>
              <option value="nao_informado">Não informado</option>
            </select>
          </label>
          <label className="campo">
            Perda de Bens
            <select value={oc.houvePerdaBens || 'nao_informado'} onChange={(e) => atualizar(i, 'houvePerdaBens', e.target.value as HistoricoOcorrencia['houvePerdaBens'])}>
              <option value="sim">SIM</option>
              <option value="nao">NÃO</option>
              <option value="nao_informado">Não informado</option>
            </select>
          </label>
          <label className="campo">
            Perda Total/Parcial
            <select value={oc.houvePerdaTotalParcialImovel || 'nao_informado'} onChange={(e) => atualizar(i, 'houvePerdaTotalParcialImovel', e.target.value as HistoricoOcorrencia['houvePerdaTotalParcialImovel'])}>
              <option value="sim">SIM</option>
              <option value="nao">NÃO</option>
              <option value="parcial">PARCIAL</option>
              <option value="total">TOTAL</option>
              <option value="nao_informado">Não informado</option>
            </select>
          </label>
          <label className="campo">
            Observação
            <input value={oc.observacao || ''} onChange={(e) => atualizar(i, 'observacao', e.target.value)} />
          </label>
          <button type="button" onClick={() => { const n = lista.filter((_, idx) => idx !== i); setLista(n); aoAlterar(n); }}>Remover</button>
        </div>
      ))}
      <button type="button" onClick={adicionar}>+ Adicionar ocorrência</button>
    </div>
  );
}

interface InterdictioesFormularioProps {
  interdictioes: Interdicao[];
  aoAlterar: (ints: Interdicao[]) => void;
}

export function InterdictioesFormulario({ interdictioes, aoAlterar }: InterdictioesFormularioProps) {
  const [lista, setLista] = useState<Interdicao[]>(interdictioes);

  useEffect(() => setLista(interdictioes), [interdictioes]);

  const atualizar = (index: number, campo: keyof Interdicao, valor: Interdicao[keyof Interdicao]) => {
    const nova = [...lista];
    nova[index] = { ...nova[index], [campo]: valor };
    setLista(nova);
    aoAlterar(nova);
  };

  const adicionar = () => {
    const novo: Interdicao = { imovelJaFoiInterditado: 'nao_informado' };
    const nova = [...lista, novo];
    setLista(nova);
    aoAlterar(nova);
  };

  return (
    <div>
      {lista.map((int, i) => (
        <div key={i} className="grade-campos historico-item">
          <label className="campo">
            Interditado?
            <select value={int.imovelJaFoiInterditado} onChange={(e) => atualizar(i, 'imovelJaFoiInterditado', e.target.value as Interdicao['imovelJaFoiInterditado'])}>
              <option value="sim">SIM</option>
              <option value="nao">NÃO</option>
              <option value="nao_informado">Não informado</option>
            </select>
          </label>
          <label className="campo">
            Tipo
            <select value={int.tipo || ''} onChange={(e) => atualizar(i, 'tipo', e.target.value as Interdicao['tipo'])}>
              <option value="">Selecione</option>
              <option value="total">Total</option>
              <option value="parcial">Parcial</option>
              <option value="preventiva">Preventiva</option>
              <option value="outro">Outro</option>
            </select>
          </label>
          <label className="campo">
            Data
            <input type="date" value={int.dataInterdicao || ''} onChange={(e) => atualizar(i, 'dataInterdicao', e.target.value)} />
          </label>
          <label className="campo">
            Evacuação/Desocupação
            <select value={int.houveEvacuacaoDesocupacao || 'nao_informado'} onChange={(e) => atualizar(i, 'houveEvacuacaoDesocupacao', e.target.value as Interdicao['houveEvacuacaoDesocupacao'])}>
              <option value="sim">SIM</option>
              <option value="nao">NÃO</option>
              <option value="nao_informado">Não informado</option>
            </select>
          </label>
          <label className="campo">
            Recomendação Remoção
            <select value={int.houveRecomendacaoRemocaoDefinitiva || 'nao_informado'} onChange={(e) => atualizar(i, 'houveRecomendacaoRemocaoDefinitiva', e.target.value as Interdicao['houveRecomendacaoRemocaoDefinitiva'])}>
              <option value="sim">SIM</option>
              <option value="nao">NÃO</option>
              <option value="nao_informado">Não informado</option>
            </select>
          </label>
          <label className="campo">
            Observação
            <input value={int.observacao || ''} onChange={(e) => atualizar(i, 'observacao', e.target.value)} />
          </label>
          <button type="button" onClick={() => { const n = lista.filter((_, idx) => idx !== i); setLista(n); aoAlterar(n); }}>Remover</button>
        </div>
      ))}
      <button type="button" onClick={adicionar}>+ Adicionar interdição</button>
    </div>
  );
}

interface DesalojamentosFormularioProps {
  desalojamentos: DesalojamentoDesabrigo[];
  aoAlterar: (des: DesalojamentoDesabrigo[]) => void;
}

export function DesalojamentosFormulario({ desalojamentos, aoAlterar }: DesalojamentosFormularioProps) {
  const [lista, setLista] = useState<DesalojamentoDesabrigo[]>(desalojamentos);

  useEffect(() => setLista(desalojamentos), [desalojamentos]);

  const atualizar = (index: number, campo: keyof DesalojamentoDesabrigo, valor: DesalojamentoDesabrigo[keyof DesalojamentoDesabrigo]) => {
    const nova = [...lista];
    nova[index] = { ...nova[index], [campo]: valor };
    setLista(nova);
    aoAlterar(nova);
  };

  const adicionar = () => {
    const novo: DesalojamentoDesabrigo = { familiaJaFicouDesalojada: 'nao_informado', familiaJaFicouDesabrigada: 'nao_informado' };
    const nova = [...lista, novo];
    setLista(nova);
    aoAlterar(nova);
  };

  return (
    <div>
      {lista.map((des, i) => (
        <div key={i} className="grade-campos historico-item">
          <label className="campo">
            Desalojada?
            <select value={des.familiaJaFicouDesalojada} onChange={(e) => atualizar(i, 'familiaJaFicouDesalojada', e.target.value as DesalojamentoDesabrigo['familiaJaFicouDesalojada'])}>
              <option value="sim">SIM</option>
              <option value="nao">NÃO</option>
              <option value="nao_informado">Não informado</option>
            </select>
          </label>
          <label className="campo">
            Desabrigada?
            <select value={des.familiaJaFicouDesabrigada} onChange={(e) => atualizar(i, 'familiaJaFicouDesabrigada', e.target.value as DesalojamentoDesabrigo['familiaJaFicouDesabrigada'])}>
              <option value="sim">SIM</option>
              <option value="nao">NÃO</option>
              <option value="nao_informado">Não informado</option>
            </select>
          </label>
          <label className="campo">
            Período
            <input value={des.periodo || ''} onChange={(e) => atualizar(i, 'periodo', e.target.value)} />
          </label>
          <label className="campo">
            Local Acolhimento
            <input value={des.localAcolhimento || ''} onChange={(e) => atualizar(i, 'localAcolhimento', e.target.value)} />
          </label>
          <label className="campo">
            Retornou?
            <select value={des.retornouAoImovel || 'nao_informado'} onChange={(e) => atualizar(i, 'retornouAoImovel', e.target.value as DesalojamentoDesabrigo['retornouAoImovel'])}>
              <option value="sim">SIM</option>
              <option value="nao">NÃO</option>
              <option value="nao_informado">Não informado</option>
            </select>
          </label>
          <button type="button" onClick={() => { const n = lista.filter((_, idx) => idx !== i); setLista(n); aoAlterar(n); }}>Remover</button>
        </div>
      ))}
      <button type="button" onClick={adicionar}>+ Adicionar desalojamento</button>
    </div>
  );
}

interface BeneficiosFormularioProps {
  beneficios: BeneficioAuxilio[];
  aoAlterar: (ben: BeneficioAuxilio[]) => void;
}

export function BeneficiosFormulario({ beneficios, aoAlterar }: BeneficiosFormularioProps) {
  const [lista, setLista] = useState<BeneficioAuxilio[]>(beneficios);

  useEffect(() => setLista(beneficios), [beneficios]);

  const atualizar = (index: number, campo: keyof BeneficioAuxilio, valor: BeneficioAuxilio[keyof BeneficioAuxilio]) => {
    const nova = [...lista];
    nova[index] = { ...nova[index], [campo]: valor };
    setLista(nova);
    aoAlterar(nova);
  };

  const adicionar = () => {
    const novo: BeneficioAuxilio = { jaRecebeuBeneficioAuxilio: 'nao_informado' };
    const nova = [...lista, novo];
    setLista(nova);
    aoAlterar(nova);
  };

  return (
    <div>
      {lista.map((ben, i) => (
        <div key={i} className="grade-campos historico-item">
          <label className="campo">
            Recebeu?
            <select value={ben.jaRecebeuBeneficioAuxilio} onChange={(e) => atualizar(i, 'jaRecebeuBeneficioAuxilio', e.target.value as BeneficioAuxilio['jaRecebeuBeneficioAuxilio'])}>
              <option value="sim">SIM</option>
              <option value="nao">NÃO</option>
              <option value="nao_informado">Não informado</option>
            </select>
          </label>
          <label className="campo">
            Tipo
            <input value={ben.tipoBeneficio || ''} onChange={(e) => atualizar(i, 'tipoBeneficio', e.target.value)} />
          </label>
          <label className="campo">
            Data
            <input type="date" value={ben.data || ''} onChange={(e) => atualizar(i, 'data', e.target.value)} />
          </label>
          <label className="campo">
            Observação
            <input value={ben.observacao || ''} onChange={(e) => atualizar(i, 'observacao', e.target.value)} />
          </label>
          <button type="button" onClick={() => { const n = lista.filter((_, idx) => idx !== i); setLista(n); aoAlterar(n); }}>Remover</button>
        </div>
      ))}
      <button type="button" onClick={adicionar}>+ Adicionar benefício</button>
    </div>
  );
}

interface EncaminhamentoFormularioProps {
  encaminhamento?: EncaminhamentoHabitacional;
  aoAlterar: (enc: EncaminhamentoHabitacional) => void;
}

export function EncaminhamentoFormulario({ encaminhamento, aoAlterar }: EncaminhamentoFormularioProps) {
  const [form, setForm] = useState<EncaminhamentoHabitacional>({
    jaFoiEncaminhado: encaminhamento?.jaFoiEncaminhado || 'nao_informado',
    data: encaminhamento?.data || '',
    observacao: encaminhamento?.observacao || '',
  });

  useEffect(() => {
    if (encaminhamento) setForm(encaminhamento);
  }, [encaminhamento]);

  const atualizar = (campo: keyof EncaminhamentoHabitacional, valor: string | number | boolean | undefined) => {
    const novo = { ...form, [campo]: valor };
    setForm(novo);
    aoAlterar(novo);
  };

  return (
    <div className="grade-campos">
      <label className="campo">
        Encaminhado?
        <select value={form.jaFoiEncaminhado} onChange={(e) => atualizar('jaFoiEncaminhado', e.target.value as EncaminhamentoHabitacional['jaFoiEncaminhado'])}>
          <option value="sim">SIM</option>
          <option value="nao">NÃO</option>
          <option value="nao_informado">Não informado</option>
        </select>
      </label>
      <label className="campo">
        Data
        <input type="date" value={form.data || ''} onChange={(e) => atualizar('data', e.target.value)} />
      </label>
      <label className="campo">
        Observação
        <input value={form.observacao || ''} onChange={(e) => atualizar('observacao', e.target.value)} />
      </label>
    </div>
  );
}

interface VistoriasFormularioProps {
  vistorias?: HistoricoVistorias;
  aoAlterar: (vis: HistoricoVistorias) => void;
}

export function VistoriasFormulario({ vistorias, aoAlterar }: VistoriasFormularioProps) {
  const [form, setForm] = useState<HistoricoVistorias>({
    jaFoiAtendidaAssistenciaSocial: vistorias?.jaFoiAtendidaAssistenciaSocial || 'nao_informado',
    dataUltimaVistoriaAssistencia: vistorias?.dataUltimaVistoriaAssistencia || '',
    assistenteSocialResponsavel: vistorias?.assistenteSocialResponsavel || '',
    jaFoiRealizadaVistoriaTecnicaDefesaCivil: vistorias?.jaFoiRealizadaVistoriaTecnicaDefesaCivil || 'nao_informado',
    dataUltimaVistoriaDefesaCivil: vistorias?.dataUltimaVistoriaDefesaCivil || '',
    tecnicoResponsavel: vistorias?.tecnicoResponsavel || '',
  });

  useEffect(() => {
    if (vistorias) setForm(vistorias);
  }, [vistorias]);

  const atualizar = (campo: keyof HistoricoVistorias, valor: string | number | boolean | undefined) => {
    const novo = { ...form, [campo]: valor };
    setForm(novo);
    aoAlterar(novo);
  };

  return (
    <div className="grade-campos">
      <label className="campo">
        Atendida Assistência Social?
        <select value={form.jaFoiAtendidaAssistenciaSocial} onChange={(e) => atualizar('jaFoiAtendidaAssistenciaSocial', e.target.value as HistoricoVistorias['jaFoiAtendidaAssistenciaSocial'])}>
          <option value="sim">SIM</option>
          <option value="nao">NÃO</option>
          <option value="nao_informado">Não informado</option>
        </select>
      </label>
      <label className="campo">
        Data Última Vistoria Assistência
        <input type="date" value={form.dataUltimaVistoriaAssistencia || ''} onChange={(e) => atualizar('dataUltimaVistoriaAssistencia', e.target.value)} />
      </label>
      <label className="campo">
        Assistente Social Responsável
        <input value={form.assistenteSocialResponsavel || ''} onChange={(e) => atualizar('assistenteSocialResponsavel', e.target.value)} />
      </label>
      <label className="campo">
        Vistoria Técnica Defesa Civil?
        <select value={form.jaFoiRealizadaVistoriaTecnicaDefesaCivil} onChange={(e) => atualizar('jaFoiRealizadaVistoriaTecnicaDefesaCivil', e.target.value as HistoricoVistorias['jaFoiRealizadaVistoriaTecnicaDefesaCivil'])}>
          <option value="sim">SIM</option>
          <option value="nao">NÃO</option>
          <option value="nao_informado">Não informado</option>
        </select>
      </label>
      <label className="campo">
        Data Última Vistoria Defesa Civil
        <input type="date" value={form.dataUltimaVistoriaDefesaCivil || ''} onChange={(e) => atualizar('dataUltimaVistoriaDefesaCivil', e.target.value)} />
      </label>
      <label className="campo">
        Técnico Responsável
        <input value={form.tecnicoResponsavel || ''} onChange={(e) => atualizar('tecnicoResponsavel', e.target.value)} />
      </label>
    </div>
  );
}

interface SituacaoAtualFormularioProps {
  situacao?: SituacaoAtual;
  aoAlterar: (sit: SituacaoAtual) => void;
}

export function SituacaoAtualFormulario({ situacao, aoAlterar }: SituacaoAtualFormularioProps) {
  const [form, setForm] = useState<SituacaoAtual>({
    emAcompanhamentoDefesaCivil: situacao?.emAcompanhamentoDefesaCivil || 'nao_informado',
    observacao: situacao?.observacao || '',
  });

  useEffect(() => {
    if (situacao) setForm(situacao);
  }, [situacao]);

  const atualizar = (campo: keyof SituacaoAtual, valor: string | number | boolean | undefined) => {
    const novo = { ...form, [campo]: valor };
    setForm(novo);
    aoAlterar(novo);
  };

  return (
    <div className="grade-campos">
      <label className="campo">
        Em Acompanhamento Defesa Civil?
        <select value={form.emAcompanhamentoDefesaCivil} onChange={(e) => atualizar('emAcompanhamentoDefesaCivil', e.target.value as SituacaoAtual['emAcompanhamentoDefesaCivil'])}>
          <option value="sim">SIM</option>
          <option value="nao">NÃO</option>
          <option value="nao_informado">Não informado</option>
        </select>
      </label>
      <label className="campo">
        Observação
        <textarea rows={2} value={form.observacao || ''} onChange={(e) => atualizar('observacao', e.target.value)} />
      </label>
    </div>
  );
}

interface DocumentosFormularioProps {
  documentos?: DocumentosFotograficos;
  aoAlterar: (doc: DocumentosFotograficos) => void;
}

export function DocumentosFormulario({ documentos, aoAlterar }: DocumentosFormularioProps) {
  const [form, setForm] = useState<DocumentosFotograficos>({
    possuiDocumentos: documentos?.possuiDocumentos || 'nao',
    listaDocumentos: documentos?.listaDocumentos || [],
    possuiRegistroFotografico: documentos?.possuiRegistroFotografico || 'nao',
    descricaoFotos: documentos?.descricaoFotos || '',
  });

  useEffect(() => {
    if (documentos) setForm(documentos);
  }, [documentos]);

  const atualizar = (campo: keyof DocumentosFotograficos, valor: string | number | boolean | string[] | undefined) => {
    const novo = { ...form, [campo]: valor };
    setForm(novo);
    aoAlterar(novo);
  };

  return (
    <div className="grade-campos">
      <label className="campo">
        Possui Documentos?
        <select value={form.possuiDocumentos} onChange={(e) => atualizar('possuiDocumentos', e.target.value as DocumentosFotograficos['possuiDocumentos'])}>
          <option value="sim">SIM</option>
          <option value="nao">NÃO</option>
          <option value="parcial">PARCIAL</option>
        </select>
      </label>
      <label className="campo">
        Lista de Documentos (separados por vírgula)
        <input value={form.listaDocumentos?.join(', ') || ''} onChange={(e) => atualizar('listaDocumentos', e.target.value.split(',').map(s => s.trim()).filter(Boolean))} />
      </label>
      <label className="campo">
        Possui Registro Fotográfico?
        <select value={form.possuiRegistroFotografico} onChange={(e) => atualizar('possuiRegistroFotografico', e.target.value as DocumentosFotograficos['possuiRegistroFotografico'])}>
          <option value="sim">SIM</option>
          <option value="nao">NÃO</option>
        </select>
      </label>
      <label className="campo">
        Descrição das Fotos
        <textarea rows={2} value={form.descricaoFotos || ''} onChange={(e) => atualizar('descricaoFotos', e.target.value)} />
      </label>
    </div>
  );
}