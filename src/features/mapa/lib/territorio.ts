import limite from '../data/limite-goiana.json';
import bairros from '../data/bairros-goiana.json';
import type { Feature, Polygon, MultiPolygon, FeatureCollection, Geometry, Position } from 'geojson';
import type * as Leaflet from 'leaflet';

export const LIMITE_GOIANA = limite as Feature<Polygon | MultiPolygon>;
export const BAIRROS_GOIANA = bairros as FeatureCollection<Polygon>;

type Posicao = Position;

/**
 * Verifica se um ponto está dentro de um anel (linear ring) usando ray-casting.
 * Retorna 'dentro', 'fora' ou 'borda'.
 */
function situacaoNoAnel(
  x: number,
  y: number,
  anel: Posicao[],
): 'dentro' | 'fora' | 'borda' {
  let dentro = false;
  for (let i = 0, j = anel.length - 1; i < anel.length; j = i++) {
    const [xi, yi] = anel[i],
      [xj, yj] = anel[j];
    const dx = xj - xi,
      dy = yj - yi;
    const comprimento = Math.hypot(dx, dy);
    // Verifica se o ponto está sobre a borda (com tolerância)
    if (
      comprimento > 0 &&
      Math.abs((x - xi) * dy - (y - yi) * dx) <= 1e-10 * comprimento &&
      x >= Math.min(xi, xj) - 1e-10 &&
      x <= Math.max(xi, xj) + 1e-10 &&
      y >= Math.min(yi, yj) - 1e-10 &&
      y <= Math.max(yi, yj) + 1e-10
    )
      return 'borda';
    // Ray-casting: conta interseções com raio horizontal para a direita
    if (yi > y !== yj > y && x < (dx * (y - yi)) / dy + xi) dentro = !dentro;
  }
  return dentro ? 'dentro' : 'fora';
}

/**
 * Verifica se um ponto está dentro de um polígono (pode ter holes).
 */
function pontoEmPoligono(
  longitude: number,
  latitude: number,
  poligono: Position[][],
): boolean {
  const exterior = situacaoNoAnel(longitude, latitude, poligono[0]);
  if (exterior === 'fora') return false;
  // Verifica se está em algum hole (anel interno)
  return !poligono
    .slice(1)
    .some((anel) => situacaoNoAnel(longitude, latitude, anel) === 'dentro');
}

/**
 * Verifica se um ponto está dentro dos limites do município de Goiana (IBGE 2025).
 * Limite IBGE 2025, código 2606200. SIRGAS 2000 em coordenadas geográficas.
 */
export function dentroDeGoiana(longitude: number, latitude: number): boolean {
  if (!Number.isFinite(longitude) || !Number.isFinite(latitude)) return false;
  const geometria = LIMITE_GOIANA.geometry;
  const poligonos: Position[][][] =
    geometria.type === 'Polygon'
      ? [geometria.coordinates as Position[][]]
      : (geometria.coordinates as Position[][][]);
  return poligonos.some((p) => pontoEmPoligono(longitude, latitude, p));
}

/**
 * Verifica se um ponto está dentro de algum bairro de Goiana.
 * Retorna o nome do bairro se encontrado, ou null se fora de todos.
 */
export function bairroDoPonto(longitude: number, latitude: number): string | null {
  if (!Number.isFinite(longitude) || !Number.isFinite(latitude)) return null;

  for (const feature of BAIRROS_GOIANA.features) {
    const coords = feature.geometry.coordinates as Position[][];
    if (pontoEmPoligono(longitude, latitude, coords)) {
      return feature.properties?.nome ?? null;
    }
  }
  return null;
}

/**
 * Validação completa: ponto deve estar dentro do município E dentro de algum bairro.
 * Retorna objeto com resultado e detalhes.
 */
