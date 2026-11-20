import { useEffect, useRef, useState } from 'react';
import type * as Leaflet from 'leaflet';
import { adicionarLimiteGoiana } from '@/features/mapa/lib/territorio';
import { CENTRO_GOIANA } from '@/features/mapa/lib/pontos';
import type { LocalizacaoFamilia } from '@/features/mapa/lib/familias';

export default function SeletorLocalizacao({
  localizacao,
  aoSelecionar,
}: {
  localizacao: LocalizacaoFamilia | null;
  aoSelecionar: (local: LocalizacaoFamilia) => void;
}) {
  const elemento = useRef<HTMLDivElement>(null);
  const mapa = useRef<Leaflet.Map | null>(null);
  const marcador = useRef<Leaflet.Marker | null>(null);
  const selecionar = useRef(aoSelecionar);
  const [estado, setEstado] = useState<'carregando' | 'pronto' | 'erro'>(
    'carregando',
  );
  const [tentativa, setTentativa] = useState(0);
  // Ready state to track when map and marker are fully initialized
  const [mapaPronta, setMapaPronta] = useState(false);
  selecionar.current = aoSelecionar;

  useEffect(() => {
    const localizacaoInicial = localizacao;
    let cancelado = false;
    let instancia: Leaflet.Map | undefined;
    let observador: ResizeObserver | undefined;
    setEstado('carregando');
    import('leaflet')
      .then(({ default: L }) => {
        if (cancelado || !elemento.current) return;
        instancia = L.map(elemento.current, {
          center: localizacaoInicial
            ? [localizacaoInicial.latitude, localizacaoInicial.longitude]
            : CENTRO_GOIANA,
          zoom: 16,
          minZoom: 3,
          maxZoom: 19,
          scrollWheelZoom: false,
          zoomControl: false,
          doubleClickZoom: false,
          zoomAnimation: !window.matchMedia('(prefers-reduced-motion: reduce)')
            .matches,
        });
        mapa.current = instancia;
        instancia.attributionControl.setPrefix('Leaflet');
        L.control
          .zoom({
            zoomInTitle: 'Aproximar localização',
            zoomOutTitle: 'Afastar localização',
          })
          .addTo(instancia);
        adicionarLimiteGoiana(L, instancia);
        L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
          maxZoom: 19,
          attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a>',
        }).addTo(instancia);
        const escolher = (lat: number, lng: number) =>
          selecionar.current({
            latitude: Number(lat.toFixed(7)),
            longitude: Number(lng.toFixed(7)),
            origem: 'mapa',
          });
        instancia.on('click', (evento: Leaflet.LeafletMouseEvent) =>
          escolher(evento.latlng.lat, evento.latlng.lng),
        );
        const pin = document.createElement('span');
        pin.className = 'pin-cadastro';
        marcador.current = L.marker(CENTRO_GOIANA, {
          draggable: true,
          opacity: 0,
          keyboard: false,
          title: 'Residência selecionada. Arraste para ajustar.',
          icon: L.divIcon({
            html: pin,
            className: 'marcador-cadastro',
            iconSize: [30, 36],
            iconAnchor: [15, 34],
          }),
        }).addTo(instancia);
        marcador.current.on('dragend', () => {
          const posicao = marcador.current!.getLatLng();
          escolher(posicao.lat, posicao.lng);
        });
        // Inline marker update logic here to avoid stale closure
        const pinRef = marcador.current;
        const mapaRef = mapa.current;
        if (pinRef && mapaRef && localizacaoInicial) {
          pinRef
            .setLatLng([
              localizacaoInicial.latitude,
              localizacaoInicial.longitude,
            ])
            .setOpacity(1);
          pinRef.dragging?.enable();
          if (
            !mapaRef
              .getBounds()
              .contains([
                localizacaoInicial.latitude,
                localizacaoInicial.longitude,
              ])
          ) {
            mapaRef.setView(
              [localizacaoInicial.latitude, localizacaoInicial.longitude],
              16,
              { animate: false },
            );
          }
        }
        // Signal that map and marker are ready
        setMapaPronta(true);
        observador = new ResizeObserver(() => {
          if (
            !cancelado &&
            elemento.current?.clientWidth &&
            elemento.current.clientHeight
          )
            instancia?.invalidateSize({ animate: false });
        });
        observador.observe(elemento.current);
        setEstado('pronto');
      })
      .catch(() => {
        instancia?.remove();
        mapa.current = null;
        marcador.current = null;
        if (!cancelado) setEstado('erro');
      });
    return () => {
      cancelado = true;
      observador?.disconnect();
      instancia?.remove();
      mapa.current = null;
      marcador.current = null;
      setMapaPronta(false);
    };
  }, [tentativa]);

  // Separate effect for updating marker when localizacao changes
  // Depends on mapaPronta to ensure map is ready before updating marker
  useEffect(() => {
    if (!mapaPronta) return;
    const pinRef = marcador.current;
    const mapaRef = mapa.current;
    if (!pinRef || !mapaRef) return;
    if (!localizacao) {
      pinRef.setOpacity(0);
      pinRef.dragging?.disable();
      return;
    }
    pinRef
      .setLatLng([localizacao.latitude, localizacao.longitude])
      .setOpacity(1);
    pinRef.dragging?.enable();
    if (
      !mapaRef
        .getBounds()
        .contains([localizacao.latitude, localizacao.longitude])
    ) {
      mapaRef.setView(
        [localizacao.latitude, localizacao.longitude],
        16,
        { animate: false },
      );
    }
  }, [localizacao, mapaPronta]);

  return (
    <div className="seletor-localizacao">
      <div
        ref={elemento}
        className="mapa-selecao"
        role="region"
        aria-label="Mapa para localizar a residência"
      />
      {estado === 'carregando' && <p role="status">Preparando o mapa…</p>}
      {estado === 'erro' && (
        <p role="alert" className="erro-campo">
          Não foi possível iniciar o mapa.{' '}
          <button type="button" onClick={() => setTentativa((n) => n + 1)}>
            Tentar novamente
          </button>{' '}
          Você também pode informar as coordenadas.
        </p>
      )}
      <button
        type="button"
        disabled={estado !== 'pronto'}
        onClick={() => {
          const centro = mapa.current?.getCenter();
          if (centro)
            selecionar.current({
              latitude: Number(centro.lat.toFixed(7)),
              longitude: Number(centro.lng.toFixed(7)),
              origem: 'mapa',
            });
        }}
      >
        Usar o centro do mapa
      </button>
      <p>
        Clique na residência ou mova o mapa com as setas e use o botão acima.
        Para aproximar, use + e − ou o gesto de pinça.
      </p>
    </div>
  );
}