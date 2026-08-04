import { describe, it, expect } from 'vitest';
import {
  WETNESS_THRESHOLDS,
  DEFAULT_WET_SURFACE_CONFIG,
  classifyWetness,
  computeProximityWetness,
  computeRainfallWetness,
  computeHumidityWetness,
  computeSurfaceWetness,
  generateWetMaterialParams,
  generateDroplets,
  generateRipples,
  advanceAnimation,
  buildWetSurfaceUniforms,
  computeIntegratedWetness,
  type WetSurfaceConfig,
} from './wetSurface';

describe('Wet Surface System (M09-T14, GIZA-03 §2.17)', () => {
  describe('WETNESS_THRESHOLDS', () => {
    it('defines 4 wetness level thresholds in ascending order', () => {
      expect(WETNESS_THRESHOLDS.dry).toBeLessThanOrEqual(WETNESS_THRESHOLDS.damp);
      expect(WETNESS_THRESHOLDS.damp).toBeLessThanOrEqual(WETNESS_THRESHOLDS.wet);
      expect(WETNESS_THRESHOLDS.wet).toBeLessThanOrEqual(WETNESS_THRESHOLDS.submerged);
    });
  });

  describe('classifyWetness', () => {
    it('classifies 0% as Dry', () => {
      expect(classifyWetness(0)).toBe('Dry');
    });

    it('classifies 40% as Damp', () => {
      expect(classifyWetness(40)).toBe('Damp');
    });

    it('classifies 75% as Wet', () => {
      expect(classifyWetness(75)).toBe('Wet');
    });

    it('classifies 95% as Submerged', () => {
      expect(classifyWetness(95)).toBe('Submerged');
    });
  });

  describe('computeProximityWetness', () => {
    it('returns 100% at the water source center', () => {
      const wetness = computeProximityWetness({ x: 0, y: 0, z: 0 }, [
        { position: { x: 0, y: 0, z: 0 }, radius: 5 },
      ]);
      expect(wetness).toBeCloseTo(100, 0);
    });

    it('returns 0 outside the influence radius', () => {
      const wetness = computeProximityWetness({ x: 10, y: 0, z: 0 }, [
        { position: { x: 0, y: 0, z: 0 }, radius: 5 },
      ]);
      expect(wetness).toBe(0);
    });

    it('falls off linearly with distance', () => {
      const wetness = computeProximityWetness({ x: 2.5, y: 0, z: 0 }, [
        { position: { x: 0, y: 0, z: 0 }, radius: 5 },
      ]);
      expect(wetness).toBeCloseTo(50, 0);
    });
  });

  describe('computeRainfallWetness', () => {
    it('returns 0 when there is no rain', () => {
      expect(computeRainfallWetness(0, 0.3)).toBe(0);
    });

    it('saturates at heavy rainfall', () => {
      const wetness = computeRainfallWetness(50, 0.1);
      expect(wetness).toBe(100);
    });
  });

  describe('computeHumidityWetness', () => {
    it('returns 0 below 60% humidity', () => {
      expect(computeHumidityWetness(0.5, 0.3)).toBe(0);
    });

    it('increases with humidity above 60%', () => {
      const low = computeHumidityWetness(0.7, 0.3);
      const high = computeHumidityWetness(0.9, 0.3);
      expect(high).toBeGreaterThan(low);
      expect(low).toBeGreaterThan(0);
    });
  });

  describe('computeSurfaceWetness', () => {
    it('combines factors and clamps to 0-100', () => {
      const config: WetSurfaceConfig = {
        ...DEFAULT_WET_SURFACE_CONFIG,
        rainfallRate: 10,
        humidity: 0.8,
        porosity: 0.3,
        waterSources: [{ position: { x: 0, y: 0, z: 0 }, radius: 10 }],
      };
      const wetness = computeSurfaceWetness({ x: 1, y: 0, z: 0 }, config);
      expect(wetness).toBeGreaterThanOrEqual(0);
      expect(wetness).toBeLessThanOrEqual(100);
    });

    it('returns 0 when all factors are absent', () => {
      const config: WetSurfaceConfig = {
        ...DEFAULT_WET_SURFACE_CONFIG,
        rainfallRate: 0,
        humidity: 0.3,
        porosity: 0.3,
        waterSources: [],
      };
      const wetness = computeSurfaceWetness({ x: 100, y: 0, z: 0 }, config);
      expect(wetness).toBe(0);
    });
  });

  describe('generateWetMaterialParams', () => {
    it('returns no modification at 0% wetness (Dry)', () => {
      const params = generateWetMaterialParams(0);
      expect(params.roughnessReduction).toBe(0);
      expect(params.specularIncrease).toBe(0);
      expect(params.darkeningFactor).toBe(1);
      expect(params.reflectionIntensity).toBe(0);
    });

    it('increases roughness reduction and specular with wetness', () => {
      const damp = generateWetMaterialParams(40);
      const wet = generateWetMaterialParams(80);
      expect(wet.roughnessReduction).toBeGreaterThan(damp.roughnessReduction);
      expect(wet.specularIncrease).toBeGreaterThan(damp.specularIncrease);
      expect(wet.darkeningFactor).toBeLessThan(damp.darkeningFactor);
    });

    it('enables reflections only above Damp threshold', () => {
      const dry = generateWetMaterialParams(20);
      const wet = generateWetMaterialParams(80);
      expect(dry.reflectionIntensity).toBe(0);
      expect(wet.reflectionIntensity).toBeGreaterThan(0);
    });
  });

  describe('generateDroplets', () => {
    it('returns no droplets below Damp threshold', () => {
      const droplets = generateDroplets(20, 10, 42);
      expect(droplets).toHaveLength(0);
    });

    it('generates more droplets at higher wetness', () => {
      const few = generateDroplets(40, 10, 42);
      const many = generateDroplets(90, 10, 42);
      expect(many.length).toBeGreaterThan(few.length);
      expect(many.length).toBeGreaterThan(0);
    });

    it('is deterministic for the same seed', () => {
      const a = generateDroplets(80, 10, 42);
      const b = generateDroplets(80, 10, 42);
      expect(a).toEqual(b);
    });
  });

  describe('generateRipples', () => {
    it('returns no ripples below Wet threshold', () => {
      const droplets = generateDroplets(80, 10, 42);
      const ripples = generateRipples(droplets, 40, 42);
      expect(ripples).toHaveLength(0);
    });

    it('generates ripples at Wet threshold', () => {
      const droplets = generateDroplets(80, 10, 42);
      const ripples = generateRipples(droplets, 80, 42);
      expect(ripples.length).toBeGreaterThan(0);
    });
  });

  describe('advanceAnimation', () => {
    it('ages droplets and removes expired ones', () => {
      const animation = {
        droplets: [
          { u: 0.5, v: 0.5, radius: 0.01, age: 0, lifetime: 2 },
          { u: 0.3, v: 0.7, radius: 0.01, age: 1.9, lifetime: 2 },
        ],
        ripples: [],
      };
      const advanced = advanceAnimation(animation, 0.5);
      expect(advanced.droplets).toHaveLength(1);
      expect(advanced.droplets[0].age).toBeCloseTo(0.5, 2);
    });

    it('expands ripples and reduces amplitude over time', () => {
      const animation = {
        droplets: [],
        ripples: [
          { u: 0.5, v: 0.5, radius: 0.02, maxRadius: 0.2, amplitude: 0.5, age: 0, lifetime: 2 },
        ],
      };
      const advanced = advanceAnimation(animation, 1);
      expect(advanced.ripples[0].radius).toBeGreaterThan(0.02);
      expect(advanced.ripples[0].amplitude).toBeLessThan(0.5);
    });
  });

  describe('buildWetSurfaceUniforms', () => {
    it('produces all required uniforms with correct ranges', () => {
      const params = generateWetMaterialParams(80);
      const uniforms = buildWetSurfaceUniforms(80, params, { droplets: [], ripples: [] }, 1.5);
      expect(uniforms.uWetness).toBeCloseTo(0.8, 2);
      expect(uniforms.uRoughnessReduction).toBe(params.roughnessReduction);
      expect(uniforms.uSpecularIncrease).toBe(params.specularIncrease);
      expect(uniforms.uDarkeningFactor).toBe(params.darkeningFactor);
      expect(uniforms.uReflectionIntensity).toBe(params.reflectionIntensity);
      expect(uniforms.uDropletCount).toBe(0);
      expect(uniforms.uRippleCount).toBe(0);
      expect(uniforms.uTime).toBe(1.5);
    });
  });

  describe('computeIntegratedWetness', () => {
    it('adds depth-based wetness from moisture gradient', () => {
      const config: WetSurfaceConfig = {
        ...DEFAULT_WET_SURFACE_CONFIG,
        rainfallRate: 0,
        humidity: 0.3,
        waterSources: [],
      };
      const surfaceWetness = computeSurfaceWetness({ x: 0, y: -30, z: 0 }, config);
      const integrated = computeIntegratedWetness({ x: 0, y: -30, z: 0 }, config);
      expect(integrated).toBeGreaterThanOrEqual(surfaceWetness);
    });

    it('falls back to surface wetness when gradient disabled', () => {
      const config: WetSurfaceConfig = {
        ...DEFAULT_WET_SURFACE_CONFIG,
        rainfallRate: 10,
        humidity: 0.3,
        waterSources: [],
        moistureGradient: {
          ...DEFAULT_WET_SURFACE_CONFIG.moistureGradient,
          enabled: false,
        },
      };
      const surfaceWetness = computeSurfaceWetness({ x: 0, y: -30, z: 0 }, config);
      const integrated = computeIntegratedWetness({ x: 0, y: -30, z: 0 }, config);
      expect(integrated).toBe(surfaceWetness);
    });
  });
});
