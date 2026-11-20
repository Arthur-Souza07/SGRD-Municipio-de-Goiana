import { useEffect, useState, useRef, useCallback } from 'react';
import {
  carregarEstacoes,
  type EstacaoAmbiental,
  type TipoEstacao,
} from '@/features/mapa/lib/ambiente';

interface CacheEntry {
  promise: Promise<EstacaoAmbiental[]> | null;
  abortController: AbortController | null;
  subscriberCount: number;
  lastAccessed: number;
  cacheKey: string;
}

const MAX_CACHE_SIZE = 20;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes
const CLEANUP_INTERVAL_MS = 60 * 1000; // 1 minute

const cache = new Map<string, CacheEntry>();
let cleanupInterval: ReturnType<typeof setInterval> | null = null;
let globalSubscriberCount = 0;

function ensureCleanupInterval() {
  if (cleanupInterval === null) {
    cleanupInterval = setInterval(() => {
      const now = Date.now();
      for (const [key, entry] of cache.entries()) {
        const isExpired = now - entry.lastAccessed > CACHE_TTL_MS;
        const hasNoSubscribers = entry.subscriberCount === 0;

        if (hasNoSubscribers && (isExpired || cache.size > MAX_CACHE_SIZE)) {
          if (entry.abortController) {
            entry.abortController.abort();
          }
          cache.delete(key);
        }
      }

      // If still over max size, evict LRU entries with no subscribers
      if (cache.size > MAX_CACHE_SIZE) {
        const entries = Array.from(cache.entries())
          .filter(([, entry]) => entry.subscriberCount === 0)
          .sort((a, b) => a[1].lastAccessed - b[1].lastAccessed);

        const toEvict = entries.slice(0, cache.size - MAX_CACHE_SIZE);
        for (const [key, entry] of toEvict) {
          if (entry.abortController) {
            entry.abortController.abort();
          }
          cache.delete(key);
        }
      }
    }, CLEANUP_INTERVAL_MS);
  }
}

function trackGlobalSubscriber(delta: number) {
  globalSubscriberCount += delta;
  if (globalSubscriberCount === 0 && cleanupInterval !== null) {
    clearInterval(cleanupInterval);
    cleanupInterval = null;
  }
}

function getOrCreateCacheEntry(cacheKey: string): CacheEntry {
  let entry = cache.get(cacheKey);
  if (!entry) {
    entry = {
      promise: null,
      abortController: null,
      subscriberCount: 0,
      lastAccessed: Date.now(),
      cacheKey,
    };
    cache.set(cacheKey, entry);
  }
  return entry;
}

export function useDadosAmbientais(
  tipo: TipoEstacao,
  ativo: boolean,
  revisao: number,
) {
  const [estacoes, setEstacoes] = useState<EstacaoAmbiental[]>([]);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState('');
  const cacheKeyRef = useRef<string | null>(null);
  const entryRef = useRef<CacheEntry | null>(null);

  const cleanup = useCallback(() => {
    const entry = entryRef.current;
    if (entry) {
      entry.subscriberCount--;
      if (entry.subscriberCount === 0) {
        entry.lastAccessed = Date.now();
        // Don't abort immediately - let cleanup interval handle it
        // This allows quick re-subscription without re-fetching
      }
      entryRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (!ativo) {
      setCarregando(false);
      setErro('');
      cleanup();
      return;
    }

    ensureCleanupInterval();
    trackGlobalSubscriber(1);

    const cacheKey = `${tipo}:${revisao}`;
    cacheKeyRef.current = cacheKey;

    const entry = getOrCreateCacheEntry(cacheKey);
    entryRef.current = entry;
    entry.subscriberCount++;
    entry.lastAccessed = Date.now();

    let cancelado = false;
    // Per-subscriber timeout: only affects THIS subscriber's state, not the shared fetch
    const timeout = setTimeout(() => {
      if (!cancelado && cacheKeyRef.current === cacheKey) {
        setCarregando(false);
        setErro('Tempo de consulta esgotado. Tente novamente.');
      }
    }, 15000);

    setCarregando(true);
    setErro('');

    // Create new AbortController if this is the first subscriber or previous was aborted
    if (entry.subscriberCount === 1 || !entry.abortController || entry.promise === null) {
      entry.abortController = new AbortController();
      entry.promise = carregarEstacoes(tipo, entry.abortController.signal)
        .then((dados) => {
          if (!cancelado && cacheKeyRef.current === cacheKey) {
            setEstacoes(dados);
          }
          return dados;
        })
        .catch((e) => {
          if (!cancelado && cacheKeyRef.current === cacheKey) {
            setEstacoes([]);
            setErro(
              'Não foi possível consultar a APAC. A camada não será exibida até uma nova consulta.',
            );
          }
          throw e;
        })
        .finally(() => {
          if (!cancelado && cacheKeyRef.current === cacheKey) {
            setCarregando(false);
          }
        });
    } else {
      // Reuse existing promise for subsequent subscribers
      entry.promise
        .then((dados) => {
          if (!cancelado && cacheKeyRef.current === cacheKey) {
            setEstacoes(dados);
          }
        })
        .catch(() => {
          if (!cancelado && cacheKeyRef.current === cacheKey) {
            setEstacoes([]);
            setErro(
              'Não foi possível consultar a APAC. A camada não será exibida até uma nova consulta.',
            );
          }
        })
        .finally(() => {
          if (!cancelado && cacheKeyRef.current === cacheKey) {
            setCarregando(false);
          }
        });
    }

    return () => {
      cancelado = true;
      clearTimeout(timeout);
      trackGlobalSubscriber(-1);
      cleanup();
    };
  }, [ativo, tipo, revisao, cleanup]);

  return { estacoes, carregando, erro };
}