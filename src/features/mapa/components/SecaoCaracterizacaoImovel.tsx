import { Plus, Trash2 } from 'lucide-react';
import { type CaracterizacaoImovel, type Comodo } from '@/features/mapa/lib/familias';

interface Props {
  dados: CaracterizacaoImovel | undefined;
  aoAlterar: (dados: CaracterizacaoImovel) => void;
  erros?: Partial<Record<keyof CaracterizacaoImovel, string>>;
  apenasLeitura?: boolean;
}

const OPCOES_USO = {
  residencial: 'Residencial',
  comercial: 'Comercial',
  misto: 'Misto (residencial + comercial)',
  institucional: 'Institucional',
  outro: 'Outro',
} as const;

const OPCOES_OCUPACAO = {
  proprio: 'Próprio',
  alugado: 'Alugado',
  cedido: 'Cedido',
  invasao: 'Invasão',
  outro: 'Outro',
} as const;

export default function SecaoCaracterizacaoImovel({
  dados,
  aoAlterar,
  erros = {},
  apenasLeitura = false,
}: Props) {
  const d = dados || {} as CaracterizacaoImovel;
  const comodos = d.comodos || [];

  function alterar<K extends keyof CaracterizacaoImovel>(campo: K, valor: CaracterizacaoImovel[K]) {
    aoAlterar({ ...d, [campo]: valor });
  }

  function alterarComodos(novosComodos: Comodo[]) {
    aoAlterar({ ...d, comodos: novosComodos });
  }

  function atualizarComodo(index: number, campo: keyof Comodo, valor: string | number) {
    const novos = [...comodos];
    novos[index] = { ...novos[index], [campo]: valor };
    alterarComodos(novos);
  }

  function removerComodo(index: number) {
    const novos = comodos.filter((_, i) => i !== index);
    alterarComodos(novos);
  }

  function adicionarComodo() {
    const novos = [...comodos, { nome: '', quantidade: 1 }];
    alterarComodos(novos);
  }

  const propsCampo = (campo: keyof CaracterizacaoImovel) => ({
    'aria-invalid': !!erros[campo],
    'aria-describedby': erros[campo] ? `erro-${campo}` : undefined,
    disabled: apenasLeitura,
  });

  const ajuda = (campo: keyof CaracterizacaoImovel) =>
    erros[campo] ? (
      <span id={`erro-${campo}`} className="erro-campo">
        {erros[campo]}
      </span>
    ) : null;

  return (
    <fieldset disabled={apenasLeitura}>
      <legend>
        <span>2</span>Caracterização do Imóvel
      </legend>
      <p className="ajuda-secao">
        Informações sobre uso, ocupação, áreas e cômodos da residência.
      </p>

      <div className="grade-campos">
        <label className="campo">
          Uso do imóvel *
          <select
            name="usoImovel"
            value={d.usoImovel || ''}
            onChange={(e) => alterar('usoImovel', e.target.value as CaracterizacaoImovel['usoImovel'])}
            {...propsCampo('usoImovel')}
          >
            <option value="">Selecione</option>
            {Object.entries(OPCOES_USO).map(([valor, nome]) => (
              <option key={valor} value={valor}>
                {nome}
              </option>
            ))}
          </select>
          {ajuda('usoImovel')}
        </label>
        <label className="campo">
          Condição de ocupação *
          <select
            name="condicoesOcupacao"
            value={d.condicoesOcupacao || ''}
            onChange={(e) => alterar('condicoesOcupacao', e.target.value as CaracterizacaoImovel['condicoesOcupacao'])}
            {...propsCampo('condicoesOcupacao')}
          >
            <option value="">Selecione</option>
            {Object.entries(OPCOES_OCUPACAO).map(([valor, nome]) => (
              <option key={valor} value={valor}>
                {nome}
              </option>
            ))}
          </select>
          {ajuda('condicoesOcupacao')}
        </label>
      </div>

      <div className="grade-campos">
        <label className="campo">
          Valor do aluguel (R$) <span className="opcional">(se alugado)</span>
          <input
            name="valorAluguel"
            inputMode="decimal"
            autoComplete="off"
            maxLength={15}
            placeholder="0,00"
            value={d.valorAluguel || ''}
            onChange={(e) => alterar('valorAluguel', e.target.value)}
            {...propsCampo('valorAluguel')}
            disabled={d.condicoesOcupacao !== 'alugado' && !apenasLeitura}
          />
        </label>
        <label className="campo">
          Nome do locador <span className="opcional">(se alugado)</span>
          <input
            name="nomeLocador"
            maxLength={120}
            value={d.nomeLocador || ''}
            onChange={(e) => alterar('nomeLocador', e.target.value)}
            {...propsCampo('nomeLocador')}
            disabled={d.condicoesOcupacao !== 'alugado' && !apenasLeitura}
          />
        </label>
      </div>

      <div className="grade-campos">
        <label className="campo">
          Imóvel verticalizado? *
          <select
            name="imovelVerticalizado"
            value={d.imovelVerticalizado || ''}
            onChange={(e) => alterar('imovelVerticalizado', e.target.value as CaracterizacaoImovel['imovelVerticalizado'])}
            {...propsCampo('imovelVerticalizado')}
          >
            <option value="">Selecione</option>
            <option value="sim">Sim</option>
            <option value="nao">Não</option>
          </select>
          {ajuda('imovelVerticalizado')}
        </label>
        <label className="campo">
          Nº de pavimentos <span className="opcional">(se verticalizado)</span>
          <input
            name="numeroPavimentos"
            type="number"
            min="1"
            max="50"
            inputMode="numeric"
            value={d.numeroPavimentos || ''}
            onChange={(e) => alterar('numeroPavimentos', e.target.value)}
            {...propsCampo('numeroPavimentos')}
            disabled={d.imovelVerticalizado !== 'sim' && !apenasLeitura}
          />
        </label>
      </div>

      <div className="grade-campos">
        <label className="campo">
          Pavimentos que ocupa <span className="opcional">(se verticalizado)</span>
          <input
            name="pavimentosOcupa"
            maxLength={50}
            placeholder="Ex.: Térreo e 1º andar"
            value={d.pavimentosOcupa || ''}
            onChange={(e) => alterar('pavimentosOcupa', e.target.value)}
            {...propsCampo('pavimentosOcupa')}
            disabled={d.imovelVerticalizado !== 'sim' && !apenasLeitura}
          />
        </label>
        <label className="campo">
          Área do terreno (m²) *
          <input
            name="areaTerreno"
            inputMode="decimal"
            autoComplete="off"
            maxLength={15}
            placeholder="Ex.: 120"
            value={d.areaTerreno || ''}
            onChange={(e) => alterar('areaTerreno', e.target.value)}
            {...propsCampo('areaTerreno')}
          />
          {ajuda('areaTerreno')}
        </label>
      </div>

      <label className="campo">
        Área de construção (m²) *
        <input
          name="areaConstrucao"
          inputMode="decimal"
          autoComplete="off"
          maxLength={15}
          placeholder="Ex.: 80"
          value={d.areaConstrucao || ''}
          onChange={(e) => alterar('areaConstrucao', e.target.value)}
          {...propsCampo('areaConstrucao')}
        />
        {ajuda('areaConstrucao')}
      </label>

      <div className="secao-comodos">
        <h4>Cômodos e dependências</h4>
        <p className="ajuda-secao">Liste os cômodos e suas quantidades.</p>
        <table className="tabela-comodos">
          <thead>
            <tr>
              <th>Cômodo</th>
              <th>Quantidade</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {comodos.map((comodo, i) => (
              <tr key={i}>
                <td>
                  <input
                    type="text"
                    maxLength={50}
                    value={comodo.nome}
                    onChange={(e) => atualizarComodo(i, 'nome', e.target.value)}
                    disabled={apenasLeitura}
                    placeholder="Ex.: Quarto, Sala, Cozinha"
                  />
                </td>
                <td>
                  <input
                    type="number"
                    min="0"
                    max="20"
                    inputMode="numeric"
                    value={comodo.quantidade}
                    onChange={(e) => atualizarComodo(i, 'quantidade', Number(e.target.value) || 0)}
                    disabled={apenasLeitura}
                  />
                </td>
                <td>
                  {!apenasLeitura && (
                    <button
                      type="button"
                      className="remover-familiar"
                      aria-label={`Remover ${comodo.nome}`}
                      onClick={() => removerComodo(i)}
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!apenasLeitura && (
          <button type="button" className="adicionar-familiar" onClick={adicionarComodo}>
            <Plus size={16} />
            Adicionar cômodo
          </button>
        )}
      </div>
    </fieldset>
  );
}