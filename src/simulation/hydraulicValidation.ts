/**
 * Hydraulic validation per GIZA-06 §1.11 (M10-T14).
 *
 * Validates simulation results against:
 *   - Mass conservation
 *   - Boundary conditions
 *   - Numerical stability
 *   - Measured water levels
 *   - Known chamber elevations
 *   - Survey geometry
 *   - Published geological constraints
 *
 * Any mismatch is reported rather than hidden.
 */

import type { HydraulicSolverResult, HydraulicInputs } from './hydraulicSolver';
import type { HydraulicTimeStep } from './hydraulicSolver';

export interface ValidationCheck {
  name: string;
  passed: boolean;
  expected: string;
  actual: string;
  message: string;
  severity: 'error' | 'warning' | 'info';
}

export interface ValidationResult {
  passed: boolean;
  checks: ValidationCheck[];
  errors: ValidationCheck[];
  warnings: ValidationCheck[];
  summary: string;
}

// ─── Reference data for Osiris Shaft ──────────────────────────────────────

export interface ReferenceData {
  measuredWaterLevel?: number; // m
  chamberFloorElevation?: number; // m
  chamberCeilingElevation?: number; // m
  surveyedConduitLength?: number; // m
  surveyedConduitDiameter?: number; // m
  geologicalConstraintMaxPressure?: number; // Pa
}

export const OSIRIS_SHAFT_REFERENCE: ReferenceData = {
  measuredWaterLevel: 0.5, // typical observed level
  chamberFloorElevation: -30.65,
  chamberCeilingElevation: -27.65,
  surveyedConduitLength: 6.8,
  surveyedConduitDiameter: 0.6,
  geologicalConstraintMaxPressure: 200_000, // 200 kPa
};

// ─── Validation functions ─────────────────────────────────────────────────

/**
 * Validates mass conservation: inflow - outflow = dV/dt
 */
export function validateMassConservation(
  timeSeries: HydraulicTimeStep[],
  tolerance = 0.001,
): ValidationCheck {
  if (timeSeries.length < 2) {
    return {
      name: 'Mass Conservation',
      passed: false,
      expected: '≥2 time steps for comparison',
      actual: `${timeSeries.length} steps`,
      message: 'Insufficient data for mass conservation check',
      severity: 'error',
    };
  }

  let maxError = 0;
  for (let i = 1; i < timeSeries.length; i++) {
    const prev = timeSeries[i - 1];
    const curr = timeSeries[i];
    const dt = curr.time - prev.time;
    const dV = (curr.waterLevel - prev.waterLevel) * 6.5 * 9.0; // chamber area
    const expectedDV = (curr.inflowRate - curr.outflowRate) * dt;
    const error = Math.abs(dV - expectedDV);
    maxError = Math.max(maxError, error);
  }

  const passed = maxError < tolerance;
  return {
    name: 'Mass Conservation',
    passed,
    expected: `error < ${tolerance} m³`,
    actual: `error = ${maxError.toFixed(6)} m³`,
    message: passed
      ? 'Mass conservation satisfied within tolerance'
      : `Mass conservation violated: max error ${maxError.toFixed(6)} m³`,
    severity: passed ? 'info' : 'error',
  };
}

/**
 * Validates boundary conditions are properly applied.
 */
export function validateBoundaryConditions(
  inputs: HydraulicInputs,
  result: HydraulicSolverResult,
): ValidationCheck {
  const { boundaryType } = inputs;
  let passed = true;
  let message = '';

  switch (boundaryType) {
    case 'closed':
      if (result.drainTime !== Infinity) {
        passed = false;
        message = 'Closed boundary should have infinite drain time';
      } else {
        message = 'Closed boundary: no outflow (drain time = ∞)';
      }
      break;
    case 'open-inflow':
      if (result.fillTime === Infinity && inputs.inflowRate > 0) {
        passed = false;
        message = 'Open inflow with positive inflow should have finite fill time';
      } else {
        message = 'Open inflow: finite fill time';
      }
      break;
    case 'open-outflow':
      if (result.drainTime === Infinity && result.finalWaterLevel > 0) {
        passed = false;
        message = 'Open outflow with water should have finite drain time';
      } else {
        message = 'Open outflow: finite drain time';
      }
      break;
    case 'semi-open':
      message = 'Semi-open: both inflow and outflow active';
      break;
  }

  return {
    name: 'Boundary Conditions',
    passed,
    expected: `boundary '${boundaryType}' properly enforced`,
    actual: passed ? 'correctly enforced' : 'violated',
    message,
    severity: passed ? 'info' : 'error',
  };
}

