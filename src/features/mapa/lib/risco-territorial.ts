import type { FeatureCollection, Geometry, Position } from 'geojson';
import type { NivelRisco } from './familias';
import { dentroDeGoiana } from './territorio';

type Classe = 'Baixa' | 'Média' | 'Alta';

interface PropriedadesSuscetibilidade {
  camada: 'inundacao' | 'movimento';
  descricao: Classe;
  id: string;
}

interface PropriedadesHistorico {
  camada: 'historico';
  descricao: string;
  processo: string;
  grauHistorico: string;
  ano: number;
}

interface PropriedadesGeologia {
  camada: 'geologia';
  descricao: string;
}

export interface AvaliacaoRiscoTerritorial {
  nivel: NivelRisco;
  pontuacao: number;
  tipoPrioritario: 'inundacao' | 'movimento' | 'erosao' | 'nao_informado';
  fatores: string[];
  inundacao: Classe | null;
  movimento: Classe | null;
  setorHistorico: string | null;
  distanciaSuscetibilidadeMetros: number | null;
}

let suscetibilidade:
  | FeatureCollection<Geometry, PropriedadesSuscetibilidade>
  | null = null;
let historico:
  | FeatureCollection<Geometry, PropriedadesHistorico>
  | null = null;
let geologia:
  | FeatureCollection<Geometry, PropriedadesGeologia>
  | null = null;
let inicializacao: Promise<void> | null = null;

export async function inicializarRiscoTerritorial(): Promise<void> {
  if (inicializacao) return inicializacao;
  inicializacao = (async () => {
    const base = import.meta.env?.BASE_URL?.replace(/\/$/, '') || '';
    const [sus, his, geo] = await Promise.all([
      fetch(`${base}/camadas/suscetibilidade-goiana.geojson`),
      fetch(`${base}/camadas/setores-historicos-goiana.geojson`),
      fetch(`${base}/camadas/geologia-goiana.geojson`),
    ]);
    const respostas = [sus, his, geo];
    const arquivos = [
      'suscetibilidade-goiana.geojson',
      'setores-historicos-goiana.geojson',
      'geologia-goiana.geojson',
    ];
    const falha = respostas.findIndex((resposta) => !resposta.ok);
    if (falha !== -1) {
      throw new Error(`Não foi possível carregar a camada ${arquivos[falha]}.`);
    }

    [suscetibilidade, historico, geologia] = await Promise.all(
      respostas.map((resposta) => resposta.json()),
    );
  })();
  try {
    await inicializacao;
  } catch (erro) {
    inicializacao = null;
    throw erro;
  }
}

export function sortearPontoEmAreaSuscetibilidade(
  aleatorio: () => number,
): { longitude: number; latitude: number } | null {
  const feicoes = suscetibilidade?.features.filter((feature) =>
    feature.properties && feature.geometry.type !== 'GeometryCollection',
  );
  if (!feicoes?.length) return null;

  for (let tentativa = 0; tentativa < 100; tentativa++) {
    const indice = Math.floor(aleatorio() * feicoes.length);
    const feicao = feicoes[indice];
    const aneis = anelCompleto(feicao.geometry);
    let minLongitude = Number.POSITIVE_INFINITY;
    let maxLongitude = Number.NEGATIVE_INFINITY;
    let minLatitude = Number.POSITIVE_INFINITY;
    let maxLatitude = Number.NEGATIVE_INFINITY;
    for (const poligono of aneis) {
      for (const anel of poligono) {
        for (const [longitude, latitude] of anel) {
          minLongitude = Math.min(minLongitude, longitude);
          maxLongitude = Math.max(maxLongitude, longitude);
          minLatitude = Math.min(minLatitude, latitude);
          maxLatitude = Math.max(maxLatitude, latitude);
        }
      }
    }
    if (!Number.isFinite(minLongitude) || !Number.isFinite(minLatitude)) continue;

    for (let tentativaPonto = 0; tentativaPonto < 40; tentativaPonto++) {
      const longitude = minLongitude + aleatorio() * (maxLongitude - minLongitude);
      const latitude = minLatitude + aleatorio() * (maxLatitude - minLatitude);
      if (
        dentroDeGoiana(longitude, latitude) &&
        pontoEmGeometria(longitude, latitude, feicao.geometry)
      ) {
        return { longitude, latitude };
      }
    }
  }

  return null;
}

