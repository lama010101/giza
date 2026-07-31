/**
 * Shadow strategy per M04-T06.
 *
 * Provides three shadow strategies selectable by quality profile:
 *   1. Cascaded Shadow Maps (CSM) — ultra/high quality
 *   2. Single shadow map — medium quality
 *   3. Baked AO — low quality (no runtime shadows)
 *
 * Each strategy computes shadow parameters for the render pipeline.
 */

import type { QualityProfile as GPUQualityProfile } from './gpuDetection';

export type ShadowStrategy = 'csm' | 'single' | 'baked-ao';

export interface CascadeShadow {
  cascadeIndex: number;
  near: number;
  far: number;
  resolution: number;
  bias: number;
  normalBias: number;
}

export interface ShadowMapConfig {
  strategy: ShadowStrategy;
  resolution: number;
  bias: number;
  normalBias: number;
  cascades: CascadeShadow[];
  updateRate: 'every-frame' | 'every-other-frame' | 'static';
}

export interface BakedAOConfig {
  strategy: 'baked-ao';
  aoTextureSize: number;
  aoStrength: number;
  aoRadius: number;
}

export type ShadowConfig = ShadowMapConfig | BakedAOConfig;

/**
 * Returns the shadow strategy for a quality profile.
 */
export function getShadowStrategy(profile: GPUQualityProfile): ShadowStrategy {
  switch (profile) {
    case 'ultra':
    case 'high':
      return 'csm';
    case 'medium':
      return 'single';
    case 'low':
      return 'baked-ao';
  }
}

/**
 * Generates CSM cascade splits based on the camera near/far planes.
 * Uses logarithmic splitting for better depth distribution.
 */
export function generateCSMCascades(
  near: number,
  far: number,
  cascadeCount: number,
  resolution: number,
  lambda = 0.5,
): CascadeShadow[] {
  const cascades: CascadeShadow[] = [];

  for (let i = 0; i < cascadeCount; i++) {
    const p = (i + 1) / cascadeCount;
    const logSplit = near * Math.pow(far / near, p);
    const uniformSplit = near + (far - near) * p;
    const split = lambda * logSplit + (1 - lambda) * uniformSplit;

    const prevSplit = i === 0 ? near : cascades[i - 1].far;

    cascades.push({
      cascadeIndex: i,
      near: prevSplit,
      far: split,
      resolution,
      bias: 0.001 + i * 0.0005,
      normalBias: 0.02 + i * 0.01,
    });
  }

  return cascades;
}

/**
 * Creates a shadow configuration for the given quality profile.
 */
export function createShadowConfig(profile: GPUQualityProfile): ShadowConfig {
  const strategy = getShadowStrategy(profile);

  switch (strategy) {
    case 'csm': {
      const resolution = profile === 'ultra' ? 2048 : 1024;
      const cascades = generateCSMCascades(0.1, 500, 4, resolution);
      return {
        strategy: 'csm',
        resolution,
        bias: 0.001,
        normalBias: 0.02,
        cascades,
        updateRate: profile === 'ultra' ? 'every-frame' : 'every-other-frame',
      };
    }
    case 'single': {
      return {
        strategy: 'single',
        resolution: 1024,
        bias: 0.002,
        normalBias: 0.04,
        cascades: [
          {
            cascadeIndex: 0,
            near: 0.1,
            far: 200,
            resolution: 1024,
            bias: 0.002,
            normalBias: 0.04,
          },
        ],
        updateRate: 'every-frame',
      };
    }
    case 'baked-ao': {
      return {
        strategy: 'baked-ao',
        aoTextureSize: 1024,
        aoStrength: 1.0,
        aoRadius: 0.5,
      };
    }
  }
}

/**
 * Returns the optimal cascade for a given distance from the camera.
 */
export function selectCascadeForDistance(
  cascades: CascadeShadow[],
  distance: number,
): CascadeShadow | undefined {
  return (
    cascades.find((c) => distance >= c.near && distance < c.far) ?? cascades[cascades.length - 1]
  );
}

// ─── Backward-compatible API ──────────────────────────────────────────────

export type QualityProfile = 'ultra' | 'high' | 'medium' | 'low';

export interface ShadowConfigLegacy {
  mapSize: number;
  cameraNear: number;
  cameraFar: number;
  cameraLeft: number;
  cameraRight: number;
  cameraTop: number;
  cameraBottom: number;
  bias: number;
}

export const SHADOW_CONFIGS: Record<QualityProfile, ShadowConfigLegacy> = {
  ultra: {
    mapSize: 2048,
    cameraNear: 0.5,
    cameraFar: 100,
    cameraLeft: -30,
    cameraRight: 30,
    cameraTop: 30,
    cameraBottom: -30,
    bias: -0.0001,
  },
  high: {
    mapSize: 2048,
    cameraNear: 0.5,
    cameraFar: 80,
    cameraLeft: -25,
    cameraRight: 25,
    cameraTop: 25,
    cameraBottom: -25,
    bias: -0.0002,
  },
  medium: {
    mapSize: 1024,
    cameraNear: 0.5,
    cameraFar: 60,
    cameraLeft: -20,
    cameraRight: 20,
    cameraTop: 20,
    cameraBottom: -20,
    bias: -0.0005,
  },
  low: {
    mapSize: 512,
    cameraNear: 0.5,
    cameraFar: 40,
    cameraLeft: -15,
    cameraRight: 15,
    cameraTop: 15,
    cameraBottom: -15,
    bias: -0.001,
  },
};

/**
 * Detects quality profile based on hardware capabilities.
 * @param cpuCores - Number of CPU cores
 * @param isMobile - Whether the device is mobile
 */
export function detectQualityProfile(cpuCores: number, isMobile: boolean): QualityProfile {
  if (isMobile) return 'low';
  if (cpuCores >= 8) return 'ultra';
  if (cpuCores >= 4) return 'high';
  if (cpuCores >= 2) return 'medium';
  return 'low';
}

/**
 * Returns shadow config for a quality profile (legacy API).
 */
export function getShadowConfig(profile: QualityProfile): ShadowConfigLegacy {
  return SHADOW_CONFIGS[profile];
}
