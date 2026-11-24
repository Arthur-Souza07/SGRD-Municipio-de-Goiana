import { useLocation } from 'react-router-dom';
import { useSessaoFamilias } from '../sessao-contexto';
import {
  API_FAMILIAS,
  API_MAPA,
  BASE_MAPA,
  DEMONSTRACAO,
} from '../lib/configuracao';
import '../mapa.css';
import {
  useCallback,
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { AlertTriangle, CheckCircle2, ChevronRight, Download, FlaskConical, Info, MapPin, Search, ShieldCheck, Users } from 'lucide-react';
import { Map as MapIcon } from 'lucide-react';
import {
  filtrarFamilias,
  normalizarBusca,
} from '@/features/mapa/lib/gestao-familias';
import { useConexao } from './use-conexao';
import { useDeviceType } from '@/hooks/useDeviceType';
import MapaRiscos from './mapa-riscos';
import FormularioFamilia from './formulario-familia';
import ThemeToggle from '@/components/ui/ThemeToggle';
import DetalhesFamilia from './detalhes-familia';
import ListaFamilias from './lista-familias';
import ModalHistoricoExportacao from './ModalHistoricoExportacao';
import { useDadosAmbientais } from './use-dados-ambientais';
import { useExportarExcel } from './use-exportar-excel';
import type {
  AreaPlanejada,
  CamadaTerritorial,
} from './camadas-ambientais-mapa';
import {
  carregarPontos,
  contarNiveis,
  nomeDaFamilia,
} from '@/features/mapa/lib/pontos';
import {
  type CadastroFamilia,
  type DadosFamilia,
  type NivelRisco,
  type PontoRisco,
} from '@/features/mapa/lib/familias';
import { carregarDemonstracao } from '@/features/mapa/lib/demonstracao';

const familiasApi = API_FAMILIAS;
const apiMapa = API_MAPA;
const demonstracao = DEMONSTRACAO;
const basePath = BASE_MAPA;
const fonte = familiasApi || apiMapa || `${basePath}/dados-exemplo.json`;

// Mobile-only component: ONLY family registration form - no map, no points, no layers
function VisaoMapaMobile() {
  const {
    salvarFamilia,
    setMobileJustLoggedIn
  } = useSessaoFamilias();
  const [cadastroAberto, setCadastroAberto] = useState(true);
  const [sucesso, setSucesso] = useState('');

  const fecharCadastro = useCallback(() => {
    setCadastroAberto(true);
    setMobileJustLoggedIn(false);
  }, [setMobileJustLoggedIn]);

  async function salvar(dados: DadosFamilia, chave: string) {
    const cadastro = await salvarFamilia(dados, chave);
    setSucesso(
      demonstracao
        ? `${cadastro.nomeRepresentante} foi adicionado à demonstração. O registro fica nesta aba até a página ser atualizada.`
        : `Cadastro de ${cadastro.nomeRepresentante} confirmado pelo servidor.`,
    );
    // After saving, keep form open for next registration
    setCadastroAberto(true);
  }

  return (
    <div className="modulo-mapa mobile-only">
      <main id="conteudo" tabIndex={-1} className="mobile-main mobile-cadastro-only">
        {sucesso && (
          <div className="aviso-sucesso" role="status">
            <CheckCircle2 size={20} />
            <span>{sucesso}</span>
            <button type="button" onClick={() => setSucesso('')}>
              Fechar
            </button>
          </div>
        )}

        <FormularioFamilia
          aberto={cadastroAberto}
          demonstracao={demonstracao}
          aoFechar={fecharCadastro}
          aoSalvar={salvar}
          mobileKeepOpen={true}
        />
      </main>
    </div>
  );
}

// Desktop component: Full management functionality
function VisaoMapaDesktop() {
  const online = useConexao();
  const {
    cadastrosSessao,
    setCadastrosSessao,
    salvarFamilia,
  } = useSessaoFamilias();
  const rota = useLocation();
  const rotaLocalizada = useRef<string | null>(null);
  const [descartados, setDescartados] = useState(0);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');
  const [revisao, setRevisao] = useState(0);
  const [cadastroAberto, setCadastroAberto] = useState(false);
  const [selecionada, setSelecionada] = useState<CadastroFamilia | null>(null);
  const [foco, setFoco] = useState<{
    ponto: PontoRisco;
    revisao: number;
  } | null>(null);
  const focoAnunciado = useRef<number | null>(null);
  const [sucesso, setSucesso] = useState('');
  const [busca, setBusca] = useState('');
  const [nivel, setNivel] = useState<NivelRisco | ''>('');
  const [bairroSelecionado, setBairroSelecionado] = useState<string>('Todos');
  const chuvaAtiva = false;
  const rioAtivo = false;
  const revisaoAmbiente = 0;
  const [camada, setCamada] = useState<CamadaTerritorial>('nenhuma');
  const [apenasAlta, setApenasAlta] = useState(false);
  const [areaPlanejada, setAreaPlanejada] = useState<AreaPlanejada | null>(
    null,
  );
  const [historicoAberto, setHistoricoAberto] = useState(false);
  const [pontosOrigem, setPontosOrigem] = useState<CadastroFamilia[]>([]);

  const chuva = useDadosAmbientais('chuva', chuvaAtiva, revisaoAmbiente);
  const rio = useDadosAmbientais('rio', rioAtivo, revisaoAmbiente);
  const estacoes = useMemo(
    () => [
      ...(chuvaAtiva ? chuva.estacoes : []),
      ...(rioAtivo ? rio.estacoes : []),
    ],
    [chuvaAtiva, rioAtivo, chuva.estacoes, rio.estacoes],
  );
  const ambiente = useMemo(
    () => ({
      estacoes,
      camada,
      apenasAlta,
      areaPlanejada,
      aoCamada: (nova: CamadaTerritorial) => {
        setCamada(nova);
        setAreaPlanejada(null);
      },
      aoApenasAlta: (ativo: boolean) => {
        setApenasAlta(ativo);
        setAreaPlanejada(null);
      },
      aoPlanejar: setAreaPlanejada,
    }),
    [estacoes, camada, apenasAlta, areaPlanejada],
  );
  const buscaAdiada = useDeferredValue(busca);
  const { bairrosDisponiveis, exportarMultiplas } = useExportarExcel({ endpoint: familiasApi });
  const pontos = useMemo(() => {
    const unicos = new Map<string, CadastroFamilia>(
      pontosOrigem.map((p) => [p.id, p]),
    );
    cadastrosSessao.forEach((p) => unicos.set(p.id, p));
    return [...unicos.values()];
  }, [pontosOrigem, cadastrosSessao]);
  const totais = useMemo(() => contarNiveis(pontos), [pontos]);
  const bairros = useMemo(() => bairrosDisponiveis(pontos), [pontos]);
  const visiveis = useMemo(
    () => {
      let resultado = filtrarFamilias(pontos, buscaAdiada, nivel);
      if (bairroSelecionado !== 'Todos') {
        resultado = resultado.filter((f) =>
          normalizarBusca(f.dados?.bairro || 'Não informado') === normalizarBusca(bairroSelecionado)
        );
      }
      return resultado;
    },
    [pontos, buscaAdiada, nivel, bairroSelecionado],
  );
  const selecionarFamilia = useCallback(
    (ponto: PontoRisco) =>
      setSelecionada(pontos.find((p) => p.id === ponto.id) || ponto),
    [pontos],
  );
  const fecharDetalhes = useCallback(() => setSelecionada(null), []);
  const fecharCadastro = useCallback(() => setCadastroAberto(false), []);
  const localizar = useCallback((ponto: PontoRisco) => {
    setSelecionada(null);
    setBusca('');
    setNivel('');
    setBairroSelecionado('Todos');
    setFoco((anterior) => ({ ponto, revisao: (anterior?.revisao || 0) + 1 }));
  }, []);

  const editarFamilia = useCallback((familia: CadastroFamilia) => {
    setSelecionada(familia);
    setCadastroAberto(true);
  }, []);

  const excluirFamilia = useCallback((familia: CadastroFamilia) => {
    setCadastrosSessao((prev) => prev.filter((c) => c.id !== familia.id));
    setPontosOrigem((prev) => prev.filter((c) => c.id !== familia.id));
    fecharDetalhes();
  }, [setCadastrosSessao, fecharDetalhes]);

  useEffect(() => {
    if (
      !foco ||
      cadastroAberto ||
      selecionada ||
      focoAnunciado.current === foco.revisao
    )
      return;
    const quadro = requestAnimationFrame(() => {
      focoAnunciado.current = foco.revisao;
      const regiao = document.getElementById('mapa-familias');
      regiao?.scrollIntoView({
        behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches
          ? 'instant'
          : 'smooth',
        block: 'start',
      });
      regiao
        ?.querySelector<HTMLElement>('.superficie-mapa')
        ?.focus({ preventScroll: true });
    });
    return () => cancelAnimationFrame(quadro);
  }, [foco, cadastroAberto, selecionada]);

  useEffect(() => {
    const id = rota.state?.familiaId;
    if (typeof id !== 'string' || rotaLocalizada.current === rota.key) return;
    const familia = pontos.find((p) => p.id === id);
    if (familia) {
      rotaLocalizada.current = rota.key;
      localizar(familia);
    }
  }, [rota.state, rota.key, pontos, localizar]);

  const recarregar = useCallback(() => setRevisao((n) => n + 1), []);

  useEffect(() => {
    const controlador = new AbortController();
    let cancelado = false;
    const limite = setTimeout(() => controlador.abort(), 20000);
    setCarregando(true);
    setErro('');
    (demonstracao
      ? carregarDemonstracao(fonte, controlador.signal)
      : carregarPontos(fonte, controlador.signal)
    )
      .then((dados) => {
        if (!cancelado) {
          setPontosOrigem(dados.pontos);
          setDescartados(dados.descartados);
        }
      })
      .catch((e) => {
        if (!cancelado)
          setErro(
            e instanceof Error && e.name !== 'AbortError'
              ? e.message
              : 'O carregamento demorou mais que o esperado. Verifique a conexão e tente novamente.',
          );
      })
      .finally(() => {
        clearTimeout(limite);
        if (!cancelado) setCarregando(false);
      });
    return () => {
      cancelado = true;
      clearTimeout(limite);
      controlador.abort();
    };
  }, [revisao]);

  async function salvar(dados: DadosFamilia, chave: string) {
    const cadastro = await salvarFamilia(dados, chave);
    setSucesso(
      demonstracao
        ? `${cadastro.nomeRepresentante} foi adicionado à demonstração. O registro fica nesta aba até a página ser atualizada.`
        : `Cadastro de ${cadastro.nomeRepresentante} confirmado pelo servidor.`,
    );
    localizar(cadastro);
  }

  return (
    <div className="modulo-mapa desktop-only">
      <div className="pagina-mapa">
        <a href="#conteudo" className="pular-conteudo">
          Ir para o conteúdo
        </a>

        <aside className="barra-lateral" aria-label="Defesa Civil de Goiana">
          <div className="marca-prefeitura">
            <img
              src={`${basePath}/logo-goiana.png`}
              width="142"
              height="76"
              alt="Prefeitura de Goiana — Crescendo juntos, cuidando da gente"
            />
          </div>
          <nav className="navegacao" aria-label="Monitoramento social">
            <span className="titulo-navegacao">MONITORAMENTO SOCIAL</span>
            <a href="#mapa-familias" aria-current="page">
              <MapIcon size={20} />
              <span>Mapa social</span>
              <ChevronRight size={15} />
            </a>
            <a href="#titulo-cadastros" className="nav-secundaria">
              <Users size={20} />
              <span>Consultar famílias</span>
            </a>
            <div className="tema-lateral" aria-label="Tema da interface">
              <ThemeToggle />
            </div>
          </nav>
          <div className="base-lateral">
            {demonstracao && (
              <div className="aviso-demonstracao">
                <strong>
                  <FlaskConical size={16} />
                  Ambiente demonstrativo
                </strong>
                <p>
                  50 famílias fictícias na sede de Goiana. Pontos aproximados
                  em áreas suscetíveis, dentro do limite do IBGE.
                </p>
              </div>
            )}
            <div className="assinatura-lateral">
              <ShieldCheck size={18} />
              <span>
                Defesa Civil de Goiana<small>Pernambuco</small>
              </span>
            </div>
          </div>
        </aside>

        <main id="conteudo" tabIndex={-1}>
          <header className="cabecalho">
            <div>
              <div className="caminho">
                DRP <ChevronRight size={12} /> Gestão em campo
              </div>
              <div className="titulo-pagina">
                <h1>Monitoramento social</h1>
                <span className="municipio-cabecalho">
                  <MapPin size={13} />
                  Goiana–PE
                </span>
              </div>
            </div>
            {demonstracao && (
              <span className="etiqueta-demo">
                <Info size={16} />
                Dados fictícios · Demonstração
              </span>
            )}
          </header>

          <div className="conteudo-mapa">
            {!online && (
              <p className="aviso-conexao" role="status">
                Sem conexão com a internet. As ruas e as fontes ambientais podem
                ficar indisponíveis. O rascunho é mantido nesta aba; evite
                atualizar a página.
              </p>
            )}

            <div className="introducao-gestao">
              <div>
                <span className="sobretitulo">GESTÃO EM CAMPO</span>
                <h2>Cada família, no mapa.</h2>
                <p>Cadastre, localize e acompanhe as famílias de Goiana.</p>
              </div>
            </div>

            {!demonstracao && !familiasApi && (
              <p className="aviso-dados">
                A fonte atual permite apenas consulta. O cadastro depende da
                integração com a API da equipe.
              </p>
            )}

            <div className="indicadores">
              <div>
                <span className="icone-indicador">
                  <Users size={20} />
                </span>
                <div>
                  <span>Famílias no território</span>
                  <strong>
                    {carregando && !pontos.length
                      ? '—'
                      : pontos.length.toLocaleString('pt-BR')}
                  </strong>
                </div>
              </div>
              <div>
                <span className="icone-indicador atencao">
                  <AlertTriangle size={20} />
                </span>
                <div>
                  <span>Com risco alto informado</span>
                  <strong>
                    {carregando && !pontos.length
                      ? '—'
                      : totais.alto.toLocaleString('pt-BR')}
                  </strong>
                </div>
              </div>
              <div>
                <span className="icone-indicador positivo">
                  <CheckCircle2 size={20} />
                </span>
                <div>
                  <span>Adicionadas nesta sessão</span>
                  <strong>{cadastrosSessao.length}</strong>
                </div>
              </div>
            </div>


            {sucesso && (
              <div className="aviso-sucesso" role="status">
                <CheckCircle2 size={20} />
                <span>{sucesso}</span>
                <button type="button" onClick={() => setSucesso('')}>
                  Fechar aviso
                </button>
              </div>
            )}

            <section
              className="filtros-familias"
              aria-label="Buscar e filtrar famílias"
            >
              <label className="busca-familias">
                <Search size={18} />
                <span className="somente-leitor">
                  Buscar representante da família
                </span>
                <input
                  type="search"
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  placeholder="Buscar representante da família"
                  maxLength={120}
                />
              </label>
              <label className="filtro-nivel">
                <span>Risco informado</span>
                <select
                  value={nivel}
                  onChange={(e) => setNivel(e.target.value as NivelRisco | '')}
                >
                  <option value="">Todos os níveis</option>
                  <option value="alto">Alto</option>
                  <option value="medio">Médio</option>
                  <option value="baixo">Baixo</option>
                  <option value="nao_informado">Sem classificação</option>
                </select>
              </label>
              <label className="filtro-bairro">
                <span>Bairro</span>
                <select
                  value={bairroSelecionado}
                  onChange={(e) => setBairroSelecionado(e.target.value)}
                >
                  <option value="Todos">Todos os bairros</option>
                  {bairros.map((b) => (
                    <option key={b.nome} value={b.nome}>
                      {b.nome} ({b.contagem})
                    </option>
                  ))}
                </select>
              </label>
              {(busca || nivel || bairroSelecionado !== 'Todos') && (
                <button
                  type="button"
                  onClick={() => {
                    setBusca('');
                    setNivel('');
                    setBairroSelecionado('Todos');
                  }}
                >
                  Limpar filtros
                </button>
              )}
              <div className="acoes-filtros">
                <button
                  type="button"
                  className="botao-exportar botao-primario"
                  onClick={() => exportarMultiplas(visiveis)}
                  disabled={!visiveis.length}
                  aria-label="Exportar famílias filtradas para Excel"
                >
                  <Download size={16} />
                  Exportar filtradas
                </button>
                <button
                  type="button"
                  className="botao-exportar"
                  onClick={() => setHistoricoAberto(true)}
                  disabled={!pontos.length}
                  aria-label="Ver histórico de exportações"
                >
                  <Download size={16} />
                  Histórico de Exportações
                </button>
              </div>
              <output aria-live="polite">
                {visiveis.length} de {pontos.length} famílias
              </output>
            </section>

            <div id="mapa-familias">
              <MapaRiscos
                pontos={visiveis}
                carregando={carregando}
                erro={erro}
                descartados={descartados}
                aoRecarregar={recarregar}
                aoSelecionarFamilia={selecionarFamilia}
                foco={foco}
                ambiente={ambiente}
                filtroAtivo={!!(buscaAdiada.trim() || nivel || bairroSelecionado !== 'Todos')}
              />
            </div>

            <ListaFamilias
              key={`${nivel}:${normalizarBusca(buscaAdiada)}:${bairroSelecionado}`}
              familias={visiveis}
              aoSelecionar={selecionarFamilia}
              aoLocalizar={localizar}
              aoEditar={editarFamilia}
              aoExcluir={excluirFamilia}
            />

            <footer className="rodape-pagina">
              <span>Defesa Civil de Goiana · Pernambuco</span>
              <span>
                {demonstracao
                  ? 'Classificações fictícias. Calor = concentração de cadastros.'
                  : 'Classificações informadas pela equipe. Calor = concentração de cadastros.'}
              </span>
            </footer>
          </div>
        </main>
        <FormularioFamilia
          aberto={cadastroAberto}
          demonstracao={demonstracao}
          aoFechar={fecharCadastro}
          aoSalvar={salvar}
          mobileKeepOpen={false}
        />
        <DetalhesFamilia
          key={selecionada?.id || 'sem-selecao'}
          familia={selecionada}
          endpoint={familiasApi}
          demonstracao={demonstracao}
          aoFechar={fecharDetalhes}
          aoLocalizar={localizar}
        />
        <ModalHistoricoExportacao
          aberto={historicoAberto}
          aoFechar={() => setHistoricoAberto(false)}
          familias={pontos.map(p => ({
            id: p.id,
            nome: nomeDaFamilia(p),
            dados: p.dados,
          }))}
        />
      </div>
    </div>
  );
}

export default function VisaoMapa() {
  const deviceType = useDeviceType();
  const isMobile = deviceType === 'mobile' || deviceType === 'tablet';

  if (isMobile) {
    return <VisaoMapaMobile />;
  }

  return <VisaoMapaDesktop />;
}