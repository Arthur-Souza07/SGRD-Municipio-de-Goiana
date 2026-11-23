import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import type * as Leaflet from 'leaflet';
import {
  prepararPontosCalor,
  type PontoCalor,
} from '@/features/mapa/lib/calor';
import type { CamadaCalor } from '@/features/mapa/lib/camada-calor';
import type { PontoRisco } from '@/features/mapa/lib/familias';

export interface EstadoCalor {
  fase: 'desligado' | 'carregando' | 'ativo' | 'vazio' | 'erro';
  quantidade: number;
}

interface Props {
  mapa: Leaflet.Map | null;
  pontos: readonly PontoRisco[];
  ativo: boolean;
}

/** Densidade em um canvas reutilizado, sem um nó DOM por família.
 *  Computação pesada offloaded para Web Worker (dentro da camada Leaflet). */
export function useCamadaCalor({ mapa, pontos, ativo }: Props) {
  // Alternar a camada e mover o mapa não refazem a conversão das coordenadas.
  const dados = useMemo(() => prepararPontosCalor(pontos), [pontos]);
  const camadaRef = useRef<CamadaCalor | null>(null);
  const aplicadosRef = useRef<PontoCalor[] | null>(null);
  const [fase, setFase] = useState<EstadoCalor['fase']>('desligado');
  const erroRef = useRef(() => {});
  erroRef.current = () => setFase('erro');
  const [tentativa, setTentativa] = useState(0);

  // Memoiza a função de atualização para evitar re-renders desnecessários
  const atualizarDadosCamada = useCallback((novosDados: PontoCalor[]) => {
    const camada = camadaRef.current;
    if (camada && aplicadosRef.current !== novosDados) {
      camada.setLatLngs(novosDados);
      aplicadosRef.current = novosDados;
    }
  }, []);

  // Cleanup quando o mapa muda
  useEffect(
    () => () => {
      camadaRef.current?.remove();
      camadaRef.current = null;
      aplicadosRef.current = null;
    },
    [mapa],
  );

  // Efeito principal: gerencia criação, atualização de dados e anexação/remoção da camada
  useEffect(() => {
    let cancelado = false;
    let quadro: number | undefined;
    let segundoQuadro: number | undefined;
    let remocao: ReturnType<typeof setTimeout> | undefined;

    const canvas = () => camadaRef.current?.getElement();

    if (!ativo || !mapa) {
      setFase('desligado');
      const camada = camadaRef.current;
      const elemento = canvas();
      if (elemento) elemento.style.opacity = '0';
      if (
        window.matchMedia('(prefers-reduced-motion: reduce)').matches ||
        !elemento
      )
        camada?.remove();
      else remocao = setTimeout(() => camada?.remove(), 220);
      return () => {
        if (remocao) clearTimeout(remocao);
      };
    }

    const mapaAtual = mapa;
    setFase('carregando');

    async function mostrar() {
      const L = (await import('leaflet')).default;
      const { criarCamadaCalor } = await import('@/features/mapa/lib/camada-calor');
      if (cancelado) return;

      // Cria a camada se não existir, usando os dados atuais
      if (!camadaRef.current) {
        camadaRef.current = criarCamadaCalor(L, dados, () => erroRef.current());
        aplicadosRef.current = dados;
      }

      const camada = camadaRef.current;

      // Reanexa a mesma instância antes de redesenhar os dados atualizados.
      const estavaVisivel = mapaAtual.hasLayer(camada);
      if (!estavaVisivel) camada.addTo(mapaAtual);

      // Atualiza os dados da camada se mudaram (usa callback memoizado)
      atualizarDadosCamada(dados);

      // A descrição textual fica na legenda; os marcadores continuam acessíveis.
      const elemento = canvas();
      if (elemento) {
        elemento.setAttribute('aria-hidden', 'true');
        if (!estavaVisivel) elemento.style.opacity = '0';
        quadro = requestAnimationFrame(() => {
          segundoQuadro = requestAnimationFrame(() => {
            if (!cancelado) elemento.style.opacity = '1';
          });
        });
      }
      setFase(dados.length ? 'ativo' : 'vazio');
    }

    mostrar().catch(() => {
      if (!cancelado) {
        camadaRef.current?.remove();
        setFase('erro');
      }
    });

    return () => {
      cancelado = true;
      if (quadro !== undefined) cancelAnimationFrame(quadro);
      if (segundoQuadro !== undefined) cancelAnimationFrame(segundoQuadro);
    };
  }, [ativo, mapa, dados, tentativa, atualizarDadosCamada]);

  const estado = useMemo<EstadoCalor>(
    () => ({ fase, quantidade: dados.length }),
    [fase, dados.length],
  );
  return { estado, tentarNovamente: () => setTentativa((n) => n + 1) };
}