function situacaoNoAnel(
  x: number,
  y: number,
  anel: Position[],
): 'dentro' | 'fora' {
  let dentro = false;
  for (let i = 0, j = anel.length - 1; i < anel.length; j = i++) {
    const [xi, yi] = anel[i];
    const [xj, yj] = anel[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) {
      dentro = !dentro;
    }
  }
  return dentro ? 'dentro' : 'fora';
}

function pontoEmPoligono(longitude: number, latitude: number, poligono: Position[][]): boolean {
  if (situacaoNoAnel(longitude, latitude, poligono[0]) === 'fora') return false;
  return !poligono.slice(1).some((anel) =>
    situacaoNoAnel(longitude, latitude, anel) === 'dentro',
  );
}

function pontoEmGeometria(longitude: number, latitude: number, geometria: Geometry): boolean {
  if (geometria.type === 'Polygon') {
    return pontoEmPoligono(longitude, latitude, geometria.coordinates as Position[][]);
  }
  if (geometria.type === 'MultiPolygon') {
    return (geometria.coordinates as Position[][][]).some((poligono) =>
      pontoEmPoligono(longitude, latitude, poligono),
    );
  }
  return false;
}

function anelCompleto(geometria: Geometry): Position[][][] {
  if (geometria.type === 'Polygon') {
    return [geometria.coordinates as Position[][]];
  }
  if (geometria.type === 'MultiPolygon') {
    return geometria.coordinates as Position[][][];
  }
  return [];
}

function haversineMetros(a: Position, b: Position): number {
  const longitude1 = a[0] * Math.PI / 180;
  const latitude1 = a[1] * Math.PI / 180;
  const longitude2 = b[0] * Math.PI / 180;
  const latitude2 = b[1] * Math.PI / 180;
  const dLat = latitude2 - latitude1;
  const dLon = longitude2 - longitude1;
  const valor = Math.sin(dLat / 2) ** 2
    + Math.cos(latitude1) * Math.cos(latitude2) * Math.sin(dLon / 2) ** 2;
  return 6371000 * 2 * Math.atan2(Math.sqrt(valor), Math.sqrt(1 - valor));
}

function distanciaArestaMetros(
  longitude: number,
  latitude: number,
  poligono: Position[][],
): number {
  let menor = Number.POSITIVE_INFINITY;
  for (const anel of poligono) {
    for (let i = 0; i < anel.length - 1; i++) {
      menor = Math.min(
        menor,
        distanciaPontoSegmentoMetros(
          [longitude, latitude],
          anel[i],
          anel[i + 1],
        ),
      );
    }
  }
  return menor;
}

function distanciaPontoSegmentoMetros(
  ponto: Position,
  inicio: Position,
  fim: Position,
): number {
  const longitude = ponto[0];
  const latitude = ponto[1];
  const minLon = Math.min(inicio[0], fim[0]);
  const maxLon = Math.max(inicio[0], fim[0]);
  const minLat = Math.min(inicio[1], fim[1]);
  const maxLat = Math.max(inicio[1], fim[1]);

  if (longitude >= minLon && longitude <= maxLon && latitude >= minLat && latitude <= maxLat) {
    return haversineMetros(ponto, inicio);
  }
  return Math.min(haversineMetros(ponto, inicio), haversineMetros(ponto, fim));
}

function distanciaFeicaoMetros(
  longitude: number,
  latitude: number,
  geometria: Geometry,
): number {
  let menor = Number.POSITIVE_INFINITY;
  for (const poligonos of anelCompleto(geometria)) {
    menor = Math.min(
      menor,
      distanciaArestaMetros(longitude, latitude, poligonos),
    );
  }
  return menor;
}