/**
 * Validates numerical stability.
 */
export function validateNumericalStability(
  result: HydraulicSolverResult,
  inputs: HydraulicInputs,
): ValidationCheck {
  const issues: string[] = [];

  // Check for NaN or Infinity in key outputs
  if (!isFinite(result.finalWaterLevel)) issues.push('water level is not finite');
  if (!isFinite(result.reynoldsNumber)) issues.push('Reynolds number is not finite');
  if (result.reynoldsNumber < 0) issues.push('Reynolds number is negative');
  if (result.froudeNumber < 0) issues.push('Froude number is negative');

  // Check CFL-like condition (simplified)
  const courantNumber =
    ((result.velocityVectors[0]?.velocityMagnitude ?? 0) * inputs.timeStep) /
    (inputs.conduitDiameter || 1);
  if (courantNumber > 1) {
    issues.push(`CFL condition violated: Courant number ${courantNumber.toFixed(2)} > 1`);
  }

  // Check convergence
  if (!result.converged) {
    issues.push('Solver did not converge within max iterations');
  }

  const passed = issues.length === 0;
  return {
    name: 'Numerical Stability',
    passed,
    expected: 'all values finite, CFL ≤ 1, converged',
    actual: issues.length === 0 ? 'stable' : issues.join('; '),
    message: passed ? 'Numerical stability verified' : `Stability issues: ${issues.join('; ')}`,
    severity: passed ? 'info' : 'error',
  };
}

/**
 * Validates against measured water levels.
 */
export function validateMeasuredWaterLevel(
  result: HydraulicSolverResult,
  reference: ReferenceData,
  tolerance = 0.2,
): ValidationCheck {
  if (reference.measuredWaterLevel === undefined) {
    return {
      name: 'Measured Water Level',
      passed: true,
      expected: 'N/A',
      actual: 'N/A',
      message: 'No measured water level reference available',
      severity: 'info',
    };
  }

  const error = Math.abs(result.finalWaterLevel - reference.measuredWaterLevel);
  const passed = error <= tolerance;

  return {
    name: 'Measured Water Level',
    passed,
    expected: `${reference.measuredWaterLevel}m ± ${tolerance}m`,
    actual: `${result.finalWaterLevel.toFixed(3)}m`,
    message: passed
      ? `Water level matches measurement within ${tolerance}m tolerance`
      : `Water level mismatch: ${error.toFixed(3)}m deviation from measured ${reference.measuredWaterLevel}m`,
    severity: passed ? 'info' : 'warning',
  };
}

/**
 * Validates against known chamber elevations.
 */
export function validateChamberElevations(
  inputs: HydraulicInputs,
  reference: ReferenceData,
): ValidationCheck {
  if (reference.chamberFloorElevation === undefined) {
    return {
      name: 'Chamber Elevations',
      passed: true,
      expected: 'N/A',
      actual: 'N/A',
      message: 'No chamber elevation reference available',
      severity: 'info',
    };
  }

  // Check that chamber height is consistent with elevation data
  const expectedHeight = (reference.chamberCeilingElevation ?? 0) - reference.chamberFloorElevation;
  const passed = Math.abs(inputs.chamberHeight - expectedHeight) < 0.5;

  return {
    name: 'Chamber Elevations',
    passed,
    expected: `chamber height ≈ ${expectedHeight.toFixed(2)}m`,
    actual: `chamber height = ${inputs.chamberHeight.toFixed(2)}m`,
    message: passed
      ? 'Chamber dimensions consistent with survey data'
      : `Chamber height mismatch: expected ${expectedHeight.toFixed(2)}m, got ${inputs.chamberHeight.toFixed(2)}m`,
    severity: passed ? 'info' : 'warning',
  };
}

