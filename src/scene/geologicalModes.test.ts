import { describe, it, expect } from 'vitest';
import {
  GEOLOGICAL_MODES,
  GEOLOGICAL_MODE_CONFIGS,
  getStrataColor,
  STRATA_COLORS,
} from './geologicalModes';

describe('Geological Visualization Modes (M09-T11, GIZA-03 §2.16)', () => {
  describe('GEOLOGICAL_MODES', () => {
    it('defines 5 modes', () => {
      expect(GEOLOGICAL_MODES).toHaveLength(5);
    });

    it('includes all required modes', () => {
      expect(GEOLOGICAL_MODES).toContain('photorealistic');
      expect(GEOLOGICAL_MODES).toContain('simplified-stratigraphy');
      expect(GEOLOGICAL_MODES).toContain('cutaway');
      expect(GEOLOGICAL_MODES).toContain('semi-transparent');
      expect(GEOLOGICAL_MODES).toContain('cross-sectional-engineering');
    });
  });

  describe('GEOLOGICAL_MODE_CONFIGS', () => {
    it('all modes have configs', () => {
      for (const mode of GEOLOGICAL_MODES) {
        expect(GEOLOGICAL_MODE_CONFIGS[mode]).toBeDefined();
      }
    });

    it('photorealistic has full opacity', () => {
      expect(GEOLOGICAL_MODE_CONFIGS.photorealistic.opacity).toBe(1.0);
      expect(GEOLOGICAL_MODE_CONFIGS.photorealistic.wireframe).toBe(false);
    });

    it('semi-transparent has reduced opacity', () => {
      expect(GEOLOGICAL_MODE_CONFIGS['semi-transparent'].opacity).toBeLessThan(0.5);
    });

    it('cutaway has a cutaway plane', () => {
      expect(GEOLOGICAL_MODE_CONFIGS.cutaway.cutawayPlane).not.toBeNull();
    });

    it('cross-sectional engineering has wireframe and dimensions', () => {
      const config = GEOLOGICAL_MODE_CONFIGS['cross-sectional-engineering'];
      expect(config.wireframe).toBe(true);
      expect(config.showDimensions).toBe(true);
    });

    it('simplified stratigraphy shows strata', () => {
      expect(GEOLOGICAL_MODE_CONFIGS['simplified-stratigraphy'].showStrata).toBe(true);
    });
  });

  describe('STRATA_COLORS', () => {
    it('defines geological strata', () => {
      expect(STRATA_COLORS.length).toBeGreaterThan(0);
      for (const strata of STRATA_COLORS) {
        expect(strata.name).toBeDefined();
        expect(strata.color).toMatch(/^#/);
      }
    });
  });

  describe('getStrataColor', () => {
    it('returns desert sand color at surface', () => {
      expect(getStrataColor(2)).toBe('#e8d8a8');
    });

    it('returns bedrock color at depth', () => {
      expect(getStrataColor(-30)).toBe('#6b5f45');
    });

    it('returns a valid color for any elevation', () => {
      for (const y of [10, 0, -10, -20, -30, -100]) {
        expect(getStrataColor(y)).toMatch(/^#/);
      }
    });
  });

  describe('mode switching (instant, no geometry reload)', () => {
    it('all mode configs are pre-computed (no async)', () => {
      for (const mode of GEOLOGICAL_MODES) {
        const config = GEOLOGICAL_MODE_CONFIGS[mode];
        expect(typeof config.opacity).toBe('number');
        expect(typeof config.wireframe).toBe('boolean');
      }
    });
  });
});
