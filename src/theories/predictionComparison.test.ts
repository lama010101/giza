import { describe, it, expect } from 'vitest';
import {
  comparePredictions,
  deriveObservable,
  exportComparisonAsJson,
} from './predictionComparison';
import type { Hypothesis } from '@/schemas/hypothesis';
import type { Prediction } from '@/schemas/prediction';

function makePrediction(
  id: string,
  hypothesisId: string,
  description: string,
  predictedObservation = '',
  status: Prediction['status'] = 'untested',
): Prediction {
  return {
    id,
    hypothesisId,
    description,
    predictedObservation,
    evidenceRefs: [],
    status,
  };
}

function makeHypothesis(id: string, predictions: Prediction[]): Hypothesis {
  return {
    id,
    name: id,
    description: `Hypothesis ${id}`,
    authors: [],
    scientificAssumptions: [],
    predictions,
    affectedStructures: [],
    supports: [],
    contradicts: [],
    requiredEvidence: [],
    simulations: [],
    visualizationRules: [],
    confidence: 50,
    confidenceByObject: {},
    references: [],
    bibliography: [],
    status: 'published',
    tags: [],
  };
}

describe('Prediction Comparison (M05.5-T05)', () => {
  describe('deriveObservable', () => {
    it('extracts the first clause as the observable key', () => {
      expect(deriveObservable('Chamber water level reaches 0.5m. Stable flow.')).toBe(
        'chamber water level reaches 0',
      );
    });
  });

  describe('comparePredictions', () => {
    it('throws when fewer than 2 hypotheses are provided', () => {
      const h = makeHypothesis('THEORY-A', []);
      expect(() => comparePredictions([h])).toThrow('at least 2 hypotheses');
    });

    it('groups predictions by observable and detects matches', () => {
      const hA = makeHypothesis('THEORY-A', [
        makePrediction('PRED-A-01', 'THEORY-A', 'Water level stable', '0.5m'),
      ]);
      const hB = makeHypothesis('THEORY-B', [
        makePrediction('PRED-B-01', 'THEORY-B', 'Water level stable', '0.5m'),
      ]);
      const result = comparePredictions([hA, hB]);

      expect(result.observables).toHaveLength(1);
      expect(result.observables[0].observable).toBe('water level stable');
      expect(result.observables[0].matches).toBe(true);
      expect(result.observables[0].conflicts).toHaveLength(0);
    });

    it('detects conflicting predictions on the same observable', () => {
      const hA = makeHypothesis('THEORY-A', [
        makePrediction('PRED-A-01', 'THEORY-A', 'Water level stable', '0.5m'),
      ]);
      const hB = makeHypothesis('THEORY-B', [
        makePrediction('PRED-B-01', 'THEORY-B', 'Water level stable', '1.2m'),
      ]);
      const result = comparePredictions([hA, hB]);

      expect(result.observables[0].matches).toBe(false);
      expect(result.observables[0].conflicts).toHaveLength(1);
      expect(result.conflicts).toHaveLength(1);
      expect(result.conflicts[0].hypothesisIds).toEqual(['THEORY-A', 'THEORY-B']);
    });

    it('computes agreement and disagreement scores', () => {
      const hA = makeHypothesis('THEORY-A', [
        makePrediction('PRED-A-01', 'THEORY-A', 'Water level stable', '0.5m'),
        makePrediction('PRED-A-02', 'THEORY-A', 'Acoustic resonance', '440Hz'),
      ]);
      const hB = makeHypothesis('THEORY-B', [
        makePrediction('PRED-B-01', 'THEORY-B', 'Water level stable', '0.5m'),
        makePrediction('PRED-B-02', 'THEORY-B', 'Acoustic resonance', '880Hz'),
      ]);
      const result = comparePredictions([hA, hB]);

      expect(result.totalPredicates).toBe(2);
      expect(result.matchedPredicates).toBe(1);
      expect(result.mismatchedPredicates).toBe(1);
      expect(result.agreementScore).toBeCloseTo(0.5);
      expect(result.disagreementScore).toBeCloseTo(0.5);
    });

    it('applies numeric significance threshold for numeric comparisons', () => {
      const hA = makeHypothesis('THEORY-A', [
        makePrediction('PRED-A-01', 'THEORY-A', 'Flow rate', '1.0 m/s'),
      ]);
      const hB = makeHypothesis('THEORY-B', [
        makePrediction('PRED-B-01', 'THEORY-B', 'Flow rate', '1.05 m/s'),
      ]);

      // Without threshold: mismatch (1.0 vs 1.05)
      const exact = comparePredictions([hA, hB]);
      expect(exact.observables[0].matches).toBe(false);

      // With threshold 0.1: match
      const tolerant = comparePredictions([hA, hB], { numericThreshold: 0.1 });
      expect(tolerant.observables[0].matches).toBe(true);
    });

    it('produces per-predicate pair comparisons with match/mismatch/unique statuses', () => {
      const hA = makeHypothesis('THEORY-A', [
        makePrediction('PRED-A-01', 'THEORY-A', 'Water level stable', '0.5m'),
        makePrediction('PRED-A-02', 'THEORY-A', 'Conduit flow', 'laminar'),
      ]);
      const hB = makeHypothesis('THEORY-B', [
        makePrediction('PRED-B-01', 'THEORY-B', 'Water level stable', '0.5m'),
      ]);
      const result = comparePredictions([hA, hB]);

      expect(result.pairs).toHaveLength(1);
      const pair = result.pairs[0];
      const statuses = pair.predicates.map((p) => p.status).sort();
      expect(statuses).toEqual(['match', 'unique-a']);
      expect(pair.matchedPredicates).toBe(1);
      expect(pair.uniquePredicates).toBe(1);
    });

    it('supports explicit observable and value maps', () => {
      const hA = makeHypothesis('THEORY-A', [
        makePrediction('PRED-A-01', 'THEORY-A', 'Some description', 'value-a'),
      ]);
      const hB = makeHypothesis('THEORY-B', [
        makePrediction('PRED-B-01', 'THEORY-B', 'Different description', 'value-b'),
      ]);
      const result = comparePredictions([hA, hB], {
        observableMap: { 'PRED-A-01': 'chamber-water-level', 'PRED-B-01': 'chamber-water-level' },
        valueMap: { 'PRED-A-01': 'high', 'PRED-B-01': 'high' },
      });

      expect(result.observables).toHaveLength(1);
      expect(result.observables[0].observable).toBe('chamber-water-level');
      expect(result.observables[0].matches).toBe(true);
    });

    it('compares 3 hypotheses and produces 3 pairs', () => {
      const hA = makeHypothesis('THEORY-A', [
        makePrediction('PRED-A-01', 'THEORY-A', 'Water level stable', '0.5m'),
      ]);
      const hB = makeHypothesis('THEORY-B', [
        makePrediction('PRED-B-01', 'THEORY-B', 'Water level stable', '0.5m'),
      ]);
      const hC = makeHypothesis('THEORY-C', [
        makePrediction('PRED-C-01', 'THEORY-C', 'Water level stable', '2.0m'),
      ]);
      const result = comparePredictions([hA, hB, hC]);

      expect(result.hypothesisIds).toHaveLength(3);
      expect(result.pairs).toHaveLength(3);
      // A-B match, A-C mismatch, B-C mismatch
      const matchPairs = result.pairs.filter((p) => p.matchedPredicates > 0);
      expect(matchPairs).toHaveLength(1);
      expect(result.conflicts).toHaveLength(2);
    });
  });

  describe('exportComparisonAsJson', () => {
    it('serializes the comparison result to valid JSON', () => {
      const hA = makeHypothesis('THEORY-A', [
        makePrediction('PRED-A-01', 'THEORY-A', 'Water level stable', '0.5m'),
      ]);
      const hB = makeHypothesis('THEORY-B', [
        makePrediction('PRED-B-01', 'THEORY-B', 'Water level stable', '0.5m'),
      ]);
      const result = comparePredictions([hA, hB]);
      const json = exportComparisonAsJson(result);
      const parsed = JSON.parse(json) as { hypothesisIds: string[] };
      expect(parsed.hypothesisIds).toEqual(['THEORY-A', 'THEORY-B']);
    });
  });
});
