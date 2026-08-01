/**
 * Procedural wet surface system per GIZA-03 §2.17 (M09-T14).
 *
 * Computes per-surface wetness from multiple environmental factors and
 * generates the material parameter adjustments and shader uniforms needed
 * to render wet surfaces realistically.
 *
 * Wetness levels (0-100%):
 *   - Dry       (0-25%)   no visible moisture
 *   - Damp      (25-60%)  slight darkening, minor roughness reduction
 *   - Wet       (60-90%)  strong darkening, specular increase, reflections
 *   - Submerged (90-100%) full water film, mirror-like reflections
 *
 * All effects are scientifically grounded — no fantasy elements.
 */

import type { MoistureGradient } from './environmentalRendering';

// ─── Wetness levels ────────────────────────────────────────────────────────

export type WetnessLevel = 'Dry' | 'Damp' | 'Wet' | 'Submerged';

export interface WetnessThresholds {
  /** Below this % wetness a surface is considered Dry */
  dry: number;
  /** Below this % wetness a surface is considered Damp */
  damp: number;
  /** Below this % wetness a surface is considered Wet */
  wet: number;
  /** At or above this % wetness a surface is considered Submerged */
  submerged: number;
}

export const WETNESS_THRESHOLDS: WetnessThresholds = {
  dry: 25,
  damp: 60,
  wet: 90,
  submerged: 90,
};

// ─── Wet surface configuration ─────────────────────────────────────────────

export interface WaterSource {
  /** World-space position of the water source */
  position: { x: number; y: number; z: number };
  /** Influence radius in meters */
  radius: number;
}

export interface WetSurfaceConfig {
  /** Rainfall rate (mm/hour) — 0 means no rain */
  rainfallRate: number;
  /** Ambient humidity (0-1) */
  humidity: number;
  /** Material porosity (0-1); porous materials absorb more water */
  porosity: number;
  /** Water sources that increase nearby surface wetness */
  waterSources: WaterSource[];
  /** Moisture gradient (integrates with environmental rendering) */
  moistureGradient: MoistureGradient;
  /** Whether droplet/ripple animation is enabled */
  animationEnabled: boolean;
}

export const DEFAULT_WET_SURFACE_CONFIG: WetSurfaceConfig = {
  rainfallRate: 0,
  humidity: 0.5,
  porosity: 0.3,
  waterSources: [],
  moistureGradient: {
    enabled: true,
    surfaceHumidity: 0.2,
    deepHumidity: 0.85,
    wetnessThreshold: 0.6,
  },
  animationEnabled: true,
};

// ─── Material parameters ───────────────────────────────────────────────────

export interface WetMaterialParams {
  /** Roughness reduction factor (0-1); applied multiplicatively to base roughness */
  roughnessReduction: number;
  /** Specular intensity increase (0-1); added to base specular */
  specularIncrease: number;
  /** Albedo darkening factor (0-1); 1 = no darkening, 0 = fully black */
  darkeningFactor: number;
  /** Reflection intensity (0-1); strength of planar reflections */
  reflectionIntensity: number;
}

// ─── Animation ─────────────────────────────────────────────────────────────

export interface WaterDroplet {
  /** Surface-space UV position (0-1) */
  u: number;
  v: number;
  /** Droplet radius in meters */
  radius: number;
  /** Current age in seconds */
  age: number;
  /** Maximum lifetime in seconds */
  lifetime: number;
}

export interface SurfaceRipple {
  /** Surface-space UV origin (0-1) */
  u: number;
  v: number;
  /** Current radius in meters */
  radius: number;
  /** Maximum radius in meters */
  maxRadius: number;
  /** Amplitude (0-1) */
  amplitude: number;
  /** Current age in seconds */
  age: number;
  /** Maximum lifetime in seconds */
  lifetime: number;
}

export interface WetSurfaceAnimation {
  droplets: WaterDroplet[];
  ripples: SurfaceRipple[];
}

// ─── Shader uniforms ───────────────────────────────────────────────────────

export interface WetSurfaceUniforms {
  /** Wetness amount (0-1) */
  uWetness: number;
  /** Roughness reduction (0-1) */
  uRoughnessReduction: number;
  /** Specular increase (0-1) */
  uSpecularIncrease: number;
  /** Darkening factor (0-1) */
  uDarkeningFactor: number;
  /** Reflection intensity (0-1) */
  uReflectionIntensity: number;
  /** Droplet count */
  uDropletCount: number;
  /** Ripple count */
  uRippleCount: number;
  /** Animation time in seconds */
  uTime: number;
}

// ─── Wetness computation ───────────────────────────────────────────────────

