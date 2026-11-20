import { useEffect, useState, useCallback, useSyncExternalStore } from 'react';
import type { DeviceType } from '../utils/deviceDetection';
import { detectDeviceType } from '../utils/deviceDetection';

/**
 * Hook for reactive device type detection.
 * Updates on resize and orientation change.
 * SSR-safe: uses useSyncExternalStore to avoid hydration mismatch.
 * Returns null on server, actual device type on client.
 */
export function useDeviceType(): DeviceType | null {
  const [mounted, setMounted] = useState(false);

  // Subscribe to device type changes
  const subscribe = useCallback((callback: () => void) => {
    if (typeof window === 'undefined') return () => {};

    const updateDeviceType = () => callback();

    window.addEventListener('resize', updateDeviceType);
    window.addEventListener('orientationchange', updateDeviceType);

    return () => {
      window.removeEventListener('resize', updateDeviceType);
      window.removeEventListener('orientationchange', updateDeviceType);
    };
  }, []);

  // Get snapshot for client
  const getSnapshot = useCallback((): DeviceType => {
    return detectDeviceType();
  }, []);

  // Get snapshot for server (returns a stable default)
  const getServerSnapshot = useCallback((): DeviceType => {
    return 'desktop';
  }, []);

  // Use useSyncExternalStore for SSR-safe hydration
  const deviceType = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  // Track mount state to return null during SSR
  useEffect(() => {
    setMounted(true);
  }, []);

  // Return null during SSR to avoid hydration mismatch
  if (!mounted) {
    return null;
  }

  return deviceType;
}

/**
 * Hook that returns true for mobile/tablet (touch devices).
 * Useful for conditional touch-specific features.
 */
export function useIsTouchDevice(): boolean {
  const deviceType = useDeviceType();
  return deviceType === 'mobile' || deviceType === 'tablet';
}

/**
 * Hook for getting device label (human-readable).
 */
export function useDeviceLabel(): string {
  const deviceType = useDeviceType();
  switch (deviceType) {
    case 'mobile':
      return 'Celular';
    case 'tablet':
      return 'Tablet';
    case 'desktop':
      return 'Desktop';
    default:
      return 'Desconhecido';
  }
}