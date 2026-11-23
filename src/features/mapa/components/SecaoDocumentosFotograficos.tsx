import { type DocumentosFotograficos } from '@/features/mapa/lib/familias';

interface Props {
  dados: DocumentosFotograficos | undefined;
  aoAlterar: (dados: DocumentosFotograficos) => void;
  erros?: Partial<Record<keyof DocumentosFotograficos, string>>;
  apenasLeitura?: boolean;
}

const OPCOES_DOCUMENTOS = {
  sim: 'Sim',
  nao: 'Não',
  parcial: 'Parcial',
} as const;

const OPCOES_FOTOS = {
  sim: 'Sim',
  nao: 'Não',
} as const;

export default function SecaoDocumentosFotograficos({
  dados,
  aoAlterar,
  erros = {},
  apenasLeitura = false,
}: Props) {
  const d = dados || {} as DocumentosFotograficos;

  function alterar<K extends keyof DocumentosFotograficos>(campo: K, valor: DocumentosFotograficos[K]) {
    aoAlterar({ ...d, [campo]: valor });
  }

  const propsCampo = (campo: keyof DocumentosFotograficos) => ({
    'aria-invalid': !!erros[campo],
    'aria-describedby': erros[campo] ? `erro-${campo}` : undefined,
    disabled: apenasLeitura,
  });

  const ajuda = (campo: keyof DocumentosFotograficos) =>
    erros[campo] ? (
      <span id={`erro-${campo}`} className="erro-campo">
        {erros[campo]}
      </span>
    ) : null;

  return (
    <fieldset disabled={apenasLeitura}>
      <legend>
        <span>6</span>Documentos e Registro Fotográfico
      </legend>
      <p className="ajuda-secao">
        Informações sobre documentação da família e registros fotográficos da residência.
      </p>

      <div className="grade-campos">
        <label className="campo">
          Possui documentos? *
          <select
            name="docs-possui"
            value={d.possuiDocumentos || ''}
            onChange={(e) => alterar('possuiDocumentos', e.target.value as DocumentosFotograficos['possuiDocumentos'])}
            {...propsCampo('possuiDocumentos')}
          >
            <option value="">Selecione</option>
            {Object.entries(OPCOES_DOCUMENTOS).map(([valor, nome]) => (
              <option key={valor} value={valor}>
                {nome}
              </option>
            ))}
          </select>
          {ajuda('possuiDocumentos')}
        </label>
      </div>

      <label className="campo">
        Lista de documentos <span className="opcional">(opcional)</span>
        <textarea
          name="docs-lista"
          rows={3}
          maxLength={500}
          placeholder="Ex.: RG, CPF, Comprovante de residência, Certidão de nascimento, Certidão de casamento, Título de eleitor, Carteira de trabalho"
          value={d.listaDocumentos?.join(', ') || ''}
          onChange={(e) => alterar('listaDocumentos', e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
          {...propsCampo('listaDocumentos')}
        />
        <small>Separe os documentos por vírgula</small>
        {ajuda('listaDocumentos')}
      </label>

      <div className="grade-campos">
        <label className="campo">
          Possui registro fotográfico? *
          <select
            name="docs-fotos"
            value={d.possuiRegistroFotografico || ''}
            onChange={(e) => alterar('possuiRegistroFotografico', e.target.value as DocumentosFotograficos['possuiRegistroFotografico'])}
            {...propsCampo('possuiRegistroFotografico')}
          >
            <option value="">Selecione</option>
            {Object.entries(OPCOES_FOTOS).map(([valor, nome]) => (
              <option key={valor} value={valor}>
                {nome}
              </option>
            ))}
          </select>
          {ajuda('possuiRegistroFotografico')}
        </label>
      </div>

      <label className="campo">
        Descrição das fotos <span className="opcional">(opcional)</span>
        <textarea
          name="docs-descricao"
          rows={3}
          maxLength={500}
          placeholder="Ex.: Fachada da residência, interior, danos da enchente 2022, documentos pessoais"
          value={d.descricaoFotos || ''}
          onChange={(e) => alterar('descricaoFotos', e.target.value)}
          {...propsCampo('descricaoFotos')}
        />
        {ajuda('descricaoFotos')}
      </label>
    </fieldset>
  );
}