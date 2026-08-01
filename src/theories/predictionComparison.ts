/**
 * Prediction comparison engine per M05.5-T05.
 *
 * Compares predictions from different hypotheses side-by-side, detects
 * conflicting predictions (same observable, different values), computes
 * agreement/disagreement scores between hypothesis prediction sets, groups
 * predictions by observable, and provides a structured comparison result
 * with per-predicate matches/mismatches.
 *
 * Scientific neutrality is preserved: the engine never declares a hypothesis
 * correct. It only reports where predictions agree or disagree so the user
 * can draw conclusions.
 */

import type { Hypothesis } from '@/schemas/hypothesis';
import type { Prediction, PredictionStatus } from '@/schemas/prediction';

/**
 * A single prediction normalized for comparison.
 */
export interface PredictionComparisonEntry {
  predictionId: string;
  hypothesisId: string;
  description: string;
  predictedObservation: string;
  status: PredictionStatus;
  /** Observable key used to group predictions across hypotheses. */
  observable: string;
  /** Normalized predicted value (lowercased, trimmed) used for matching. */
  value: string;
}

/**
 * A conflict between two or more hypotheses on the same observable.
 */
export interface PredictionConflict {
  observable: string;
  hypothesisIds: string[];
  values: string[];
}

/**
 * A group of predictions (one per hypothesis) that share an observable.
 */
export interface ObservableGroup {
  observable: string;
  entries: PredictionComparisonEntry[];
  /** True when every entry's value matches (within significance threshold). */
  matches: boolean;
  conflicts: PredictionConflict[];
}

/**
 * Per-predicate match/mismatch summary for a pair of hypotheses.
 */
export interface PredicateComparison {
  observable: string;
  status: 'match' | 'mismatch' | 'partial' | 'unique-a' | 'unique-b';
  entryA?: PredictionComparisonEntry;
  entryB?: PredictionComparisonEntry;
}

/**
 * Pairwise comparison between two hypotheses.
 */
export interface HypothesisPairComparison {
  hypothesisAId: string;
  hypothesisBId: string;
  predicates: PredicateComparison[];
  matchedPredicates: number;
  mismatchedPredicates: number;
  uniquePredicates: number;
  agreementScore: number;
  disagreementScore: number;
}

/**
 * Full comparison result across all provided hypotheses.
 */
export interface PredictionComparisonResult {
  hypothesisIds: string[];
  observables: ObservableGroup[];
  conflicts: PredictionConflict[];
  pairs: HypothesisPairComparison[];
  totalPredicates: number;
  matchedPredicates: number;
  mismatchedPredicates: number;
  agreementScore: number;
  disagreementScore: number;
}

/**
 * Options for comparison.
 */
export interface ComparisonOptions {
  /**
   * Numeric significance threshold. When two predicted values both parse as
   * numbers, they are considered matching if their absolute difference is
   * within this threshold. Defaults to 0 (exact match).
   */
  numericThreshold?: number;
  /**
   * Optional mapping from prediction ID to an explicit observable key.
   * When omitted, the observable is derived from the prediction description.
   */
  observableMap?: Record<string, string>;
  /**
   * Optional mapping from prediction ID to an explicit predicted value.
   * When omitted, the value is derived from `predictedObservation`.
   */
  valueMap?: Record<string, string>;
}

const DEFAULT_NUMERIC_THRESHOLD = 0;

/**
 * Extracts a numeric value from a string, if present.
 * Returns the first number found (integer or decimal), or undefined.
 */
function extractNumber(text: string): number | undefined {
  const match = text.match(/-?\d+(?:\.\d+)?/);
  if (!match) return undefined;
  return Number(match[0]);
}

/**
 * Normalizes a prediction into a comparison entry.
 */
function toEntry(
  prediction: Prediction,
  options: Required<Pick<ComparisonOptions, 'observableMap' | 'valueMap'>>,
): PredictionComparisonEntry {
  const observable =
    options.observableMap[prediction.id] ?? deriveObservable(prediction.description);
  const value = (options.valueMap[prediction.id] ?? prediction.predictedObservation)
    .trim()
    .toLowerCase();
  return {
    predictionId: prediction.id,
    hypothesisId: prediction.hypothesisId,
    description: prediction.description,
    predictedObservation: prediction.predictedObservation,
    status: prediction.status,
    observable,
    value,
  };
}

/**
 * Derives an observable key from a prediction description.
 *
 * Uses the first sentence / clause before any numeric qualifier so that
 * predictions about the same phenomenon group together even when the
 * predicted values differ.
 */
export function deriveObservable(description: string): string {
  const firstClause = description.split(/[,.:;]/)[0] ?? description;
  return firstClause.trim().toLowerCase();
}

/**
 * Determines whether two values match, accounting for numeric thresholds.
 */
function valuesMatch(valueA: string, valueB: string, threshold: number): boolean {
  if (valueA === valueB) return true;
  const numA = extractNumber(valueA);
  const numB = extractNumber(valueB);
  if (numA !== undefined && numB !== undefined) {
    return Math.abs(numA - numB) <= threshold;
  }
  return false;
}

/**
 * Collects all predictions from a set of hypotheses.
 */
function collectPredictions(hypotheses: Hypothesis[]): Prediction[] {
  return hypotheses.flatMap((h) => h.predictions);
}

/**
 * Groups comparison entries by observable.
 */
