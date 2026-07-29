import type { AcousticOutputs } from './acousticSolver';

export type AcousticVisualizationLayer =
  | 'pressureIsosurfaces'
  | 'heatmaps'
  | 'wavefronts'
  | 'particleMotion'
  | 'frequencySpectrum';

export interface IsosurfaceData {
  level: number;
  points: { x: number; y: number; z: number; pressure: number }[];
}

export interface HeatmapData {
  grid: { x: number; z: number; pressure: number }[];
  unit: string;
  range: { min: number; max: number };
}

export interface WavefrontData {
  time: number;
  radius: number;
  amplitude: number;
  sourceX: number;
  sourceY: number;
  sourceZ: number;
}

export interface ParticleMotionData {
  positions: { x: number; y: number; z: number }[];
  velocities: { vx: number; vy: number; vz: number }[];
}

export interface FrequencySpectrumData {
  frequencies: number[];
  spl: number[];
  unit: string;
  peaks: { frequency: number; spl: number }[];
}

export interface AcousticVisualization {
  isosurfaces: IsosurfaceData[];
  heatmaps: HeatmapData[];
  wavefronts: WavefrontData[];
  particleMotion: ParticleMotionData;
  frequencySpectrum: FrequencySpectrumData;
  activeLayers: Set<AcousticVisualizationLayer>;
  unitsDisplayed: boolean;
}

export function buildPressureIsosurfaces(
  outputs: AcousticOutputs,
  levels: number[] = [-0.5, 0, 0.5],
): IsosurfaceData[] {
  return levels.map((level) => ({
    level,
    points: outputs.pressureDistribution.filter((p) => Math.abs(p.pressure - level) < 0.15),
  }));
}

export function buildHeatmap(outputs: AcousticOutputs): HeatmapData {
  const pressures = outputs.pressureDistribution.map((p) => p.pressure);
  const min = Math.min(...pressures);
  const max = Math.max(...pressures);

  const grid = outputs.pressureDistribution
    .filter((p) => p.y < 0.01 || p.y > 0.01)
    .map((p) => ({ x: p.x, z: p.z, pressure: p.pressure }));

  return {
    grid,
    unit: 'Pa (relative)',
    range: { min, max },
  };
}

export function buildWavefronts(
  sourceLocation: { x: number; y: number; z: number },
  speedOfSound: number,
  maxTime: number,
  steps = 10,
): WavefrontData[] {
  const wavefronts: WavefrontData[] = [];
  for (let i = 1; i <= steps; i++) {
    const t = (i / steps) * maxTime;
    wavefronts.push({
      time: t,
      radius: speedOfSound * t,
      amplitude: 1 / (1 + t),
      sourceX: sourceLocation.x,
      sourceY: sourceLocation.y,
      sourceZ: sourceLocation.z,
    });
  }
  return wavefronts;
}

export function buildParticleMotion(
  outputs: AcousticOutputs,
  particleCount = 50,
): ParticleMotionData {
  const positions: { x: number; y: number; z: number }[] = [];
  const velocities: { vx: number; vy: number; vz: number }[] = [];

  const fundamental = outputs.resonantFrequencies[0];
  if (!fundamental) {
    return { positions: [], velocities: [] };
  }

  for (let i = 0; i < particleCount; i++) {
    const angle = (i / particleCount) * Math.PI * 2;
    const r = 0.3 + 0.7 * Math.random();
    positions.push({
      x: r * Math.cos(angle),
      y: (Math.random() - 0.5) * 0.5,
      z: r * Math.sin(angle),
    });
    velocities.push({
      vx: Math.cos(angle) * fundamental.frequency * 0.001,
      vy: 0,
      vz: Math.sin(angle) * fundamental.frequency * 0.001,
    });
  }

  return { positions, velocities };
}

export function buildFrequencySpectrum(outputs: AcousticOutputs): FrequencySpectrumData {
  const frequencies = outputs.frequencyResponse.map((f) => f.frequency);
  const spl = outputs.frequencyResponse.map((f) => f.spl);

  const peaks: { frequency: number; spl: number }[] = [];
  for (let i = 1; i < spl.length - 1; i++) {
    if (spl[i] > spl[i - 1] && spl[i] > spl[i + 1] && spl[i] > 70) {
      peaks.push({ frequency: frequencies[i], spl: spl[i] });
    }
  }

  return {
    frequencies,
    spl,
    unit: 'dB SPL',
    peaks,
  };
}

export function buildAcousticVisualization(
  outputs: AcousticOutputs,
  sourceLocation: { x: number; y: number; z: number },
  speedOfSound: number,
): AcousticVisualization {
  return {
    isosurfaces: buildPressureIsosurfaces(outputs),
    heatmaps: [buildHeatmap(outputs)],
    wavefronts: buildWavefronts(sourceLocation, speedOfSound, 0.1),
    particleMotion: buildParticleMotion(outputs),
    frequencySpectrum: buildFrequencySpectrum(outputs),
    activeLayers: new Set<AcousticVisualizationLayer>([
      'pressureIsosurfaces',
      'heatmaps',
      'wavefronts',
      'particleMotion',
      'frequencySpectrum',
    ]),
    unitsDisplayed: true,
  };
}
