/**
 * Prediction-simulation loop per M11.5-T12.
 *
 * Implements the feedback loop that validates hypothesis predictions against
 * simulation results:
 *   1. Select testable predictions from the prediction store.
 *   2. For each prediction: configure simulation parameters, run the
 *      simulation, and extract results.
 *   3. Compare simulation results against the prediction's expected values.
 *   4. Update prediction status:
 *        - Confirmed (within tolerance)
 *        - Falsified (outside tolerance)
 *        - Inconclusive (insufficient data)
 *   5. Compute confidence adjustment based on match quality.
 *
 * Supports batch processing and generates a validation report with
 * per-predicate results. Simulation failures (timeout, divergence) are
 * handled gracefully.
 */

import type { Prediction, PredictionStatus } from '@/schemas/prediction';
import type { SimulationResult, SimulationMetadata } from '@/simulation/types';

// ─── Types ─────────────────────────────────────────────────────────────────

/**
 * A predicate defines how a prediction is tested against simulation outputs.
 */
export interface PredictionPredicate {
  /** The simulation output key to compare. */
  outputKey: string;
  /** The expected value from the prediction. */
  expectedValue: number;
  /** Tolerance as an absolute value or relative fraction. */
  tolerance: number;
  /** Whether tolerance is relative (fraction) or absolute. */
  toleranceType: 'absolute' | 'relative';
  /** Human-readable comparison operator. */
  operator: 'eq' | 'gt' | 'lt' | 'gte' | 'lte';
}

/**
 * Extended prediction with testable predicates and simulation config.
 */
export interface TestablePrediction {
  prediction: Prediction;
  predicates: PredictionPredicate[];
  /** Simulation type to run (e.g. 'Hydraulic', 'Acoustic'). */
  simulationType: string;
  /** Parameters for the simulation. */
  simulationParameters: Record<string, unknown>;
}

export type ValidationOutcome = 'confirmed' | 'falsified' | 'inconclusive';

export interface PredicateResult {
  outputKey: string;
  expected: number;
  actual: number;
  tolerance: number;
  passed: boolean;
  error: number;
  outcome: ValidationOutcome;
  message: string;
}

export interface PredictionValidationResult {
  predictionId: string;
  hypothesisId: string;
  outcome: ValidationOutcome;
  newStatus: PredictionStatus;
  confidenceAdjustment: number;
  predicateResults: PredicateResult[];
  error?: string;
  duration: number; // seconds
}

export interface ValidationReport {
  totalPredictions: number;
  confirmed: number;
  falsified: number;
  inconclusive: number;
  errors: number;
  results: PredictionValidationResult[];
  overallConfidenceAdjustment: number;
  summary: string;
}

export type SimulationRunner = (
  prediction: TestablePrediction,
  metadata: SimulationMetadata,
) => SimulationResult;

// ─── Prediction selection ──────────────────────────────────────────────────

/**
 * Selects predictions that are testable via simulation.
 *
 * A prediction is testable if it has at least one predicate and a simulation
 * type defined. Predictions with status 'inconclusive' are also re-testable.
 */
export function selectTestablePredictions(
  predictions: Prediction[],
  testableMap: Map<string, TestablePrediction>,
): TestablePrediction[] {
  const testable: TestablePrediction[] = [];
  for (const pred of predictions) {
    const testablePred = testableMap.get(pred.id);
    if (!testablePred) continue;
    if (testablePred.predicates.length === 0) continue;
    if (!testablePred.simulationType) continue;
    // Only test untested or inconclusive predictions
    if (pred.status === 'untested' || pred.status === 'inconclusive') {
      testable.push(testablePred);
    }
  }
  return testable;
}

// ─── Predicate evaluation ──────────────────────────────────────────────────

/**
 * Extracts a numeric value from simulation outputs by key.
 */
function extractOutputValue(outputs: Record<string, unknown>, key: string): number | undefined {
  const value = outputs[key];
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const parsed = Number(value);
    if (!isNaN(parsed)) return parsed;
  }
  return undefined;
}

/**
 * Evaluates a single predicate against simulation outputs.
 */
