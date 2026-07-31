/**
 * Shadow strategy per GIZA - 04 §6.12.
 *
 * Desktop: Cascaded Shadow Maps (CSM)
 * Mobile: Single directional shadow map
 * Distant objects: Baked AO
 *
 * The shadow strategy is selected based on the active quality profile.
 */

export type ShadowStrategy = 'csm' | 'single-map' | 'baked-ao' | 'disabled';
export type QualityProfile =
  | 'desktop-high'
  | 'desktop-standard'
  | 'mobile-high'
  | 'mobile-standard';

export interface ShadowConfig {
  strategy: ShadowStrategy;
  mapSize: number;
  cascadeCount: number; // CSM only
  cascadeBias: number[];
  cameraNear: number;
  cameraFar: number;
  cameraLeft: number;
  cameraRight: number;
  cameraTop: number;
  cameraBottom: number;
  bias: number;
  normalBias: number;
}

export const SHADOW_CONFIGS: Record<QualityProfile, ShadowConfig> = {
  'desktop-high': {
    strategy: 'csm',
    mapSize: 2048,
    cascadeCount: 4,
    cascadeBias: [0.0005, 0.001, 0.002, 0.005],
    cameraNear: 0.5,
    cameraFar: 200,
    cameraLeft: -80,
    cameraRight: 80,
    cameraTop: 80,
    cameraBottom: -80,
    bias: -0.0005,
    normalBias: 0.02,
  },
  'desktop-standard': {
    strategy: 'csm',
    mapSize: 1024,
    cascadeCount: 3,
    cascadeBias: [0.001, 0.002, 0.005],
    cameraNear: 0.5,
    cameraFar: 150,
    cameraLeft: -60,
    cameraRight: 60,
    cameraTop: 60,
    cameraBottom: -60,
    bias: -0.001,
    normalBias: 0.04,
  },
  'mobile-high': {
    strategy: 'single-map',
    mapSize: 1024,
    cascadeCount: 1,
    cascadeBias: [0.002],
    cameraNear: 1,
    cameraFar: 100,
    cameraLeft: -40,
    cameraRight: 40,
    cameraTop: 40,
    cameraBottom: -40,
    bias: -0.002,
    normalBias: 0.06,
  },
  'mobile-standard': {
    strategy: 'single-map',
    mapSize: 512,
    cascadeCount: 1,
    cascadeBias: [0.005],
    cameraNear: 1,
    cameraFar: 80,
    cameraLeft: -30,
    cameraRight: 30,
    cameraTop: 30,
    cameraBottom: -30,
    bias: -0.005,
    normalBias: 0.08,
  },
};

/**
 * Detects quality profile from GPU tier and viewport.
 * This is a heuristic; the adaptive quality manager (M04-T03) does
 * the full detection.
 */
export function detectQualityProfile(gpuTier: number, isMobile: boolean): QualityProfile {
  if (isMobile) {
    return gpuTier >= 2 ? 'mobile-high' : 'mobile-standard';
  }
  return gpuTier >= 2 ? 'desktop-high' : 'desktop-standard';
}

export function getShadowConfig(profile: QualityProfile): ShadowConfig {
  return SHADOW_CONFIGS[profile];
}

/**
 * Determines if an object at the given distance should use baked AO
 * instead of real-time shadows.
 */
export function shouldUseBakedAO(distance: number, config: ShadowConfig): boolean {
  return distance > config.cameraFar * 0.8;
}
