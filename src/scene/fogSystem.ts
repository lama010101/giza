/**
 * Fog system per GIZA-04 §6.10 and GIZA-03 §2.18 (M09-T16).
 *
 * 3 fog volumes:
 *   1. Surface: minimal fog (atmospheric haze)
 *   2. Lower levels: humidity fog (increasing with depth)
 *   3. Level 3: localized volumetric fog (chamber atmosphere)
 *
 * Density is kept low enough to preserve scientific visibility.
 */

export type FogVolume = 'surface' | 'lower-levels' | 'level-3';

export interface FogConfig {
  volume: FogVolume;
  density: number;
  color: string;
  near: number; // near plane distance
  far: number; // far plane distance
  enabled: boolean;
}

export const FOG_CONFIGS: Record<FogVolume, FogConfig> = {
  surface: {
    volume: 'surface',
    density: 0.002,
    color: '#d4c498',
    near: 30,
    far: 120,
    enabled: true,
  },
  'lower-levels': {
    volume: 'lower-levels',
    density: 0.008,
    color: '#6a5f45',
    near: 5,
    far: 40,
    enabled: true,
  },
  'level-3': {
    volume: 'level-3',
    density: 0.015,
    color: '#4a3f30',
    near: 2,
    far: 15,
    enabled: true,
  },
};

/**
 * Returns the fog config for a given Y elevation in the Osiris Shaft.
 * Surface (y > -5): surface fog
 * Lower levels (-5 > y > -25): humidity fog
 * Level 3 (y < -25): volumetric fog
 */
export function getFogForElevation(y: number): FogConfig {
  if (y > -5) return FOG_CONFIGS.surface;
  if (y > -25) return FOG_CONFIGS['lower-levels'];
  return FOG_CONFIGS['level-3'];
}

/**
 * Returns all enabled fog volumes.
 */
export function getEnabledFogVolumes(): FogConfig[] {
  return Object.values(FOG_CONFIGS).filter((f) => f.enabled);
}

/**
 * Computes a blended fog density based on camera elevation.
 * This allows smooth transitions between fog volumes as the camera descends.
 */
export function getBlendedFogDensity(y: number): number {
  if (y > -5) return FOG_CONFIGS.surface.density;
  if (y > -25) {
    const t = (y - -5) / (-25 - -5);
    return FOG_CONFIGS.surface.density * (1 - t) + FOG_CONFIGS['lower-levels'].density * t;
  }
  const t = Math.max(0, (y - -25) / (-35 - -25));
  return FOG_CONFIGS['lower-levels'].density * (1 - t) + FOG_CONFIGS['level-3'].density * t;
}