export function evaluatePredicate(
  predicate: PredictionPredicate,
  outputs: Record<string, unknown>,
): PredicateResult {
  const actual = extractOutputValue(outputs, predicate.outputKey);

  if (actual === undefined) {
    return {
      outputKey: predicate.outputKey,
      expected: predicate.expectedValue,
      actual: NaN,
      tolerance: predicate.tolerance,
      passed: false,
      error: Infinity,
      outcome: 'inconclusive',
      message: `Output key "${predicate.outputKey}" not found in simulation results`,
    };
  }

  const error = Math.abs(actual - predicate.expectedValue);
  const toleranceValue =
    predicate.toleranceType === 'relative'
      ? Math.abs(predicate.expectedValue) * predicate.tolerance
      : predicate.tolerance;

  const withinTolerance = error <= toleranceValue;

  // Check operator
  let operatorPassed = true;
  switch (predicate.operator) {
    case 'eq':
      operatorPassed = withinTolerance;
      break;
    case 'gt':
      operatorPassed = actual > predicate.expectedValue;
      break;
    case 'lt':
      operatorPassed = actual < predicate.expectedValue;
      break;
    case 'gte':
      operatorPassed = actual >= predicate.expectedValue - toleranceValue;
      break;
    case 'lte':
      operatorPassed = actual <= predicate.expectedValue + toleranceValue;
      break;
  }

  const passed = operatorPassed;
  const outcome: ValidationOutcome = passed ? 'confirmed' : 'falsified';

  return {
    outputKey: predicate.outputKey,
    expected: predicate.expectedValue,
    actual,
    tolerance: toleranceValue,
    passed,
    error,
    outcome,
    message: passed
      ? `Value ${actual} within tolerance of expected ${predicate.expectedValue}`
      : `Value ${actual} outside tolerance of expected ${predicate.expectedValue} (error: ${error.toFixed(4)})`,
  };
}

// ─── Outcome determination ─────────────────────────────────────────────────

/**
 * Determines the overall outcome from a set of predicate results.
 *
 * - All pass → confirmed
 * - Any fail (falsified) → falsified
 * - All inconclusive → inconclusive
 * - Mix of confirmed + inconclusive → inconclusive
 */
export function determineOutcome(results: PredicateResult[]): ValidationOutcome {
  if (results.length === 0) return 'inconclusive';

  const hasFalsified = results.some((r) => r.outcome === 'falsified');
  if (hasFalsified) return 'falsified';

  const allConfirmed = results.every((r) => r.outcome === 'confirmed');
  if (allConfirmed) return 'confirmed';

  return 'inconclusive';
}

/**
 * Maps a validation outcome to a prediction status.
 */
export function outcomeToStatus(outcome: ValidationOutcome): PredictionStatus {
  switch (outcome) {
    case 'confirmed':
      return 'confirmed';
    case 'falsified':
      return 'contradicted';
    case 'inconclusive':
      return 'inconclusive';
  }
}

// ─── Confidence adjustment ─────────────────────────────────────────────────

/**
 * Computes a confidence adjustment based on match quality.
 *
 * - Confirmed: positive adjustment proportional to match quality (0–10).
 * - Falsified: negative adjustment proportional to error magnitude (-10–0).
 * - Inconclusive: no adjustment (0).
 */
export function computeConfidenceAdjustment(
  results: PredicateResult[],
  outcome: ValidationOutcome,
): number {
  if (outcome === 'inconclusive' || results.length === 0) return 0;

  if (outcome === 'confirmed') {
    // Average of (1 - normalised error) across predicates, scaled to 0–10
    let qualitySum = 0;
    for (const r of results) {
      const tolerance = r.tolerance > 0 ? r.tolerance : 1;
      const normalisedError = Math.min(1, r.error / tolerance);
      qualitySum += 1 - normalisedError;
    }
    return (qualitySum / results.length) * 10;
  }

  // Falsified
  let penaltySum = 0;
  for (const r of results) {
    if (r.outcome === 'falsified') {
      const tolerance = r.tolerance > 0 ? r.tolerance : 1;
      const excess = (r.error - tolerance) / tolerance;
      penaltySum += Math.min(1, excess);
    }
  }
  return -(penaltySum / results.length) * 10;
}

// ─── Simulation failure handling ───────────────────────────────────────────

export interface SimulationFailure {
  type: 'timeout' | 'divergence' | 'error';
  message: string;
}

/**
 * Detects simulation failures from a simulation result.
 */
export function detectFailure(result: SimulationResult): SimulationFailure | null {
  // Check for divergence: validation failed with NaN values
  if (!result.validation.passed) {
    for (const check of result.validation.checks) {
      if (typeof check.value === 'number' && !isFinite(check.value)) {
        return { type: 'divergence', message: `Divergence detected: ${check.message}` };
      }
    }
  }

  // Check outputs for NaN / Infinity
  for (const [key, value] of Object.entries(result.outputs)) {
    if (typeof value === 'number' && !isFinite(value)) {
      return { type: 'divergence', message: `Non-finite value in output "${key}"` };
    }
  }

  return null;
}