/**
 * Validates against surveyed conduit geometry.
 */
export function validateSurveyGeometry(
  inputs: HydraulicInputs,
  reference: ReferenceData,
): ValidationCheck {
  const issues: string[] = [];

  if (reference.surveyedConduitLength !== undefined) {
    const lengthError = Math.abs(inputs.conduitLength - reference.surveyedConduitLength);
    if (lengthError > 0.5) {
      issues.push(`conduit length off by ${lengthError.toFixed(2)}m`);
    }
  }

  if (reference.surveyedConduitDiameter !== undefined) {
    const diameterError = Math.abs(inputs.conduitDiameter - reference.surveyedConduitDiameter);
    if (diameterError > 0.1) {
      issues.push(`conduit diameter off by ${diameterError.toFixed(2)}m`);
    }
  }

  const passed = issues.length === 0;
  return {
    name: 'Survey Geometry',
    passed,
    expected: 'conduit dimensions match survey',
    actual: issues.length === 0 ? 'matches survey' : issues.join('; '),
    message: passed
      ? 'Conduit geometry matches survey data'
      : `Geometry mismatch: ${issues.join('; ')}`,
    severity: passed ? 'info' : 'warning',
  };
}

/**
 * Validates against geological constraints (max pressure).
 */
export function validateGeologicalConstraints(
  result: HydraulicSolverResult,
  reference: ReferenceData,
): ValidationCheck {
  if (reference.geologicalConstraintMaxPressure === undefined) {
    return {
      name: 'Geological Constraints',
      passed: true,
      expected: 'N/A',
      actual: 'N/A',
      message: 'No geological constraint reference available',
      severity: 'info',
    };
  }

  const maxPressure = Math.max(...result.pressureField.map((p) => p.pressure));
  const passed = maxPressure <= reference.geologicalConstraintMaxPressure;

  return {
    name: 'Geological Constraints',
    passed,
    expected: `max pressure ≤ ${reference.geologicalConstraintMaxPressure / 1000}kPa`,
    actual: `max pressure = ${maxPressure / 1000}kPa`,
    message: passed
      ? 'Pressure within geological constraints'
      : `Pressure exceeds geological limit: ${(maxPressure / 1000).toFixed(1)}kPa > ${(reference.geologicalConstraintMaxPressure / 1000).toFixed(1)}kPa`,
    severity: passed ? 'info' : 'error',
  };
}

// ─── Full validation ──────────────────────────────────────────────────────

export function validateHydraulicSimulation(
  inputs: HydraulicInputs,
  result: HydraulicSolverResult,
  timeSeries: HydraulicTimeStep[],
  reference: ReferenceData = OSIRIS_SHAFT_REFERENCE,
): ValidationResult {
  const checks: ValidationCheck[] = [
    validateMassConservation(timeSeries),
    validateBoundaryConditions(inputs, result),
    validateNumericalStability(result, inputs),
    validateMeasuredWaterLevel(result, reference),
    validateChamberElevations(inputs, reference),
    validateSurveyGeometry(inputs, reference),
    validateGeologicalConstraints(result, reference),
  ];

  const errors = checks.filter((c) => c.severity === 'error' && !c.passed);
  const warnings = checks.filter((c) => c.severity === 'warning' && !c.passed);
  const passed = errors.length === 0;

  const summary = passed
    ? warnings.length > 0
      ? `Validation passed with ${warnings.length} warning(s)`
      : 'All validation checks passed'
    : `Validation failed with ${errors.length} error(s) and ${warnings.length} warning(s)`;

  return { passed, checks, errors, warnings, summary };
}
