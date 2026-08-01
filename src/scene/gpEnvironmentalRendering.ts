/**
 * Great Pyramid-specific environmental rendering per M11-T24.
 *
 * Defines GP-specific environmental effects:
 *   - Dust particles (per-chamber density based on ventilation/traffic)
 *   - Salt efflorescence (moisture + mineral content on limestone)
 *   - Smoke/torch blackening (near entrances and ceilings)
 *   - Roughness variation (weathered surface maps)
 *
 * Each effect provides shader parameters that can be consumed by the
 * rendering pipeline. Effects are hypothesis-agnostic.
 */

// ─── GP chamber IDs ───────────────────────────────────────────────────────────

export const GP_CHAMBERS = [
  'kings-chamber',
  'queens-chamber',
  'grand-gallery',
  'descending-passage',
  'subterranean-chamber',
  'antechamber',
  'relieving-chambers',
] as const;

export type GPChamberId = (typeof GP_CHAMBERS)[number];

// ─── Dust parameters ──────────────────────────────────────────────────────────

export interface GPDustParams {
  enabled: boolean;
  /** Dust density (particles per m³) */
  density: number;
  /** Dust color (RGBA hex) */
  color: string;
  /** Particle size in mm */
  particleSize: number;
  /** Settling rate (0-1, higher = faster settling) */
  settlingRate: number;
  /** Airborne fraction (0-1) */
  airborneFraction: number;
}

// ─── Salt efflorescence parameters ──────────────────────────────────────────────

export interface SaltEfflorescenceParams {
  enabled: boolean;
  /** Coverage (0-1) */
  coverage: number;
  /** Crystal color */
  color: string;
  /** Crystal size in mm */
  crystalSize: number;
  /** Intensity (0-1) */
  intensity: number;
  /** Preferred wall orientation ('all', 'lower', 'upper', 'ceiling') */
  preferredOrientation: string;
}

// ─── Smoke blackening parameters ────────────────────────────────────────────────

export interface SmokeBlackeningParams {
  enabled: boolean;
  /** Darkening factor (0-1, 1 = fully black) */
  darkening: number;
  /** Soot color */
  color: string;
  /** Coverage (0-1) */
  coverage: number;
  /** Distance from entrance (m) — blackening is strongest near entrances */
  entranceDistance: number;
  /** Ceiling bias (0-1, how much it concentrates on ceilings) */
  ceilingBias: number;
}

// ─── Roughness variation parameters ─────────────────────────────────────────────

export interface RoughnessVariationParams {
  enabled: boolean;
  /** Base roughness (0-1) */
  baseRoughness: number;
  /** Variation amplitude (0-1) */
  amplitude: number;
  /** Spatial frequency (cycles per m) */
  frequency: number;
  /** Weathering scale (0-1, higher = more weathered) */
  weatheringScale: number;
}

// ─── Combined environmental params ──────────────────────────────────────────────

export interface GPEnvironmentalParams {
  chamberId: GPChamberId;
  dust: GPDustParams;
  saltEfflorescence: SaltEfflorescenceParams;
  smokeBlackening: SmokeBlackeningParams;
  roughnessVariation: RoughnessVariationParams;
}

// ─── Chamber properties ─────────────────────────────────────────────────────────

interface ChamberProperties {
  ventilation: number; // 0-1 (1 = well ventilated)
  footTraffic: number; // 0-1 (1 = high traffic)
  age: number; // years
  hasWaterSource: boolean;
  proximityToEntrance: number; // meters
  ceilingHeight: number; // meters
  wallMaterial: 'limestone' | 'granite' | 'basalt';
}

const CHAMBER_PROPERTIES: Record<GPChamberId, ChamberProperties> = {
  'kings-chamber': {
    ventilation: 0.2,
    footTraffic: 0.8,
    age: 4500,
    hasWaterSource: false,
    proximityToEntrance: 80,
    ceilingHeight: 5.84,
    wallMaterial: 'granite',
  },
  'queens-chamber': {
    ventilation: 0.15,
    footTraffic: 0.5,
    age: 4500,
    hasWaterSource: false,
    proximityToEntrance: 60,
    ceilingHeight: 6.23,
    wallMaterial: 'limestone',
  },
  'grand-gallery': {
    ventilation: 0.4,
    footTraffic: 0.9,
    age: 4500,
    hasWaterSource: false,
    proximityToEntrance: 40,
    ceilingHeight: 8.74,
    wallMaterial: 'limestone',
  },
  'descending-passage': {
    ventilation: 0.6,
    footTraffic: 0.7,
    age: 4500,
    hasWaterSource: false,
    proximityToEntrance: 0,
    ceilingHeight: 1.2,
    wallMaterial: 'limestone',
  },
  'subterranean-chamber': {
    ventilation: 0.1,
    footTraffic: 0.3,
    age: 4500,
    hasWaterSource: true,
    proximityToEntrance: 30,
    ceilingHeight: 3.36,
    wallMaterial: 'limestone',
  },
  antechamber: {
    ventilation: 0.3,
    footTraffic: 0.6,
    age: 4500,
    hasWaterSource: false,
    proximityToEntrance: 70,
    ceilingHeight: 3.79,
    wallMaterial: 'granite',
  },
  'relieving-chambers': {
    ventilation: 0.05,
    footTraffic: 0.1,
    age: 4500,
    hasWaterSource: false,
    proximityToEntrance: 90,
    ceilingHeight: 2.0,
    wallMaterial: 'limestone',
  },
};

