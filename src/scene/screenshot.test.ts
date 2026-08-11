import { describe, it, expect, vi } from 'vitest';
import * as THREE from 'three';
import {
  buildOrthographicCamera,
  formatLength,
  getCitationText,
  getNorthAngle,
  getScaleBarMetrics,
  getWorldHeightAtTarget,
  drawScreenshotOverlays,
  DEFAULT_SCREENSHOT_OPTIONS,
} from './screenshot';

describe('screenshot helpers', () => {
  describe('formatLength', () => {
    it('formats kilometers, meters, centimeters, and millimeters', () => {
      expect(formatLength(2500)).toBe('2.5 km');
      expect(formatLength(1000)).toBe('1 km');
      expect(formatLength(20)).toBe('20 m');
      expect(formatLength(0.5)).toBe('50 cm');
      expect(formatLength(0.005)).toBe('5 mm');
    });
  });

  describe('getScaleBarMetrics', () => {
    it('returns a nice round scale bar for 1 m/px', () => {
      const bar = getScaleBarMetrics(1);
      expect(bar).not.toBeNull();
      expect(bar!.meters).toBe(100);
      expect(bar!.widthPx).toBeCloseTo(100);
      expect(bar!.label).toBe('100 m');
    });

    it('returns a smaller nice scale bar for 0.1 m/px', () => {
      const bar = getScaleBarMetrics(0.1);
      expect(bar).not.toBeNull();
      expect(bar!.meters).toBe(10);
      expect(bar!.widthPx).toBeCloseTo(100);
    });

    it('returns null for invalid meters per pixel', () => {
      expect(getScaleBarMetrics(0)).toBeNull();
      expect(getScaleBarMetrics(-1)).toBeNull();
      expect(getScaleBarMetrics(Number.NaN)).toBeNull();
    });
  });

  describe('getWorldHeightAtTarget', () => {
    it('computes world height for a perspective camera', () => {
      const camera = new THREE.PerspectiveCamera(55, 1, 0.1, 1000);
      camera.position.set(0, 10, 0);
      camera.lookAt(0, 0, 0);
      camera.updateMatrixWorld();

      const target = new THREE.Vector3(0, 0, 0);
      const height = getWorldHeightAtTarget(camera, target, 100);

      // 2 * 10 * tan(55/2 deg) ≈ 10.35
      expect(height).toBeGreaterThan(10);
      expect(height).toBeLessThan(11);
    });

    it('uses the orthographic frustum height for an orthographic camera', () => {
      const ortho = new THREE.OrthographicCamera(-10, 10, 5, -5, 0.1, 1000);
      const target = new THREE.Vector3(0, 0, 0);
      expect(getWorldHeightAtTarget(ortho, target, 100)).toBe(10);
    });
  });

  describe('buildOrthographicCamera', () => {
    it('creates an orthographic camera matching the perspective frustum', () => {
      const perspective = new THREE.PerspectiveCamera(55, 800 / 600, 0.1, 1000);
      perspective.position.set(0, 10, 0);
      perspective.lookAt(0, 0, 0);
      perspective.updateMatrixWorld();

      const target = new THREE.Vector3(0, 0, 0);
      const ortho = buildOrthographicCamera(perspective, target, 800, 600);

      expect(ortho.isOrthographicCamera).toBe(true);
      expect(ortho.top - ortho.bottom).toBeCloseTo(
        2 * 10 * Math.tan(THREE.MathUtils.degToRad(55) / 2),
        1,
      );
      expect(ortho.left).toBeLessThan(0);
      expect(ortho.right).toBeGreaterThan(0);
      expect(ortho.left).toBe(-ortho.right);
    });
  });

  describe('getNorthAngle', () => {
    it('returns 0 when screen right points North (camera East of target)', () => {
      const camera = new THREE.PerspectiveCamera(55, 1, 0.1, 1000);
      camera.position.set(10, 0, 0);
      camera.lookAt(0, 0, 0);
      camera.updateMatrixWorld();
      expect(getNorthAngle(camera)).toBeCloseTo(0, 5);
    });

    it('returns π when screen left points North (camera West of target)', () => {
      const camera = new THREE.PerspectiveCamera(55, 1, 0.1, 1000);
      camera.position.set(-10, 0, 0);
      camera.lookAt(0, 0, 0);
      camera.updateMatrixWorld();
      expect(Math.abs(getNorthAngle(camera))).toBeCloseTo(Math.PI, 5);
    });

    it('returns -π/2 when screen up points North (top-down camera)', () => {
      const camera = new THREE.PerspectiveCamera(55, 1, 0.1, 1000);
      camera.position.set(0, 10, 0);
      camera.lookAt(0, 0, 0);
      camera.updateMatrixWorld();
      expect(getNorthAngle(camera)).toBeCloseTo(-Math.PI / 2, 5);
    });
  });

  describe('getCitationText', () => {
    it('includes version and monument when no selections are made', () => {
      const text = getCitationText('great-pyramid', null, null, '0.1.0');
      expect(text).toContain('GIZA v0.1.0');
      expect(text).toContain('great pyramid');
    });
  });

  describe('drawScreenshotOverlays', () => {
    it('draws scale bar, north arrow, and citation when options are enabled', () => {
      const ctx = createMockContext();

      drawScreenshotOverlays(
        ctx as unknown as CanvasRenderingContext2D,
        800,
        600,
        DEFAULT_SCREENSHOT_OPTIONS,
        {
          scaleBar: { widthPx: 100, label: '100 m', meters: 100 },
          northAngle: 0,
          citation: 'GIZA v0.1.0 | Great Pyramid',
        },
      );

      expect(ctx.fillText).toHaveBeenCalledWith('100 m', expect.any(Number), expect.any(Number));
      expect(ctx.fillText).toHaveBeenCalledWith('N', expect.any(Number), expect.any(Number));
      expect(ctx.fillText).toHaveBeenCalledWith(
        'GIZA v0.1.0 | Great Pyramid',
        expect.any(Number),
        expect.any(Number),
      );
    });

    it('skips overlays disabled in options', () => {
      const ctx = createMockContext();

      drawScreenshotOverlays(
        ctx as unknown as CanvasRenderingContext2D,
        800,
        600,
        {
          ...DEFAULT_SCREENSHOT_OPTIONS,
          scaleBar: false,
          northArrow: false,
          citationWatermark: false,
        },
        {
          scaleBar: { widthPx: 100, label: '100 m', meters: 100 },
          northAngle: 0,
          citation: 'GIZA v0.1.0 | Great Pyramid',
        },
      );

      expect(ctx.fillText).not.toHaveBeenCalled();
    });
  });
});

function createMockContext() {
  return {
    save: vi.fn(),
    restore: vi.fn(),
    beginPath: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    stroke: vi.fn(),
    fillText: vi.fn(),
    translate: vi.fn(),
    rotate: vi.fn(),
    measureText: vi.fn(() => ({ width: 50 })),
  };
}
