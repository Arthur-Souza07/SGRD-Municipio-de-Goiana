import { type EncaminhamentoHabitacional } from '@/features/mapa/lib/familias';

interface Props {
  dados: EncaminhamentoHabitacional | undefined;
  aoAlterar: (dados: EncaminhamentoHabitacional) => void;
  erros?: Partial<Record<keyof EncaminhamentoHabitacional, string>>;
  apenasLeitura?: boolean;
}

const OPCOES_SIM_NAO = {
  sim: 'Sim',
  nao: 'Não',
  nao_informado: 'Não informado',
} as const;

export default function SecaoEncaminhamentoHabitacional({
  dados,
  aoAlterar,
  erros = {},
  apenasLeitura = false,
}: Props) {
  const d = dados || {} as EncaminhamentoHabitacional;

  function alterar<K extends keyof EncaminhamentoHabitacional>(campo: K, valor: EncaminhamentoHabitacional[K]) {
    aoAlterar({ ...d, [campo]: valor });
  }

  const propsCampo = (campo: keyof EncaminhamentoHabitacional) => ({
    'aria-invalid': !!erros[campo],
    'aria-describedby': erros[campo] ? `erro-${campo}` : undefined,
    disabled: apenasLeitura,
  });

  const ajuda = (campo: keyof EncaminhamentoHabitacional) =>
    erros[campo] ? (
      <span id={`erro-${campo}`} className="erro-campo">
        {erros[campo]}
      </span>
    ) : null;

  return (
    <fieldset disabled={apenasLeitura}>
      <legend>
        <span>5.5</span>Encaminhamento Habitacional
      </legend>
      <p className="ajuda-secao">
        Registre se a família já foi encaminhada para programas habitacionais.
      </p>

      <div className="grade-campos">
        <label className="campo">
          Já foi encaminhada? *
          <select
            name="encaminhamento-foi"
            value={d.jaFoiEncaminhado || ''}
            onChange={(e) => alterar('jaFoiEncaminhado', e.target.value as EncaminhamentoHabitacional['jaFoiEncaminhado'])}
            {...propsCampo('jaFoiEncaminhado')}
          >
            <option value="">Selecione</option>
            {Object.entries(OPCOES_SIM_NAO).map(([valor, nome]) => (
              <option key={valor} value={valor}>
                {nome}
              </option>
            ))}
          </select>
          {ajuda('jaFoiEncaminhado')}
        </label>
        <label className="campo">
          Data *
          <input
            name="encaminhamento-data"
            type="date"
            value={d.data || ''}
            onChange={(e) => alterar('data', e.target.value)}
            {...propsCampo('data')}
          />
        </label>
      </div>

      <label className="campo">
        Observações <span className="opcional">(opcional)</span>
        <textarea
          name="encaminhamento-obs"
          rows={2}
          maxLength={300}
          placeholder="Ex.: Encaminhada para programa Minha Casa Minha Vida - Faixa 1"
          value={d.observacao || ''}
          onChange={(e) => alterar('observacao', e.target.value)}
          {...propsCampo('observacao')}
        />
        {ajuda('observacao')}
      </label>
    </fieldset>
  );
}