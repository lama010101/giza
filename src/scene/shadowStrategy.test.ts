import { describe, it, expect } from 'vitest';
import {
  getShadowStrategy,
  generateCSMCascades,
  createShadowConfig,
  selectCascadeForDistance,
} from './shadowStrategy';

describe('Shadow Strategy (M04-T06)', () => {
  describe('getShadowStrategy', () => {
    it('returns csm for ultra', () => {
      expect(getShadowStrategy('ultra')).toBe('csm');
    });

    it('returns csm for high', () => {
      expect(getShadowStrategy('high')).toBe('csm');
    });

    it('returns single for medium', () => {
      expect(getShadowStrategy('medium')).toBe('single');
    });

    it('returns baked-ao for low', () => {
      expect(getShadowStrategy('low')).toBe('baked-ao');
    });
  });

  describe('generateCSMCascades', () => {
    it('generates the requested number of cascades', () => {
      const cascades = generateCSMCascades(0.1, 500, 4, 2048);
      expect(cascades).toHaveLength(4);
    });

    it('first cascade starts at near plane', () => {
      const cascades = generateCSMCascades(0.1, 500, 4, 2048);
      expect(cascades[0].near).toBe(0.1);
    });

    it('last cascade ends at far plane', () => {
      const cascades = generateCSMCascades(0.1, 500, 4, 2048);
      expect(cascades[cascades.length - 1].far).toBeCloseTo(500, 0);
    });

    it('cascades are contiguous', () => {
      const cascades = generateCSMCascades(0.1, 500, 4, 2048);
      for (let i = 1; i < cascades.length; i++) {
        expect(cascades[i].near).toBeCloseTo(cascades[i - 1].far, 5);
      }
    });
  });

  describe('createShadowConfig', () => {
    it('creates CSM config for ultra', () => {
      const config = createShadowConfig('ultra');
      expect(config.strategy).toBe('csm');
      if (config.strategy === 'csm') {
        expect(config.cascades.length).toBeGreaterThan(0);
        expect(config.updateRate).toBe('every-frame');
      }
    });

    it('creates single map config for medium', () => {
      const config = createShadowConfig('medium');
      expect(config.strategy).toBe('single');
      if (config.strategy === 'single') {
        expect(config.cascades).toHaveLength(1);
      }
    });

    it('creates baked AO config for low', () => {
      const config = createShadowConfig('low');
      expect(config.strategy).toBe('baked-ao');
    });
  });

  describe('selectCascadeForDistance', () => {
    it('selects the correct cascade for a distance', () => {
      const cascades = generateCSMCascades(0.1, 500, 4, 2048);
      const selected = selectCascadeForDistance(cascades, 5);
      expect(selected).toBeDefined();
      expect(selected?.cascadeIndex).toBe(0);
    });

    it('returns last cascade for distance beyond all cascades', () => {
      const cascades = generateCSMCascades(0.1, 500, 4, 2048);
      const selected = selectCascadeForDistance(cascades, 1000);
      expect(selected).toBeDefined();
      expect(selected?.cascadeIndex).toBe(cascades.length - 1);
    });
  });
});
