import { describe, it, expect, vi } from 'vitest';
import {
  DEFAULT_MOBILE_CONFIG,
  DESKTOP_CONFIG,
  getDeviceConfig,
  isMobileDevice,
  isTabletDevice,
  detectTouchGesture,
  setupPowerEfficientRendering,
  getResponsiveUIScale,
} from './mobileOptimization';

describe('Mobile Optimization (M12-T06)', () => {
  describe('DEFAULT_MOBILE_CONFIG', () => {
    it('has reduced texture resolution', () => {
      expect(DEFAULT_MOBILE_CONFIG.textureResolutionScale).toBeLessThan(1.0);
    });

    it('has smaller shadow maps', () => {
      expect(DEFAULT_MOBILE_CONFIG.shadowMapSize).toBeLessThan(DESKTOP_CONFIG.shadowMapSize);
    });

    it('has simplified shaders enabled', () => {
      expect(DEFAULT_MOBILE_CONFIG.simplifiedShaders).toBe(true);
    });

    it('has power-efficient mode enabled', () => {
      expect(DEFAULT_MOBILE_CONFIG.powerEfficient).toBe(true);
    });

    it('has larger UI scale for touch', () => {
      expect(DEFAULT_MOBILE_CONFIG.uiScale).toBeGreaterThan(DESKTOP_CONFIG.uiScale);
    });

    it('has reduced particle count', () => {
      expect(DEFAULT_MOBILE_CONFIG.maxParticles).toBeLessThan(DESKTOP_CONFIG.maxParticles);
    });
  });

  describe('DESKTOP_CONFIG', () => {
    it('has full texture resolution', () => {
      expect(DESKTOP_CONFIG.textureResolutionScale).toBe(1.0);
    });

    it('has full shadow maps', () => {
      expect(DESKTOP_CONFIG.shadowMapSize).toBeGreaterThanOrEqual(1024);
    });

    it('has simplified shaders disabled', () => {
      expect(DESKTOP_CONFIG.simplifiedShaders).toBe(false);
    });
  });

  describe('getDeviceConfig', () => {
    it('returns a valid config', () => {
      const config = getDeviceConfig();
      expect(config.textureResolutionScale).toBeGreaterThan(0);
      expect(config.shadowMapSize).toBeGreaterThan(0);
    });
  });

  describe('isMobileDevice / isTabletDevice', () => {
    it('returns a boolean', () => {
      expect(typeof isMobileDevice()).toBe('boolean');
      expect(typeof isTabletDevice()).toBe('boolean');
    });
  });

  describe('detectTouchGesture', () => {
    it('returns null for no touches', () => {
      expect(detectTouchGesture([], null, 0)).toBeNull();
    });

    it('returns null for start of touch (no previous)', () => {
      const touches = [{ x: 100, y: 100 }];
      expect(detectTouchGesture(touches, null, 0)).toBeNull();
    });

    it('detects tap (minimal movement, short duration)', () => {
      const touches = [{ x: 100, y: 100 }];
      const prev = [{ x: 101, y: 101 }];
      expect(detectTouchGesture(touches, prev, 100)).toBe('tap');
    });

    it('detects long-press (no movement, long duration)', () => {
      const touches = [{ x: 100, y: 100 }];
      const prev = [{ x: 100, y: 100 }];
      expect(detectTouchGesture(touches, prev, 600)).toBe('long-press');
    });

    it('detects pan (movement, short duration)', () => {
      const touches = [{ x: 130, y: 110 }];
      const prev = [{ x: 100, y: 100 }];
      expect(detectTouchGesture(touches, prev, 100)).toBe('pan');
    });

    it('detects swipe (large horizontal movement)', () => {
      const touches = [{ x: 300, y: 100 }];
      const prev = [{ x: 100, y: 100 }];
      expect(detectTouchGesture(touches, prev, 100)).toBe('swipe');
    });

    it('detects pinch (two-finger distance change)', () => {
      const touches = [
        { x: 100, y: 100 },
        { x: 300, y: 100 },
      ];
      const prev = [
        { x: 150, y: 100 },
        { x: 250, y: 100 },
      ];
      expect(detectTouchGesture(touches, prev, 100)).toBe('pinch');
    });
  });

  describe('setupPowerEfficientRendering', () => {
    const noop = () => undefined;

    it('sets up visibility change listener', () => {
      const addSpy = vi.spyOn(document, 'addEventListener');
      const cleanup = setupPowerEfficientRendering(noop, noop);
      expect(addSpy).toHaveBeenCalledWith('visibilitychange', expect.any(Function));
      cleanup();
      addSpy.mockRestore();
    });

    it('calls onPause when hidden', () => {
      let paused = false;
      const cleanup = setupPowerEfficientRendering(() => {
        paused = true;
      }, noop);
      // Simulate visibility change
      Object.defineProperty(document, 'hidden', {
        value: true,
        configurable: true,
        writable: true,
      });
      document.dispatchEvent(new Event('visibilitychange'));
      expect(paused).toBe(true);
      cleanup();
    });
  });

  describe('getResponsiveUIScale', () => {
    it('returns 1.0 or greater', () => {
      const scale = getResponsiveUIScale();
      expect(scale).toBeGreaterThanOrEqual(1.0);
    });
  });
});
