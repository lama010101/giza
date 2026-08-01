import { describe, it, expect } from 'vitest';
import {
  GP_CHAMBERS,
  computeDustDensity,
  computeDustParams,
  computeSaltEfflorescence,
  computeSmokeBlackening,
  computeRoughnessVariation,
  getGPEnvironmentalParams,
  getAllGPEnvironmentalParams,
} from './gpEnvironmentalRendering';

describe('GP Environmental Rendering (M11-T24)', () => {
  describe('computeDustDensity', () => {
    it('returns higher density for poorly ventilated chambers', () => {
      const kings = computeDustDensity('kings-chamber');
      const gallery = computeDustDensity('grand-gallery');
      expect(kings).toBeGreaterThan(gallery);
    });

    it('returns a positive number for all chambers', () => {
      for (const chamber of GP_CHAMBERS) {
        expect(computeDustDensity(chamber)).toBeGreaterThan(0);
      }
    });
  });

  describe('computeDustParams', () => {
    it('returns enabled dust params', () => {
      const params = computeDustParams('kings-chamber');
      expect(params.enabled).toBe(true);
      expect(params.density).toBeGreaterThan(0);
      expect(params.color).toMatch(/^#/);
    });
  });

  describe('computeSaltEfflorescence', () => {
    it('is disabled for granite chambers', () => {
      const params = computeSaltEfflorescence('kings-chamber');
      expect(params.enabled).toBe(false);
    });

    it('is enabled for limestone chambers with water', () => {
      const params = computeSaltEfflorescence('subterranean-chamber');
      expect(params.enabled).toBe(true);
      expect(params.coverage).toBeGreaterThan(0);
    });

    it('respects wall orientation', () => {
      const params = computeSaltEfflorescence('queens-chamber', 'ceiling');
      expect(params.preferredOrientation).toBe('ceiling');
    });
  });

  describe('computeSmokeBlackening', () => {
    it('is stronger near entrances', () => {
      const passage = computeSmokeBlackening('descending-passage');
      const kings = computeSmokeBlackening('kings-chamber');
      expect(passage.darkening).toBeGreaterThan(kings.darkening);
    });

    it('has high ceiling bias', () => {
      const params = computeSmokeBlackening('kings-chamber');
      expect(params.ceilingBias).toBeGreaterThan(0.5);
    });
  });

  describe('computeRoughnessVariation', () => {
    it('returns higher base roughness for limestone than granite', () => {
      const limestone = computeRoughnessVariation('queens-chamber');
      const granite = computeRoughnessVariation('kings-chamber');
      expect(limestone.baseRoughness).toBeGreaterThan(granite.baseRoughness);
    });

    it('increases weathering with water sources', () => {
      const wet = computeRoughnessVariation('subterranean-chamber');
      const dry = computeRoughnessVariation('kings-chamber');
      expect(wet.weatheringScale).toBeGreaterThan(dry.weatheringScale);
    });
  });

  describe('getGPEnvironmentalParams', () => {
    it('returns all effect params for a chamber', () => {
      const params = getGPEnvironmentalParams('kings-chamber');
      expect(params.chamberId).toBe('kings-chamber');
      expect(params.dust).toBeDefined();
      expect(params.saltEfflorescence).toBeDefined();
      expect(params.smokeBlackening).toBeDefined();
      expect(params.roughnessVariation).toBeDefined();
    });
  });

  describe('getAllGPEnvironmentalParams', () => {
    it('returns params for all chambers', () => {
      const all = getAllGPEnvironmentalParams();
      expect(all).toHaveLength(GP_CHAMBERS.length);
      for (const p of all) {
        expect(GP_CHAMBERS).toContain(p.chamberId);
      }
    });
  });
});
