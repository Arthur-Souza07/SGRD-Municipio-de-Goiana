import { Link, useLocation } from 'react-router-dom';
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
import {
  ClipboardList,
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  FlaskConical,
  Info,
  Map as MapIcon,
  MapPin,
  Plus,
  Search,
  ShieldCheck,
  Users,
} from 'lucide-react';
import {
  filtrarFamilias,
  normalizarBusca,
} from '@/features/mapa/lib/gestao-familias';
import { useConexao } from './use-conexao';
import MapaRiscos from './mapa-riscos';
import FormularioFamilia from './formulario-familia';
import DetalhesFamilia from './detalhes-familia';
import ListaFamilias from './lista-familias';
import PainelAmbiental from './painel-ambiental';
import { useDadosAmbientais } from './use-dados-ambientais';
import { useExportarExcel } from './use-exportar-excel';
import type {
  AreaPlanejada,
  CamadaTerritorial,
} from './camadas-ambientais-mapa';
import {
  carregarPontos,
  contarNiveis,
  type NivelRisco,
  type PontoRisco,
} from '@/features/mapa/lib/pontos';
import {
  type CadastroFamilia,
  type DadosFamilia,
} from '@/features/mapa/lib/familias';
import { carregarDemonstracao } from '@/features/mapa/lib/demonstracao';

const familiasApi = API_FAMILIAS;
const apiMapa = API_MAPA;
const demonstracao = DEMONSTRACAO;
const basePath = BASE_MAPA;
const fonte = familiasApi || apiMapa || `${basePath}/dados-exemplo.json`;

export default function VisaoMapa() {
  const online = useConexao();
  const [pontosOrigem, setPontosOrigem] = useState<CadastroFamilia[]>([]);
  const { cadastrosSessao, salvarFamilia } = useSessaoFamilias();
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
  const [chuvaAtiva, setChuvaAtiva] = useState(false);
  const [rioAtivo, setRioAtivo] = useState(false);
  const [revisaoAmbiente, setRevisaoAmbiente] = useState(0);
  const [camada, setCamada] = useState<CamadaTerritorial>('nenhuma');
  const [apenasAlta, setApenasAlta] = useState(false);
  const [areaPlanejada, setAreaPlanejada] = useState<AreaPlanejada | null>(
    null,
  );
  const [areasDisponiveis, setAreasDisponiveis] = useState<AreaPlanejada[]>([]);
  const [bairroSelecionado, setBairroSelecionado] = useState<string>('Todos');
  const { exportar, bairrosDisponiveis } = useExportarExcel();
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
      aoPlanejar: setAreaPlanejada,
      aoAtualizarAreas: setAreasDisponiveis,
    }),
    [estacoes, camada, apenasAlta, areaPlanejada],
  );
  const buscaAdiada = useDeferredValue(busca);
  const pontos = useMemo(() => {
    const unicos = new Map<string, CadastroFamilia>(
      pontosOrigem.map((p) => [p.id, p]),
    );
    cadastrosSessao.forEach((p) => unicos.set(p.id, p));
    return [...unicos.values()];
  }, [pontosOrigem, cadastrosSessao]);
  const totais = useMemo(() => contarNiveis(pontos), [pontos]);
  const visiveis = useMemo(
    () => {
      let resultado = filtrarFamilias(pontos, buscaAdiada, nivel);
      if (bairroSelecionado !== 'Todos') {
        resultado = resultado.filter((f) => f.dados?.bairro === bairroSelecionado);
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
    setFoco((anterior) => ({ ponto, revisao: (anterior?.revisao || 0) + 1 }));
  }, []);
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
    <div className="modulo-mapa">
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
          <div className="identidade-sistema">
            <span className="icone-defesa">
              <ShieldCheck size={25} strokeWidth={1.6} />
            </span>
            <div>
              <span>Prefeitura de Goiana</span>
              <strong>Defesa Civil</strong>
            </div>
          </div>
          <p className="descricao-sistema">
            Sistema de Redução de
            <br />
            Riscos de Desastres
          </p>
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
            <Link to="/cadastro-equipe" className="nav-secundaria">
              <ClipboardList size={20} />
              <span>Ficha da equipe</span>
            </Link>
          </nav>
          <div className="base-lateral">
            {demonstracao && (
              <div className="aviso-demonstracao">
                <strong>
                  <FlaskConical size={16} />
                  Ambiente demonstrativo
                </strong>
                <p>
                  500 famílias fictícias na sede de Goiana. Pontos aproximados
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
              <button
                className="botao-primario cadastrar-familia"
                type="button"
                disabled={!demonstracao && !familiasApi}
                onClick={() => {
                  setSucesso('');
                  setCadastroAberto(true);
                }}
              >
                <Plus size={18} />
                Cadastrar família
              </button>
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
            <PainelAmbiental
              chuvaAtiva={chuvaAtiva}
              rioAtivo={rioAtivo}
              aoChuva={setChuvaAtiva}
              aoRio={setRioAtivo}
              chuva={chuva}
              rio={rio}
              aoAtualizar={() => setRevisaoAmbiente((n) => n + 1)}
              camada={camada}
              aoCamada={(nova) => {
                setCamada(nova);
                setAreaPlanejada(null);
              }}
              apenasAlta={apenasAlta}
              aoApenasAlta={(ativo) => {
                setApenasAlta(ativo);
                setAreaPlanejada(null);
              }}
              area={areaPlanejada}
              aoLimparArea={() => setAreaPlanejada(null)}
              aoCadastrar={() => {
                if (demonstracao || familiasApi) setCadastroAberto(true);
              }}
              areas={areasDisponiveis}
              aoSelecionarArea={setAreaPlanejada}
            />
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
                  {bairrosDisponiveis.map((bairro) => (
                    <option key={bairro} value={bairro}>
                      {bairro}
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
                  className="botao-exportar"
                  onClick={() => exportar(visiveis, bairroSelecionado)}
                  disabled={!visiveis.length}
                  aria-label="Exportar famílias filtradas para Excel"
                >
                  📊 Exportar Excel
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
                filtroAtivo={!!(buscaAdiada.trim() || nivel)}
              />
            </div>
            <ListaFamilias
              key={`${nivel}:${normalizarBusca(buscaAdiada)}`}
              familias={visiveis}
              aoSelecionar={selecionarFamilia}
              aoLocalizar={localizar}
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
        />
        <DetalhesFamilia
          key={selecionada?.id || 'sem-selecao'}
          familia={selecionada}
          endpoint={familiasApi}
          demonstracao={demonstracao}
          aoFechar={fecharDetalhes}
          aoLocalizar={localizar}
        />
      </div>
    </div>
  );
}
