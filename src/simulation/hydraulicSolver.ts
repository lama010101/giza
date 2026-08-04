/**
 * Dedicated hydraulic solver per GIZA-06 §1.7–1.9 (M10-T12).
 *
 * Models 9 behaviors (§1.7):
 *   1. Standing water
 *   2. Gravity flow
 *   3. Pressure
 *   4. Filling
 *   5. Emptying
 *   6. Surface elevation
 *   7. Water velocity
 *   8. Turbulence (simplified)
 *   9. Conduit connectivity
 *
 * MVP assumes incompressible Newtonian fluid behavior.
 *
 * Inputs (§1.8): Geometry, Water Sources, Water Level, Material Roughness,
 *   Gravity, Flow Restrictions, Boundary Conditions
 *
 * Outputs (§1.9): Flow direction, Pressure field, Velocity vectors,
 *   Fill time, Drain time, Water volume, Estimated energy loss
 */

import { z } from 'zod';

// ─── Schemas ──────────────────────────────────────────────────────────────

export const HydraulicInputsSchema = z.object({
  // Geometry
  chamberWidth: z.number().positive(),
  chamberDepth: z.number().positive(),
  chamberHeight: z.number().positive(),
  conduitDiameter: z.number().positive(),
  conduitLength: z.number().positive(),
  conduitSlope: z.number().min(0).max(90).default(0),

  // Water Sources
  inflowRate: z.number().min(0).default(0), // m³/s
  sourceElevation: z.number().default(0).optional(), // m above chamber floor

  // Water Level
  initialWaterLevel: z.number().min(0).default(0), // m
  targetWaterLevel: z.number().min(0).default(0), // m

  // Material Roughness (Manning's n)
  manningRoughness: z.number().min(0.001).max(0.1).default(0.015),

  // Gravity
  gravity: z.number().positive().default(9.81), // m/s²

  // Flow Restrictions
  restrictionCoefficient: z.number().min(0).max(1).default(0.6), // orifice/discharge coeff

  // Boundary Conditions
  boundaryType: z.enum(['closed', 'open-inflow', 'open-outflow', 'semi-open']).default('closed'),
  ambientPressure: z.number().default(101325), // Pa (1 atm)

  // Fluid properties
  waterDensity: z.number().positive().default(1000), // kg/m³
  waterViscosity: z.number().positive().default(0.001), // Pa·s

  // Simulation parameters
  timeStep: z.number().positive().default(0.01), // s
  maxIterations: z.number().int().min(1).default(10000),
});

export type HydraulicInputs = z.infer<typeof HydraulicInputsSchema>;

export interface HydraulicFieldPoint {
  position: { x: number; y: number; z: number };
  pressure: number; // Pa
  velocity: { x: number; y: number; z: number }; // m/s
  velocityMagnitude: number; // m/s
}

export interface HydraulicSolverResult {
  // Outputs per §1.9
  flowDirection: { x: number; y: number; z: number };
  pressureField: HydraulicFieldPoint[];
  velocityVectors: HydraulicFieldPoint[];
  fillTime: number; // s (Infinity if no filling)
  drainTime: number; // s (Infinity if no draining)
  waterVolume: number; // m³
  estimatedEnergyLoss: number; // W (watts)

  // Additional outputs
  finalWaterLevel: number; // m
  stable: boolean;
  turbulenceIntensity: number; // dimensionless (0-1)
  reynoldsNumber: number;
  froudeNumber: number;
  iterations: number;
  converged: boolean;
}

// ─── Solver ───────────────────────────────────────────────────────────────

/**
 * Solves the hydraulic system for the given inputs.
 *
 * The solver uses a simplified finite-difference approach:
 * - Pressure field from hydrostatic + dynamic pressure
 * - Velocity from Bernoulli + Manning's equation for conduit flow
 * - Fill/drain times from volume balance
 * - Turbulence from Reynolds number
 * - Conduit connectivity checks flow paths
 */
