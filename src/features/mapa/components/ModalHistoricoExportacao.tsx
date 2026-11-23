import { useEffect, useState } from 'react';
import { Download, FileSpreadsheet, Trash2, Clock } from 'lucide-react';
import PainelDialogo from './painel-dialogo';

interface ExportacaoHistorico {
  id: string;
  familiaId: string;
  nomeFamilia: string;
  dataExportacao: string;
  arquivoNome: string;
  blob: Blob;
}

interface ModalHistoricoExportacaoProps {
  aberto: boolean;
  aoFechar: () => void;
  familias: { id: string; nome: string; dados: any }[];
}

export default function ModalHistoricoExportacao({
  aberto,
  aoFechar,
  familias,
}: ModalHistoricoExportacaoProps) {
  const [historico, setHistorico] = useState<ExportacaoHistorico[]>([]);
  const [carregando, setCarregando] = useState(false);

  function base64ToBlob(base64: string, mimeType: string): Blob {
    const byteCharacters = atob(base64);
    const byteArray = Uint8Array.from(byteCharacters, c => c.charCodeAt(0));
    return new Blob([byteArray], { type: mimeType });
  }

  // Carregar histórico do localStorage ao abrir
  useEffect(() => {
    if (aberto) {
      setCarregando(true);
      try {
        const salvo = localStorage.getItem('exportacoes-familias');
        if (salvo) {
          const parsed = JSON.parse(salvo);
          // Converter base64 de volta para blob
          const comBlobs = parsed.map((item: any) => ({
            ...item,
            blob: base64ToBlob(item.blobBase64, 'application/vnd.ms-excel.sheet.macroEnabled.12'),
          }));
          setHistorico(comBlobs);
        }
      } catch (e) {
        console.error('Erro ao carregar histórico:', e);
        setHistorico([]);
      } finally {
        setCarregando(false);
      }
    }
  }, [aberto, familias]);

  async function baixarArquivo(item: ExportacaoHistorico) {
    const url = URL.createObjectURL(item.blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = item.arquivoNome;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  async function removerDoHistorico(id: string) {
    try {
      const salvo = localStorage.getItem('exportacoes-familias');
      if (salvo) {
        const parsed = JSON.parse(salvo);
        const atualizado = parsed.filter((item: any) => item.id !== id);
        localStorage.setItem('exportacoes-familias', JSON.stringify(atualizado));
        setHistorico(prev => prev.filter(item => item.id !== id));
      }
    } catch (e) {
      console.error('Erro ao remover do histórico:', e);
    }
  }

  function formatarDataBR(dataISO: string): string {
    try {
      return new Date(dataISO).toLocaleString('pt-BR');
    } catch {
      return dataISO;
    }
  }

  // Filtrar histórico para mostrar apenas famílias que existem atualmente
  const historicoFiltrado = historico.filter(h =>
    familias.some(f => f.id === h.familiaId)
  );

  if (!aberto) return null;

  return (
    <PainelDialogo
      id="historico-exportacao"
      aberto={aberto}
      aoFechar={aoFechar}
      titulo="Histórico de Exportações"
      subtitulo="Gerencie os arquivos Excel exportados por família"
    >
      {carregando ? (
        <div className="estado-carregando">
          <span className="spinner" />
          Carregando histórico...
        </div>
      ) : historicoFiltrado.length === 0 ? (
        <div className="estado-vazio">
          <FileSpreadsheet size={48} />
          <p>Nenhuma exportação encontrada</p>
          <span>As exportações aparecerão aqui após gerar o Excel de uma família</span>
        </div>
      ) : (
        <div className="lista-historico">
          <table className="tabela-historico">
            <thead>
              <tr>
                <th>Família</th>
                <th>Data da Exportação</th>
                <th>Arquivo</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {historicoFiltrado.map(item => {
                const familia = familias.find(f => f.id === item.familiaId);
                return (
                  <tr key={item.id}>
                    <td>
                      <strong>{item.nomeFamilia}</strong>
                      {familia && <span className="badge-familia">{familia.dados?.bairro || 'Sem bairro'}</span>}
                    </td>
                    <td>
                      <Clock size={14} />
                      {formatarDataBR(item.dataExportacao)}
                    </td>
                    <td>
                      <FileSpreadsheet size={16} />
                      <span className="nome-arquivo" title={item.arquivoNome}>{item.arquivoNome}</span>
                    </td>
                    <td className="acoes">
                      <button
                        className="botao-icone"
                        onClick={() => baixarArquivo(item)}
                        aria-label="Baixar novamente"
                        title="Baixar novamente"
                      >
                        <Download size={16} />
                      </button>
                      <button
                        className="botao-icone botao-perigo"
                        onClick={() => removerDoHistorico(item.id)}
                        aria-label="Remover do histórico"
                        title="Remover do histórico"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </PainelDialogo>
  );
}