import { type CondicoesHabitabilidade } from '@/features/mapa/lib/familias';

interface Props {
  dados: CondicoesHabitabilidade | undefined;
  aoAlterar: (dados: CondicoesHabitabilidade) => void;
  erros?: Partial<Record<keyof CondicoesHabitabilidade, string>>;
  apenasLeitura?: boolean;
}

const OPCOES_TIPO_CONSTRUCAO = {
  alvenaria: 'Alvenaria',
  madeira: 'Madeira',
  mista: 'Mista',
  taipa: 'Taipa',
  container: 'Container',
  outro: 'Outro',
} as const;

const OPCOES_ACABAMENTO = {
  alto: 'Alto',
  medio: 'Médio',
  baixo: 'Baixo',
  sem_acabamento: 'Sem acabamento',
} as const;

const OPCOES_COBERTA = {
  laje: 'Laje',
  telha_ceramica: 'Telha cerâmica',
  telha_metalica: 'Telha metálica',
  telha_fibrocimento: 'Telha fibrocimento',
  palha: 'Palha',
  outro: 'Outro',
} as const;

const OPCOES_SANEAMENTO = {
  rede_coletora: 'Rede coletora',
  fossa_setica: 'Fossa séptica',
  fossa_rudimentar: 'Fossa rudimentar',
  valao: 'Valão',
  inexistente: 'Inexistente',
} as const;

const OPCOES_AGUA = {
  rede_publica: 'Rede pública',
  poco_artesiano: 'Poço artesiano',
  cisterna: 'Cisterna',
  carro_pipa: 'Carro-pipa',
  outro: 'Outro',
} as const;

const OPCOES_AGUAS_PLUVIAS = {
  rede_coletora: 'Rede coletora',
  valao: 'Valão',
  superficial: 'Superficial',
  inexistente: 'Inexistente',
} as const;

const OPCOES_PAVIMENTACAO = {
  asfalto: 'Asfalto',
  paralelepipedo: 'Paralelepípedo',
  bloquete: 'Bloquete',
  terra: 'Terra',
  outro: 'Outro',
} as const;

const OPCOES_ILUMINACAO = {
  sim: 'Sim',
  nao: 'Não',
  parcial: 'Parcial',
} as const;

const OPCOES_COLETA = {
  sim: 'Sim',
  nao: 'Não',
} as const;

