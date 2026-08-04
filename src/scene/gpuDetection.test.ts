import { describe, it, expect } from 'vitest';
import {
  detectGPUCapabilities,
  selectQualityProfile,
  getQualitySettings,
  getRecommendedProfile,
  QUALITY_SETTINGS,
  type QualityProfile,
  type GPUCapabilities,
} from './gpuDetection';

function makeMockGL(overrides: Partial<GPUCapabilities> = {}): WebGLRenderingContext {
  const base: GPUCapabilities = {
    vendor: 'NVIDIA Corporation',
    renderer: 'NVIDIA GeForce RTX 3080',
    maxTextureSize: 16384,
    maxViewportDims: 16384,
    maxVertexUniformVectors: 4096,
    maxFragmentUniformVectors: 4096,
    maxVertexTextureImageUnits: 16,
    extensions: ['WEBGL_debug_renderer_info'],
    qualityProfile: 'ultra',
    ...overrides,
  };

  return {
    // WebGL constants
    VENDOR: 0x1f00,
    RENDERER: 0x1f01,
    MAX_TEXTURE_SIZE: 0x0d33,
    MAX_VIEWPORT_DIMS: 0x0d3a,
    MAX_VERTEX_UNIFORM_VECTORS: 0x8dfb,
    MAX_FRAGMENT_UNIFORM_VECTORS: 0x8dfd,
    MAX_VERTEX_TEXTURE_IMAGE_UNITS: 0x8b4c,
    getExtension: () => ({
      UNMASKED_VENDOR_WEBGL: 0x9245,
      UNMASKED_RENDERER_WEBGL: 0x9246,
    }),
    getParameter: (param: number) => {
      if (param === 0x9245) return base.vendor;
      if (param === 0x9246) return base.renderer;
      if (param === 0x0d33) return base.maxTextureSize;
      if (param === 0x0d3a) return new Int32Array([base.maxViewportDims, base.maxViewportDims]);
      if (param === 0x8dfb) return base.maxVertexUniformVectors;
      if (param === 0x8dfd) return base.maxFragmentUniformVectors;
      if (param === 0x8b4c) return base.maxVertexTextureImageUnits;
      if (param === 0x1f00) return base.vendor;
      if (param === 0x1f01) return base.renderer;
      return 0;
    },
    getSupportedExtensions: () => base.extensions,
  } as unknown as WebGLRenderingContext;
}

describe('GPU Detection (M04-T03)', () => {
  describe('QUALITY_SETTINGS', () => {
    it('has settings for all profiles', () => {
      const profiles: QualityProfile[] = ['ultra', 'high', 'medium', 'low'];
      for (const profile of profiles) {
        expect(QUALITY_SETTINGS[profile]).toBeDefined();
        expect(QUALITY_SETTINGS[profile].shadowMapSize).toBeGreaterThan(0);
      }
    });

    it('ultra has highest quality', () => {
      expect(QUALITY_SETTINGS.ultra.shadowMapSize).toBeGreaterThan(
        QUALITY_SETTINGS.low.shadowMapSize,
      );
      expect(QUALITY_SETTINGS.ultra.maxDrawCalls).toBeGreaterThan(
        QUALITY_SETTINGS.low.maxDrawCalls,
      );
    });
  });

  describe('detectGPUCapabilities', () => {
    it('detects GPU vendor and renderer', () => {
      const gl = makeMockGL();
      const caps = detectGPUCapabilities(gl);
      expect(caps.vendor).toBe('NVIDIA Corporation');
      expect(caps.renderer).toBe('NVIDIA GeForce RTX 3080');
    });

    it('detects max texture size', () => {
      const gl = makeMockGL({ maxTextureSize: 8192 });
      const caps = detectGPUCapabilities(gl);
      expect(caps.maxTextureSize).toBe(8192);
    });

    it('assigns ultra profile for RTX GPU', () => {
      const gl = makeMockGL({ renderer: 'NVIDIA GeForce RTX 3080' });
      const caps = detectGPUCapabilities(gl);
      expect(caps.qualityProfile).toBe('ultra');
    });

    it('assigns low profile for Intel HD', () => {
      const gl = makeMockGL({ renderer: 'Intel HD Graphics 4000' });
      const caps = detectGPUCapabilities(gl);
      expect(caps.qualityProfile).toBe('low');
    });
  });

  describe('selectQualityProfile', () => {
    it('returns ultra for RTX', () => {
      expect(
        selectQualityProfile({
          vendor: 'NVIDIA',
          renderer: 'NVIDIA GeForce RTX 4090',
          maxTextureSize: 16384,
          maxViewportDims: 16384,
          maxVertexUniformVectors: 4096,
          maxFragmentUniformVectors: 4096,
          maxVertexTextureImageUnits: 16,
          extensions: [],
        }),
      ).toBe('ultra');
    });

    it('returns high for GTX 10', () => {
      expect(
        selectQualityProfile({
          vendor: 'NVIDIA',
          renderer: 'NVIDIA GeForce GTX 1080',
          maxTextureSize: 16384,
          maxViewportDims: 16384,
          maxVertexUniformVectors: 4096,
          maxFragmentUniformVectors: 4096,
          maxVertexTextureImageUnits: 16,
          extensions: [],
        }),
      ).toBe('high');
    });

    it('returns low for Mali', () => {
      expect(
        selectQualityProfile({
          vendor: 'ARM',
          renderer: 'Mali-G78',
          maxTextureSize: 4096,
          maxViewportDims: 4096,
          maxVertexUniformVectors: 1024,
          maxFragmentUniformVectors: 1024,
          maxVertexTextureImageUnits: 16,
          extensions: [],
        }),
      ).toBe('low');
    });
  });

  describe('getQualitySettings', () => {
    it('returns settings for a profile', () => {
      const settings = getQualitySettings('high');
      expect(settings.profile).toBe('high');
      expect(settings.shadowMapSize).toBe(2048);
    });
  });

  describe('getRecommendedProfile', () => {
    it('returns a valid profile', () => {
      const profile = getRecommendedProfile();
      expect(['ultra', 'high', 'medium', 'low']).toContain(profile);
    });
  });
});
