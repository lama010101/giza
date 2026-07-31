/**
 * Hydraulic visualization per M10-T13.
 *
 * Provides visualization data for hydraulic simulations:
 *   - Streamlines (flow paths)
 *   - Velocity arrows (direction + magnitude)
 *   - Pressure heatmaps (color-mapped pressure field)
 *   - Velocity magnitude heatmaps
 *   - Vorticity contours
 */

export interface Vector3 {
  x: number;
  y: number;
  z: number;
}

export interface Streamline {
  id: string;
  points: Vector3[];
  velocity: number; // average velocity along the line
}

export interface VelocityArrow {
  position: Vector3;
  direction: Vector3;
  magnitude: number;
}

export interface HeatmapCell {
  position: Vector3;
  size: number;
  value: number; // normalized 0-1
  rawValue: number;
}

export type HydraulicVisualizationType =
  | 'streamlines'
  | 'velocity-arrows'
  | 'pressure-heatmap'
  | 'velocity-heatmap'
  | 'vorticity-contours';

export interface HydraulicVisualizationData {
  type: HydraulicVisualizationType;
  streamlines?: Streamline[];
  velocityArrows?: VelocityArrow[];
  heatmap?: HeatmapCell[];
  contours?: Vector3[][];
  colorMap: string[]; // hex colors
  units: string;
  minValue: number;
  maxValue: number;
}

/**
 * Generates streamlines from a velocity field using Runge-Kutta integration.
 */
export function generateStreamlines(
  velocityField: { position: Vector3; velocity: Vector3 }[],
  seedPoints: Vector3[],
  maxSteps = 100,
  stepSize = 0.1,
): Streamline[] {
  const streamlines: Streamline[] = [];

  for (let i = 0; i < seedPoints.length; i++) {
    const seed = seedPoints[i];
    const points: Vector3[] = [{ ...seed }];
    let current = { ...seed };
    let totalVelocity = 0;

    for (let step = 0; step < maxSteps; step++) {
      // Find nearest velocity sample
      const nearest = findNearestVelocity(current, velocityField);
      if (!nearest) break;

      // RK4 integration step
      const k1 = nearest.velocity;
      const k2 =
        sampleVelocity(
          {
            x: current.x + (k1.x * stepSize) / 2,
            y: current.y + (k1.y * stepSize) / 2,
            z: current.z + (k1.z * stepSize) / 2,
          },
          velocityField,
        ) ?? k1;
      const k3 =
        sampleVelocity(
          {
            x: current.x + (k2.x * stepSize) / 2,
            y: current.y + (k2.y * stepSize) / 2,
            z: current.z + (k2.z * stepSize) / 2,
          },
          velocityField,
        ) ?? k1;
      const k4 =
        sampleVelocity(
          {
            x: current.x + k3.x * stepSize,
            y: current.y + k3.y * stepSize,
            z: current.z + k3.z * stepSize,
          },
          velocityField,
        ) ?? k1;

      current = {
        x: current.x + (stepSize / 6) * (k1.x + 2 * k2.x + 2 * k3.x + k4.x),
        y: current.y + (stepSize / 6) * (k1.y + 2 * k2.y + 2 * k3.y + k4.y),
        z: current.z + (stepSize / 6) * (k1.z + 2 * k2.z + 2 * k3.z + k4.z),
      };

      const speed = Math.sqrt(k1.x ** 2 + k1.y ** 2 + k1.z ** 2);
      totalVelocity += speed;
      points.push({ ...current });

      if (speed < 0.001) break; // Stagnation
    }

    streamlines.push({
      id: `streamline-${i}`,
      points,
      velocity: totalVelocity / points.length,
    });
  }

  return streamlines;
}

/**
 * Generates velocity arrows from a velocity field.
 */
