import { useState, useCallback, useEffect } from 'react';

export type GeolocationState = {
  latitude: number | null;
  longitude: number | null;
  accuracy: number | null;
  error: GeolocationErrorType | null;
  loading: boolean;
};

export type GeolocationErrorType =
  | 'PERMISSION_DENIED'
  | 'POSITION_UNAVAILABLE'
  | 'TIMEOUT'
  | 'NOT_SUPPORTED'
  | 'UNKNOWN';

export type GeolocationOptions = {
  enableHighAccuracy?: boolean;
  timeout?: number;
  maximumAge?: number;
};

const DEFAULT_OPTIONS: GeolocationOptions = {
  enableHighAccuracy: import.meta.env.VITE_GPS_HIGH_ACCURACY === 'true',
  timeout: Number(import.meta.env.VITE_GPS_TIMEOUT) || 10000,
  maximumAge: Number(import.meta.env.VITE_GPS_MAX_AGE) || 300000,
};

/**
 * Hook for capturing GPS location with proper error handling.
 * Uses Geolocation API with configurable options.
 */
export function useGeolocation(options: GeolocationOptions = {}) {
  const mergedOptions = { ...DEFAULT_OPTIONS, ...options };

  const [state, setState] = useState<GeolocationState>({
    latitude: null,
    longitude: null,
    accuracy: null,
    error: null,
    loading: false,
  });

  const [watchId, setWatchId] = useState<number | null>(null);

  const clearError = useCallback(() => {
    setState((prev) => ({ ...prev, error: null }));
  }, []);

  const getCurrentPosition = useCallback(() => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setState((prev) => ({ ...prev, error: 'NOT_SUPPORTED', loading: false }));
      return;
    }

    setState((prev) => ({ ...prev, loading: true, error: null }));

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setState({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          error: null,
          loading: false,
        });
      },
      (error) => {
        let errorType: GeolocationErrorType;
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorType = 'PERMISSION_DENIED';
            break;
          case error.POSITION_UNAVAILABLE:
            errorType = 'POSITION_UNAVAILABLE';
            break;
          case error.TIMEOUT:
            errorType = 'TIMEOUT';
            break;
          default:
            errorType = 'UNKNOWN';
        }
        setState((prev) => ({ ...prev, error: errorType, loading: false }));
      },
      mergedOptions
    );
  }, [mergedOptions]);

  const watchPosition = useCallback(() => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setState((prev) => ({ ...prev, error: 'NOT_SUPPORTED' }));
      return;
    }

    setState((prev) => ({ ...prev, loading: true, error: null }));

    const id = navigator.geolocation.watchPosition(
      (position) => {
        setState({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          error: null,
          loading: false,
        });
      },
      (error) => {
        let errorType: GeolocationErrorType;
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorType = 'PERMISSION_DENIED';
            break;
          case error.POSITION_UNAVAILABLE:
            errorType = 'POSITION_UNAVAILABLE';
            break;
          case error.TIMEOUT:
            errorType = 'TIMEOUT';
            break;
          default:
            errorType = 'UNKNOWN';
        }
        setState((prev) => ({ ...prev, error: errorType, loading: false }));
      },
      mergedOptions
    );

    setWatchId(id);
  }, [mergedOptions]);

  const clearWatch = useCallback(() => {
    if (watchId !== null && typeof navigator !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.clearWatch(watchId);
      setWatchId(null);
    }
  }, [watchId]);

  const reset = useCallback(() => {
    clearWatch();
    setState({
      latitude: null,
      longitude: null,
      accuracy: null,
      error: null,
      loading: false,
    });
  }, [clearWatch]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (watchId !== null && typeof navigator !== 'undefined' && navigator.geolocation) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, [watchId]);

  const errorMessages: Record<GeolocationErrorType, string> = {
    PERMISSION_DENIED: 'Permissão de localização negada. Ative nas configurações do navegador.',
    POSITION_UNAVAILABLE: 'Localização indisponível. Tente novamente em local aberto.',
    TIMEOUT: 'Tempo esgotado ao obter localização. Verifique o GPS e tente novamente.',
    NOT_SUPPORTED: 'Geolocalização não suportada neste navegador.',
    UNKNOWN: 'Erro desconhecido ao obter localização.',
  };

  return {
    ...state,
    getCurrentPosition,
    watchPosition,
    clearWatch,
    reset,
    clearError,
    errorMessage: state.error ? errorMessages[state.error] : null,
    hasLocation: state.latitude !== null && state.longitude !== null,
  };
}