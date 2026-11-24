import { useRef, useState } from 'react';
import { Camera, ImagePlus, Trash2 } from 'lucide-react';
import {
  type DocumentosFotograficos,
  type FotoAnexada,
} from '@/features/mapa/lib/familias';

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
  const inputCamera = useRef<HTMLInputElement>(null);
  const inputGaleria = useRef<HTMLInputElement>(null);
  const [erroFotos, setErroFotos] = useState('');
  const fotos = d.fotosAnexadas || [];
  const MAX_FOTOS = 8;
  const MAX_FOTO_BYTES = 4 * 1024 * 1024;

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

  async function adicionarFotos(arquivos: FileList | null) {
    if (!arquivos?.length) return;

    setErroFotos('');
    const novosArquivos = Array.from(arquivos);
    const vagas = MAX_FOTOS - fotos.length;
    if (vagas <= 0) {
      setErroFotos(`Máximo de ${MAX_FOTOS} fotos por cadastro.`);
      return;
    }

    const selecionados = novosArquivos
      .filter((arquivo) => arquivo.type.startsWith('image/'))
      .slice(0, vagas);

    if (!selecionados.length) {
      setErroFotos('Selecione apenas arquivos de imagem.');
      return;
    }

    const anexadas: FotoAnexada[] = [];
    for (const arquivo of selecionados) {
      if (arquivo.size > MAX_FOTO_BYTES) {
        setErroFotos(`A foto "${arquivo.name}" excede o limite de 4 MB.`);
        continue;
      }

      const dadosBase64 = await new Promise<string>((resolve, reject) => {
        const leitor = new FileReader();
        leitor.onload = () => resolve(String(leitor.result));
        leitor.onerror = () => reject(new Error('Não foi possível ler a foto.'));
        leitor.readAsDataURL(arquivo);
      });

      anexadas.push({
        nome: arquivo.name,
        tipo: arquivo.type,
        tamanho: arquivo.size,
        dadosBase64,
      });
    }

    alterar('fotosAnexadas', [...fotos, ...anexadas]);
  }

  function removerFoto(indice: number) {
    alterar(
      'fotosAnexadas',
      fotos.filter((_, fotoAtual) => fotoAtual !== indice),
    );
  }

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
            onChange={(e) => {
              const valor = e.target.value as DocumentosFotograficos['possuiRegistroFotografico'];
              aoAlterar({
                ...d,
                possuiRegistroFotografico: valor,
                fotosAnexadas: valor === 'nao' ? [] : d.fotosAnexadas,
              });
            }}
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

      {d.possuiRegistroFotografico === 'sim' && (
        <div className="anexos-fotos">
          <div className="anexos-fotos-cabecalho">
            <strong>Anexar fotos</strong>
            <span>{fotos.length}/{MAX_FOTOS}</span>
          </div>
          <p>
            Tire fotos agora ou selecione imagens já existentes no celular.
          </p>

          <input
            ref={inputCamera}
            className="entrada-foto"
            type="file"
            accept="image/*"
            capture="environment"
            onChange={(e) => {
              adicionarFotos(e.target.files);
              e.target.value = '';
            }}
            disabled={apenasLeitura}
          />
          <input
            ref={inputGaleria}
            className="entrada-foto"
            type="file"
            accept="image/*"
            multiple
            onChange={(e) => {
              adicionarFotos(e.target.files);
              e.target.value = '';
            }}
            disabled={apenasLeitura}
          />

          <div className="acoes-anexo-foto">
            <button
              type="button"
              onClick={() => inputCamera.current?.click()}
              disabled={apenasLeitura || fotos.length >= MAX_FOTOS}
            >
              <Camera size={18} />
              Tirar foto
            </button>
            <button
              type="button"
              onClick={() => inputGaleria.current?.click()}
              disabled={apenasLeitura || fotos.length >= MAX_FOTOS}
            >
              <ImagePlus size={18} />
              Escolher da galeria
            </button>
          </div>

          {erroFotos && (
            <p className="erro-anexo-foto" role="alert">
              {erroFotos}
            </p>
          )}

          {fotos.length > 0 && (
            <div className="lista-fotos-anexadas">
              {fotos.map((foto, indice) => (
                <div className="foto-anexada" key={`${foto.nome}-${indice}`}>
                  <img src={foto.dadosBase64} alt={foto.nome} />
                  <div>
                    <strong>{foto.nome}</strong>
                    <span>{Math.max(1, Math.round(foto.tamanho / 1024))} KB</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => removerFoto(indice)}
                    disabled={apenasLeitura}
                    aria-label={`Remover ${foto.nome}`}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

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