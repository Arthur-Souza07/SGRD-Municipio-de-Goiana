import type * as Leaflet from 'leaflet';
import {
  projetarPontosCalor,
  RAIO_CALOR_METROS,
  type PontoCalor,
  type CampoCalor,
} from './calor';

/** Camada única de canvas. Usa APIs públicas do Leaflet e não modifica plugins/protótipos. */
export function criarCamadaCalor(
  L: typeof Leaflet,
  pontosIniciais: readonly PontoCalor[],
  aoFalhar: () => void,
) {
  // Create Web Worker for heatmap computation
  const worker = new Worker(
    new URL('./calor.worker.ts', import.meta.url),
    { type: 'module' },
  );

  let workerReady = false;
  const pendingRequests = new Map<number, (campo: CampoCalor, rgba: Uint8ClampedArray) => void>();
  let requestId = 0;

  worker.onmessage = (event: MessageEvent<{
    type?: string;
    id?: number;
    campo?: CampoCalor;
    rgba?: Uint8ClampedArray;
    error?: string;
  }>) => {
    if (event.data.type === 'ready') {
      workerReady = true;
      return;
    }

    const { id, campo, rgba, error } = event.data;
    if (id !== undefined && pendingRequests.has(id)) {
      const resolve = pendingRequests.get(id)!;
      pendingRequests.delete(id);
      if (error) {
        console.error('[Heatmap Worker] Error:', error);
        aoFalhar();
      } else if (campo && rgba) {
        resolve(campo, rgba);
      }
    }
  };

  worker.onerror = (error) => {
    console.error('[Heatmap Worker] Worker error:', error);
    aoFalhar();
  };

  // Pre-project points once
  let pontosProjetados = projetarPontosCalor(pontosIniciais);

  return new (class extends L.Layer {
    private mapa: Leaflet.Map | null = null;
    private canvas = document.createElement('canvas');
    private amostra = document.createElement('canvas');
    private quadro: number | null = null;
    private origem: Leaflet.LatLng | null = null;
    private zoomDesenhado = 14;
    private renderizacoes = 0;
    private limitesDesenhados: Leaflet.Bounds | null = null;
    private emZoom = false;
    // Throttling para redraw durante arraste - evita redraw excessivo
    private ultimoRedrawArraste = 0;
    private readonly INTERVALO_MINIMO_ARRASTE = 100; // ms
    private desenhando = false;
    private desenharPendente = false;

    constructor() {
      super();
      this.canvas.className = 'leaflet-heatmap-layer leaflet-layer';
      this.canvas.style.transformOrigin = '0 0';
      this.canvas.setAttribute('aria-hidden', 'true');
      this.canvas.dataset.renderizadorCalor = 'radial-canvas-worker';
      this.canvas.dataset.raioMetros = String(RAIO_CALOR_METROS);
    }

    getElement() {
      return this.canvas;
    }

    setLatLngs(dados: readonly PontoCalor[]) {
      pontosProjetados = projetarPontosCalor(dados);
      return this.redraw();
    }

    onAdd(mapa: Leaflet.Map) {
      this.mapa = mapa;
      L.DomUtil.addClass(
        this.canvas,
        mapa.options.zoomAnimation && L.Browser.any3d
          ? 'leaflet-zoom-animated'
          : 'leaflet-zoom-hide',
      );
      mapa.getPanes().overlayPane.appendChild(this.canvas);
      mapa.on('moveend resize viewreset', this.redraw, this);
      mapa.on('move', this.acompanharArraste, this);
      mapa.on('zoomstart', this.iniciarZoom, this);
      mapa.on('zoomend', this.terminarZoom, this);
      mapa.on('zoomanim', this.animarZoom, this);
      this.redraw();
      return this;
    }

    onRemove(mapa: Leaflet.Map) {
      mapa.off('moveend resize viewreset', this.redraw, this);
      mapa.off('move', this.acompanharArraste, this);
      mapa.off('zoomstart', this.iniciarZoom, this);
      mapa.off('zoomend', this.terminarZoom, this);
      mapa.off('zoomanim', this.animarZoom, this);
      if (this.quadro !== null) cancelAnimationFrame(this.quadro);
      this.quadro = null;
      this.canvas.remove();
      this.mapa = null;
      this.origem = null;
      this.limitesDesenhados = null;
      this.emZoom = false;
      // Terminate worker
      worker.terminate();
      return this;
    }

    redraw() {
      if (this.mapa && this.quadro === null && !this.desenhando) {
        this.quadro = requestAnimationFrame(() => {
          this.quadro = null;
          try {
            this.desenhar();
          } catch {
            this.remove();
            aoFalhar();
          }
        });
      }
      return this;
    }

    private async desenhar() {
      if (this.desenhando || !this.mapa) return;

      // If worker not ready, wait a bit
      if (!workerReady) {
        await new Promise<void>((resolve) => {
          const checkReady = setInterval(() => {
            if (workerReady) {
              clearInterval(checkReady);
              resolve();
            }
          }, 50);
          // Timeout after 2 seconds
          setTimeout(() => {
            clearInterval(checkReady);
            resolve();
          }, 2000);
        });
      }

      if (!this.mapa) return;

      this.desenhando = true;

      const tamanho = this.mapa.getSize();
      if (tamanho.x <= 0 || tamanho.y <= 0) {
        this.desenhando = false;
        return;
      }

      const inicio = performance.now();
      const margemX = Math.min(160, Math.ceil(tamanho.x * 0.25));
      const margemY = Math.min(160, Math.ceil(tamanho.y * 0.25));
      const origem = this.mapa.getPixelBounds().min!.subtract([margemX, margemY]);
      const largura = tamanho.x + margemX * 2,
        altura = tamanho.y + margemY * 2;
      const zoom = this.mapa.getZoom();

      try {
        // Send computation to worker
        const campo = await this.computarCampoNoWorker({
          x: origem.x,
          y: origem.y,
          largura,
          altura,
          zoom,
        });

        // Render on main thread (canvas operations must be on main thread)
        this.amostra.width = campo.colunas;
        this.amostra.height = campo.linhas;
        const contextoAmostra = this.amostra.getContext('2d');
        const contexto = this.canvas.getContext('2d');
        if (!contextoAmostra || !contexto) throw new Error('Canvas indisponível.');

        // Use the pre-computed RGBA from worker
        const imagem = contextoAmostra.createImageData(campo.colunas, campo.linhas);
        imagem.data.set(campo.rgba!); // Worker returns Uint8ClampedArray as plain array
        contextoAmostra.putImageData(imagem, 0, 0);

        if (this.canvas.width !== largura) this.canvas.width = largura;
        if (this.canvas.height !== altura) this.canvas.height = altura;
        contexto.clearRect(0, 0, largura, altura);
        contexto.imageSmoothingEnabled = true;
        contexto.imageSmoothingQuality = 'high';

        contexto.drawImage(
          this.amostra,
          campo.origemX - origem.x - campo.passo / 2,
          campo.origemY - origem.y - campo.passo / 2,
          campo.colunas * campo.passo,
          campo.linhas * campo.passo,
        );

        L.DomUtil.setPosition(
          this.canvas,
          this.mapa.containerPointToLayerPoint([-margemX, -margemY]),
        );

        this.origem = this.mapa.unproject(origem, zoom);
        this.zoomDesenhado = zoom;
        this.limitesDesenhados = L.bounds(origem, origem.add([largura, altura]));
        this.canvas.dataset.raioCalor = String(campo.radius);
        this.canvas.dataset.zoomCalor = String(zoom);
        this.canvas.dataset.celulasCalor = String(campo.valores.length);
        this.canvas.dataset.quadrosCalor = String(++this.renderizacoes);
        this.canvas.dataset.calculoMs = String(Math.round(performance.now() - inicio));
      } catch (error) {
        console.error('[Heatmap] Error drawing:', error);
        this.remove();
        aoFalhar();
      } finally {
        this.desenhando = false;
        if (this.desenharPendente) {
          this.desenharPendente = false;
          this.redraw();
        }
      }
    }

    private computarCampoNoWorker(janela: {
      x: number;
      y: number;
      largura: number;
      altura: number;
      zoom: number;
    }): Promise<CampoCalor & { rgba?: Uint8ClampedArray }> {
      return new Promise((resolve, reject) => {
        const id = ++requestId;
        pendingRequests.set(id, (campo, rgba) => {
          resolve({ ...campo, rgba });
        });

        worker.postMessage({
          id,
          pontos: pontosProjetados,
          janela,
        });

        // Timeout after 5 seconds
        setTimeout(() => {
          if (pendingRequests.has(id)) {
            pendingRequests.delete(id);
            reject(new Error('Worker timeout'));
          }
        }, 5000);
      });
    }

    private acompanharArraste() {
      if (!this.mapa || this.emZoom || !this.limitesDesenhados) return;
      const agora = performance.now();
      // Throttle: só redraw se passou tempo suficiente desde o último
      if (agora - this.ultimoRedrawArraste < this.INTERVALO_MINIMO_ARRASTE) {
        return;
      }
      const visivel = this.mapa.getPixelBounds();
      const comFolga = L.bounds(
        visivel.min!.subtract([24, 24]),
        visivel.max!.add([24, 24]),
      );
      // Recalcula durante arrastes longos apenas quando a margem está acabando.
      if (!this.limitesDesenhados.contains(comFolga)) {
        this.ultimoRedrawArraste = agora;
        this.redraw();
      }
    }

    private iniciarZoom() {
      this.emZoom = true;
    }

    private terminarZoom() {
      this.emZoom = false;
      this.redraw();
    }

    private animarZoom(evento: Leaflet.ZoomAnimEvent) {
      const mapa = this.mapa;
      if (!mapa || !this.origem) return;
      const escala = mapa.getZoomScale(evento.zoom, this.zoomDesenhado);
      const pane = mapa.containerPointToLayerPoint([0, 0]).multiplyBy(-1);
      const novaOrigem = mapa
        .project(evento.center, evento.zoom)
        .subtract(mapa.getSize().divideBy(2))
        .add(pane)
        .round();
      const deslocamento = mapa
        .project(this.origem, evento.zoom)
        .subtract(novaOrigem);
      L.DomUtil.setTransform(this.canvas, deslocamento, escala);
    }
  })();
}

export type CamadaCalor = ReturnType<typeof criarCamadaCalor>;