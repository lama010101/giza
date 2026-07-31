/**
 * Hydraulic visualization per GIZA-06 §1.10 (M10-T13).
 *
 * 5 visualization layers:
 *   1. Animated streamlines
 *   2. Velocity arrows
 *   3. Pressure heatmaps
 *   4. Water surface animation
 *   5. Particle tracers
 *
 * Researchers may display multiple overlays simultaneously.
 * Scientific units are displayed.
 */

import type { HydraulicSolverResult } from './hydraulicSolver';

export type VisualizationLayer =
  | 'streamlines'
  | 'velocity-arrows'
  | 'pressure-heatmap'
  | 'surface-animation'
  | 'particle-tracers';

export const ALL_VISUALIZATION_LAYERS: VisualizationLayer[] = [
  'streamlines',
  'velocity-arrows',
  'pressure-heatmap',
  'surface-animation',
  'particle-tracers',
];

export interface VisualizationConfig {
  enabledLayers: Set<VisualizationLayer>;
  colorScale: 'viridis' | 'plasma' | 'coolwarm' | 'grayscale';
  arrowScale: number; // multiplier for arrow length
  streamlineDensity: number; // number of streamlines
  particleCount: number; // number of particle tracers
  showUnits: boolean;
}

export const DEFAULT_VISUALIZATION_CONFIG: VisualizationConfig = {
  enabledLayers: new Set<VisualizationLayer>(['velocity-arrows', 'pressure-heatmap']),
  colorScale: 'viridis',
  arrowScale: 1.0,
  streamlineDensity: 20,
  particleCount: 100,
  showUnits: true,
};

// ─── Color scales ─────────────────────────────────────────────────────────

export function colorScaleValue(
  value: number,
  min: number,
  max: number,
  scale: VisualizationConfig['colorScale'],
): string {
  const t = Math.max(0, Math.min(1, (value - min) / (max - min || 1)));
  switch (scale) {
    case 'viridis': {
      // Viridis approximation: dark purple → blue → green → yellow
      const r = Math.round(68 + (253 - 68) * t);
      const g = Math.round(1 + (231 - 1) * t);
      const b = Math.round(84 + (37 - 84) * t);
      return `rgb(${r}, ${g}, ${b})`;
    }
    case 'plasma': {
      // Plasma approximation: dark purple → magenta → orange → yellow
      const r = Math.round(13 + (240 - 13) * t);
      const g = Math.round(8 + (125 - 8) * t);
      const b = Math.round(135 + (0 - 135) * t);
      return `rgb(${r}, ${g}, ${b})`;
    }
    case 'coolwarm': {
      // Cool-warm: blue → white → red
      if (t < 0.5) {
        const tt = t * 2;
        const r = Math.round(59 + (221 - 59) * tt);
        const g = Math.round(76 + (221 - 76) * tt);
        const b = Math.round(197 + (221 - 197) * tt);
        return `rgb(${r}, ${g}, ${b})`;
      }
      const tt = (t - 0.5) * 2;
      const r = Math.round(221 + (180 - 221) * tt);
      const g = Math.round(221 + (4 - 221) * tt);
      const b = Math.round(221 + (38 - 221) * tt);
      return `rgb(${r}, ${g}, ${b})`;
    }
    case 'grayscale': {
      const v = Math.round(255 * t);
      return `rgb(${v}, ${v}, ${v})`;
    }
  }
}

// ─── Streamline generation ────────────────────────────────────────────────

export interface StreamlinePoint {
  position: { x: number; y: number; z: number };
  velocity: { x: number; y: number; z: number };
}

export interface Streamline {
  id: string;
  points: StreamlinePoint[];
}

/**
 * Generates streamlines from the velocity field.
 * Streamlines follow the flow direction from seed points.
 */
export function generateStreamlines(result: HydraulicSolverResult, density: number): Streamline[] {
  const streamlines: Streamline[] = [];
  const velocityPoints = result.velocityVectors;

  if (velocityPoints.length === 0) return streamlines;

  // Seed streamlines at regular intervals along the conduit
  for (let i = 0; i < density; i++) {
    const seedT = i / density;
    const seedPoint = velocityPoints[Math.floor(seedT * velocityPoints.length)];
    if (!seedPoint) continue;

    const points: StreamlinePoint[] = [];
    const pos = { ...seedPoint.position };
    const vel = { ...seedPoint.velocity };
    const stepSize = 0.1;
    const maxSteps = 50;

    for (let step = 0; step < maxSteps; step++) {
      points.push({ position: { ...pos }, velocity: { ...vel } });
      pos.x += vel.x * stepSize;
      pos.y += vel.y * stepSize;
      pos.z += vel.z * stepSize;
      // Simplified: velocity stays constant (real impl would interpolate)
      if (Math.abs(pos.z) > 10) break; // stop when out of bounds
    }

    streamlines.push({
      id: `streamline-${i}`,
      points,
    });
  }

  return streamlines;
}

