import { type SituacaoAtual } from '@/features/mapa/lib/familias';

interface Props {
  dados: SituacaoAtual | undefined;
  aoAlterar: (dados: SituacaoAtual) => void;
  erros?: Partial<Record<keyof SituacaoAtual, string>>;
  apenasLeitura?: boolean;
}

const OPCOES_SIM_NAO = {
  sim: 'Sim',
  nao: 'Não',
  nao_informado: 'Não informado',
} as const;

export default function SecaoSituacaoAtual({
  dados,
  aoAlterar,
  erros = {},
  apenasLeitura = false,
}: Props) {
  const d = dados || {} as SituacaoAtual;

  function alterar<K extends keyof SituacaoAtual>(campo: K, valor: SituacaoAtual[K]) {
    aoAlterar({ ...d, [campo]: valor });
  }

  const propsCampo = (campo: keyof SituacaoAtual) => ({
    'aria-invalid': !!erros[campo],
    'aria-describedby': erros[campo] ? `erro-${campo}` : undefined,
    disabled: apenasLeitura,
  });

  const ajuda = (campo: keyof SituacaoAtual) =>
    erros[campo] ? (
      <span id={`erro-${campo}`} className="erro-campo">
        {erros[campo]}
      </span>
    ) : null;

  return (
    <fieldset disabled={apenasLeitura}>
      <legend>
        <span>5.7</span>Situação Atual
      </legend>
      <p className="ajuda-secao">
        Situação atual de acompanhamento pela Defesa Civil.
      </p>

      <div className="grade-campos">
        <label className="campo">
          Em acompanhamento pela Defesa Civil? *
          <select
            name="situacao-acompanhamento"
            value={d.emAcompanhamentoDefesaCivil || ''}
            onChange={(e) => alterar('emAcompanhamentoDefesaCivil', e.target.value as SituacaoAtual['emAcompanhamentoDefesaCivil'])}
            {...propsCampo('emAcompanhamentoDefesaCivil')}
          >
            <option value="">Selecione</option>
            {Object.entries(OPCOES_SIM_NAO).map(([valor, nome]) => (
              <option key={valor} value={valor}>
                {nome}
              </option>
            ))}
          </select>
          {ajuda('emAcompanhamentoDefesaCivil')}
        </label>
      </div>

      <label className="campo">
        Observações <span className="opcional">(opcional)</span>
        <textarea
          name="situacao-obs"
          rows={2}
          maxLength={300}
          placeholder="Ex.: Família em área de risco monitorada. Recomendada remoção preventiva."
          value={d.observacao || ''}
          onChange={(e) => alterar('observacao', e.target.value)}
          {...propsCampo('observacao')}
        />
        {ajuda('observacao')}
      </label>
    </fieldset>
  );
}