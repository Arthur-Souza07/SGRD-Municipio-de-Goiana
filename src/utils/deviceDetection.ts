/**
 * Device detection utilities for differentiating between mobile, tablet, and desktop.
 * Uses userAgent + feature detection (touch, screen width, hover) without external libraries.
 */

export type DeviceType = 'mobile' | 'tablet' | 'desktop';

/**
 * Breakpoints for device classification (in pixels)
 */
export const BREAKPOINTS = {
  mobile: 768,
  tablet: 1024,
} as const;

/**
 * Checks if the device has hover capability (mouse/trackpad).
 * Desktop devices with touchscreens (Surface, etc.) typically have hover.
 * Mobile/tablet devices typically don't have hover.
 */
function hasHoverCapability(): boolean {
  if (typeof window === 'undefined' || typeof matchMedia === 'undefined') {
    return true; // Assume desktop on SSR
  }
  return window.matchMedia('(hover: hover) and (pointer: fine)').matches;
}

/**
 * Checks if the userAgent indicates a Windows touch device (Surface, etc.).
 * These are desktop-class devices that happen to have touchscreens.
 */
function isWindowsTouchDevice(): boolean {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent;
  // Windows NT with touch support indicators
  return /Windows NT/.test(ua) && /Touch/.test(ua);
}

/**
 * Detects device type based on screen width, touch support, and hover capability.
 * Desktop with touchscreen (Surface, etc.) is classified as desktop by width + hover.
 *
 * @param width - Screen width in pixels (defaults to window.innerWidth)
 * @param hasTouch - Whether touch is supported (defaults to navigator.maxTouchPoints > 0)
 * @returns Device type: 'mobile', 'tablet', or 'desktop'
 */
export function detectDeviceType(
  width: number = typeof window !== 'undefined' ? window.innerWidth : 1024,
  hasTouch: boolean = typeof navigator !== 'undefined' ? navigator.maxTouchPoints > 0 : false
): DeviceType {
  // Width >= tablet breakpoint -> always desktop (desktop-class device)
  if (width >= BREAKPOINTS.tablet) {
    return 'desktop';
  }

  // Width < mobile breakpoint -> mobile (if touch) or desktop (unlikely but possible)
  if (width < BREAKPOINTS.mobile) {
    return hasTouch ? 'mobile' : 'desktop';
  }

  // Width in [mobile, tablet) range (768px - 1023px)
  // This is the tablet width range. Need to distinguish:
  // - True tablets: touch + no hover
  // - Desktop with touch (Surface, etc.): touch + hover
  // - Desktop without touch: no touch (already caught above as desktop)

  if (hasTouch) {
    // Check for hover capability or Windows touch device
    // If has hover OR is Windows touch device -> desktop
    // Otherwise -> tablet
    if (hasHoverCapability() || isWindowsTouchDevice()) {
      return 'desktop';
    }
    return 'tablet';
  }

  // No touch in tablet width range -> desktop
  return 'desktop';
}

/**
 * Checks if the current device is mobile or tablet (touch-based).
 * Useful for conditional rendering of touch-specific UI.
 */
export function isTouchDevice(
  width: number = typeof window !== 'undefined' ? window.innerWidth : 1024,
  hasTouch: boolean = typeof navigator !== 'undefined' ? navigator.maxTouchPoints > 0 : false
): boolean {
  const type = detectDeviceType(width, hasTouch);
  return type === 'mobile' || type === 'tablet';
}

/**
 * Gets a human-readable label for the device type.
 */
export function getDeviceLabel(type: DeviceType): string {
  switch (type) {
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