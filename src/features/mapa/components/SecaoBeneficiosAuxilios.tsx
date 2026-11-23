import { Plus, Trash2 } from 'lucide-react';
import { type BeneficioAuxilio } from '@/features/mapa/lib/familias';

interface Props {
  dados: BeneficioAuxilio[] | undefined;
  aoAlterar: (dados: BeneficioAuxilio[]) => void;
  erros?: string;
  apenasLeitura?: boolean;
}

const OPCOES_SIM_NAO = {
  sim: 'Sim',
  nao: 'Não',
  nao_informado: 'Não informado',
} as const;

export default function SecaoBeneficiosAuxilios({
  dados,
  aoAlterar,
  erros,
  apenasLeitura = false,
}: Props) {
  const beneficios = dados || [];

  function atualizar(index: number, campo: keyof BeneficioAuxilio, valor: string) {
    const novas = [...beneficios];
    novas[index] = { ...novas[index], [campo]: valor };
    aoAlterar(novas);
  }

  function adicionar() {
    const novas = [...beneficios, {
      jaRecebeuBeneficioAuxilio: 'nao_informado' as const,
      tipoBeneficio: '',
      data: '',
      observacao: '',
    }];
    aoAlterar(novas);
  }

  function remover(index: number) {
    const novas = beneficios.filter((_, i) => i !== index);
    aoAlterar(novas);
  }

  return (
    <fieldset disabled={apenasLeitura}>
      <legend>
        <span>5.4</span>Benefícios e Auxílios
      </legend>
      <p className="ajuda-secao">
        Registre benefícios e auxílios recebidos pela família.
      </p>

      {beneficios.map((ben, i) => (
        <section key={i} className="ficha-familiar bloco-beneficio">
          <header>
            <strong>Benefício {i + 1}</strong>
            {!apenasLeitura && (
              <button
                type="button"
                className="remover-familiar"
                aria-label={`Remover benefício ${i + 1}`}
                onClick={() => remover(i)}
              >
                <Trash2 size={14} />
                Remover
              </button>
            )}
          </header>

          <div className="grade-campos">
            <label className="campo">
              Recebeu benefício/auxílio? *
              <select
                name={`beneficio-recebeu-${i}`}
                value={ben.jaRecebeuBeneficioAuxilio}
                onChange={(e) => atualizar(i, 'jaRecebeuBeneficioAuxilio', e.target.value as BeneficioAuxilio['jaRecebeuBeneficioAuxilio'])}
              >
                {Object.entries(OPCOES_SIM_NAO).map(([valor, nome]) => (
                  <option key={valor} value={valor}>
                    {nome}
                  </option>
                ))}
              </select>
            </label>
            <label className="campo">
              Tipo de benefício *
              <input
                name={`beneficio-tipo-${i}`}
                maxLength={100}
                placeholder="Ex.: Auxílio Aluguel, Auxílio Moradia, Bolsa Família"
                value={ben.tipoBeneficio || ''}
                onChange={(e) => atualizar(i, 'tipoBeneficio', e.target.value)}
              />
            </label>
          </div>

          <div className="grade-campos">
            <label className="campo">
              Data *
              <input
                name={`beneficio-data-${i}`}
                type="date"
                value={ben.data || ''}
                onChange={(e) => atualizar(i, 'data', e.target.value)}
              />
            </label>
          </div>

          <label className="campo">
            Observações <span className="opcional">(opcional)</span>
            <textarea
              name={`beneficio-obs-${i}`}
              rows={2}
              maxLength={300}
              placeholder="Detalhes sobre o benefício (valores, parcelas, etc.)"
              value={ben.observacao || ''}
              onChange={(e) => atualizar(i, 'observacao', e.target.value)}
            />
          </label>
        </section>
      ))}

      {!apenasLeitura && (
        <button type="button" className="adicionar-familiar" onClick={adicionar}>
          <Plus size={16} />
          Adicionar benefício
        </button>
      )}

      {erros && (
        <p className="erro-campo" role="alert">{erros}</p>
      )}
    </fieldset>
  );
}