// ─── Effect computation functions ──────────────────────────────────────────────

/**
 * Computes dust density for a chamber.
 * Dust is higher in poorly ventilated, high-traffic, old chambers.
 */
export function computeDustDensity(chamberId: GPChamberId): number {
  const props = CHAMBER_PROPERTIES[chamberId];
  // Base density from age and ventilation
  const baseDensity = (props.age / 5000) * 1000 * (1 - props.ventilation);
  // Traffic multiplier
  const trafficFactor = 1 + props.footTraffic * 0.5;
  return Math.round(baseDensity * trafficFactor);
}

export function computeDustParams(chamberId: GPChamberId): GPDustParams {
  const density = computeDustDensity(chamberId);
  const props = CHAMBER_PROPERTIES[chamberId];
  return {
    enabled: true,
    density,
    color: '#c4a878',
    particleSize: 0.01 + (1 - props.ventilation) * 0.02,
    settlingRate: 0.3 + props.ventilation * 0.4,
    airborneFraction: Math.max(0.1, 1 - props.ventilation * 0.7),
  };
}

/**
 * Computes salt efflorescence for a chamber wall.
 * Salt deposits form where moisture evaporates from limestone.
 */
export function computeSaltEfflorescence(
  chamberId: GPChamberId,
  wallOrientation: 'all' | 'lower' | 'upper' | 'ceiling' = 'all',
): SaltEfflorescenceParams {
  const props = CHAMBER_PROPERTIES[chamberId];

  // Salt only forms on limestone, not granite
  if (props.wallMaterial !== 'limestone') {
    return {
      enabled: false,
      coverage: 0,
      color: '#e8e0d0',
      crystalSize: 0,
      intensity: 0,
      preferredOrientation: wallOrientation,
    };
  }

  // Moisture from water source or humidity
  const moisture = props.hasWaterSource ? 0.8 : 0.2;
  const coverage = Math.min(0.9, moisture * 0.6 + (1 - props.ventilation) * 0.3);

  return {
    enabled: true,
    coverage,
    color: '#e8e0d0',
    crystalSize: 0.5 + moisture * 1.5,
    intensity: coverage * 0.7,
    preferredOrientation: wallOrientation,
  };
}

/**
 * Computes smoke/torch blackening for a chamber.
 * Blackening is strongest near entrances and on ceilings.
 */
export function computeSmokeBlackening(chamberId: GPChamberId): SmokeBlackeningParams {
  const props = CHAMBER_PROPERTIES[chamberId];

  // Blackening decreases with distance from entrance
  const distanceFactor = Math.max(0, 1 - props.proximityToEntrance / 100);
  const darkening = Math.min(0.6, distanceFactor * 0.5 + 0.1);

  // Ceiling bias — smoke rises
  const ceilingBias = 0.7 + (1 - props.ventilation) * 0.2;

  return {
    enabled: darkening > 0.05,
    darkening,
    color: '#1a1a1a',
    coverage: Math.min(0.8, distanceFactor * 0.6 + 0.1),
    entranceDistance: props.proximityToEntrance,
    ceilingBias,
  };
}

/**
 * Computes roughness variation for weathered surfaces.
 */
export function computeRoughnessVariation(chamberId: GPChamberId): RoughnessVariationParams {
  const props = CHAMBER_PROPERTIES[chamberId];

  // Base roughness by material
  const baseRoughness = props.wallMaterial === 'granite' ? 0.6 : 0.8;
  // Weathering increases with age and moisture
  const weatheringScale = Math.min(1, (props.age / 5000) * 0.7 + (props.hasWaterSource ? 0.3 : 0));
  const amplitude = 0.1 + weatheringScale * 0.2;

  return {
    enabled: true,
    baseRoughness,
    amplitude,
    frequency: 2 + weatheringScale * 3,
    weatheringScale,
  };
}

/**
 * Gets all environmental parameters for a chamber.
 */
export function getGPEnvironmentalParams(chamberId: GPChamberId): GPEnvironmentalParams {
  return {
    chamberId,
    dust: computeDustParams(chamberId),
    saltEfflorescence: computeSaltEfflorescence(chamberId),
    smokeBlackening: computeSmokeBlackening(chamberId),
    roughnessVariation: computeRoughnessVariation(chamberId),
  };
}

/**
 * Gets environmental parameters for all GP chambers.
 */
export function getAllGPEnvironmentalParams(): GPEnvironmentalParams[] {
  return GP_CHAMBERS.map((id) => getGPEnvironmentalParams(id));
}