export function solveHydraulicSystem(inputs: HydraulicInputs): HydraulicSolverResult {
  const validated = HydraulicInputsSchema.parse(inputs);

  const {
    chamberWidth,
    chamberDepth,
    chamberHeight,
    conduitDiameter,
    conduitLength,
    conduitSlope,
    inflowRate,
    initialWaterLevel,
    manningRoughness,
    gravity,
    restrictionCoefficient,
    boundaryType,
    ambientPressure,
    waterDensity,
    waterViscosity,
    timeStep,
    maxIterations,
  } = validated;

  const chamberFloorArea = chamberWidth * chamberDepth;
  const conduitCrossSection = Math.PI * (conduitDiameter / 2) ** 2;

  // ── 1. Standing water: hydrostatic pressure ──
  const waterLevel = Math.min(initialWaterLevel, chamberHeight);
  const hydrostaticPressure = waterDensity * gravity * waterLevel;

  // ── 2. Gravity flow through conduit (Manning's equation) ──
  const slopeRadians = (conduitSlope * Math.PI) / 180;
  const hydraulicRadius = conduitDiameter / 4;
  const manningVelocity =
    (1 / manningRoughness) *
    Math.pow(hydraulicRadius, 2 / 3) *
    Math.sqrt(Math.sin(slopeRadians) || 0.001);

  // ── 3. Pressure at conduit entrance (Bernoulli) ──
  const conduitPressure = ambientPressure + hydrostaticPressure;
  const dynamicPressure = 0.5 * waterDensity * manningVelocity ** 2;

  // ── 4. Filling: time to reach target level ──
  const targetLevel = Math.min(validated.targetWaterLevel, chamberHeight);
  const volumeToFill = Math.max(0, (targetLevel - waterLevel) * chamberFloorArea);
  const netInflow = Math.max(0, inflowRate);
  const fillTime = netInflow > 0 ? volumeToFill / netInflow : Infinity;

  // ── 5. Emptying: time to drain to zero ──
  const outflowRate =
    boundaryType === 'open-outflow' || boundaryType === 'semi-open'
      ? conduitCrossSection * manningVelocity * restrictionCoefficient
      : 0;
  const currentVolume = waterLevel * chamberFloorArea;
  const drainTime = outflowRate > 0 ? currentVolume / outflowRate : Infinity;

  // ── 6. Surface elevation ──
  // (surfaceElevation = waterLevel, used implicitly in pressure field)

  // ── 7. Water velocity (in conduit) ──
  const conduitVelocity = manningVelocity * restrictionCoefficient;

  // ── 8. Turbulence (simplified via Reynolds number) ──
  const reynoldsNumber = (waterDensity * conduitVelocity * conduitDiameter) / waterViscosity;
  const turbulenceIntensity = reynoldsNumber > 4000 ? 1 : reynoldsNumber > 2300 ? 0.5 : 0;

  // ── 9. Conduit connectivity ──
  const conduitConnected = conduitLength > 0 && conduitDiameter > 0;

  // ── Pressure field (grid of points) ──
  const pressureField: HydraulicFieldPoint[] = [];
  const gridResolution = 5;
  for (let i = 0; i < gridResolution; i++) {
    for (let j = 0; j < gridResolution; j++) {
      const x = (i / (gridResolution - 1) - 0.5) * chamberWidth;
      const z = (j / (gridResolution - 1) - 0.5) * chamberDepth;
      // Pressure increases with depth
      const depth = waterLevel;
      for (let k = 0; k < gridResolution; k++) {
        const y = (k / (gridResolution - 1)) * depth;
        const pressure = ambientPressure + waterDensity * gravity * (depth - y);
        pressureField.push({
          position: { x, y, z },
          pressure,
          velocity: { x: 0, y: 0, z: 0 },
          velocityMagnitude: 0,
        });
      }
    }
  }

  // ── Velocity vectors (in conduit and chamber) ──
  const velocityVectors: HydraulicFieldPoint[] = [];
  // Conduit velocity points
  for (let i = 0; i < 5; i++) {
    const t = i / 4;
    velocityVectors.push({
      position: {
        x: 0,
        y: 0,
        z: -t * conduitLength,
      },
      pressure: conduitPressure - dynamicPressure * t,
      velocity: { x: 0, y: 0, z: -conduitVelocity },
      velocityMagnitude: conduitVelocity,
    });
  }
  // Chamber surface velocity (near-zero for standing water)
  if (waterLevel > 0) {
    velocityVectors.push({
      position: { x: 0, y: waterLevel, z: 0 },
      pressure: ambientPressure,
      velocity: { x: 0.001, y: 0, z: 0 },
      velocityMagnitude: 0.001,
    });
  }

  // ── Flow direction ──
  const flowDirection = conduitConnected ? { x: 0, y: 0, z: -1 } : { x: 0, y: 0, z: 0 };

  // ── Water volume ──
  const waterVolume = waterLevel * chamberFloorArea;

  // ── Estimated energy loss (head loss × flow × density × gravity) ──
  const headLoss =
    ((manningRoughness ** 2 * conduitLength) / hydraulicRadius ** (4 / 3)) * conduitVelocity ** 2;
  const estimatedEnergyLoss = outflowRate * waterDensity * gravity * headLoss;

  // ── Froude number (for flow regime classification) ──
  const froudeNumber = conduitVelocity / Math.sqrt(gravity * waterLevel || 1);

  // ── Stability check ──
  const stable =
    Math.abs(netInflow - outflowRate) < 0.0001 && waterLevel > 0 && waterLevel <= chamberHeight;

  // ── Convergence (simplified: always converges for steady-state) ──
  // For steady-state with no flow, convergence is immediate.
  const maxRelevantTime = Math.max(
    isFinite(fillTime) ? fillTime : 0,
    isFinite(drainTime) ? drainTime : 0,
  );
  const iterations = Math.min(maxIterations, Math.max(1, Math.ceil(maxRelevantTime / timeStep)));
  const converged = iterations < maxIterations;

  return {
    flowDirection,
    pressureField,
    velocityVectors,
    fillTime,
    drainTime,
    waterVolume,
    estimatedEnergyLoss,
    finalWaterLevel: waterLevel,
    stable,
    turbulenceIntensity,
    reynoldsNumber,
    froudeNumber,
    iterations,
    converged,
  };
}

