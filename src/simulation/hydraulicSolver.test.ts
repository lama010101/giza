import { describe, it, expect } from 'vitest';
import {
  solveHydraulicSystem,
  runTransientHydraulic,
  HydraulicInputsSchema,
  type HydraulicInputs,
} from './hydraulicSolver';

const DEFAULT_INPUTS: HydraulicInputs = {
  chamberWidth: 6.5,
  chamberDepth: 9.0,
  chamberHeight: 3.0,
  conduitDiameter: 0.6,
  conduitLength: 6.8,
  conduitSlope: 5,
  inflowRate: 0.01,
  initialWaterLevel: 0.5,
  targetWaterLevel: 2.0,
  manningRoughness: 0.015,
  gravity: 9.81,
  restrictionCoefficient: 0.6,
  boundaryType: 'semi-open',
  ambientPressure: 101325,
  waterDensity: 1000,
  waterViscosity: 0.001,
  timeStep: 0.1,
  maxIterations: 1000,
};

describe('Hydraulic Solver (M10-T12, GIZA-06 §1.7–1.9)', () => {
  describe('HydraulicInputsSchema', () => {
    it('validates correct inputs', () => {
      const result = HydraulicInputsSchema.safeParse(DEFAULT_INPUTS);
      expect(result.success).toBe(true);
    });

    it('rejects negative chamber dimensions', () => {
      const result = HydraulicInputsSchema.safeParse({
        ...DEFAULT_INPUTS,
        chamberWidth: -1,
      });
      expect(result.success).toBe(false);
    });

    it('applies defaults for optional fields', () => {
      const result = HydraulicInputsSchema.parse({
        chamberWidth: 5,
        chamberDepth: 5,
        chamberHeight: 3,
        conduitDiameter: 0.5,
        conduitLength: 5,
      });
      expect(result.gravity).toBe(9.81);
      expect(result.waterDensity).toBe(1000);
      expect(result.boundaryType).toBe('closed');
    });
  });

  describe('solveHydraulicSystem — 9 modeled behaviors', () => {
    const result = solveHydraulicSystem(DEFAULT_INPUTS);

    it('1. Standing water: computes hydrostatic pressure', () => {
      expect(result.pressureField.length).toBeGreaterThan(0);
      // Pressure at the bottom should be greater than ambient
      const bottomPressure = Math.max(...result.pressureField.map((p) => p.pressure));
      expect(bottomPressure).toBeGreaterThan(101325);
    });

    it('2. Gravity flow: computes flow direction', () => {
      expect(result.flowDirection).toBeDefined();
      expect(Math.abs(result.flowDirection.z)).toBeGreaterThan(0);
    });

    it('3. Pressure: pressure field is populated', () => {
      expect(result.pressureField.length).toBe(125); // 5×5×5 grid
      // All pressures should be positive
      for (const point of result.pressureField) {
        expect(point.pressure).toBeGreaterThan(0);
      }
    });

    it('4. Filling: computes fill time', () => {
      expect(result.fillTime).toBeGreaterThan(0);
      expect(result.fillTime).toBeLessThan(Infinity);
    });

    it('5. Emptying: computes drain time', () => {
      // With semi-open boundary, drain time should be finite
      expect(result.drainTime).toBeGreaterThan(0);
      expect(result.drainTime).toBeLessThan(Infinity);
    });

    it('6. Surface elevation: final water level is valid', () => {
      expect(result.finalWaterLevel).toBeGreaterThanOrEqual(0);
      expect(result.finalWaterLevel).toBeLessThanOrEqual(DEFAULT_INPUTS.chamberHeight);
    });

    it('7. Water velocity: velocity vectors are populated', () => {
      expect(result.velocityVectors.length).toBeGreaterThan(0);
      // At least one vector should have non-zero magnitude
      const maxVelocity = Math.max(...result.velocityVectors.map((v) => v.velocityMagnitude));
      expect(maxVelocity).toBeGreaterThan(0);
    });

    it('8. Turbulence: computes Reynolds number and turbulence intensity', () => {
      expect(result.reynoldsNumber).toBeGreaterThan(0);
      expect(result.turbulenceIntensity).toBeGreaterThanOrEqual(0);
      expect(result.turbulenceIntensity).toBeLessThanOrEqual(1);
    });

    it('9. Conduit connectivity: flow direction is set when conduit exists', () => {
      expect(result.flowDirection.z).toBe(-1);
    });
  });

  describe('solveHydraulicSystem — outputs per §1.9', () => {
    const result = solveHydraulicSystem(DEFAULT_INPUTS);

    it('computes flow direction', () => {
      expect(result.flowDirection).toBeDefined();
    });

    it('computes pressure field', () => {
      expect(result.pressureField).toBeInstanceOf(Array);
      expect(result.pressureField.length).toBeGreaterThan(0);
    });

    it('computes velocity vectors', () => {
      expect(result.velocityVectors).toBeInstanceOf(Array);
      expect(result.velocityVectors.length).toBeGreaterThan(0);
    });

    it('computes fill time', () => {
      expect(result.fillTime).toBeGreaterThan(0);
    });

    it('computes drain time', () => {
      expect(result.drainTime).toBeGreaterThan(0);
    });

    it('computes water volume', () => {
      expect(result.waterVolume).toBeGreaterThan(0);
      // Volume = waterLevel × floor area
      const expectedVolume = DEFAULT_INPUTS.initialWaterLevel * 6.5 * 9.0;
      expect(result.waterVolume).toBeCloseTo(expectedVolume, 2);
    });

    it('computes estimated energy loss', () => {
      expect(result.estimatedEnergyLoss).toBeGreaterThanOrEqual(0);
    });
  });

  describe('solveHydraulicSystem — additional outputs', () => {
    const result = solveHydraulicSystem(DEFAULT_INPUTS);

    it('computes Froude number', () => {
      expect(result.froudeNumber).toBeGreaterThanOrEqual(0);
    });

    it('reports stability', () => {
      expect(typeof result.stable).toBe('boolean');
    });

    it('reports convergence', () => {
      expect(typeof result.converged).toBe('boolean');
      expect(result.iterations).toBeGreaterThan(0);
    });
  });

  describe('closed boundary (no outflow)', () => {
    it('drain time is Infinity when boundary is closed', () => {
      const result = solveHydraulicSystem({
        ...DEFAULT_INPUTS,
        boundaryType: 'closed',
      });
      expect(result.drainTime).toBe(Infinity);
    });
  });

  describe('runTransientHydraulic', () => {
    it('produces a time series', () => {
      const steps = runTransientHydraulic(DEFAULT_INPUTS, 10);
      expect(steps.length).toBeGreaterThan(0);
      expect(steps[0].time).toBe(0);
      expect(steps[steps.length - 1].time).toBeCloseTo(10, 1);
    });

    it('water level changes over time with inflow', () => {
      const steps = runTransientHydraulic(
        { ...DEFAULT_INPUTS, initialWaterLevel: 0.1, boundaryType: 'closed' },
        60,
      );
      const firstLevel = steps[0].waterLevel;
      const lastLevel = steps[steps.length - 1].waterLevel;
      expect(lastLevel).toBeGreaterThan(firstLevel);
    });

    it('respects chamber height limit', () => {
      const steps = runTransientHydraulic(
        { ...DEFAULT_INPUTS, initialWaterLevel: 2.9, boundaryType: 'closed', inflowRate: 1.0 },
        100,
      );
      const maxLevel = Math.max(...steps.map((s) => s.waterLevel));
      expect(maxLevel).toBeLessThanOrEqual(DEFAULT_INPUTS.chamberHeight);
    });

    it('drains to zero with open outflow', () => {
      const steps = runTransientHydraulic(
        { ...DEFAULT_INPUTS, initialWaterLevel: 2.0, boundaryType: 'open-outflow', inflowRate: 0 },
        1000,
      );
      const lastLevel = steps[steps.length - 1].waterLevel;
      expect(lastLevel).toBeCloseTo(0, 2);
    });

    it('each step has all required fields', () => {
      const steps = runTransientHydraulic(DEFAULT_INPUTS, 1);
      for (const step of steps) {
        expect(step.time).toBeGreaterThanOrEqual(0);
        expect(step.waterLevel).toBeGreaterThanOrEqual(0);
        expect(step.inflowRate).toBeGreaterThanOrEqual(0);
        expect(step.outflowRate).toBeGreaterThanOrEqual(0);
        expect(step.pressure).toBeGreaterThanOrEqual(0);
        expect(step.velocity).toBeGreaterThanOrEqual(0);
      }
    });
  });
});
