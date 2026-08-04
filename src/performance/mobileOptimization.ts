/**
 * Mobile performance optimization per M12-T06.
 *
 * Mobile-specific optimizations:
 *   1. Touch controls (pinch-zoom, pan, tap)
 *   2. Reduced texture resolution
 *   3. Simplified shaders
 *   4. Lower shadow map resolution
 *   5. Aggressive frustum culling
 *   6. Power-efficient rendering (pause when backgrounded)
 *   7. Responsive UI scaling
 */

export interface MobileConfig {
  /** Texture resolution scale (0.25 - 1.0) */
  textureResolutionScale: number;
  /** Shadow map size (256, 512, 1024) */
  shadowMapSize: number;
  /** Enable simplified shaders */
  simplifiedShaders: boolean;
  /** Pixel ratio cap */
  pixelRatioCap: number;
  /** Enable power-efficient mode (pauses when backgrounded) */
  powerEfficient: boolean;
  /** Touch sensitivity */
  touchSensitivity: number;
  /** UI scale factor */
  uiScale: number;
  /** Max concurrent particles */
  maxParticles: number;
}

export const DEFAULT_MOBILE_CONFIG: MobileConfig = {
  textureResolutionScale: 0.5,
  shadowMapSize: 512,
  simplifiedShaders: true,
  pixelRatioCap: 2,
  powerEfficient: true,
  touchSensitivity: 1.0,
  uiScale: 1.2,
  maxParticles: 50,
};

export const DESKTOP_CONFIG: MobileConfig = {
  textureResolutionScale: 1.0,
  shadowMapSize: 2048,
  simplifiedShaders: false,
  pixelRatioCap: 2,
  powerEfficient: false,
  touchSensitivity: 1.0,
  uiScale: 1.0,
  maxParticles: 500,
};

// ─── Mobile detection ──────────────────────────────────────────────────────

export function isMobileDevice(): boolean {
  if (typeof navigator === 'undefined') return false;
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

export function isTabletDevice(): boolean {
  if (typeof navigator === 'undefined') return false;
  return /iPad|Android(?!.*Mobile)/i.test(navigator.userAgent);
}

/**
 * Returns the appropriate config based on device type.
 */
export function getDeviceConfig(): MobileConfig {
  if (isTabletDevice()) {
    return { ...DEFAULT_MOBILE_CONFIG, textureResolutionScale: 0.75, shadowMapSize: 1024 };
  }
  if (isMobileDevice()) {
    return DEFAULT_MOBILE_CONFIG;
  }
  return DESKTOP_CONFIG;
}

// ─── Touch gesture detection ───────────────────────────────────────────────

export type TouchGesture = 'tap' | 'double-tap' | 'long-press' | 'pinch' | 'pan' | 'swipe';

export interface TouchGestureEvent {
  type: TouchGesture;
  position: { x: number; y: number };
  scale?: number;
  delta?: { x: number; y: number };
}

/**
 * Detects touch gestures from touch events.
 * Returns the detected gesture type and relevant data.
 */
export function detectTouchGesture(
  touches: { x: number; y: number }[],
  previousTouches: { x: number; y: number }[] | null,
  duration: number,
): TouchGesture | null {
  if (touches.length === 0) return null;

  // Single touch
  if (touches.length === 1) {
    if (previousTouches === null) return null; // start of touch

    if (duration > 500) return 'long-press';

    const dx = touches[0].x - previousTouches[0].x;
    const dy = touches[0].y - previousTouches[0].y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance < 5) return 'tap';
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) return 'swipe';
    return 'pan';
  }

  // Two touches (pinch)
  if (touches.length === 2 && previousTouches && previousTouches.length === 2) {
    const currentDist = Math.sqrt(
      Math.pow(touches[0].x - touches[1].x, 2) + Math.pow(touches[0].y - touches[1].y, 2),
    );
    const prevDist = Math.sqrt(
      Math.pow(previousTouches[0].x - previousTouches[1].x, 2) +
        Math.pow(previousTouches[0].y - previousTouches[1].y, 2),
    );

    if (Math.abs(currentDist - prevDist) > 5) return 'pinch';
  }

  return null;
}

// ─── Power-efficient rendering ──────────────────────────────────────────────

/**
 * Pauses rendering when the page is in the background.
 * This saves battery on mobile devices.
 */
export function setupPowerEfficientRendering(
  onPause: () => void,
  onResume: () => void,
): () => void {
  const handleVisibility = () => {
    if (document.hidden) {
      onPause();
    } else {
      onResume();
    }
  };

  document.addEventListener('visibilitychange', handleVisibility);
  return () => {
    document.removeEventListener('visibilitychange', handleVisibility);
  };
}

// ─── Responsive UI scaling ─────────────────────────────────────────────────

/**
 * Returns a UI scale factor based on screen size.
 * Smaller screens get larger UI elements.
 */
export function getResponsiveUIScale(): number {
  if (typeof window === 'undefined') return 1.0;
  const width = window.innerWidth;
  if (width < 768) return 1.2; // phone
  if (width < 1024) return 1.1; // tablet
  return 1.0; // desktop
}
