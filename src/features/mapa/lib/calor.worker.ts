/**
 * Web Worker for heatmap computation.
 * Offloads CPU-intensive calculations from the main thread.
 */

import type {
  PontoProjetadoCalor,
  JanelaCalor,
  CampoCalor,
} from './calor';
import {
  opcoesCalorNoZoom,
  colorirCampoCalor,
} from './calor';

interface HeatmapRequest {
  id: number;
  pontos: readonly PontoProjetadoCalor[];
  janela: JanelaCalor;
}

interface HeatmapResponse {
  id: number;
  campo: CampoCalor;
  rgba: Uint8ClampedArray;
  error?: string;
}

self.onmessage = (event: MessageEvent<HeatmapRequest>) => {
  const { id, pontos, janela } = event.data;

  try {
    const { radius, passo, escala } = opcoesCalorNoZoom(janela.zoom);
    const origemX = Math.floor(janela.x / passo) * passo;
    const origemY = Math.floor(janela.y / passo) * passo;
    const colunas = Math.ceil((janela.x + janela.largura - origemX) / passo) + 2;
    const linhas = Math.ceil((janela.y + janela.altura - origemY) / passo) + 2;

    // Safety check for excessive memory allocation
    if (colunas * linhas > 2000000) {
      throw new Error('A área de desenho excede o limite do calor.');
    }

    const valores = new Float32Array(colunas * linhas);
    const raioQuadrado = radius * radius;

    // Compute heat field
    for (const [xBase, yBase, peso] of pontos) {
      if (![xBase, yBase, peso].every(Number.isFinite) || peso <= 0) continue;
      const x = xBase * escala;
      const y = yBase * escala;

      const inicioX = Math.max(0, Math.ceil((x - radius - origemX) / passo));
      const fimX = Math.min(colunas - 1, Math.floor((x + radius - origemX) / passo));
      const inicioY = Math.max(0, Math.ceil((y - radius - origemY) / passo));
      const fimY = Math.min(linhas - 1, Math.floor((y + radius - origemY) / passo));

      for (let iy = inicioY; iy <= fimY; iy++) {
        const dy = origemY + iy * passo - y;
        const dy2 = dy * dy;
        for (let ix = inicioX; ix <= fimX; ix++) {
          const dx = origemX + ix * passo - x;
          const u = 1 - (dx * dx + dy2) / raioQuadrado;
          if (u > 0) {
            const uu = u * u * u;
            valores[iy * colunas + ix] += peso * uu;
          }
        }
      }
    }

    const campo: CampoCalor = {
      valores,
      colunas,
      linhas,
      origemX,
      origemY,
      passo,
      radius,
    };

    const rgba = colorirCampoCalor(valores);

    // Transfer ownership of ArrayBuffers for zero-copy transfer
    const response: HeatmapResponse = { id, campo, rgba };
    self.postMessage(response, { transfer: [rgba.buffer] });
  } catch (error) {
    const response: HeatmapResponse = {
      id,
      campo: { valores: new Float32Array(0), colunas: 0, linhas: 0, origemX: 0, origemY: 0, passo: 0, radius: 0 },
      rgba: new Uint8ClampedArray(0),
      error: error instanceof Error ? error.message : 'Erro desconhecido no worker',
    };
    self.postMessage(response);
  }
};

// Signal that worker is ready
self.postMessage({ type: 'ready' });

export {};