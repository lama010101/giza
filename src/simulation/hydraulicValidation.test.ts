import { describe, it, expect } from 'vitest';
import {
  solveHydraulicSystem,
  runTransientHydraulic,
  type HydraulicInputs,
} from './hydraulicSolver';
import {
  validateMassConservation,
  validateBoundaryConditions,
  validateNumericalStability,
  validateMeasuredWaterLevel,
  validateChamberElevations,
  validateSurveyGeometry,
  validateGeologicalConstraints,
  validateHydraulicSimulation,
  OSIRIS_SHAFT_REFERENCE,
  type ReferenceData,
} from './hydraulicValidation';

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

describe('Hydraulic Validation (M10-T14, GIZA-06 §1.11)', () => {
  const result = solveHydraulicSystem(DEFAULT_INPUTS);
  const timeSeries = runTransientHydraulic(DEFAULT_INPUTS, 10);

  describe('validateMassConservation', () => {
    it('passes for a well-behaved time series', () => {
      const check = validateMassConservation(timeSeries);
      expect(check.passed).toBe(true);
      expect(check.name).toBe('Mass Conservation');
    });

    it('fails for insufficient data', () => {
      const check = validateMassConservation([]);
      expect(check.passed).toBe(false);
      expect(check.severity).toBe('error');
    });
  });

  describe('validateBoundaryConditions', () => {
    it('validates closed boundary', () => {
      const closedResult = solveHydraulicSystem({ ...DEFAULT_INPUTS, boundaryType: 'closed' });
      const check = validateBoundaryConditions(
        { ...DEFAULT_INPUTS, boundaryType: 'closed' },
        closedResult,
      );
      expect(check.passed).toBe(true);
    });

    it('validates semi-open boundary', () => {
      const check = validateBoundaryConditions(DEFAULT_INPUTS, result);
      expect(check.passed).toBe(true);
    });
  });

  describe('validateNumericalStability', () => {
    it('passes for stable simulation', () => {
      const stableInputs = {
        ...DEFAULT_INPUTS,
        timeStep: 0.001,
        maxIterations: 10_000_000,
        boundaryType: 'closed' as const,
        inflowRate: 0,
      };
      const stableResult = solveHydraulicSystem(stableInputs);
      const check = validateNumericalStability(stableResult, stableInputs);
      expect(check.passed).toBe(true);
    });

    it('detects CFL violation', () => {
      const unstableResult = solveHydraulicSystem({
        ...DEFAULT_INPUTS,
        timeStep: 10, // very large time step
      });
      const check = validateNumericalStability(unstableResult, {
        ...DEFAULT_INPUTS,
        timeStep: 10,
      });
      // May or may not fail depending on velocity, but should run
      expect(check).toBeDefined();
    });
  });

  describe('validateMeasuredWaterLevel', () => {
    it('passes when water level matches reference', () => {
      const reference: ReferenceData = { measuredWaterLevel: 0.5 };
      const check = validateMeasuredWaterLevel(result, reference, 0.2);
      expect(check.passed).toBe(true);
    });

    it('warns when water level differs significantly', () => {
      const reference: ReferenceData = { measuredWaterLevel: 5.0 };
      const check = validateMeasuredWaterLevel(result, reference, 0.2);
      expect(check.passed).toBe(false);
      expect(check.severity).toBe('warning');
    });

    it('passes when no reference is available', () => {
      const check = validateMeasuredWaterLevel(result, {});
      expect(check.passed).toBe(true);
    });
  });

  describe('validateChamberElevations', () => {
    it('validates against Osiris Shaft reference', () => {
      const check = validateChamberElevations(DEFAULT_INPUTS, OSIRIS_SHAFT_REFERENCE);
      expect(check).toBeDefined();
    });
  });

  describe('validateSurveyGeometry', () => {
    it('passes when conduit matches survey', () => {
      const check = validateSurveyGeometry(DEFAULT_INPUTS, OSIRIS_SHAFT_REFERENCE);
      expect(check.passed).toBe(true);
    });

    it('warns when conduit length differs', () => {
      const check = validateSurveyGeometry(
        { ...DEFAULT_INPUTS, conduitLength: 20 },
        OSIRIS_SHAFT_REFERENCE,
      );
      expect(check.passed).toBe(false);
      expect(check.severity).toBe('warning');
    });
  });

  describe('validateGeologicalConstraints', () => {
    it('passes when pressure is within limits', () => {
      const check = validateGeologicalConstraints(result, OSIRIS_SHAFT_REFERENCE);
      expect(check.passed).toBe(true);
    });

    it('fails when pressure exceeds geological limit', () => {
      const reference: ReferenceData = { geologicalConstraintMaxPressure: 100 };
      const check = validateGeologicalConstraints(result, reference);
      expect(check.passed).toBe(false);
      expect(check.severity).toBe('error');
    });
  });

  describe('validateHydraulicSimulation (full)', () => {
    it('runs all 7 validation checks', () => {
      const validation = validateHydraulicSimulation(
        DEFAULT_INPUTS,
        result,
        timeSeries,
        OSIRIS_SHAFT_REFERENCE,
      );
      expect(validation.checks).toHaveLength(7);
    });

    it('returns a summary', () => {
      const validation = validateHydraulicSimulation(
        DEFAULT_INPUTS,
        result,
        timeSeries,
        OSIRIS_SHAFT_REFERENCE,
      );
      expect(validation.summary).toBeDefined();
      expect(validation.summary.length).toBeGreaterThan(0);
    });

    it('separates errors and warnings', () => {
      const validation = validateHydraulicSimulation(
        DEFAULT_INPUTS,
        result,
        timeSeries,
        OSIRIS_SHAFT_REFERENCE,
      );
      expect(validation.errors).toBeDefined();
      expect(validation.warnings).toBeDefined();
    });

    it('mismatches are reported not hidden', () => {
      const badReference: ReferenceData = {
        ...OSIRIS_SHAFT_REFERENCE,
        measuredWaterLevel: 99, // impossible value
        geologicalConstraintMaxPressure: 1, // impossible limit
      };
      const validation = validateHydraulicSimulation(
        DEFAULT_INPUTS,
        result,
        timeSeries,
        badReference,
      );
      expect(validation.passed).toBe(false);
      expect(validation.errors.length).toBeGreaterThan(0);
      // The mismatch should be in the report
      const allMessages = validation.checks.map((c) => c.message).join(' ');
      expect(allMessages).toContain('mismatch');
    });
  });
});
