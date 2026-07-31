import { describe, it, expect } from 'vitest';
import {
  SHADOW_CONFIGS,
  detectQualityProfile,
  getShadowConfig,
  shouldUseBakedAO,
  type QualityProfile,
  type ShadowStrategy,
} from './shadowStrategy';

describe('Shadow Strategy (M04-T06)', () => {
  describe('SHADOW_CONFIGS', () => {
    it('defines configs for all 4 quality profiles', () => {
      expect(SHADOW_CONFIGS['desktop-high']).toBeDefined();
      expect(SHADOW_CONFIGS['desktop-standard']).toBeDefined();
      expect(SHADOW_CONFIGS['mobile-high']).toBeDefined();
      expect(SHADOW_CONFIGS['mobile-standard']).toBeDefined();
    });

    it('desktop-high uses CSM with 4 cascades and 2048 map', () => {
      const cfg = SHADOW_CONFIGS['desktop-high'];
      expect(cfg.strategy).toBe('csm');
      expect(cfg.cascadeCount).toBe(4);
      expect(cfg.mapSize).toBe(2048);
    });

    it('desktop-standard uses CSM with 3 cascades and 1024 map', () => {
      const cfg = SHADOW_CONFIGS['desktop-standard'];
      expect(cfg.strategy).toBe('csm');
      expect(cfg.cascadeCount).toBe(3);
      expect(cfg.mapSize).toBe(1024);
    });

    it('mobile-high uses single map with 1024 texture', () => {
      const cfg = SHADOW_CONFIGS['mobile-high'];
      expect(cfg.strategy).toBe('single-map');
      expect(cfg.cascadeCount).toBe(1);
      expect(cfg.mapSize).toBe(1024);
    });

    it('mobile-standard uses single map with 512 texture', () => {
      const cfg = SHADOW_CONFIGS['mobile-standard'];
      expect(cfg.strategy).toBe('single-map');
      expect(cfg.mapSize).toBe(512);
    });

    it('all configs have valid bias values', () => {
      for (const profile of Object.keys(SHADOW_CONFIGS) as QualityProfile[]) {
        const cfg = SHADOW_CONFIGS[profile];
        expect(cfg.bias).toBeLessThan(0); // negative bias to avoid acne
        expect(cfg.normalBias).toBeGreaterThan(0);
        expect(cfg.cascadeBias.length).toBe(cfg.cascadeCount);
      }
    });
  });

  describe('detectQualityProfile', () => {
    it('returns desktop-high for high-tier desktop GPU', () => {
      expect(detectQualityProfile(2, false)).toBe('desktop-high');
      expect(detectQualityProfile(3, false)).toBe('desktop-high');
    });

    it('returns desktop-standard for low-tier desktop GPU', () => {
      expect(detectQualityProfile(0, false)).toBe('desktop-standard');
      expect(detectQualityProfile(1, false)).toBe('desktop-standard');
    });

    it('returns mobile-high for high-tier mobile GPU', () => {
      expect(detectQualityProfile(2, true)).toBe('mobile-high');
    });

    it('returns mobile-standard for low-tier mobile GPU', () => {
      expect(detectQualityProfile(0, true)).toBe('mobile-standard');
    });
  });

  describe('getShadowConfig', () => {
    it('returns the correct config for each profile', () => {
      const cfg = getShadowConfig('desktop-high');
      expect(cfg).toBe(SHADOW_CONFIGS['desktop-high']);
    });
  });

  describe('shouldUseBakedAO', () => {
    it('returns true for distant objects (>80% of camera far)', () => {
      const cfg = SHADOW_CONFIGS['desktop-high'];
      // cameraFar = 200, 80% = 160
      expect(shouldUseBakedAO(170, cfg)).toBe(true);
      expect(shouldUseBakedAO(200, cfg)).toBe(true);
    });

    it('returns false for near objects', () => {
      const cfg = SHADOW_CONFIGS['desktop-high'];
      expect(shouldUseBakedAO(50, cfg)).toBe(false);
      expect(shouldUseBakedAO(100, cfg)).toBe(false);
    });
  });

  describe('shadow strategy types', () => {
    it('all strategies are valid', () => {
      const strategies: ShadowStrategy[] = ['csm', 'single-map', 'baked-ao', 'disabled'];
      for (const s of strategies) {
        expect(typeof s).toBe('string');
      }
    });
  });
});
