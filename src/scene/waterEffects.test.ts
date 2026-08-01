import { describe, it, expect } from 'vitest';
import {
  getDefaultWaterParams,
  computeFresnel,
  computeSSR,
  computeRefraction,
  getWaterShaderUniforms,
  WaterVertexShader,
  WaterFragmentShader,
  type Vector2,
  type Vector3,
} from './waterEffects';

describe('Water Effects (M08.5-T04)', () => {
  describe('getDefaultWaterParams', () => {
    it('returns sensible defaults', () => {
      const params = getDefaultWaterParams();
      expect(params.ssrEnabled).toBe(true);
      expect(params.fresnelPower).toBeGreaterThan(0);
      expect(params.refractionAmount).toBeGreaterThan(0);
      expect(params.rippleScale).toBeGreaterThan(0);
      expect(params.rippleSpeed).toBeGreaterThan(0);
      expect(params.normalMapScale).toBeGreaterThan(0);
      expect(params.depth).toBeGreaterThan(0);
    });

    it('returns a fresh object each call', () => {
      const a = getDefaultWaterParams();
      const b = getDefaultWaterParams();
      expect(a).not.toBe(b);
      expect(a).toEqual(b);
    });
  });

  describe('computeFresnel', () => {
    it('returns 0 when view aligns with normal', () => {
      const view: Vector3 = { x: 0, y: 1, z: 0 };
      const normal: Vector3 = { x: 0, y: 1, z: 0 };
      expect(computeFresnel(view, normal, 3)).toBeCloseTo(0, 5);
    });

    it('returns 1 when view is perpendicular to normal', () => {
      const view: Vector3 = { x: 1, y: 0, z: 0 };
      const normal: Vector3 = { x: 0, y: 1, z: 0 };
      expect(computeFresnel(view, normal, 3)).toBeCloseTo(1, 5);
    });

    it('normalizes non-unit inputs', () => {
      const view: Vector3 = { x: 0, y: 5, z: 0 };
      const normal: Vector3 = { x: 0, y: 5, z: 0 };
      expect(computeFresnel(view, normal, 3)).toBeCloseTo(0, 5);
    });

    it('higher power produces tighter rim', () => {
      const view: Vector3 = { x: 0.5, y: 0.866, z: 0 };
      const normal: Vector3 = { x: 0, y: 1, z: 0 };
      const low = computeFresnel(view, normal, 1);
      const high = computeFresnel(view, normal, 8);
      expect(high).toBeLessThan(low);
    });
  });

  describe('computeSSR', () => {
    it('returns 1 for zero depth and zero roughness', () => {
      expect(computeSSR(0, 0)).toBeCloseTo(1, 5);
    });

    it('decreases with depth', () => {
      const shallow = computeSSR(0.5, 0);
      const deep = computeSSR(5, 0);
      expect(deep).toBeLessThan(shallow);
    });

    it('decreases with roughness', () => {
      const smooth = computeSSR(1, 0);
      const rough = computeSSR(1, 0.9);
      expect(rough).toBeLessThan(smooth);
    });

    it('clamps to [0, 1]', () => {
      expect(computeSSR(-1, -1)).toBeGreaterThanOrEqual(0);
      expect(computeSSR(-1, -1)).toBeLessThanOrEqual(1);
      expect(computeSSR(100, 2)).toBeGreaterThanOrEqual(0);
      expect(computeSSR(100, 2)).toBeLessThanOrEqual(1);
    });
  });

  describe('computeRefraction', () => {
    it('returns a perturbed uv', () => {
      const uv: Vector2 = { x: 0.5, y: 0.5 };
      const out = computeRefraction(uv, 0.02, 0);
      expect(out.x).not.toBe(uv.x);
      expect(out.y).not.toBe(uv.y);
    });

    it('does not mutate input uv', () => {
      const uv: Vector2 = { x: 0.5, y: 0.5 };
      const snapshot = { ...uv };
      computeRefraction(uv, 0.02, 1);
      expect(uv).toEqual(snapshot);
    });

    it('zero amount returns the original uv', () => {
      const uv: Vector2 = { x: 0.3, y: 0.7 };
      const out = computeRefraction(uv, 0, 0);
      expect(out.x).toBeCloseTo(uv.x, 5);
      expect(out.y).toBeCloseTo(uv.y, 5);
    });
  });

  describe('getWaterShaderUniforms', () => {
    it('includes all effect params and time', () => {
      const params = getDefaultWaterParams();
      const uniforms = getWaterShaderUniforms(params, 1.5);
      expect(uniforms.uSSREnabled).toBeDefined();
      expect(uniforms.uFresnelPower).toBeDefined();
      expect(uniforms.uRefractionAmount).toBeDefined();
      expect(uniforms.uRippleScale).toBeDefined();
      expect(uniforms.uRippleSpeed).toBeDefined();
      expect(uniforms.uNormalMapScale).toBeDefined();
      expect(uniforms.uDepth).toBeDefined();
      expect(uniforms.uTime).toBeDefined();
    });

    it('encodes ssrEnabled as 1/0', () => {
      const on = getWaterShaderUniforms({ ...getDefaultWaterParams(), ssrEnabled: true }, 0);
      const off = getWaterShaderUniforms({ ...getDefaultWaterParams(), ssrEnabled: false }, 0);
      expect((on.uSSREnabled as { value: number }).value).toBe(1);
      expect((off.uSSREnabled as { value: number }).value).toBe(0);
    });

    it('passes time through as uTime', () => {
      const uniforms = getWaterShaderUniforms(getDefaultWaterParams(), 2.25);
      expect((uniforms.uTime as { value: number }).value).toBeCloseTo(2.25, 5);
    });
  });

  describe('shader strings', () => {
    it('WaterVertexShader is non-empty GLSL', () => {
      expect(WaterVertexShader.length).toBeGreaterThan(0);
      expect(WaterVertexShader).toContain('gl_Position');
    });

    it('WaterFragmentShader is non-empty GLSL', () => {
      expect(WaterFragmentShader.length).toBeGreaterThan(0);
      expect(WaterFragmentShader).toContain('gl_FragColor');
    });

    it('vertex shader references ripple uniforms', () => {
      expect(WaterVertexShader).toContain('uRippleScale');
      expect(WaterVertexShader).toContain('uRippleSpeed');
    });

    it('fragment shader references fresnel, ssr, and refraction', () => {
      expect(WaterFragmentShader).toContain('uFresnelPower');
      expect(WaterFragmentShader).toContain('uSSREnabled');
      expect(WaterFragmentShader).toContain('uRefractionAmount');
    });
  });
});
