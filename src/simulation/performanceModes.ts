/**
 * Simulation performance modes per M10-T11.
 *
 * Provides 4 performance modes that trade visual fidelity for speed:
 *   - Preview: Fast, low-fidelity, for quick iteration
 *   - Standard: Balanced, default mode
 *   - Research: High-fidelity, slower, for publication
 *   - Offline: Batch processing, no real-time constraint
 */

export type SimulationPerformanceMode = 'preview' | 'standard' | 'research' | 'offline';

export interface PerformanceModeSettings {
  mode: SimulationPerformanceMode;
  maxIterations: number;
  timeStep: number; // seconds
  meshResolution: 'low' | 'medium' | 'high' | 'ultra';
  particleCount: number;
  solverIterations: number;
  convergenceThreshold: number;
  parallelWorkers: number;
  realtime: boolean;
  targetFPS: number;
  enableVisualization: boolean;
  enablePostProcessing: boolean;
}

export const PERFORMANCE_MODE_SETTINGS: Record<SimulationPerformanceMode, PerformanceModeSettings> =
  {
    preview: {
      mode: 'preview',
      maxIterations: 100,
      timeStep: 0.1,
      meshResolution: 'low',
      particleCount: 500,
      solverIterations: 5,
      convergenceThreshold: 1e-3,
      parallelWorkers: 1,
      realtime: true,
      targetFPS: 30,
      enableVisualization: true,
      enablePostProcessing: false,
    },
    standard: {
      mode: 'standard',
      maxIterations: 1000,
      timeStep: 0.01,
      meshResolution: 'medium',
      particleCount: 5000,
      solverIterations: 20,
      convergenceThreshold: 1e-4,
      parallelWorkers: 2,
      realtime: true,
      targetFPS: 60,
      enableVisualization: true,
      enablePostProcessing: true,
    },
    research: {
      mode: 'research',
      maxIterations: 10000,
      timeStep: 0.001,
      meshResolution: 'high',
      particleCount: 50000,
      solverIterations: 100,
      convergenceThreshold: 1e-6,
      parallelWorkers: 4,
      realtime: false,
      targetFPS: 0,
      enableVisualization: true,
      enablePostProcessing: true,
    },
    offline: {
      mode: 'offline',
      maxIterations: 100000,
      timeStep: 0.0001,
      meshResolution: 'ultra',
      particleCount: 500000,
      solverIterations: 500,
      convergenceThreshold: 1e-8,
      parallelWorkers: 8,
      realtime: false,
      targetFPS: 0,
      enableVisualization: false,
      enablePostProcessing: false,
    },
  };

/**
 * Returns the settings for a performance mode.
 */
export function getPerformanceModeSettings(
  mode: SimulationPerformanceMode,
): PerformanceModeSettings {
  return PERFORMANCE_MODE_SETTINGS[mode];
}

/**
 * Returns the recommended performance mode based on hardware.
 */
export function getRecommendedPerformanceMode(
  cpuCores: number,
  gpuQuality: 'low' | 'medium' | 'high' | 'ultra',
): SimulationPerformanceMode {
  if (gpuQuality === 'low' || cpuCores < 4) return 'preview';
  if (gpuQuality === 'ultra' && cpuCores >= 8) return 'research';
  return 'standard';
}

/**
 * Returns true if a mode supports real-time visualization.
 */
export function isRealtimeMode(mode: SimulationPerformanceMode): boolean {
  return PERFORMANCE_MODE_SETTINGS[mode].realtime;
}

/**
 * Returns the estimated time for a simulation run (in seconds of compute time).
 * Higher fidelity modes take longer per iteration due to more solver iterations.
 */
export function estimateRunTime(mode: SimulationPerformanceMode, iterations: number): number {
  const settings = PERFORMANCE_MODE_SETTINGS[mode];
  // Compute time scales with solver iterations and mesh resolution
  const resolutionMultiplier: Record<string, number> = {
    low: 1,
    medium: 4,
    high: 16,
    ultra: 64,
  };
  const multiplier = resolutionMultiplier[settings.meshResolution] ?? 1;
  return iterations * settings.solverIterations * multiplier * 0.001;
}