/**
 * Classifies a wetness percentage (0-100) into a discrete level.
 */
export function classifyWetness(wetnessPercent: number): WetnessLevel {
  if (wetnessPercent < WETNESS_THRESHOLDS.dry) return 'Dry';
  if (wetnessPercent < WETNESS_THRESHOLDS.damp) return 'Damp';
  if (wetnessPercent < WETNESS_THRESHOLDS.wet) return 'Wet';
  return 'Submerged';
}

/**
 * Computes the wetness contribution from proximity to water sources.
 * Returns a value in the range 0-100 (% wetness).
 * Surfaces inside the influence radius receive up to 100% wetness,
 * falling off linearly to 0 at the radius edge.
 */
export function computeProximityWetness(
  surfacePosition: { x: number; y: number; z: number },
  waterSources: WaterSource[],
): number {
  let maxWetness = 0;
  for (const source of waterSources) {
    const dx = surfacePosition.x - source.position.x;
    const dy = surfacePosition.y - source.position.y;
    const dz = surfacePosition.z - source.position.z;
    const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
    if (distance < source.radius) {
      const proximityFactor = 1 - distance / source.radius;
      maxWetness = Math.max(maxWetness, proximityFactor * 100);
    }
  }
  return maxWetness;
}

/**
 * Computes the wetness contribution from rainfall.
 * Returns a value in the range 0-100 (% wetness).
 * Rainfall rate is in mm/hour. Heavy rain (>25 mm/h) saturates surfaces.
 */
export function computeRainfallWetness(rainfallRate: number, porosity: number): number {
  if (rainfallRate <= 0) return 0;
  // Non-porous surfaces pool water faster; porous surfaces absorb it
  const absorptionFactor = 1 - porosity * 0.4;
  const saturated = 25; // mm/hour at which surface is fully wet
  return Math.min(100, (rainfallRate / saturated) * 100 * absorptionFactor);
}

/**
 * Computes the wetness contribution from ambient humidity.
 * Returns a value in the range 0-100 (% wetness).
 * Humidity above 60% begins to deposit moisture on surfaces.
 */
export function computeHumidityWetness(humidity: number, porosity: number): number {
  if (humidity <= 0.6) return 0;
  const excess = humidity - 0.6;
  // Porous materials retain more moisture from humid air
  const retentionFactor = 0.5 + porosity * 0.5;
  return Math.min(100, excess * 250 * retentionFactor);
}

/**
 * Computes the total per-surface wetness percentage (0-100) from all factors.
 * Combines proximity to water, rainfall, humidity, and material porosity.
 */
export function computeSurfaceWetness(
  surfacePosition: { x: number; y: number; z: number },
  config: WetSurfaceConfig,
): number {
  const proximity = computeProximityWetness(surfacePosition, config.waterSources);
  const rainfall = computeRainfallWetness(config.rainfallRate, config.porosity);
  const humidity = computeHumidityWetness(config.humidity, config.porosity);
  // Take the dominant factor but allow humidity to add a small contribution
  const total = Math.max(proximity, rainfall) + humidity * 0.3;
  return Math.min(100, Math.max(0, total));
}

// ─── Material parameter generation ─────────────────────────────────────────

/**
 * Generates wet surface material parameters from a wetness percentage.
 *   - Dry:       no modification
 *   - Damp:      slight darkening, minor roughness reduction
 *   - Wet:       strong darkening, specular increase, reflections
 *   - Submerged: full water film, mirror-like reflections
 */
export function generateWetMaterialParams(wetnessPercent: number): WetMaterialParams {
  const t = Math.max(0, Math.min(1, wetnessPercent / 100));
  // Roughness reduction: up to 70% reduction when fully wet
  const roughnessReduction = t * 0.7;
  // Specular increase: scales with wetness, up to 0.6
  const specularIncrease = t * 0.6;
  // Darkening: up to 40% darker (factor 0.6)
  const darkeningFactor = 1 - t * 0.4;
  // Reflection intensity: only meaningful above Damp threshold
  const reflectionThreshold = WETNESS_THRESHOLDS.damp / 100;
  const reflectionT = Math.max(0, (t - reflectionThreshold) / (1 - reflectionThreshold));
  const reflectionIntensity = reflectionT * 0.9;

  return {
    roughnessReduction,
    specularIncrease,
    darkeningFactor,
    reflectionIntensity,
  };
}

// ─── Animation ─────────────────────────────────────────────────────────────

/**
 * Generates animated water droplets for a wet surface.
 * Droplet count scales with wetness — drier surfaces have few or no droplets.
 */