export function calcularRiscoTerritorial(
  longitude: number,
  latitude: number,
): AvaliacaoRiscoTerritorial {
  let pontuacao = 0;
  let inundacao: Classe | null = null;
  let movimento: Classe | null = null;
  let setorHistorico: string | null = null;
  let distanciaSuscetibilidadeMetros: number | null = null;
  let tipoPrioritario: AvaliacaoRiscoTerritorial['tipoPrioritario'] = 'nao_informado';
  const fatores: string[] = [];

  for (const feature of suscetibilidade?.features || []) {
    const propriedades = feature.properties;
    if (!propriedades) continue;

    if (pontoEmGeometria(longitude, latitude, feature.geometry)) {
      if (propriedades.camada === 'inundacao') inundacao = propriedades.descricao;
      if (propriedades.camada === 'movimento') movimento = propriedades.descricao;

      const peso = propriedades.descricao === 'Alta'
        ? 48
        : propriedades.descricao === 'Média'
          ? 30
          : 12;
      pontuacao += peso;
      distanciaSuscetibilidadeMetros = 0;
      fatores.push(
        `${propriedades.camada === 'inundacao' ? 'Inundação' : 'Movimento de massa'}: suscetibilidade ${propriedades.descricao.toLocaleLowerCase('pt-BR')} no SGB 2025.`,
      );
    } else {
      const distancia = distanciaFeicaoMetros(longitude, latitude, feature.geometry);
      if (distancia <= 250) {
        const peso = propriedades.descricao === 'Alta' ? 18 : 10;
        pontuacao += peso;
        distanciaSuscetibilidadeMetros = distanciaSuscetibilidadeMetros === null
          ? distancia
          : Math.min(distanciaSuscetibilidadeMetros, distancia);
        fatores.push(
          `Residência a ${Math.round(distancia)} m de área ${propriedades.descricao.toLocaleLowerCase('pt-BR')} de ${propriedades.camada === 'inundacao' ? 'inundação' : 'movimento de massa'}.`,
        );
      }
    }
  }

  for (const feature of historico?.features || []) {
    if (!pontoEmGeometria(longitude, latitude, feature.geometry)) continue;
    const propriedades = feature.properties;
    setorHistorico = propriedades?.descricao || null;
    const grau = propriedades?.grauHistorico?.toLocaleLowerCase('pt-BR') || '';
    pontuacao += grau.includes('muito') || grau.includes('alto') ? 24 : 14;
    fatores.push(
      `Dentro do setor histórico registrado pelo SGB/CPRM em 2014: ${setorHistorico}.`,
    );
  }

  for (const feature of geologia?.features || []) {
    if (!pontoEmGeometria(longitude, latitude, feature.geometry)) continue;
    const descricao = feature.properties?.descricao?.toLocaleLowerCase('pt-BR') || '';
    if (descricao.includes('xisto') || descricao.includes('argil') || descricao.includes('sediment')) {
      pontuacao += 4;
      fatores.push('Contexto geológico compatível com maior suscetibilidade litológica.');
    }
  }

  const maiorInundacao = inundacao;
  const maiorMovimento = movimento;
  if (maiorInundacao === 'Alta' || maiorInundacao === 'Média') {
    tipoPrioritario = 'inundacao';
  } else if (maiorMovimento === 'Alta' || maiorMovimento === 'Média') {
    tipoPrioritario = 'movimento';
  } else if (setorHistorico) {
    tipoPrioritario = setorHistorico.toLocaleLowerCase('pt-BR').includes('cocota')
      ? 'movimento'
      : 'inundacao';
  }

  const nivel: NivelRisco = pontuacao >= 55
    ? 'alto'
    : pontuacao >= 25
      ? 'medio'
      : 'baixo';

  return {
    nivel,
    pontuacao,
    tipoPrioritario,
    fatores,
    inundacao,
    movimento,
    setorHistorico,
    distanciaSuscetibilidadeMetros:
      distanciaSuscetibilidadeMetros === null
        ? null
        : Math.round(distanciaSuscetibilidadeMetros),
  };
}
