import { type HistoricoVistorias } from '@/features/mapa/lib/familias';

interface Props {
  dados: HistoricoVistorias | undefined;
  aoAlterar: (dados: HistoricoVistorias) => void;
  erros?: Partial<Record<keyof HistoricoVistorias, string>>;
  apenasLeitura?: boolean;
}

const OPCOES_SIM_NAO = {
  sim: 'Sim',
  nao: 'Não',
  nao_informado: 'Não informado',
} as const;

export default function SecaoVistorias({
  dados,
  aoAlterar,
  erros = {},
  apenasLeitura = false,
}: Props) {
  const d = dados || {} as HistoricoVistorias;

  function alterar<K extends keyof HistoricoVistorias>(campo: K, valor: HistoricoVistorias[K]) {
    aoAlterar({ ...d, [campo]: valor });
  }

  const propsCampo = (campo: keyof HistoricoVistorias) => ({
    'aria-invalid': !!erros[campo],
    'aria-describedby': erros[campo] ? `erro-${campo}` : undefined,
    disabled: apenasLeitura,
  });

  const ajuda = (campo: keyof HistoricoVistorias) =>
    erros[campo] ? (
      <span id={`erro-${campo}`} className="erro-campo">
        {erros[campo]}
      </span>
    ) : null;

  return (
    <fieldset disabled={apenasLeitura}>
      <legend>
        <span>5.6</span>Histórico de Vistorias
      </legend>
      <p className="ajuda-secao">
        Registre as vistorias de assistência social e técnicas (Defesa Civil) realizadas.
      </p>

      <h4>Vistoria de Assistência Social</h4>
      <div className="grade-campos">
        <label className="campo">
          Já foi atendida pela Assistência Social? *
          <select
            name="vistoria-social-atendida"
            value={d.jaFoiAtendidaAssistenciaSocial || ''}
            onChange={(e) => alterar('jaFoiAtendidaAssistenciaSocial', e.target.value as HistoricoVistorias['jaFoiAtendidaAssistenciaSocial'])}
            {...propsCampo('jaFoiAtendidaAssistenciaSocial')}
          >
            <option value="">Selecione</option>
            {Object.entries(OPCOES_SIM_NAO).map(([valor, nome]) => (
              <option key={valor} value={valor}>
                {nome}
              </option>
            ))}
          </select>
          {ajuda('jaFoiAtendidaAssistenciaSocial')}
        </label>
        <label className="campo">
          Data da última vistoria *
          <input
            name="vistoria-social-data"
            type="date"
            value={d.dataUltimaVistoriaAssistencia || ''}
            onChange={(e) => alterar('dataUltimaVistoriaAssistencia', e.target.value)}
            {...propsCampo('dataUltimaVistoriaAssistencia')}
          />
        </label>
      </div>
      <label className="campo">
        Assistente social responsável *
        <input
          name="vistoria-social-responsavel"
          maxLength={120}
          placeholder="Nome do profissional e unidade (Ex.: Maria Silva - CRAS Centro)"
          value={d.assistenteSocialResponsavel || ''}
          onChange={(e) => alterar('assistenteSocialResponsavel', e.target.value)}
          {...propsCampo('assistenteSocialResponsavel')}
        />
        {ajuda('assistenteSocialResponsavel')}
      </label>

      <h4 style={{ marginTop: '1.5rem' }}>Vistoria Técnica - Defesa Civil</h4>
      <div className="grade-campos">
        <label className="campo">
          Já foi realizada vistoria técnica? *
          <select
            name="vistoria-tecnica-realizada"
            value={d.jaFoiRealizadaVistoriaTecnicaDefesaCivil || ''}
            onChange={(e) => alterar('jaFoiRealizadaVistoriaTecnicaDefesaCivil', e.target.value as HistoricoVistorias['jaFoiRealizadaVistoriaTecnicaDefesaCivil'])}
            {...propsCampo('jaFoiRealizadaVistoriaTecnicaDefesaCivil')}
          >
            <option value="">Selecione</option>
            {Object.entries(OPCOES_SIM_NAO).map(([valor, nome]) => (
              <option key={valor} value={valor}>
                {nome}
              </option>
            ))}
          </select>
          {ajuda('jaFoiRealizadaVistoriaTecnicaDefesaCivil')}
        </label>
        <label className="campo">
          Data da última vistoria *
          <input
            name="vistoria-tecnica-data"
            type="date"
            value={d.dataUltimaVistoriaDefesaCivil || ''}
            onChange={(e) => alterar('dataUltimaVistoriaDefesaCivil', e.target.value)}
            {...propsCampo('dataUltimaVistoriaDefesaCivil')}
          />
        </label>
      </div>
      <label className="campo">
        Técnico responsável *
        <input
          name="vistoria-tecnica-responsavel"
          maxLength={120}
          placeholder="Nome do profissional e órgão (Ex.: Eng. João Santos - Defesa Civil Goiana)"
          value={d.tecnicoResponsavel || ''}
          onChange={(e) => alterar('tecnicoResponsavel', e.target.value)}
          {...propsCampo('tecnicoResponsavel')}
        />
        {ajuda('tecnicoResponsavel')}
      </label>
    </fieldset>
  );
}