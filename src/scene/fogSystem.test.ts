import { describe, it, expect } from 'vitest';
import {
  FOG_CONFIGS,
  getFogForElevation,
  getEnabledFogVolumes,
  getBlendedFogDensity,
  type FogVolume,
} from './fogSystem';

describe('Fog System (M09-T16, GIZA-04 §6.10)', () => {
  describe('FOG_CONFIGS', () => {
    it('defines 3 fog volumes', () => {
      const volumes = Object.keys(FOG_CONFIGS) as FogVolume[];
      expect(volumes).toHaveLength(3);
      expect(volumes).toContain('surface');
      expect(volumes).toContain('lower-levels');
      expect(volumes).toContain('level-3');
    });

    it('surface fog has minimal density', () => {
      expect(FOG_CONFIGS.surface.density).toBeLessThan(0.01);
    });

    it('level-3 fog has highest density', () => {
      expect(FOG_CONFIGS['level-3'].density).toBeGreaterThan(FOG_CONFIGS['lower-levels'].density);
      expect(FOG_CONFIGS['lower-levels'].density).toBeGreaterThan(FOG_CONFIGS.surface.density);
    });

    it('all densities preserve scientific visibility (< 0.02)', () => {
      for (const config of Object.values(FOG_CONFIGS)) {
        expect(config.density).toBeLessThan(0.02);
      }
    });

    it('all volumes have distinct colors', () => {
      const colors = Object.values(FOG_CONFIGS).map((f) => f.color);
      expect(new Set(colors).size).toBe(3);
    });
  });

  describe('getFogForElevation', () => {
    it('returns surface fog above ground', () => {
      expect(getFogForElevation(5).volume).toBe('surface');
      expect(getFogForElevation(0).volume).toBe('surface');
    });

    it('returns lower-levels fog for mid-depths', () => {
      expect(getFogForElevation(-10).volume).toBe('lower-levels');
      expect(getFogForElevation(-20).volume).toBe('lower-levels');
    });

    it('returns level-3 fog for deep elevations', () => {
      expect(getFogForElevation(-28).volume).toBe('level-3');
      expect(getFogForElevation(-35).volume).toBe('level-3');
    });
  });

  describe('getEnabledFogVolumes', () => {
    it('returns all enabled volumes', () => {
      const enabled = getEnabledFogVolumes();
      expect(enabled.length).toBe(3); // all enabled by default
    });
  });

  describe('getBlendedFogDensity', () => {
    it('returns surface density at surface', () => {
      expect(getBlendedFogDensity(5)).toBeCloseTo(FOG_CONFIGS.surface.density);
    });

    it('returns level-3 density at deepest point', () => {
      expect(getBlendedFogDensity(-35)).toBeCloseTo(FOG_CONFIGS['level-3'].density, 4);
    });

    it('interpolates between volumes', () => {
      const midDensity = getBlendedFogDensity(-15);
      expect(midDensity).toBeGreaterThan(FOG_CONFIGS.surface.density);
      expect(midDensity).toBeLessThan(FOG_CONFIGS['level-3'].density);
    });
  });
});