// ─── Velocity arrow generation ────────────────────────────────────────────

export interface VelocityArrow {
  position: { x: number; y: number; z: number };
  direction: { x: number; y: number; z: number };
  magnitude: number; // m/s
  label: string; // e.g. "0.85 m/s"
}

export function generateVelocityArrows(
  result: HydraulicSolverResult,
  _scale: number,
  showUnits: boolean,
): VelocityArrow[] {
  return result.velocityVectors.map(
    (point, i) =>
      ({
        position: point.position,
        direction: point.velocity,
        magnitude: point.velocityMagnitude,
        label: showUnits
          ? `${point.velocityMagnitude.toFixed(2)} m/s`
          : `${point.velocityMagnitude.toFixed(2)}`,
        id: `arrow-${i}`,
      }) as VelocityArrow & { id: string },
  );
}

// ─── Pressure heatmap ─────────────────────────────────────────────────────

export interface PressureHeatmapPoint {
  position: { x: number; y: number; z: number };
  pressure: number; // Pa
  pressureKPa: number; // kPa
  color: string;
  label: string;
}

export function generatePressureHeatmap(
  result: HydraulicSolverResult,
  scale: VisualizationConfig['colorScale'],
  showUnits: boolean,
): PressureHeatmapPoint[] {
  const pressures = result.pressureField.map((p) => p.pressure);
  const minP = Math.min(...pressures);
  const maxP = Math.max(...pressures);

  return result.pressureField.map(
    (point, i) =>
      ({
        position: point.position,
        pressure: point.pressure,
        pressureKPa: point.pressure / 1000,
        color: colorScaleValue(point.pressure, minP, maxP, scale),
        label: showUnits
          ? `${(point.pressure / 1000).toFixed(2)} kPa`
          : `${(point.pressure / 1000).toFixed(2)}`,
        id: `pressure-${i}`,
      }) as PressureHeatmapPoint & { id: string },
  );
}

// ─── Particle tracers ─────────────────────────────────────────────────────

export interface ParticleTracer {
  id: string;
  position: { x: number; y: number; z: number };
  age: number; // seconds
  lifetime: number; // seconds
}

export function generateParticleTracers(
  result: HydraulicSolverResult,
  count: number,
): ParticleTracer[] {
  const particles: ParticleTracer[] = [];
  const velocityPoints = result.velocityVectors;

  for (let i = 0; i < count; i++) {
    const sourcePoint = velocityPoints[0];
    if (!sourcePoint) continue;
    particles.push({
      id: `particle-${i}`,
      position: {
        x: sourcePoint.position.x + (Math.random() - 0.5) * 0.3,
        y: sourcePoint.position.y + (Math.random() - 0.5) * 0.3,
        z: sourcePoint.position.z,
      },
      age: 0,
      lifetime: 5 + Math.random() * 10,
    });
  }

  return particles;
}

// ─── Water surface animation ──────────────────────────────────────────────

export interface SurfaceAnimationConfig {
  amplitude: number;
  frequency: number;
  phase: number;
}

export function generateSurfaceAnimation(
  result: HydraulicSolverResult,
  time: number,
): SurfaceAnimationConfig {
  return {
    amplitude: 0.02 + result.turbulenceIntensity * 0.05,
    frequency: 1.5 + result.turbulenceIntensity * 2,
    phase: time * 2,
  };
}

// ─── Complete visualization bundle ────────────────────────────────────────

export interface VisualizationBundle {
  streamlines: Streamline[];
  velocityArrows: VelocityArrow[];
  pressureHeatmap: PressureHeatmapPoint[];
  particleTracers: ParticleTracer[];
  surfaceAnimation: SurfaceAnimationConfig;
  config: VisualizationConfig;
}

export function generateVisualization(
  result: HydraulicSolverResult,
  config: VisualizationConfig,
  time = 0,
): VisualizationBundle {
  return {
    streamlines: config.enabledLayers.has('streamlines')
      ? generateStreamlines(result, config.streamlineDensity)
      : [],
    velocityArrows: config.enabledLayers.has('velocity-arrows')
      ? generateVelocityArrows(result, config.arrowScale, config.showUnits)
      : [],
    pressureHeatmap: config.enabledLayers.has('pressure-heatmap')
      ? generatePressureHeatmap(result, config.colorScale, config.showUnits)
      : [],
    particleTracers: config.enabledLayers.has('particle-tracers')
      ? generateParticleTracers(result, config.particleCount)
      : [],
    surfaceAnimation: config.enabledLayers.has('surface-animation')
      ? generateSurfaceAnimation(result, time)
      : { amplitude: 0, frequency: 0, phase: 0 },
    config,
  };
}
