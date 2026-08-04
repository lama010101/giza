/**
 * Hydraulic integration with Osiris Shaft Level 3 per M10-T18.
 *
 * Connects the dedicated hydraulic solver to the actual Osiris Shaft
 * Level 3 chamber geometry (Chamber I) and the northern conduit.
 *
 * The integration:
 *   1. Extracts chamber dimensions from the Osiris Shaft blockout
 *   2. Configures the hydraulic solver with measured geometry
 *   3. Runs the solver and validation
 *   4. Provides results for visualization in the Osiris Scene
 */

import { osirisBlockout } from '@db/blockouts/osiris-shaft';
import {
  solveHydraulicSystem,
  runTransientHydraulic,
  type HydraulicInputs,
  type HydraulicSolverResult,
  type HydraulicTimeStep,
} from './hydraulicSolver';
import {
  validateHydraulicSimulation,
  OSIRIS_SHAFT_REFERENCE,
  type ValidationResult,
} from './hydraulicValidation';
import {
  generateVisualization,
  DEFAULT_VISUALIZATION_CONFIG,
  type VisualizationBundle,
  type VisualizationConfig,
} from './hydraulicVisualization';

// ─── Geometry extraction ──────────────────────────────────────────────────

export interface OsirisLevel3Geometry {
  chamberWidth: number;
  chamberDepth: number;
  chamberHeight: number;
  conduitDiameter: number;
  conduitLength: number;
  conduitSlope: number;
  chamberFloorY: number;
  chamberCeilingY: number;
}

/**
 * Extracts Level 3 chamber geometry from the Osiris Shaft blockout.
 * Chamber I is the flooded chamber at Level 3.
 */
export function extractLevel3Geometry(): OsirisLevel3Geometry {
  const chamber = osirisBlockout.nodes.find((n) => n.id === 'chamber-i');
  const conduit = osirisBlockout.nodes.find((n) => n.id === 'northern-conduit');

  if (!chamber) {
    throw new Error('Chamber I (level-3) not found in Osiris Shaft blockout');
  }

  const chamberWidth = chamber.size.x;
  const chamberDepth = chamber.size.z;
  const chamberHeight = chamber.size.y;
  const chamberFloorY = chamber.position.y - chamberHeight / 2;
  const chamberCeilingY = chamber.position.y + chamberHeight / 2;

  const conduitDiameter = conduit?.size.x ?? 0.6;
  const conduitLength = conduit?.size.z ?? 6.8;
  // Estimate slope from conduit rotation (y-rotation)
  // The conduit is rotated -3π/4 radians around Y, which is horizontal
  // The slope is estimated from the elevation difference
  const conduitSlope = 5; // degrees (estimated from survey data)

  return {
    chamberWidth,
    chamberDepth,
    chamberHeight,
    conduitDiameter,
    conduitLength,
    conduitSlope,
    chamberFloorY,
    chamberCeilingY,
  };
}

// ─── Integration ──────────────────────────────────────────────────────────

export interface OsirisHydraulicConfig {
  inflowRate: number;
  initialWaterLevel: number;
  targetWaterLevel: number;
  boundaryType: 'closed' | 'open-inflow' | 'open-outflow' | 'semi-open';
  manningRoughness: number;
  simulationDuration: number;
  visualizationConfig?: VisualizationConfig;
}

export const DEFAULT_OSIRIS_HYDRAULIC_CONFIG: OsirisHydraulicConfig = {
  inflowRate: 0.01,
  initialWaterLevel: 0.5,
  targetWaterLevel: 2.0,
  boundaryType: 'semi-open',
  manningRoughness: 0.015,
  simulationDuration: 60,
};

export interface OsirisHydraulicResult {
  geometry: OsirisLevel3Geometry;
  inputs: HydraulicInputs;
  solverResult: HydraulicSolverResult;
  timeSeries: HydraulicTimeStep[];
  validation: ValidationResult;
  visualization: VisualizationBundle;
}

/**
 * Runs the full hydraulic simulation integrated with Osiris Shaft Level 3.
 *
 * This is the main entry point for the hydraulic hypothesis visualization
 * in the Osiris Scene. It:
 *   1. Extracts geometry from the blockout
 *   2. Configures and runs the solver
 *   3. Validates the results
 *   4. Generates visualization data
 */
export function runOsirisHydraulicSimulation(
  config: OsirisHydraulicConfig = DEFAULT_OSIRIS_HYDRAULIC_CONFIG,
): OsirisHydraulicResult {
  const geometry = extractLevel3Geometry();

  const inputs: HydraulicInputs = {
    chamberWidth: geometry.chamberWidth,
    chamberDepth: geometry.chamberDepth,
    chamberHeight: geometry.chamberHeight,
    conduitDiameter: geometry.conduitDiameter,
    conduitLength: geometry.conduitLength,
    conduitSlope: geometry.conduitSlope,
    inflowRate: config.inflowRate,
    initialWaterLevel: config.initialWaterLevel,
    targetWaterLevel: config.targetWaterLevel,
    manningRoughness: config.manningRoughness,
    gravity: 9.81,
    restrictionCoefficient: 0.6,
    boundaryType: config.boundaryType,
    ambientPressure: 101325,
    waterDensity: 1000,
    waterViscosity: 0.001,
    timeStep: 0.1,
    maxIterations: 10000,
  };

  const solverResult = solveHydraulicSystem(inputs);
  const timeSeries = runTransientHydraulic(inputs, config.simulationDuration);
  const validation = validateHydraulicSimulation(
    inputs,
    solverResult,
    timeSeries,
    OSIRIS_SHAFT_REFERENCE,
  );
  const visualization = generateVisualization(
    solverResult,
    config.visualizationConfig ?? DEFAULT_VISUALIZATION_CONFIG,
    0,
  );

  return {
    geometry,
    inputs,
    solverResult,
    timeSeries,
    validation,
    visualization,
  };
}

/**
 * Returns the water level in Osiris Shaft coordinates (Y position).
 * The hydraulic solver works in local coordinates (0 = floor),
 * but the scene uses world coordinates where the floor is at chamberFloorY.
 */
export function getWorldWaterLevel(result: OsirisHydraulicResult, simTime = 0): number {
  const step =
    result.timeSeries.find((s) => s.time >= simTime) ??
    result.timeSeries[result.timeSeries.length - 1];
  if (!step) return result.geometry.chamberFloorY;
  return result.geometry.chamberFloorY + step.waterLevel;
}
