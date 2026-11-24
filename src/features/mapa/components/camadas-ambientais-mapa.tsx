import { useEffect, useMemo, useRef, useState } from 'react';
import type * as Leaflet from 'leaflet';
import type { FeatureCollection, Feature, Geometry } from 'geojson';
import {
  FONTES_AMBIENTAIS,
  formatarMedicao,
  leituraAntiga,
  type EstacaoAmbiental,
} from '@/features/mapa/lib/ambiente';

export type CamadaTerritorial =
  'nenhuma' | 'inundacao' | 'movimento' | 'geologia' | 'historico';
export interface AreaPlanejada {
  id: string;
  descricao: string;
  camada: string;
}
export interface ConfiguracaoAmbiente {
  estacoes: readonly EstacaoAmbiental[];
  camada: CamadaTerritorial;
  apenasAlta: boolean;
  areaPlanejada: AreaPlanejada | null;
  aoCamada: (camada: CamadaTerritorial) => void;
  aoApenasAlta: (ativo: boolean) => void;
  aoPlanejar: (area: AreaPlanejada) => void;
}
type Propriedades = {
  id: string;
  camada: string;
  descricao: string;
  fonte: string;
  ano: number;
  processo?: string;
  grauHistorico?: string;
};
const basePath = import.meta.env.BASE_URL.replace(/\/$/, '');
const CORES_GEOLOGIA = [
  '#8e72ab',
  '#bf935d',
  '#b49a70',
  '#c7ad76',
  '#8cad99',
  '#8ca7bb',
  '#98c3cd',
  '#c1b279',
  '#7c9b7e',
  '#b7a8a0',
];

// Cache de ícones de estação para evitar recriação
const iconeEstacaoCache = new Map<string, HTMLSpanElement>();

function obterIconeEstacao(estacao: EstacaoAmbiental): HTMLSpanElement {
  const antiga = leituraAntiga(estacao);
  const chave = `${estacao.tipo}:${antiga}:${formatarMedicao(estacao)}`;
  let etiqueta = iconeEstacaoCache.get(chave);
  if (!etiqueta) {
    etiqueta = document.createElement('span');
    etiqueta.className = `etiqueta-estacao ${estacao.tipo}${antiga ? ' leitura-antiga' : ''}`;
    const tipo = document.createElement('b');
    tipo.textContent = estacao.tipo === 'chuva' ? 'CHUVA' : 'RIO';
    const valor = document.createElement('span');
    valor.textContent = formatarMedicao(estacao);
    etiqueta.append(tipo, valor);
    iconeEstacaoCache.set(chave, etiqueta);
  }
  return etiqueta.cloneNode(true) as HTMLSpanElement;
}

// Limita cache de ícones
function limitarCacheEstacoes() {
  if (iconeEstacaoCache.size > 100) {
    const primeiras = Array.from(iconeEstacaoCache.keys()).slice(0, 50);
    primeiras.forEach((k) => iconeEstacaoCache.delete(k));
  }
}

