import { useEffect, useState } from 'react';
import { MapPin, Download } from 'lucide-react';
import PainelDialogo from './painel-dialogo';
import VisualizacaoFamilia from './VisualizacaoFamilia';
import {
  carregarDetalhe,
  type CadastroFamilia,
  type DadosFamilia,
} from '@/features/mapa/lib/familias';
import { useExportarExcel } from './use-exportar-excel';

export default function DetalhesFamilia({
  familia,
  endpoint,
  demonstracao,
  aoFechar,
  aoLocalizar,
}: {
  familia: CadastroFamilia | null;
  endpoint?: string;
  demonstracao: boolean;
  aoFechar: () => void;
  aoLocalizar: (familia: CadastroFamilia) => void;
}) {
  const { exportar } = useExportarExcel({ endpoint });
  const [dados, setDados] = useState<DadosFamilia | null>(
    familia?.dados || null,
  );
  const [carregando, setCarregando] = useState(
    !!familia && !familia.dados && !!endpoint,
  );
  const [erro, setErro] = useState('');
  const [tentativa, setTentativa] = useState(0);

  useEffect(() => {
    setDados(familia?.dados || null);
    setErro('');
    setCarregando(false);
    if (!familia || familia.dados || !endpoint) return;
    const abortar = new AbortController();
    let cancelado = false;
    const timeout = setTimeout(() => abortar.abort(), 20000);
    setCarregando(true);
    carregarDetalhe(endpoint, familia.id, abortar.signal)
      .then((d) => {
        if (!cancelado) setDados(d);
      })
      .catch(() => {
        if (!cancelado)
          setErro(
            'Não foi possível consultar os detalhes. Confira a conexão e tente novamente.',
          );
      })
      .finally(() => {
        clearTimeout(timeout);
        if (!cancelado) setCarregando(false);
      });
    return () => {
      cancelado = true;
      clearTimeout(timeout);
      abortar.abort();
    };
  }, [familia, endpoint, tentativa]);

  const handleExportar = () => {
    if (dados || familia?.resumoDemonstrativo) {
      exportar(familia!);
    }
  };

  if (!familia) {
    return null;
  }

  return (
    <PainelDialogo
      id="detalhes"
      aberto={true}
      aoFechar={aoFechar}
      titulo="Cadastro da família"
      subtitulo={
        demonstracao
          ? 'Registro fictício · Ambiente de demonstração'
          : 'Informações do cadastro selecionado'
      }
      rodape={
        <div className="rodape-detalhes">
          <button
            className="botao-secundario"
            type="button"
            onClick={handleExportar}
            disabled={!dados && !familia.resumoDemonstrativo}
            aria-label="Exportar formulário desta família para Excel"
          >
            <Download size={16} />
            Exportar Excel
          </button>
          <button
            className="botao-primario"
            type="button"
            onClick={() => aoLocalizar(familia)}
          >
            <MapPin size={16} />
            Localizar no mapa
          </button>
        </div>
      }
    >
      {carregando && (
        <p className="estado-consulta" role="status">
          <span className="spinner" />
          Consultando os dados da família…
        </p>
      )}
      {erro && (
        <div className="aviso-dados erro-dados" role="alert">
          {erro}
          <button type="button" onClick={() => setTentativa((n) => n + 1)}>
            Tentar novamente
          </button>
        </div>
      )}
      {(!carregando && !erro) && (
        <VisualizacaoFamilia
          familia={dados ?? null}
          aoExportar={handleExportar}
          aoFechar={aoFechar}
        />
      )}
      {!dados && !familia.resumoDemonstrativo && !carregando && !erro && (
        <p className="aviso-detalhe">
          Este ponto contém o representante, a classificação e a
          localização. Os demais dados da família não foram fornecidos pela
          origem do cadastro.
        </p>
      )}
      <p className="nota-detalhe">
        {familia.resumoDemonstrativo
          ? 'A classificação desta família é fictícia e não é uma avaliação oficial da residência.'
          : 'A classificação é informada pela equipe.'}{' '}
        O mapa de calor indica concentração de cadastros.
      </p>
    </PainelDialogo>
  );
}