export function generateVelocityArrows(
  velocityField: { position: Vector3; velocity: Vector3 }[],
  arrowSpacing = 1.0,
): VelocityArrow[] {
  return velocityField
    .filter((_, i) => i % Math.max(1, Math.floor(arrowSpacing)) === 0)
    .map((sample) => {
      const magnitude = Math.sqrt(
        sample.velocity.x ** 2 + sample.velocity.y ** 2 + sample.velocity.z ** 2,
      );

      return {
        position: sample.position,
        direction:
          magnitude > 0
            ? {
                x: sample.velocity.x / magnitude,
                y: sample.velocity.y / magnitude,
                z: sample.velocity.z / magnitude,
              }
            : { x: 0, y: 0, z: 0 },
        magnitude,
      };
    });
}

/**
 * Generates a pressure heatmap from a pressure field.
 */
export function generatePressureHeatmap(
  pressureField: { position: Vector3; pressure: number }[],
): HeatmapCell[] {
  const pressures = pressureField.map((p) => p.pressure);
  const minPressure = Math.min(...pressures);
  const maxPressure = Math.max(...pressures);
  const range = maxPressure - minPressure || 1;

  return pressureField.map((sample) => ({
    position: sample.position,
    size: 0.5,
    value: (sample.pressure - minPressure) / range,
    rawValue: sample.pressure,
  }));
}

/**
 * Generates a velocity magnitude heatmap.
 */
export function generateVelocityHeatmap(
  velocityField: { position: Vector3; velocity: Vector3 }[],
): HeatmapCell[] {
  const magnitudes = velocityField.map((s) =>
    Math.sqrt(s.velocity.x ** 2 + s.velocity.y ** 2 + s.velocity.z ** 2),
  );
  const minMag = Math.min(...magnitudes);
  const maxMag = Math.max(...magnitudes);
  const range = maxMag - minMag || 1;

  return velocityField.map((sample, i) => ({
    position: sample.position,
    size: 0.5,
    value: (magnitudes[i] - minMag) / range,
    rawValue: magnitudes[i],
  }));
}

/**
 * Default color map for hydraulic visualizations (blue → green → yellow → red).
 */
export const HYDRAULIC_COLOR_MAP: string[] = [
  '#0000ff', // blue (low)
  '#00ffff', // cyan
  '#00ff00', // green
  '#ffff00', // yellow
  '#ff0000', // red (high)
];

/**
 * Assembles complete visualization data for a given type.
 */
export function buildVisualization(
  type: HydraulicVisualizationType,
  velocityField: { position: Vector3; velocity: Vector3 }[],
  pressureField?: { position: Vector3; pressure: number }[],
): HydraulicVisualizationData {
  switch (type) {
    case 'streamlines': {
      const seeds = velocityField.slice(0, 10).map((s) => s.position);
      const streamlines = generateStreamlines(velocityField, seeds);
      return {
        type,
        streamlines,
        colorMap: HYDRAULIC_COLOR_MAP,
        units: 'm/s',
        minValue: 0,
        maxValue: Math.max(...streamlines.map((s) => s.velocity)),
      };
    }
    case 'velocity-arrows': {
      const arrows = generateVelocityArrows(velocityField);
      return {
        type,
        velocityArrows: arrows,
        colorMap: HYDRAULIC_COLOR_MAP,
        units: 'm/s',
        minValue: 0,
        maxValue: Math.max(...arrows.map((a) => a.magnitude)),
      };
    }
    case 'pressure-heatmap': {
      if (!pressureField) throw new Error('Pressure field required for pressure heatmap');
      const heatmap = generatePressureHeatmap(pressureField);
      return {
        type,
        heatmap,
        colorMap: HYDRAULIC_COLOR_MAP,
        units: 'Pa',
        minValue: Math.min(...pressureField.map((p) => p.pressure)),
        maxValue: Math.max(...pressureField.map((p) => p.pressure)),
      };
    }
    case 'velocity-heatmap': {
      const heatmap = generateVelocityHeatmap(velocityField);
      const mags = velocityField.map((s) =>
        Math.sqrt(s.velocity.x ** 2 + s.velocity.y ** 2 + s.velocity.z ** 2),
      );
      return {
        type,
        heatmap,
        colorMap: HYDRAULIC_COLOR_MAP,
        units: 'm/s',
        minValue: Math.min(...mags),
        maxValue: Math.max(...mags),
      };
    }
    case 'vorticity-contours': {
      // Simplified: just return empty contours
      return {
        type,
        contours: [],
        colorMap: HYDRAULIC_COLOR_MAP,
        units: '1/s',
        minValue: 0,
        maxValue: 0,
      };
    }
  }
}