export default function CamadasAmbientaisMapa({
  mapa,
  configuracao,
}: {
  mapa: Leaflet.Map;
  configuracao: ConfiguracaoAmbiente;
}) {
  const {
    estacoes,
    camada,
    apenasAlta,
    areaPlanejada,
    aoPlanejar,
  } = configuracao;
  const cache = useRef(
    new Map<string, FeatureCollection<Geometry, Propriedades>>(),
  );
  const layer = useRef<Leaflet.GeoJSON | null>(null);
  const estacoesLayer = useRef<Leaflet.LayerGroup | null>(null);
  const marcadoresEstacoes = useRef(new Map<string, Leaflet.Marker>());
  const planejar = useRef(aoPlanejar);
  planejar.current = aoPlanejar;
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState('');
  const [tentativa, setTentativa] = useState(0);

  // Memoiza as estações para detectar mudanças reais (não apenas mudança de tempo)
  const estacoesKey = useMemo(
    () => estacoes.map((e) => `${e.id}:${e.leitura}:${e.valor}`).join('|'),
    [estacoes],
  );

  // Efeito para marcadores de estações - só recria se dados mudaram (não a cada minuto)
  useEffect(() => {
    let cancelado = false;
    let grupo: Leaflet.LayerGroup | undefined;
    import('leaflet').then(({ default: L }) => {
      if (cancelado) return;
      if (!mapa.getPane('ambiente'))
        mapa.createPane('ambiente').style.zIndex = '450';
      grupo = L.layerGroup().addTo(mapa);
      estacoesLayer.current = grupo;

      const marcadoresAtuais = marcadoresEstacoes.current;
      const idsExistentes = new Set(marcadoresAtuais.keys());
      const idsNovos = new Set(estacoes.map((e) => e.id));

      // Remove marcadores obsoletos
      for (const id of idsExistentes) {
        if (!idsNovos.has(id)) {
          const marcador = marcadoresAtuais.get(id);
          if (marcador) {
            grupo.removeLayer(marcador);
            marcadoresAtuais.delete(id);
          }
        }
      }

      // Adiciona/atualiza marcadores
      for (const estacao of estacoes) {
        if (cancelado) break;
        const id = estacao.id;
        let marcador = marcadoresAtuais.get(id);
        const antiga = leituraAntiga(estacao);
        const etiqueta = obterIconeEstacao(estacao);
        const titulo = `${estacao.nome}. ${formatarMedicao(estacao)}. Leitura: ${estacao.leitura}${antiga ? '. Leitura antiga ou horário não validado.' : ''}`;

        if (marcador) {
          // Atualiza marcador existente
          const elemento = marcador.getElement();
          if (elemento) {
            elemento.title = titulo;
            // Atualiza ícone se necessário
            const iconeAtual = marcador.options.icon as Leaflet.DivIcon & { html?: HTMLElement };
            if (iconeAtual?.html !== etiqueta) {
              marcador.setIcon(
                L.divIcon({
                  className: 'marcador-estacao',
                  html: etiqueta,
                  iconSize: [116, 40],
                  iconAnchor: [58, 40],
                }),
              );
            }
          }
          // Atualiza popup
          const popup = marcador.getPopup();
          if (popup) {
            const conteudo = popup.getContent() as HTMLElement;
            if (conteudo) {
              const valorEl = conteudo.querySelector('p');
              if (valorEl) {
                valorEl.textContent = `${estacao.tipo === 'chuva' ? 'Chuva acumulada em 24h' : 'Nível na régua da estação'}: ${formatarMedicao(estacao)}`;
              }
              const quandoEl = conteudo.querySelector('p:nth-child(3)');
              if (quandoEl) {
                quandoEl.textContent = `Leitura informada: ${estacao.leitura}.`;
              }
              const avisoEl = conteudo.querySelector('.alerta-leitura');
              if (antiga && !avisoEl) {
                const aviso = document.createElement('p');
                aviso.className = 'alerta-leitura';
                aviso.textContent =
                  'Leitura há mais de 3h ou horário não validado. Confirme a atualização na fonte.';
                conteudo.append(aviso);
              } else if (!antiga && avisoEl) {
                avisoEl.remove();
              }
            }
          }
        } else {
          // Cria novo marcador
          marcador = L.marker([estacao.latitude, estacao.longitude], {
            pane: 'ambiente',
            title: titulo,
            alt: titulo,
            icon: L.divIcon({
              className: 'marcador-estacao',
              html: etiqueta,
              iconSize: [116, 40],
              iconAnchor: [58, 40],
            }),
          });

          const popup = document.createElement('div');
          popup.className = 'popup-estacao';
          const nome = document.createElement('strong');
          nome.textContent = estacao.nome;
          const medida = document.createElement('p');
          medida.textContent = `${estacao.tipo === 'chuva' ? 'Chuva acumulada em 24h' : 'Nível na régua da estação'}: ${formatarMedicao(estacao)}`;
          const quando = document.createElement('p');
          quando.textContent = `Leitura informada: ${estacao.leitura}.`;
          popup.append(nome, medida, quando);
          if (estacao.rio) {
            const rio = document.createElement('p');
            rio.textContent = `Rio: ${estacao.rio}`;
            popup.append(rio);
          }
          if (antiga) {
            const aviso = document.createElement('p');
            aviso.className = 'alerta-leitura';
            aviso.textContent =
              'Leitura há mais de 3h ou horário não validado. Confirme a atualização na fonte.';
            popup.append(aviso);
          }
          const fonte = document.createElement('a');
          fonte.href = FONTES_AMBIENTAIS[estacao.tipo];
          fonte.target = '_blank';
          fonte.rel = 'noopener noreferrer';
          fonte.textContent = 'Fonte: APAC / SIRH';
          popup.append(fonte);

          marcador
            .bindPopup(popup, { maxWidth: 280, className: 'popup-ambiental' })
            .addTo(grupo);
          marcadoresAtuais.set(id, marcador);
        }
      }

      limitarCacheEstacoes();
    });
    return () => {
      cancelado = true;
      grupo?.remove();
      estacoesLayer.current = null;
      marcadoresEstacoes.current.clear();
    };
  }, [mapa, estacoesKey]); // Usa estacoesKey em vez de estacoes + agora

  useEffect(() => {
    setErro('');
    setCarregando(false);
    if (camada === 'nenhuma') {
      return;
    }
    let cancelado = false;
    let geo: Leaflet.GeoJSON | undefined;
    const controle = new AbortController();
    const timeout = setTimeout(() => controle.abort(), 20000);
    const arquivo =
      camada === 'historico'
        ? 'setores-historicos'
        : camada === 'geologia'
          ? 'geologia'
          : 'suscetibilidade';
    setCarregando(true);
    async function iniciar() {
      const L = (await import('leaflet')).default;
      let dados = cache.current.get(arquivo);
      if (!dados) {
        const resposta = await fetch(
          `${basePath}/camadas/${arquivo}-goiana.geojson`,
          { signal: controle.signal },
        );
        if (!resposta.ok) throw new Error('Camada indisponível');
        dados = (await resposta.json()) as FeatureCollection<
          Geometry,
          Propriedades
        >;
        if (!Array.isArray(dados.features)) throw new Error('Camada inválida');
        cache.current.set(arquivo, dados);
      }
      if (cancelado) return;
      if (!mapa.getPane('territorio'))
        mapa.createPane('territorio').style.zIndex = '350';
      const descricoes = [
        ...new Set(dados.features.map((f) => f.properties.descricao)),
      ].sort();
      geo = L.geoJSON(dados, {
        pane: 'territorio',
        attribution:
          camada === 'historico'
            ? '<a href="https://rigeo.sgb.gov.br/handle/doc/19968" target="_blank" rel="noopener noreferrer">SGB · histórico 2014</a>'
            : '<a href="https://rigeo.sgb.gov.br/handle/doc/25401" target="_blank" rel="noopener noreferrer">SGB · 2025</a>',
        filter: (feature) =>
          feature.properties.camada === camada &&
          (camada === 'geologia' ||
            camada === 'historico' ||
            !apenasAlta ||
            feature.properties.descricao === 'Alta'),
        style: (feature) => ({
          color:
            camada === 'historico'
              ? '#703f97'
              : camada === 'geologia'
                ? '#71634e'
                : feature?.properties.descricao === 'Alta'
                  ? '#c04b28'
                  : feature?.properties.descricao === 'Média'
                    ? '#b98b1e'
                    : '#718d5c',
          weight: 1,
          fillOpacity: 0.22,
          fillColor:
            camada === 'geologia'
              ? CORES_GEOLOGIA[
                  descricoes.indexOf(feature?.properties.descricao || '') %
                    CORES_GEOLOGIA.length
                ]
              : undefined,
        }),
        onEachFeature: (
          feature: Feature<Geometry, Propriedades>,
          forma: Leaflet.Layer,
        ) => {
          const titulo =
            camada === 'historico'
              ? 'Setor histórico · SGB 2014'
              : camada === 'inundacao'
                ? 'Suscetibilidade à inundação'
                : camada === 'movimento'
                  ? 'Suscetibilidade a movimento de massa'
                  : 'Geologia do território';
          const cartao = document.createElement('div');
          cartao.className = 'popup-estacao';
          const nome = document.createElement('strong');
          nome.textContent = titulo;
          const classe = document.createElement('p');
          classe.textContent =
            camada === 'historico'
              ? `${feature.properties.descricao}. Processo: ${feature.properties.processo}. Grau registrado em 2014: ${feature.properties.grauHistorico}.`
              : camada === 'geologia'
                ? feature.properties.descricao
                : `Classe SGB: ${feature.properties.descricao}`;
          const limite = document.createElement('p');
          limite.textContent =
            camada === 'historico'
              ? 'Delimitação de março de 2014. Não representa uma vistoria atual nem a localização de ocorrências em tempo real.'
              : camada === 'geologia'
                ? 'Referência geológica da publicação SGB 2025. Base em escala 1:100.000.'
                : 'Carta SGB 2025 · Escala 1:45.000. Referência territorial, sem previsão de cheia.';
          cartao.append(nome, classe, limite);
          if (camada !== 'geologia' && camada !== 'historico') {
            const botao = document.createElement('button');
            botao.type = 'button';
            botao.textContent = 'Selecionar área para visitas';
            botao.onclick = () => {
              planejar.current({
                id: feature.properties.id,
                descricao: feature.properties.descricao,
                camada,
              });
              mapa.closePopup();
            };
            cartao.append(botao);
          }
          forma.bindPopup(cartao, {
            maxWidth: 280,
            className: 'popup-ambiental',
          });
        },
      }).addTo(mapa);
      layer.current = geo;
      setCarregando(false);
    }
    iniciar()
      .catch(() => {
        if (!cancelado) {
          setCarregando(false);
          setErro(
            'Não foi possível abrir a camada do SGB. O mapa de famílias continua disponível.',
          );
        }
      })
      .finally(() => clearTimeout(timeout));
    return () => {
      cancelado = true;
      clearTimeout(timeout);
      controle.abort();
      geo?.remove();
      layer.current = null;
    };
  }, [mapa, camada, apenasAlta, tentativa]);

  useEffect(() => {
    if (!layer.current) return;
    layer.current.eachLayer((forma) => {
      if (!('feature' in forma) || !('setStyle' in forma)) return;
      const poligono = forma as Leaflet.Path & {
        feature: Feature<Geometry, Propriedades>;
      };
      const selecionado = poligono.feature.properties.id === areaPlanejada?.id;
      poligono.setStyle({
        weight: selecionado ? 4 : 1,
        dashArray: selecionado ? '7 5' : undefined,
      });
      if (selecionado && 'getBounds' in poligono)
        mapa.fitBounds((poligono as Leaflet.Polygon).getBounds(), {
          padding: [45, 45],
          maxZoom: 16,
          animate: !window.matchMedia('(prefers-reduced-motion: reduce)')
            .matches,
        });
    });
  }, [areaPlanejada, mapa]);
  return (
    <div
      className="estado-camada-territorial"
      data-camada-territorial={camada}
      data-area-planejada={areaPlanejada?.id || ''}
    >
      {carregando && (
        <p className="carregando-territorio" role="status">
          <span className="spinner pequeno" />
          Preparando camada do SGB…
        </p>
      )}
      {erro && (
        <div className="erro-mapa" role="alert">
          {erro}
          <button type="button" onClick={() => setTentativa((n) => n + 1)}>
            Tentar camada novamente
          </button>
        </div>
      )}
    </div>
  );
}