export default function SecaoCondicoesHabitabilidade({
  dados,
  aoAlterar,
  erros = {},
  apenasLeitura = false,
}: Props) {
  const d = dados || {} as CondicoesHabitabilidade;

  function alterar<K extends keyof CondicoesHabitabilidade>(campo: K, valor: CondicoesHabitabilidade[K]) {
    aoAlterar({ ...d, [campo]: valor });
  }

  const propsCampo = (campo: keyof CondicoesHabitabilidade) => ({
    'aria-invalid': !!erros[campo],
    'aria-describedby': erros[campo] ? `erro-${campo}` : undefined,
    disabled: apenasLeitura,
  });

  const ajuda = (campo: keyof CondicoesHabitabilidade) =>
    erros[campo] ? (
      <span id={`erro-${campo}`} className="erro-campo">
        {erros[campo]}
      </span>
    ) : null;

  return (
    <fieldset disabled={apenasLeitura}>
      <legend>
        <span>3</span>Condições de Habitabilidade
      </legend>
      <p className="ajuda-secao">
        Infraestrutura e características construtivas da residência.
      </p>

      <div className="grade-campos">
        <label className="campo">
          Tipo de construção *
          <select
            name="tipoConstrucao"
            value={d.tipoConstrucao || ''}
            onChange={(e) => alterar('tipoConstrucao', e.target.value as CondicoesHabitabilidade['tipoConstrucao'])}
            {...propsCampo('tipoConstrucao')}
          >
            <option value="">Selecione</option>
            {Object.entries(OPCOES_TIPO_CONSTRUCAO).map(([valor, nome]) => (
              <option key={valor} value={valor}>
                {nome}
              </option>
            ))}
          </select>
          {ajuda('tipoConstrucao')}
        </label>
        <label className="campo">
          Padrão de acabamento *
          <select
            name="padraoAcabamento"
            value={d.padraoAcabamento || ''}
            onChange={(e) => alterar('padraoAcabamento', e.target.value as CondicoesHabitabilidade['padraoAcabamento'])}
            {...propsCampo('padraoAcabamento')}
          >
            <option value="">Selecione</option>
            {Object.entries(OPCOES_ACABAMENTO).map(([valor, nome]) => (
              <option key={valor} value={valor}>
                {nome}
              </option>
            ))}
          </select>
          {ajuda('padraoAcabamento')}
        </label>
      </div>

      <div className="grade-campos">
        <label className="campo">
          Tipo de cobertura *
          <select
            name="tipoCoberta"
            value={d.tipoCoberta || ''}
            onChange={(e) => alterar('tipoCoberta', e.target.value as CondicoesHabitabilidade['tipoCoberta'])}
            {...propsCampo('tipoCoberta')}
          >
            <option value="">Selecione</option>
            {Object.entries(OPCOES_COBERTA).map(([valor, nome]) => (
              <option key={valor} value={valor}>
                {nome}
              </option>
            ))}
          </select>
          {ajuda('tipoCoberta')}
        </label>
        <label className="campo">
          Saneamento básico *
          <select
            name="saneamentoBasico"
            value={d.saneamentoBasico || ''}
            onChange={(e) => alterar('saneamentoBasico', e.target.value as CondicoesHabitabilidade['saneamentoBasico'])}
            {...propsCampo('saneamentoBasico')}
          >
            <option value="">Selecione</option>
            {Object.entries(OPCOES_SANEAMENTO).map(([valor, nome]) => (
              <option key={valor} value={valor}>
                {nome}
              </option>
            ))}
          </select>
          {ajuda('saneamentoBasico')}
        </label>
      </div>

      <div className="grade-campos">
        <label className="campo">
          Abastecimento de água *
          <select
            name="abastecimentoAgua"
            value={d.abastecimentoAgua || ''}
            onChange={(e) => alterar('abastecimentoAgua', e.target.value as CondicoesHabitabilidade['abastecimentoAgua'])}
            {...propsCampo('abastecimentoAgua')}
          >
            <option value="">Selecione</option>
            {Object.entries(OPCOES_AGUA).map(([valor, nome]) => (
              <option key={valor} value={valor}>
                {nome}
              </option>
            ))}
          </select>
          {ajuda('abastecimentoAgua')}
        </label>
        <label className="campo">
          Águas pluviais *
          <select
            name="aguasPluviais"
            value={d.aguasPluviais || ''}
            onChange={(e) => alterar('aguasPluviais', e.target.value as CondicoesHabitabilidade['aguasPluviais'])}
            {...propsCampo('aguasPluviais')}
          >
            <option value="">Selecione</option>
            {Object.entries(OPCOES_AGUAS_PLUVIAS).map(([valor, nome]) => (
              <option key={valor} value={valor}>
                {nome}
              </option>
            ))}
          </select>
          {ajuda('aguasPluviais')}
        </label>
      </div>

      <div className="grade-campos">
        <label className="campo">
          Pavimentação *
          <select
            name="pavimentacao"
            value={d.pavimentacao || ''}
            onChange={(e) => alterar('pavimentacao', e.target.value as CondicoesHabitabilidade['pavimentacao'])}
            {...propsCampo('pavimentacao')}
          >
            <option value="">Selecione</option>
            {Object.entries(OPCOES_PAVIMENTACAO).map(([valor, nome]) => (
              <option key={valor} value={valor}>
                {nome}
              </option>
            ))}
          </select>
          {ajuda('pavimentacao')}
        </label>
        <label className="campo">
          Iluminação pública *
          <select
            name="iluminacaoPublica"
            value={d.iluminacaoPublica || ''}
            onChange={(e) => alterar('iluminacaoPublica', e.target.value as CondicoesHabitabilidade['iluminacaoPublica'])}
            {...propsCampo('iluminacaoPublica')}
          >
            <option value="">Selecione</option>
            {Object.entries(OPCOES_ILUMINACAO).map(([valor, nome]) => (
              <option key={valor} value={valor}>
                {nome}
              </option>
            ))}
          </select>
          {ajuda('iluminacaoPublica')}
        </label>
      </div>

      <label className="campo">
        Coleta de resíduos *
        <select
          name="coletaResiduos"
          value={d.coletaResiduos || ''}
          onChange={(e) => alterar('coletaResiduos', e.target.value as CondicoesHabitabilidade['coletaResiduos'])}
          {...propsCampo('coletaResiduos')}
        >
          <option value="">Selecione</option>
          {Object.entries(OPCOES_COLETA).map(([valor, nome]) => (
            <option key={valor} value={valor}>
              {nome}
            </option>
          ))}
        </select>
        {ajuda('coletaResiduos')}
      </label>
    </fieldset>
  );
}