// ─── Helper functions ─────────────────────────────────────────────────────

function findNearestVelocity(
  point: Vector3,
  field: { position: Vector3; velocity: Vector3 }[],
): { position: Vector3; velocity: Vector3 } | undefined {
  let nearest: { position: Vector3; velocity: Vector3 } | undefined;
  let minDist = Infinity;

  for (const sample of field) {
    const dx = sample.position.x - point.x;
    const dy = sample.position.y - point.y;
    const dz = sample.position.z - point.z;
    const dist = dx * dx + dy * dy + dz * dz;
    if (dist < minDist) {
      minDist = dist;
      nearest = sample;
    }
  }

  return nearest;
}

function sampleVelocity(
  point: Vector3,
  field: { position: Vector3; velocity: Vector3 }[],
): Vector3 | undefined {
  return findNearestVelocity(point, field)?.velocity;
}

// ─── Backward-compatible API ──────────────────────────────────────────────

import type { HydraulicSolverResult, HydraulicFieldPoint } from './hydraulicSolver';

export interface VisualizationConfig {
  showStreamlines: boolean;
  showVelocityArrows: boolean;
  showPressureHeatmap: boolean;
  showVelocityHeatmap: boolean;
  arrowSpacing: number;
  streamlineCount: number;
  colorMap: string[];
}

export const DEFAULT_VISUALIZATION_CONFIG: VisualizationConfig = {
  showStreamlines: true,
  showVelocityArrows: true,
  showPressureHeatmap: true,
  showVelocityHeatmap: false,
  arrowSpacing: 2,
  streamlineCount: 10,
  colorMap: HYDRAULIC_COLOR_MAP,
};

export interface VisualizationBundle {
  streamlines: Streamline[];
  velocityArrows: VelocityArrow[];
  pressureHeatmap: HeatmapCell[];
  velocityHeatmap: HeatmapCell[];
  colorMap: string[];
  units: string;
  minValue: number;
  maxValue: number;
}

/**
 * Generates visualization data from a hydraulic solver result.
 * Backward-compatible with the old API.
 */
export function generateVisualization(
  result: HydraulicSolverResult,
  config: VisualizationConfig,
  _timeStep: number,
): VisualizationBundle {
  const velocityField: { position: Vector3; velocity: Vector3 }[] = result.velocityVectors.map(
    (p: HydraulicFieldPoint) => ({ position: p.position, velocity: p.velocity }),
  );
  const pressureField = result.pressureField.map((p: HydraulicFieldPoint) => ({
    position: p.position,
    pressure: p.pressure,
  }));

  const streamlines = config.showStreamlines
    ? generateStreamlines(
        velocityField,
        velocityField.slice(0, config.streamlineCount).map((s) => s.position),
      )
    : [];
  const velocityArrows = config.showVelocityArrows
    ? generateVelocityArrows(velocityField, config.arrowSpacing)
    : [];
  const pressureHeatmap = config.showPressureHeatmap ? generatePressureHeatmap(pressureField) : [];
  const velocityHeatmap = config.showVelocityHeatmap ? generateVelocityHeatmap(velocityField) : [];

  const magnitudes = result.velocityVectors.map((p) => p.velocityMagnitude);
  const minVal = Math.min(...magnitudes, 0);
  const maxVal = Math.max(...magnitudes, 1);

  return {
    streamlines,
    velocityArrows,
    pressureHeatmap,
    velocityHeatmap,
    colorMap: config.colorMap,
    units: 'm/s',
    minValue: minVal,
    maxValue: maxVal,
  };
}