export function validarLocalizacaoGoiana(longitude: number, latitude: number): {
  valido: boolean;
  dentroMunicipio: boolean;
  bairro: string | null;
  mensagem: string;
} {
  const dentroMunicipio = dentroDeGoiana(longitude, latitude);
  const bairro = dentroMunicipio ? bairroDoPonto(longitude, latitude) : null;

  if (!dentroMunicipio) {
    return {
      valido: false,
      dentroMunicipio: false,
      bairro: null,
      mensagem: 'O ponto está fora dos limites do município de Goiana–PE (IBGE 2025).',
    };
  }

  if (!bairro) {
    return {
      valido: false,
      dentroMunicipio: true,
      bairro: null,
      mensagem: 'O ponto está dentro do município mas fora dos bairros oficiais (Lei Complementar 32/2026).',
    };
  }

  return {
    valido: true,
    dentroMunicipio: true,
    bairro,
    mensagem: `Localização válida no bairro ${bairro}.`,
  };
}

export type ClasseSuscetibilidade = 'Baixa' | 'Média' | 'Alta';
export interface SugestaoRiscoTerritorial {
  classe: ClasseSuscetibilidade | null;
  camada: 'inundacao' | 'movimento' | null;
  resumo: string;
  pontuacao: number;
  distanciaAreaMetros: number | null;
  fatores: string[];
}

const cacheSuscetibilidade =
  new Map<'inundacao' | 'movimento', FeatureCollection<Geometry, {
    camada: 'inundacao' | 'movimento';
    descricao: ClasseSuscetibilidade;
  }>>();

function pontoEmGeometria(
  longitude: number,
  latitude: number,
  geometria: Geometry,
): boolean {
  if (geometria.type === 'Polygon') {
    const poligono = geometria.coordinates as Position[][];
    return pontoEmPoligono(longitude, latitude, poligono);
  }
  if (geometria.type === 'MultiPolygon') {
    return (geometria.coordinates as Position[][][]).some((poligono) =>
      pontoEmPoligono(longitude, latitude, poligono),
    );
  }
  return false;
}

export async function avaliarRiscoTerritorial(
  longitude: number,
  latitude: number,
): Promise<SugestaoRiscoTerritorial> {
  if (!dentroDeGoiana(longitude, latitude)) {
    return {
      classe: null,
      camada: null,
      resumo: 'Localização fora do limite municipal.',
      pontuacao: 0,
      distanciaAreaMetros: null,
      fatores: ['Localização fora do limite municipal.'],
    };
  }

  const classes: Array<{
    camada: 'inundacao' | 'movimento';
    classe: ClasseSuscetibilidade;
  }> = [];

  for (const camada of ['inundacao', 'movimento'] as const) {
    let dados = cacheSuscetibilidade.get(camada);
    if (!dados) {
      const base = import.meta.env.BASE_URL.replace(/\/$/, '');
      const resposta = await fetch(`${base}/camadas/suscetibilidade-goiana.geojson`);
      if (!resposta.ok) continue;
      dados = await resposta.json() as FeatureCollection<
        Geometry,
        { camada: 'inundacao' | 'movimento'; descricao: ClasseSuscetibilidade }
      >;
      cacheSuscetibilidade.set(camada, dados);
    }

    for (const feature of dados.features) {
      if (feature.properties?.camada !== camada) continue;
      if (!pontoEmGeometria(longitude, latitude, feature.geometry)) continue;
      const classe = feature.properties.descricao;
      if (classe === 'Alta' || classe === 'Média' || classe === 'Baixa') {
        classes.push({ camada, classe });
        break;
      }
    }
  }

  const prioritario = classes.find((item) => item.classe === 'Alta')
    ?? classes.find((item) => item.classe === 'Média');
  if (!prioritario) {
    return {
      classe: 'Baixa',
      camada: null,
      resumo: 'Nenhuma área de inundação ou movimento de massa ativa foi encontrada.',
      pontuacao: 12,
      distanciaAreaMetros: null,
      fatores: ['Nenhuma área de inundação ou movimento de massa ativa foi encontrada.'],
    };
  }

  const nomeCamada = prioritario.camada === 'inundacao'
    ? 'inundação'
    : 'movimento de massa';
  return {
    classe: prioritario.classe,
    camada: prioritario.camada,
    resumo: `Suscetibilidade ${prioritario.classe.toLocaleLowerCase('pt-BR')} a ${nomeCamada} no SGB 2025.`,
    pontuacao: prioritario.classe === 'Alta' ? 48 : prioritario.classe === 'Média' ? 30 : 12,
    distanciaAreaMetros: 0,
    fatores: [`Suscetibilidade ${prioritario.classe.toLocaleLowerCase('pt-BR')} a ${nomeCamada} no SGB 2025.`],
  };
}