// ─── Time-stepping solver for transient simulation ────────────────────────

export interface HydraulicTimeStep {
  time: number;
  waterLevel: number;
  inflowRate: number;
  outflowRate: number;
  netFlow: number;
  pressure: number;
  velocity: number;
}

/**
 * Runs a transient (time-stepping) hydraulic simulation.
 * Returns the time series of water level, flow, pressure, and velocity.
 */
export function runTransientHydraulic(
  inputs: HydraulicInputs,
  duration: number,
): HydraulicTimeStep[] {
  const validated = HydraulicInputsSchema.parse(inputs);
  const { timeStep } = validated;

  const steps: HydraulicTimeStep[] = [];
  let currentLevel = validated.initialWaterLevel;
  let currentTime = 0;

  const chamberFloorArea = validated.chamberWidth * validated.chamberDepth;
  const conduitCrossSection = Math.PI * (validated.conduitDiameter / 2) ** 2;
  const slopeRadians = (validated.conduitSlope * Math.PI) / 180;
  const hydraulicRadius = validated.conduitDiameter / 4;
  const manningVelocity =
    (1 / validated.manningRoughness) *
    Math.pow(hydraulicRadius, 2 / 3) *
    Math.sqrt(Math.sin(slopeRadians) || 0.001);

  const inflow = validated.inflowRate;
  const outflow =
    validated.boundaryType === 'open-outflow' || validated.boundaryType === 'semi-open'
      ? conduitCrossSection * manningVelocity * validated.restrictionCoefficient
      : 0;

  while (currentTime <= duration) {
    const netFlow = inflow - (currentLevel > 0 ? outflow : 0);
    const levelChange = (netFlow * timeStep) / chamberFloorArea;
    currentLevel = Math.max(0, Math.min(validated.chamberHeight, currentLevel + levelChange));

    const pressure = validated.waterDensity * validated.gravity * currentLevel;
    const velocity = currentLevel > 0 ? manningVelocity * validated.restrictionCoefficient : 0;

    steps.push({
      time: currentTime,
      waterLevel: currentLevel,
      inflowRate: inflow,
      outflowRate: currentLevel > 0 ? outflow : 0,
      netFlow,
      pressure,
      velocity,
    });

    currentTime += timeStep;
  }

  return steps;
}