function groupByObservable(
  entries: PredictionComparisonEntry[],
): Map<string, PredictionComparisonEntry[]> {
  const groups = new Map<string, PredictionComparisonEntry[]>();
  for (const entry of entries) {
    const list = groups.get(entry.observable) ?? [];
    list.push(entry);
    groups.set(entry.observable, list);
  }
  return groups;
}

/**
 * Detects conflicts within an observable group.
 */
function detectConflicts(
  observable: string,
  entries: PredictionComparisonEntry[],
  threshold: number,
): PredictionConflict[] {
  const conflicts: PredictionConflict[] = [];
  const seen = new Set<string>();

  for (let i = 0; i < entries.length; i++) {
    for (let j = i + 1; j < entries.length; j++) {
      const a = entries[i];
      const b = entries[j];
      if (valuesMatch(a.value, b.value, threshold)) continue;

      const key = `${a.hypothesisId}:${b.hypothesisId}`;
      if (seen.has(key)) continue;
      seen.add(key);

      conflicts.push({
        observable,
        hypothesisIds: [a.hypothesisId, b.hypothesisId],
        values: [a.value, b.value],
      });
    }
  }

  return conflicts;
}

/**
 * Compares two hypotheses pairwise, producing per-predicate results.
 */
function comparePair(
  hypothesisAId: string,
  hypothesisBId: string,
  observableGroups: Map<string, PredictionComparisonEntry[]>,
  threshold: number,
): HypothesisPairComparison {
  const predicates: PredicateComparison[] = [];
  let matched = 0;
  let mismatched = 0;
  let unique = 0;

  for (const [observable, entries] of observableGroups) {
    const entryA = entries.find((e) => e.hypothesisId === hypothesisAId);
    const entryB = entries.find((e) => e.hypothesisId === hypothesisBId);

    if (entryA && entryB) {
      if (valuesMatch(entryA.value, entryB.value, threshold)) {
        predicates.push({ observable, status: 'match', entryA, entryB });
        matched += 1;
      } else {
        predicates.push({ observable, status: 'mismatch', entryA, entryB });
        mismatched += 1;
      }
    } else if (entryA && !entryB) {
      predicates.push({ observable, status: 'unique-a', entryA });
      unique += 1;
    } else if (!entryA && entryB) {
      predicates.push({ observable, status: 'unique-b', entryB });
      unique += 1;
    }
  }

  const shared = matched + mismatched;
  const agreementScore = shared > 0 ? matched / shared : 0;
  const disagreementScore = shared > 0 ? mismatched / shared : 0;

  return {
    hypothesisAId,
    hypothesisBId,
    predicates,
    matchedPredicates: matched,
    mismatchedPredicates: mismatched,
    uniquePredicates: unique,
    agreementScore,
    disagreementScore,
  };
}

/**
 * Compares predictions from multiple hypotheses and returns a structured
 * comparison result.
 *
 * @param hypotheses - The hypotheses to compare (2 or more).
 * @param options   - Comparison options (numeric threshold, observable/value maps).
 * @throws {Error} when fewer than 2 hypotheses are provided.
 */
export function comparePredictions(
  hypotheses: Hypothesis[],
  options: ComparisonOptions = {},
): PredictionComparisonResult {
  if (hypotheses.length < 2) {
    throw new Error('comparePredictions requires at least 2 hypotheses');
  }

  const numericThreshold = options.numericThreshold ?? DEFAULT_NUMERIC_THRESHOLD;
  const observableMap = options.observableMap ?? {};
  const valueMap = options.valueMap ?? {};

  const predictions = collectPredictions(hypotheses);
  const entries = predictions.map((p) => toEntry(p, { observableMap, valueMap }));

  const observableMapGroups = groupByObservable(entries);
  const observables: ObservableGroup[] = [];
  const allConflicts: PredictionConflict[] = [];

  for (const [observable, groupEntries] of observableMapGroups) {
    const conflicts = detectConflicts(observable, groupEntries, numericThreshold);
    allConflicts.push(...conflicts);
    observables.push({
      observable,
      entries: groupEntries,
      matches: conflicts.length === 0,
      conflicts,
    });
  }

  const hypothesisIds = hypotheses.map((h) => h.id);
  const pairs: HypothesisPairComparison[] = [];
  for (let i = 0; i < hypothesisIds.length; i++) {
    for (let j = i + 1; j < hypothesisIds.length; j++) {
      pairs.push(
        comparePair(hypothesisIds[i], hypothesisIds[j], observableMapGroups, numericThreshold),
      );
    }
  }

  const totalPredicates = observableMapGroups.size;
  const matchedPredicates = observables.filter((o) => o.matches).length;
  const mismatchedPredicates = observables.filter((o) => !o.matches).length;
  const agreementScore = totalPredicates > 0 ? matchedPredicates / totalPredicates : 0;
  const disagreementScore = totalPredicates > 0 ? mismatchedPredicates / totalPredicates : 0;

  return {
    hypothesisIds,
    observables,
    conflicts: allConflicts,
    pairs,
    totalPredicates,
    matchedPredicates,
    mismatchedPredicates,
    agreementScore,
    disagreementScore,
  };
}

/**
 * Exports a comparison result as a JSON string.
 */
export function exportComparisonAsJson(result: PredictionComparisonResult): string {
  return JSON.stringify(result, null, 2);
}
