import { Plus, Trash2 } from 'lucide-react';
import { type DesalojamentoDesabrigo } from '@/features/mapa/lib/familias';

interface Props {
  dados: DesalojamentoDesabrigo[] | undefined;
  aoAlterar: (dados: DesalojamentoDesabrigo[]) => void;
  erros?: string;
  apenasLeitura?: boolean;
}

const OPCOES_SIM_NAO = {
  sim: 'Sim',
  nao: 'Não',
  nao_informado: 'Não informado',
} as const;

export default function SecaoDesalojamentos({
  dados,
  aoAlterar,
  erros,
  apenasLeitura = false,
}: Props) {
  const desalojamentos = dados || [];

  function atualizar(index: number, campo: keyof DesalojamentoDesabrigo, valor: string | undefined) {
    const novas = [...desalojamentos];
    novas[index] = { ...novas[index], [campo]: valor };
    aoAlterar(novas);
  }

  function adicionar() {
    const novas = [...desalojamentos, {
      familiaJaFicouDesalojada: 'nao_informado' as const,
      familiaJaFicouDesabrigada: 'nao_informado' as const,
      periodo: '',
      localAcolhimento: '',
      retornouAoImovel: 'nao_informado' as const,
    }];
    aoAlterar(novas);
  }

  function remover(index: number) {
    const novas = desalojamentos.filter((_, i) => i !== index);
    aoAlterar(novas);
  }

  return (
    <fieldset disabled={apenasLeitura}>
      <legend>
        <span>5.3</span>Desalojamentos e Desabrigo
      </legend>
      <p className="ajuda-secao">
        Registre períodos em que a família ficou desalojada ou desabrigada. Máximo de 4 registros.
      </p>

      {desalojamentos.map((des, i) => (
        <section key={i} className="ficha-familiar bloco-desalojamento">
          <header>
            <strong>Registro {i + 1}</strong>
            {!apenasLeitura && (
              <button
                type="button"
                className="remover-familiar"
                aria-label={`Remover registro ${i + 1}`}
                onClick={() => remover(i)}
              >
                <Trash2 size={14} />
                Remover
              </button>
            )}
          </header>

          <div className="grade-campos">
            <label className="campo">
              Ficou desalojada? *
              <select
                name={`desalojado-${i}`}
                value={des.familiaJaFicouDesalojada}
                onChange={(e) => atualizar(i, 'familiaJaFicouDesalojada', e.target.value as DesalojamentoDesabrigo['familiaJaFicouDesalojada'])}
              >
                {Object.entries(OPCOES_SIM_NAO).map(([valor, nome]) => (
                  <option key={valor} value={valor}>
                    {nome}
                  </option>
                ))}
              </select>
            </label>
            <label className="campo">
              Ficou desabrigada? *
              <select
                name={`desabrigado-${i}`}
                value={des.familiaJaFicouDesabrigada}
                onChange={(e) => atualizar(i, 'familiaJaFicouDesabrigada', e.target.value as DesalojamentoDesabrigo['familiaJaFicouDesabrigada'])}
              >
                {Object.entries(OPCOES_SIM_NAO).map(([valor, nome]) => (
                  <option key={valor} value={valor}>
                    {nome}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="grade-campos">
            <label className="campo">
              Período <span className="opcional">(opcional)</span>
              <input
                name={`desalojamento-periodo-${i}`}
                maxLength={50}
                placeholder="Ex.: Junho/2022 - 15 dias"
                value={des.periodo || ''}
                onChange={(e) => atualizar(i, 'periodo', e.target.value || undefined)}
              />
            </label>
            <label className="campo">
              Local de acolhimento <span className="opcional">(opcional)</span>
              <input
                name={`desalojamento-local-${i}`}
                maxLength={120}
                placeholder="Ex.: Escola Municipal Centro"
                value={des.localAcolhimento || ''}
                onChange={(e) => atualizar(i, 'localAcolhimento', e.target.value || undefined)}
              />
            </label>
          </div>

          <label className="campo">
            Retornou ao imóvel? *
            <select
              name={`desalojamento-retornou-${i}`}
              value={des.retornouAoImovel}
              onChange={(e) => atualizar(i, 'retornouAoImovel', e.target.value as DesalojamentoDesabrigo['retornouAoImovel'])}
            >
              {Object.entries(OPCOES_SIM_NAO).map(([valor, nome]) => (
                <option key={valor} value={valor}>
                  {nome}
                </option>
              ))}
            </select>
          </label>
        </section>
      ))}

      {desalojamentos.length < 4 && !apenasLeitura && (
        <button type="button" className="adicionar-familiar" onClick={adicionar}>
          <Plus size={16} />
          Adicionar registro
        </button>
      )}

      {erros && (
        <p className="erro-campo" role="alert">{erros}</p>
      )}
    </fieldset>
  );
}