export function generateDroplets(
  wetnessPercent: number,
  surfaceArea: number,
  seed: number,
): WaterDroplet[] {
  if (wetnessPercent < WETNESS_THRESHOLDS.damp) return [];
  const density = 0.5; // droplets per square meter at full wetness
  const t = wetnessPercent / 100;
  const count = Math.floor(density * surfaceArea * t);
  const droplets: WaterDroplet[] = [];
  // Deterministic pseudo-random based on seed
  let state = seed;
  const rand = (): number => {
    state = (state * 1103515245 + 12345) & 0x7fffffff;
    return state / 0x7fffffff;
  };
  for (let i = 0; i < count; i++) {
    droplets.push({
      u: rand(),
      v: rand(),
      radius: 0.005 + rand() * 0.01,
      age: rand() * 5,
      lifetime: 3 + rand() * 4,
    });
  }
  return droplets;
}

/**
 * Generates surface ripples from droplet impacts.
 * Each droplet above the Wet threshold can produce a ripple.
 */
export function generateRipples(
  droplets: WaterDroplet[],
  wetnessPercent: number,
  seed: number,
): SurfaceRipple[] {
  if (wetnessPercent < WETNESS_THRESHOLDS.damp) return [];
  const ripples: SurfaceRipple[] = [];
  let state = seed + 1;
  const rand = (): number => {
    state = (state * 1103515245 + 12345) & 0x7fffffff;
    return state / 0x7fffffff;
  };
  // Only a fraction of droplets produce visible ripples
  const rippleFraction = 0.3;
  for (const droplet of droplets) {
    if (rand() < rippleFraction) {
      ripples.push({
        u: droplet.u,
        v: droplet.v,
        radius: droplet.radius * 2,
        maxRadius: 0.1 + rand() * 0.15,
        amplitude: 0.3 + rand() * 0.4,
        age: droplet.age,
        lifetime: 1.5 + rand() * 1.5,
      });
    }
  }
  return ripples;
}

/**
 * Advances droplet and ripple animation by a time delta.
 * Droplets age and are removed when they exceed their lifetime.
 * Ripples expand outward and fade.
 */
export function advanceAnimation(
  animation: WetSurfaceAnimation,
  deltaTime: number,
): WetSurfaceAnimation {
  const droplets = animation.droplets
    .map((d) => ({ ...d, age: d.age + deltaTime }))
    .filter((d) => d.age < d.lifetime);
  const ripples = animation.ripples
    .map((r) => {
      const age = r.age + deltaTime;
      const progress = age / r.lifetime;
      const radius = r.maxRadius * progress;
      const amplitude = r.amplitude * (1 - progress);
      return { ...r, age, radius, amplitude };
    })
    .filter((r) => r.age < r.lifetime);
  return { droplets, ripples };
}

// ─── Shader uniforms ───────────────────────────────────────────────────────

/**
 * Builds the shader uniforms for wet surface rendering.
 */
export function buildWetSurfaceUniforms(
  wetnessPercent: number,
  params: WetMaterialParams,
  animation: WetSurfaceAnimation,
  time: number,
): WetSurfaceUniforms {
  return {
    uWetness: wetnessPercent / 100,
    uRoughnessReduction: params.roughnessReduction,
    uSpecularIncrease: params.specularIncrease,
    uDarkeningFactor: params.darkeningFactor,
    uReflectionIntensity: params.reflectionIntensity,
    uDropletCount: animation.droplets.length,
    uRippleCount: animation.ripples.length,
    uTime: time,
  };
}

// ─── Environmental rendering integration ───────────────────────────────────

/**
 * Integrates wet surface computation with the environmental rendering system.
 * Uses the moisture gradient to add a depth-based wetness contribution,
 * then combines it with the per-surface wetness from other factors.
 */
export function computeIntegratedWetness(
  surfacePosition: { x: number; y: number; z: number },
  config: WetSurfaceConfig,
): number {
  const surfaceWetness = computeSurfaceWetness(surfacePosition, config);
  // Add moisture-gradient contribution based on Y elevation
  if (config.moistureGradient.enabled) {
    const y = surfacePosition.y;
    const t = Math.max(0, Math.min(1, -y / 30));
    const gradientMoisture =
      config.moistureGradient.surfaceHumidity +
      (config.moistureGradient.deepHumidity - config.moistureGradient.surfaceHumidity) * t;
    const gradientWetness =
      Math.max(
        0,
        (gradientMoisture - config.moistureGradient.wetnessThreshold) /
          (1 - config.moistureGradient.wetnessThreshold),
      ) * 100;
    return Math.min(100, Math.max(surfaceWetness, gradientWetness));
  }
  return surfaceWetness;
}
