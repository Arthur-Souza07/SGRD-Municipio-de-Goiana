import { type InformacaoImovel } from '@/features/mapa/lib/familias';

interface Props {
  dados: InformacaoImovel | undefined;
  aoAlterar: (dados: InformacaoImovel) => void;
  erros?: Partial<Record<keyof InformacaoImovel, string>>;
  apenasLeitura?: boolean;
}

export default function SecaoInformacaoImovel({
  dados,
  aoAlterar,
  erros = {},
  apenasLeitura = false,
}: Props) {
  const d = dados || {} as InformacaoImovel;

  function alterar<K extends keyof InformacaoImovel>(campo: K, valor: InformacaoImovel[K]) {
    aoAlterar({ ...d, [campo]: valor });
  }

  const propsCampo = (campo: keyof InformacaoImovel) => ({
    'aria-invalid': !!erros[campo],
    'aria-describedby': erros[campo] ? `erro-${campo}` : undefined,
    disabled: apenasLeitura,
  });

  const ajuda = (campo: keyof InformacaoImovel) =>
    erros[campo] ? (
      <span id={`erro-${campo}`} className="erro-campo">
        {erros[campo]}
      </span>
    ) : null;

  return (
    <fieldset disabled={apenasLeitura}>
      <legend>
        <span>1</span>Informação do Imóvel
      </legend>
      <p className="ajuda-secao">
        Dados de endereço e localização da residência.
      </p>

      <div className="grade-campos">
        <label className="campo">
          Município *
          <input
            name="municipio"
            maxLength={100}
            value={d.municipio || 'GOIANA / PE'}
            onChange={(e) => alterar('municipio', e.target.value)}
            {...propsCampo('municipio')}
          />
          {ajuda('municipio')}
        </label>
        <label className="campo">
          Data do cadastro *
          <input
            name="dataCadastro"
            type="date"
            value={d.dataCadastro || ''}
            onChange={(e) => alterar('dataCadastro', e.target.value)}
            {...propsCampo('dataCadastro')}
          />
          {ajuda('dataCadastro')}
        </label>
      </div>

      <div className="grade-campos">
        <label className="campo">
          Data da última atualização <span className="opcional">(opcional)</span>
          <input
            name="dataUltimaAtualizacao"
            type="date"
            value={d.dataUltimaAtualizacao || ''}
            onChange={(e) => alterar('dataUltimaAtualizacao', e.target.value)}
            {...propsCampo('dataUltimaAtualizacao')}
          />
        </label>
        <label className="campo">
          Comunidade *
          <input
            name="comunidade"
            maxLength={100}
            value={d.comunidade || ''}
            onChange={(e) => alterar('comunidade', e.target.value)}
            {...propsCampo('comunidade')}
          />
          {ajuda('comunidade')}
        </label>
      </div>

      <label className="campo">
        Endereço (rua/acesso) *
        <input
          name="endereco"
          maxLength={160}
          value={d.endereco || ''}
          onChange={(e) => alterar('endereco', e.target.value)}
          {...propsCampo('endereco')}
        />
        {ajuda('endereco')}
      </label>

      <div className="grade-campos">
        <label className="campo">
          Número *
          <input
            name="numero"
            maxLength={20}
            placeholder="ou S/N"
            value={d.numero || ''}
            onChange={(e) => alterar('numero', e.target.value)}
            {...propsCampo('numero')}
          />
          {ajuda('numero')}
        </label>
        <label className="campo">
          Complemento <span className="opcional">(opcional)</span>
          <input
            name="complemento"
            maxLength={160}
            value={d.complemento || ''}
            onChange={(e) => alterar('complemento', e.target.value)}
            {...propsCampo('complemento')}
          />
        </label>
      </div>

      <div className="grade-campos">
        <label className="campo">
          Bairro *
          <input
            name="bairro"
            maxLength={100}
            value={d.bairro || ''}
            onChange={(e) => alterar('bairro', e.target.value)}
            {...propsCampo('bairro')}
          />
          {ajuda('bairro')}
        </label>
        <label className="campo">
          Distrito <span className="opcional">(opcional)</span>
          <input
            name="distrito"
            maxLength={100}
            value={d.distrito || ''}
            onChange={(e) => alterar('distrito', e.target.value)}
            {...propsCampo('distrito')}
          />
        </label>
      </div>

      <div className="grade-campos">
        <label className="campo">
          Longitude (S) *
          <input
            name="longitude"
            inputMode="decimal"
            placeholder="-35.0009"
            value={d.longitude || ''}
            onChange={(e) => alterar('longitude', e.target.value)}
            {...propsCampo('longitude')}
          />
          {ajuda('longitude')}
        </label>
        <label className="campo">
          Latitude (W) *
          <input
            name="latitude"
            inputMode="decimal"
            placeholder="-7.5608"
            value={d.latitude || ''}
            onChange={(e) => alterar('latitude', e.target.value)}
            {...propsCampo('latitude')}
          />
          {ajuda('latitude')}
        </label>
      </div>

      <div className="grade-campos">
        <label className="campo">
          Tipo de risco *
          <input
            name="tipoRisco"
            maxLength={100}
            placeholder="Ex.: Inundação, Deslizamento, Erosão"
            value={d.tipoRisco || ''}
            onChange={(e) => alterar('tipoRisco', e.target.value)}
            {...propsCampo('tipoRisco')}
          />
          {ajuda('tipoRisco')}
        </label>
        <label className="campo">
          Grau de risco *
          <select
            name="grauRisco"
            value={d.grauRisco || ''}
            onChange={(e) => alterar('grauRisco', e.target.value)}
            {...propsCampo('grauRisco')}
          >
            <option value="">Selecione</option>
            <option value="Alto">Alto</option>
            <option value="Médio">Médio</option>
            <option value="Baixo">Baixo</option>
          </select>
          {ajuda('grauRisco')}
        </label>
      </div>
    </fieldset>
  );
}