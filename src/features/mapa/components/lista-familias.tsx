import { useState, useCallback } from 'react';
import { ChevronLeft, ChevronRight, MapPin, Edit2, Trash2 } from 'lucide-react';
import { ESTILOS_RISCO } from '@/features/mapa/lib/pontos';
import { nomeDaFamilia } from '@/features/mapa/lib/familias';
import type { CadastroFamilia } from '@/features/mapa/lib/familias';
import ProtectedAction from '@/components/ui/ProtectedAction';

const TAMANHO = 10;
interface ListaFamiliasProps {
  familias: readonly CadastroFamilia[];
  aoSelecionar: (familia: CadastroFamilia) => void;
  aoLocalizar: (familia: CadastroFamilia) => void;
  aoEditar?: (familia: CadastroFamilia) => void;
  aoExcluir?: (familia: CadastroFamilia) => void;
}

export default function ListaFamilias({
  familias,
  aoSelecionar,
  aoLocalizar,
  aoEditar,
  aoExcluir,
}: ListaFamiliasProps) {
  const [pagina, setPagina] = useState(0);
  const totalPaginas = Math.max(1, Math.ceil(familias.length / TAMANHO));
  const paginaAtual = Math.min(pagina, totalPaginas - 1);
  const inicio = paginaAtual * TAMANHO;

  const handleEdit = useCallback((familia: CadastroFamilia) => {
    if (aoEditar) {
      aoEditar(familia);
    }
  }, [aoEditar]);

  const handleDelete = useCallback((familia: CadastroFamilia) => {
    if (aoExcluir) {
      aoExcluir(familia);
    }
  }, [aoExcluir]);

  return (
    <section className="painel-cadastros" aria-labelledby="titulo-cadastros">
      <header>
        <div>
          <h2 id="titulo-cadastros">Consultar famílias</h2>
          <p>Abra um cadastro ou localize a residência no mapa.</p>
        </div>
        <span>
          {familias.length.toLocaleString('pt-BR')}{' '}
          {familias.length === 1 ? 'registro' : 'registros'}
        </span>
      </header>
      <div className="rolagem-tabela">
        <table>
          <caption className="somente-leitor">
            Famílias que correspondem à busca e à classificação selecionada
          </caption>
          <thead>
            <tr>
              <th scope="col">Representante</th>
              <th scope="col">Risco informado</th>
              <th scope="col">Consulta</th>
              {(aoEditar || aoExcluir) && <th scope="col">Ações</th>}
            </tr>
          </thead>
          <tbody>
            {familias.slice(inicio, inicio + TAMANHO).map((familia) => (
              <tr key={familia.id}>
                <td>
                  <button
                    type="button"
                    className="nome-na-lista"
                    onClick={() => aoSelecionar(familia)}
                  >
                    {nomeDaFamilia(familia)}
                  </button>
                </td>
                <td>
                  <span className="risco-na-lista">
                    <span
                      className="amostra"
                      aria-hidden="true"
                      style={{
                        backgroundColor: ESTILOS_RISCO[familia.nivelRisco].cor,
                      }}
                    >
                      {ESTILOS_RISCO[familia.nivelRisco].letra}
                    </span>
                    {ESTILOS_RISCO[familia.nivelRisco].rotulo}
                  </span>
                </td>
                <td>
                  <div className="acoes-lista">
                    <button
                      type="button"
                      onClick={() => aoSelecionar(familia)}
                      aria-label={`Ver cadastro de ${nomeDaFamilia(familia)}`}
                    >
                      Ver cadastro
                    </button>
                    <button
                      type="button"
                      className="botao-icone"
                      onClick={() => aoLocalizar(familia)}
                      aria-label={`Localizar ${nomeDaFamilia(familia)} no mapa`}
                    >
                      <MapPin size={17} />
                    </button>
                  </div>
                </td>
                {(aoEditar || aoExcluir) && (
                  <td>
                    <div className="acoes-lista">
                      {aoEditar && (
                        <ProtectedAction
                          actionType="edit"
                          requireReauth={true}
                          onConfirm={() => handleEdit(familia)}
                          confirmPhrase="EDITAR"
                          title="Editar cadastro"
                          description="Você está prestes a modificar os dados deste cadastro. Esta ação requer autorização."
                        >
                          {({ trigger, isActive }) => (
                            <button
                              className={`botao-icone ${isActive ? 'active' : ''}`}
                              type="button"
                              onClick={trigger}
                              aria-label={`Editar cadastro de ${nomeDaFamilia(familia)}`}
                            >
                              <Edit2 size={17} />
                            </button>
                          )}
                        </ProtectedAction>
                      )}
                      {aoExcluir && (
                        <ProtectedAction
                          actionType="delete"
                          requireReauth={true}
                          onConfirm={() => handleDelete(familia)}
                          confirmPhrase="EXCLUIR"
                          title="Excluir cadastro"
                          description="Esta ação é irreversível. O cadastro será removido permanentemente. Tem certeza?"
                        >
                          {({ trigger, isActive }) => (
                            <button
                              className={`botao-icone botao-perigo ${isActive ? 'active' : ''}`}
                              type="button"
                              onClick={trigger}
                              aria-label={`Excluir cadastro de ${nomeDaFamilia(familia)}`}
                            >
                              <Trash2 size={17} />
                            </button>
                          )}
                        </ProtectedAction>
                      )}
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {!familias.length && (
        <p className="lista-vazia">
          Nenhuma família encontrada. Altere a busca ou a classificação.
        </p>
      )}
      <footer className="paginacao">
        <span>
          {familias.length
            ? `${inicio + 1}–${Math.min(inicio + TAMANHO, familias.length)} de ${familias.length}`
            : '0 registros'}
        </span>
        <div>
          <button
            className="botao-icone"
            type="button"
            aria-label="Página anterior de famílias"
            disabled={paginaAtual === 0}
            onClick={() => setPagina((n) => Math.max(0, n - 1))}
          >
            <ChevronLeft size={17} />
          </button>
          <span>
            Página {paginaAtual + 1} de {totalPaginas}
          </span>
          <button
            className="botao-icone"
            type="button"
            aria-label="Próxima página de famílias"
            disabled={paginaAtual >= totalPaginas - 1}
            onClick={() => setPagina((n) => n + 1)}
          >
            <ChevronRight size={17} />
          </button>
        </div>
      </footer>
    </section>
  );
}
