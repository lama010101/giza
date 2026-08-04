import { describe, it, expect } from 'vitest';
import {
  DEFAULT_ENVIRONMENTAL_CONFIG,
  getMoistureAtY,
  isSurfaceWet,
  getRoughnessModification,
  getAlbedoDarkening,
} from './environmentalRendering';

describe('Environmental Rendering (M09-T12, GIZA-03 §2.17)', () => {
  describe('DEFAULT_ENVIRONMENTAL_CONFIG', () => {
    it('has all 6 environmental effect configs', () => {
      expect(DEFAULT_ENVIRONMENTAL_CONFIG.moistureGradient).toBeDefined();
      expect(DEFAULT_ENVIRONMENTAL_CONFIG.mineralStaining).toBeDefined();
      expect(DEFAULT_ENVIRONMENTAL_CONFIG.calciteDeposits).toBeDefined();
      expect(DEFAULT_ENVIRONMENTAL_CONFIG.dustAccumulation).toBeDefined();
      expect(DEFAULT_ENVIRONMENTAL_CONFIG.airborneParticles).toBeDefined();
      expect(DEFAULT_ENVIRONMENTAL_CONFIG.dripping).toBeDefined();
    });

    it('all effects are enabled by default', () => {
      expect(DEFAULT_ENVIRONMENTAL_CONFIG.moistureGradient.enabled).toBe(true);
      expect(DEFAULT_ENVIRONMENTAL_CONFIG.mineralStaining.enabled).toBe(true);
      expect(DEFAULT_ENVIRONMENTAL_CONFIG.calciteDeposits.enabled).toBe(true);
      expect(DEFAULT_ENVIRONMENTAL_CONFIG.dustAccumulation.enabled).toBe(true);
      expect(DEFAULT_ENVIRONMENTAL_CONFIG.airborneParticles.enabled).toBe(true);
      expect(DEFAULT_ENVIRONMENTAL_CONFIG.dripping.enabled).toBe(true);
    });

    it('NO fantasy cave elements (scientifically grounded only)', () => {
      // No glowing crystals, magical effects, or fantasy elements
      const config = DEFAULT_ENVIRONMENTAL_CONFIG;
      expect(config.mineralStaining.color).not.toContain('glow');
      expect(config.calciteDeposits.color).toMatch(/^#[0-9a-f]+$/i);
    });
  });

  describe('getMoistureAtY', () => {
    it('returns surface humidity at surface level', () => {
      const moisture = getMoistureAtY(0, DEFAULT_ENVIRONMENTAL_CONFIG.moistureGradient);
      expect(moisture).toBeCloseTo(0.2, 1);
    });

    it('returns deep humidity at Level 3', () => {
      const moisture = getMoistureAtY(-30, DEFAULT_ENVIRONMENTAL_CONFIG.moistureGradient);
      expect(moisture).toBeCloseTo(0.85, 1);
    });

    it('moisture increases with depth', () => {
      const surface = getMoistureAtY(0, DEFAULT_ENVIRONMENTAL_CONFIG.moistureGradient);
      const mid = getMoistureAtY(-15, DEFAULT_ENVIRONMENTAL_CONFIG.moistureGradient);
      const deep = getMoistureAtY(-30, DEFAULT_ENVIRONMENTAL_CONFIG.moistureGradient);
      expect(deep).toBeGreaterThan(mid);
      expect(mid).toBeGreaterThan(surface);
    });

    it('returns 0 when disabled', () => {
      const moisture = getMoistureAtY(-30, {
        ...DEFAULT_ENVIRONMENTAL_CONFIG.moistureGradient,
        enabled: false,
      });
      expect(moisture).toBe(0);
    });
  });

  describe('isSurfaceWet', () => {
    it('returns false at surface (low humidity)', () => {
      expect(isSurfaceWet(0, DEFAULT_ENVIRONMENTAL_CONFIG.moistureGradient)).toBe(false);
    });

    it('returns true at Level 3 (high humidity)', () => {
      expect(isSurfaceWet(-30, DEFAULT_ENVIRONMENTAL_CONFIG.moistureGradient)).toBe(true);
    });
  });

  describe('getRoughnessModification', () => {
    it('does not modify roughness at surface (dry)', () => {
      const baseRoughness = 0.8;
      const modified = getRoughnessModification(
        0,
        baseRoughness,
        DEFAULT_ENVIRONMENTAL_CONFIG.moistureGradient,
      );
      expect(modified).toBe(baseRoughness);
    });

    it('reduces roughness at depth (wet)', () => {
      const baseRoughness = 0.8;
      const modified = getRoughnessModification(
        -30,
        baseRoughness,
        DEFAULT_ENVIRONMENTAL_CONFIG.moistureGradient,
      );
      expect(modified).toBeLessThan(baseRoughness);
    });
  });

  describe('getAlbedoDarkening', () => {
    it('returns 1.0 at surface (no darkening)', () => {
      const darkening = getAlbedoDarkening(0, DEFAULT_ENVIRONMENTAL_CONFIG.moistureGradient);
      expect(darkening).toBe(1.0);
    });

    it('returns < 1.0 at depth (wet surfaces darker)', () => {
      const darkening = getAlbedoDarkening(-30, DEFAULT_ENVIRONMENTAL_CONFIG.moistureGradient);
      expect(darkening).toBeLessThan(1.0);
    });
  });
});