// ─── Validation report ─────────────────────────────────────────────────────

/**
 * Generates a validation report from a set of validation results.
 */
export function generateValidationReport(results: PredictionValidationResult[]): ValidationReport {
  const confirmed = results.filter((r) => r.outcome === 'confirmed').length;
  const falsified = results.filter((r) => r.outcome === 'falsified').length;
  const inconclusive = results.filter((r) => r.outcome === 'inconclusive').length;
  const errors = results.filter((r) => r.error !== undefined).length;

  const overallAdjustment =
    results.length > 0
      ? results.reduce((sum, r) => sum + r.confidenceAdjustment, 0) / results.length
      : 0;

  const summary = `Validated ${results.length} prediction(s): ${confirmed} confirmed, ${falsified} falsified, ${inconclusive} inconclusive, ${errors} error(s). Average confidence adjustment: ${overallAdjustment.toFixed(2)}.`;

  return {
    totalPredictions: results.length,
    confirmed,
    falsified,
    inconclusive,
    errors,
    results,
    overallConfidenceAdjustment: overallAdjustment,
    summary,
  };
}

// ─── Main loop ─────────────────────────────────────────────────────────────

/**
 * Runs the prediction-simulation loop for a batch of testable predictions.
 *
 * @param testablePredictions Predictions to validate.
 * @param runner A function that runs a simulation and returns results.
 * @param metadataFactory A function that creates simulation metadata for a prediction.
 * @param timeoutMs Timeout per simulation in milliseconds.
 * @returns Validation report with per-prediction results.
 */
export function runPredictionSimulationLoop(
  testablePredictions: TestablePrediction[],
  runner: SimulationRunner,
  metadataFactory: (prediction: TestablePrediction) => SimulationMetadata,
  timeoutMs = 30000,
): ValidationReport {
  const results: PredictionValidationResult[] = [];

  for (const testable of testablePredictions) {
    const startTime = Date.now();
    const metadata = metadataFactory(testable);

    let simulationResult: SimulationResult;
    try {
      simulationResult = runWithTimeout(runner, testable, metadata, timeoutMs);
    } catch (err) {
      const duration = (Date.now() - startTime) / 1000;
      const message = err instanceof Error ? err.message : String(err);
      results.push({
        predictionId: testable.prediction.id,
        hypothesisId: testable.prediction.hypothesisId,
        outcome: 'inconclusive',
        newStatus: 'inconclusive',
        confidenceAdjustment: 0,
        predicateResults: [],
        error: message,
        duration,
      });
      continue;
    }

    const duration = (Date.now() - startTime) / 1000;

    // Check for simulation failure
    const failure = detectFailure(simulationResult);
    if (failure) {
      results.push({
        predictionId: testable.prediction.id,
        hypothesisId: testable.prediction.hypothesisId,
        outcome: 'inconclusive',
        newStatus: 'inconclusive',
        confidenceAdjustment: 0,
        predicateResults: [],
        error: failure.message,
        duration,
      });
      continue;
    }

    // Evaluate predicates
    const predicateResults = testable.predicates.map((p) =>
      evaluatePredicate(p, simulationResult.outputs),
    );

    const outcome = determineOutcome(predicateResults);
    const newStatus = outcomeToStatus(outcome);
    const confidenceAdjustment = computeConfidenceAdjustment(predicateResults, outcome);

    results.push({
      predictionId: testable.prediction.id,
      hypothesisId: testable.prediction.hypothesisId,
      outcome,
      newStatus,
      confidenceAdjustment,
      predicateResults,
      duration,
    });
  }

  return generateValidationReport(results);
}

/**
 * Runs a simulation with a timeout. Throws if the timeout is exceeded.
 */
function runWithTimeout(
  runner: SimulationRunner,
  prediction: TestablePrediction,
  metadata: SimulationMetadata,
  timeoutMs: number,
): SimulationResult {
  // In a real environment this would use web workers or async cancellation.
  // For the synchronous test environment we record the start time and check
  // after execution. This keeps the interface compatible with async runners
  // in future refactors.
  const start = Date.now();
  const result = runner(prediction, metadata);
  const elapsed = Date.now() - start;
  if (elapsed > timeoutMs) {
    throw new Error(`Simulation timed out after ${elapsed}ms (limit: ${timeoutMs}ms)`);
  }
  return result;
}
