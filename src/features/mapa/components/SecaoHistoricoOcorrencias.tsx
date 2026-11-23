import { Plus, Trash2 } from 'lucide-react';
import { type HistoricoOcorrencia } from '@/features/mapa/lib/familias';

interface Props {
  dados: HistoricoOcorrencia[] | undefined;
  aoAlterar: (dados: HistoricoOcorrencia[]) => void;
  erros?: string;
  apenasLeitura?: boolean;
}

const OPCOES_SIM_NAO_PARCIAL = {
  sim: 'Sim',
  nao: 'Não',
  parcial: 'Parcial',
  nao_informado: 'Não informado',
} as const;

const OPCOES_PERDA_TOTAL = {
  sim: 'Sim',
  nao: 'Não',
  parcial: 'Parcial',
  total: 'Total',
  nao_informado: 'Não informado',
} as const;

export default function SecaoHistoricoOcorrencias({
  dados,
  aoAlterar,
  erros,
  apenasLeitura = false,
}: Props) {
  const ocorrencias = dados || [];

  function atualizar(index: number, campo: keyof HistoricoOcorrencia, valor: string | undefined) {
    const novas = [...ocorrencias];
    novas[index] = { ...novas[index], [campo]: valor };
    aoAlterar(novas);
  }

  function adicionar() {
    const novas = [...ocorrencias, {
      jaFoiAtingido: 'nao_informado' as const,
      tipoOcorrencia: '',
      dataAnoOcorrencia: '',
      houveDanosEdificacao: 'nao_informado' as const,
      houvePerdaBens: 'nao_informado' as const,
      houvePerdaTotalParcialImovel: 'nao_informado' as const,
      observacao: '',
    }];
    aoAlterar(novas);
  }

  function remover(index: number) {
    const novas = ocorrencias.filter((_, i) => i !== index);
    aoAlterar(novas);
  }

  return (
    <fieldset disabled={apenasLeitura}>
      <legend>
        <span>5.1</span>Histórico de Ocorrências
      </legend>
      <p className="ajuda-secao">
        Registre as ocorrências que atingiram a família (inundações, deslizamentos, erosões, etc.).
        Máximo de 6 ocorrências.
      </p>

      {ocorrencias.map((oc, i) => (
        <section key={i} className="ficha-familiar bloco-ocorrencia">
          <header>
            <strong>Ocorrência {i + 1}</strong>
            {!apenasLeitura && (
              <button
                type="button"
                className="remover-familiar"
                aria-label={`Remover ocorrência ${i + 1}`}
                onClick={() => remover(i)}
              >
                <Trash2 size={14} />
                Remover
              </button>
            )}
          </header>

          <div className="grade-campos">
            <label className="campo">
              Foi atingido? *
              <select
                name={`ocorrencia-atingido-${i}`}
                value={oc.jaFoiAtingido}
                onChange={(e) => atualizar(i, 'jaFoiAtingido', e.target.value as HistoricoOcorrencia['jaFoiAtingido'])}
              >
                {Object.entries(OPCOES_SIM_NAO_PARCIAL).map(([valor, nome]) => (
                  <option key={valor} value={valor}>
                    {nome}
                  </option>
                ))}
              </select>
            </label>
            <label className="campo">
              Tipo de ocorrência <span className="opcional">(opcional)</span>
              <input
                name={`ocorrencia-tipo-${i}`}
                maxLength={100}
                placeholder="Ex.: Inundação, Deslizamento, Erosão"
                value={oc.tipoOcorrencia || ''}
                onChange={(e) => atualizar(i, 'tipoOcorrencia', e.target.value || undefined)}
              />
            </label>
          </div>

          <div className="grade-campos">
            <label className="campo">
              Data / Ano <span className="opcional">(opcional)</span>
              <input
                name={`ocorrencia-data-${i}`}
                maxLength={20}
                placeholder="Ex.: 2022, Junho/2022"
                value={oc.dataAnoOcorrencia || ''}
                onChange={(e) => atualizar(i, 'dataAnoOcorrencia', e.target.value || undefined)}
              />
            </label>
          </div>

          <div className="grade-campos">
            <label className="campo">
              Houve danos à edificação? *
              <select
                name={`ocorrencia-danos-${i}`}
                value={oc.houveDanosEdificacao}
                onChange={(e) => atualizar(i, 'houveDanosEdificacao', e.target.value as HistoricoOcorrencia['houveDanosEdificacao'])}
              >
                {Object.entries(OPCOES_SIM_NAO_PARCIAL).map(([valor, nome]) => (
                  <option key={valor} value={valor}>
                    {nome}
                  </option>
                ))}
              </select>
            </label>
            <label className="campo">
              Houve perda de bens? *
              <select
                name={`ocorrencia-perda-bens-${i}`}
                value={oc.houvePerdaBens}
                onChange={(e) => atualizar(i, 'houvePerdaBens', e.target.value as HistoricoOcorrencia['houvePerdaBens'])}
              >
                {Object.entries(OPCOES_SIM_NAO_PARCIAL).map(([valor, nome]) => (
                  <option key={valor} value={valor}>
                    {nome}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <label className="campo">
            Houve perda total/parcial do imóvel? *
            <select
              name={`ocorrencia-perda-imovel-${i}`}
              value={oc.houvePerdaTotalParcialImovel}
              onChange={(e) => atualizar(i, 'houvePerdaTotalParcialImovel', e.target.value as HistoricoOcorrencia['houvePerdaTotalParcialImovel'])}
            >
              {Object.entries(OPCOES_PERDA_TOTAL).map(([valor, nome]) => (
                <option key={valor} value={valor}>
                  {nome}
                </option>
              ))}
            </select>
          </label>

          <label className="campo">
            Observações <span className="opcional">(opcional)</span>
            <textarea
              name={`ocorrencia-obs-${i}`}
              rows={2}
              maxLength={300}
              placeholder="Detalhes sobre a ocorrência"
              value={oc.observacao || ''}
              onChange={(e) => atualizar(i, 'observacao', e.target.value)}
            />
          </label>
        </section>
      ))}

      {ocorrencias.length < 6 && !apenasLeitura && (
        <button type="button" className="adicionar-familiar" onClick={adicionar}>
          <Plus size={16} />
          Adicionar ocorrência
        </button>
      )}

      {erros && (
        <p className="erro-campo" role="alert">{erros}</p>
      )}
    </fieldset>
  );
}