/**
 * Adiciona o limite do município de Goiana ao mapa Leaflet.
 */
export function adicionarLimiteGoiana(L: typeof Leaflet, mapa: Leaflet.Map) {
  return L.geoJSON(LIMITE_GOIANA, {
    interactive: false,
    attribution:
      '<a href="https://www.ibge.gov.br/geociencias/organizacao-do-territorio/malhas-territoriais/15774-malhas.html" target="_blank" rel="noopener noreferrer">Limite municipal: IBGE · 2025</a>',
    style: {
      color: '#245ba3',
      weight: 2,
      dashArray: '7 6',
      fill: false,
      opacity: 0.8,
    },
  }).addTo(mapa);
}

/**
 * Adiciona os limites dos bairros de Goiana ao mapa Leaflet.
 */
export function adicionarBairrosGoiana(
  L: typeof Leaflet,
  mapa: Leaflet.Map,
  opcoes?: {
    onClick?: (bairro: string, event: Leaflet.LeafletMouseEvent) => void;
    estilo?: Leaflet.PathOptions;
    estiloHover?: Leaflet.PathOptions;
  }
) {
  const estiloPadrao: Leaflet.PathOptions = {
    color: '#245ba3',
    weight: 1.5,
    dashArray: '4 4',
    fill: true,
    fillColor: '#245ba3',
    fillOpacity: 0.08,
    opacity: 0.7,
  };

  const estiloHoverPadrao: Leaflet.PathOptions = {
    weight: 2.5,
    fillOpacity: 0.18,
    opacity: 1,
  };

  const geojson = L.geoJSON(BAIRROS_GOIANA, {
    interactive: true,
    attribution:
      '<a href="https://www.goiana.pe.gov.br" target="_blank" rel="noopener noreferrer">Bairros: Lei Complementar 32/2026</a>',
    style: opcoes?.estilo || estiloPadrao,
    onEachFeature: (feature, layer) => {
      const nome = feature.properties?.nome as string | undefined;
      if (nome) {
        layer.bindTooltip(nome, {
          permanent: false,
          direction: 'center',
          className: 'tooltip-bairro',
        });

        const pathLayer = layer as Leaflet.Path;

        layer.on('mouseover', () => {
          pathLayer.setStyle(opcoes?.estiloHover || estiloHoverPadrao);
        });

        layer.on('mouseout', () => {
          pathLayer.setStyle(opcoes?.estilo || estiloPadrao);
        });

        if (opcoes?.onClick) {
          layer.on('click', (e: Leaflet.LeafletMouseEvent) => opcoes.onClick!(nome, e));
        }
      }
    },
  }).addTo(mapa);

  return geojson;
}

/**
 * Retorna a lista de todos os bairros de Goiana.
 */
export function listarBairros(): string[] {
  return BAIRROS_GOIANA.features
    .map((f) => f.properties?.nome as string)
    .filter((nome): nome is string => nome !== undefined)
    .sort((a, b) => a.localeCompare(b, 'pt-BR'));
}

/**
 * Retorna o centroide aproximado de um bairro (primeiro vértice do exterior).
 */
export function centroideBairro(nomeBairro: string): { latitude: number; longitude: number } | null {
  const feature = BAIRROS_GOIANA.features.find(
    (f) => f.properties?.nome === nomeBairro
  );
  if (!feature) return null;
  const [lon, lat] = feature.geometry.coordinates[0][0];
  return { latitude: lat, longitude: lon };
}