/**
 * Environmental rendering per GIZA-03 §2.17 (M09-T12).
 *
 * Procedural environmental effects:
 *   - Moisture gradients (humidity-based wetness)
 *   - Mineral staining (surface discoloration)
 *   - Calcite deposits (white crystalline deposits)
 *   - Surface roughness variation
 *   - Dust accumulation
 *   - Airborne particles
 *   - Dripping water
 *
 * NO fantasy cave elements — all effects are scientifically grounded.
 */

export interface EnvironmentalConfig {
  moistureGradient: MoistureGradient;
  mineralStaining: MineralStaining;
  calciteDeposits: CalciteDeposits;
  dustAccumulation: DustConfig;
  airborneParticles: ParticleConfig;
  dripping: DrippingConfig;
}

export interface MoistureGradient {
  enabled: boolean;
  /** Humidity at surface (0-1) */
  surfaceHumidity: number;
  /** Humidity at Level 3 (0-1) */
  deepHumidity: number;
  /** Wetness threshold — above this, surfaces appear wet */
  wetnessThreshold: number;
}

export interface MineralStaining {
  enabled: boolean;
  /** Stain color */
  color: string;
  /** Stain intensity (0-1) */
  intensity: number;
  /** Stain frequency (higher = more stains) */
  frequency: number;
}

export interface CalciteDeposits {
  enabled: boolean;
  /** Deposit color */
  color: string;
  /** Deposit intensity (0-1) */
  intensity: number;
  /** Locations where deposits form (typically near water) */
  nearWaterOnly: boolean;
}

export interface DustConfig {
  enabled: boolean;
  /** Dust color */
  color: string;
  /** Dust amount (0-1) */
  amount: number;
  /** Settles on horizontal surfaces only */
  horizontalOnly: boolean;
}

export interface ParticleConfig {
  enabled: boolean;
  /** Particle count */
  count: number;
  /** Particle size (m) */
  size: number;
  /** Particle color */
  color: string;
  /** Fall speed (m/s) */
  fallSpeed: number;
}

export interface DrippingConfig {
  enabled: boolean;
  /** Drip sources count */
  sourceCount: number;
  /** Drip interval (seconds) */
  interval: number;
  /** Drip color */
  color: string;
}

export const DEFAULT_ENVIRONMENTAL_CONFIG: EnvironmentalConfig = {
  moistureGradient: {
    enabled: true,
    surfaceHumidity: 0.2,
    deepHumidity: 0.85,
    wetnessThreshold: 0.6,
  },
  mineralStaining: {
    enabled: true,
    color: '#5a4a30',
    intensity: 0.4,
    frequency: 0.3,
  },
  calciteDeposits: {
    enabled: true,
    color: '#e8e0d0',
    intensity: 0.3,
    nearWaterOnly: true,
  },
  dustAccumulation: {
    enabled: true,
    color: '#d4c498',
    amount: 0.2,
    horizontalOnly: true,
  },
  airborneParticles: {
    enabled: true,
    count: 50,
    size: 0.02,
    color: '#a89868',
    fallSpeed: 0.1,
  },
  dripping: {
    enabled: true,
    sourceCount: 8,
    interval: 3.0,
    color: '#a0c8d8',
  },
};

/**
 * Computes the moisture level at a given Y elevation.
 * Moisture increases with depth — surface is dry, Level 3 is very humid.
 */
export function getMoistureAtY(y: number, config: MoistureGradient): number {
  if (!config.enabled) return 0;
  // Surface (y > 0): surface humidity
  // Level 3 (y < -30): deep humidity
  // Linear interpolation between
  const t = Math.max(0, Math.min(1, -y / 30));
  return config.surfaceHumidity + (config.deepHumidity - config.surfaceHumidity) * t;
}

/**
 * Returns whether a surface at the given elevation should appear wet.
 */
export function isSurfaceWet(y: number, config: MoistureGradient): boolean {
  return getMoistureAtY(y, config) > config.wetnessThreshold;
}

/**
 * Computes the roughness modification from moisture.
 * Wet surfaces have lower roughness (more specular).
 */
export function getRoughnessModification(
  y: number,
  baseRoughness: number,
  config: MoistureGradient,
): number {
  const moisture = getMoistureAtY(y, config);
  if (moisture < config.wetnessThreshold) return baseRoughness;
  // Wet surfaces: roughness reduced by up to 50%
  const wetness = (moisture - config.wetnessThreshold) / (1 - config.wetnessThreshold);
  return baseRoughness * (1 - wetness * 0.5);
}

/**
 * Computes the albedo darkening from moisture.
 * Wet surfaces appear darker.
 */
export function getAlbedoDarkening(y: number, config: MoistureGradient): number {
  const moisture = getMoistureAtY(y, config);
  if (moisture < config.wetnessThreshold) return 1.0;
  const wetness = (moisture - config.wetnessThreshold) / (1 - config.wetnessThreshold);
  return 1.0 - wetness * 0.3; // up to 30% darker
}
