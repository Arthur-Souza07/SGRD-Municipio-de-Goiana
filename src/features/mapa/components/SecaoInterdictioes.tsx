import { Plus, Trash2 } from 'lucide-react';
import { type Interdicao } from '@/features/mapa/lib/familias';

interface Props {
  dados: Interdicao[] | undefined;
  aoAlterar: (dados: Interdicao[]) => void;
  erros?: string;
  apenasLeitura?: boolean;
}

const OPCOES_SIM_NAO = {
  sim: 'Sim',
  nao: 'Não',
  nao_informado: 'Não informado',
} as const;

const OPCOES_TIPO_INTERDICAO = {
  total: 'Total',
  parcial: 'Parcial',
  preventiva: 'Preventiva',
  outro: 'Outro',
} as const;

export default function SecaoInterdictioes({
  dados,
  aoAlterar,
  erros,
  apenasLeitura = false,
}: Props) {
  const interdictioes = dados || [];

  function atualizar(index: number, campo: keyof Interdicao, valor: string | undefined) {
    const novas = [...interdictioes];
    novas[index] = { ...novas[index], [campo]: valor };
    aoAlterar(novas);
  }

  function adicionar() {
    const novas = [...interdictioes, {
      imovelJaFoiInterditado: 'nao_informado' as const,
      tipo: 'total' as const,
      dataInterdicao: '',
      houveEvacuacaoDesocupacao: 'nao_informado' as const,
      houveRecomendacaoRemocaoDefinitiva: 'nao_informado' as const,
      observacao: '',
    }];
    aoAlterar(novas);
  }

  function remover(index: number) {
    const novas = interdictioes.filter((_, i) => i !== index);
    aoAlterar(novas);
  }

  return (
    <fieldset disabled={apenasLeitura}>
      <legend>
        <span>5.2</span>Interdições e Medidas de Segurança
      </legend>
      <p className="ajuda-secao">
        Registre se o imóvel já foi interditado. Máximo de 3 interdições.
      </p>

      {interdictioes.map((int, i) => (
        <section key={i} className="ficha-familiar bloco-interdicao">
          <header>
            <strong>Interdição {i + 1}</strong>
            {!apenasLeitura && (
              <button
                type="button"
                className="remover-familiar"
                aria-label={`Remover interdição ${i + 1}`}
                onClick={() => remover(i)}
              >
                <Trash2 size={14} />
                Remover
              </button>
            )}
          </header>

          <div className="grade-campos">
            <label className="campo">
              Imóvel já foi interditado? *
              <select
                name={`interdicao-foi-${i}`}
                value={int.imovelJaFoiInterditado}
                onChange={(e) => atualizar(i, 'imovelJaFoiInterditado', e.target.value as Interdicao['imovelJaFoiInterditado'])}
              >
                {Object.entries(OPCOES_SIM_NAO).map(([valor, nome]) => (
                  <option key={valor} value={valor}>
                    {nome}
                  </option>
                ))}
              </select>
            </label>
            <label className="campo">
              Tipo de interdição <span className="opcional">(opcional)</span>
              <select
                name={`interdicao-tipo-${i}`}
                value={int.tipo || ''}
                onChange={(e) => atualizar(i, 'tipo', e.target.value || undefined)}
              >
                <option value="">Selecione</option>
                {Object.entries(OPCOES_TIPO_INTERDICAO).map(([valor, nome]) => (
                  <option key={valor} value={valor}>
                    {nome}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="grade-campos">
            <label className="campo">
              Data da interdição <span className="opcional">(opcional)</span>
              <input
                name={`interdicao-data-${i}`}
                type="date"
                value={int.dataInterdicao || ''}
                onChange={(e) => atualizar(i, 'dataInterdicao', e.target.value || undefined)}
              />
            </label>
          </div>

          <div className="grade-campos">
            <label className="campo">
              Houve evacuação/desocupação? *
              <select
                name={`interdicao-evacuacao-${i}`}
                value={int.houveEvacuacaoDesocupacao}
                onChange={(e) => atualizar(i, 'houveEvacuacaoDesocupacao', e.target.value as Interdicao['houveEvacuacaoDesocupacao'])}
              >
                {Object.entries(OPCOES_SIM_NAO).map(([valor, nome]) => (
                  <option key={valor} value={valor}>
                    {nome}
                  </option>
                ))}
              </select>
            </label>
            <label className="campo">
              Houve recomendação de remoção definitiva? *
              <select
                name={`interdicao-remocao-${i}`}
                value={int.houveRecomendacaoRemocaoDefinitiva}
                onChange={(e) => atualizar(i, 'houveRecomendacaoRemocaoDefinitiva', e.target.value as Interdicao['houveRecomendacaoRemocaoDefinitiva'])}
              >
                {Object.entries(OPCOES_SIM_NAO).map(([valor, nome]) => (
                  <option key={valor} value={valor}>
                    {nome}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <label className="campo">
            Observações <span className="opcional">(opcional)</span>
            <textarea
              name={`interdicao-obs-${i}`}
              rows={2}
              maxLength={300}
              placeholder="Detalhes sobre a interdição"
              value={int.observacao || ''}
              onChange={(e) => atualizar(i, 'observacao', e.target.value || undefined)}
            />
          </label>
        </section>
      ))}

      {interdictioes.length < 3 && !apenasLeitura && (
        <button type="button" className="adicionar-familiar" onClick={adicionar}>
          <Plus size={16} />
          Adicionar interdição
        </button>
      )}

      {erros && (
        <p className="erro-campo" role="alert">{erros}</p>
      )}
    </fieldset>
  );
}