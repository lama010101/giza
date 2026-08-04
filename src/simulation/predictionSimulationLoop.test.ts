import { describe, it, expect } from 'vitest';
import {
  selectTestablePredictions,
  evaluatePredicate,
  determineOutcome,
  outcomeToStatus,
  computeConfidenceAdjustment,
  detectFailure,
  generateValidationReport,
  runPredictionSimulationLoop,
  type TestablePrediction,
  type PredictionPredicate,
  type SimulationRunner,
  type PredictionValidationResult,
} from './predictionSimulationLoop';
import type { Prediction } from '@/schemas/prediction';
import type { SimulationMetadata, SimulationResult } from './types';

function makePrediction(overrides: Partial<Prediction> = {}): Prediction {
  return {
    id: 'PRED-001',
    hypothesisId: 'THEORY-001',
    description: 'Water level in Chamber I reaches 0.5 m',
    predictedObservation: 'measured water level',
    evidenceRefs: [],
    status: 'untested',
    ...overrides,
  };
}

function makeTestable(
  pred: Prediction,
  overrides: Partial<TestablePrediction> = {},
): TestablePrediction {
  return {
    prediction: pred,
    predicates: [
      {
        outputKey: 'waterLevel',
        expectedValue: 0.5,
        tolerance: 0.1,
        toleranceType: 'absolute',
        operator: 'eq',
      },
    ],
    simulationType: 'Hydraulic',
    simulationParameters: {},
    ...overrides,
  };
}

function makeMetadata(): SimulationMetadata {
  return {
    id: 'SIM-001',
    softwareVersion: '1.0.0',
    date: '2026-08-01',
    parameters: {
      simulationType: 'Hydraulic',
      version: 1,
      parameters: [],
    },
    author: 'test',
    geometryVersion: '1.0',
    theoryContext: 'THEORY-001',
    randomSeed: 42,
  };
}

function makeResult(outputs: Record<string, unknown>): SimulationResult {
  return {
    metadata: makeMetadata(),
    outputs,
    validation: { passed: true, checks: [] },
  };
}

describe('Prediction-Simulation Loop (M11.5-T12)', () => {
  describe('selectTestablePredictions', () => {
    it('selects untested predictions with predicates', () => {
      const preds = [makePrediction(), makePrediction({ id: 'PRED-002', status: 'confirmed' })];
      const map = new Map<string, TestablePrediction>();
      map.set('PRED-001', makeTestable(preds[0]));
      map.set('PRED-002', makeTestable(preds[1]));
      const result = selectTestablePredictions(preds, map);
      expect(result).toHaveLength(1);
      expect(result[0].prediction.id).toBe('PRED-001');
    });

    it('selects inconclusive predictions for re-testing', () => {
      const preds = [makePrediction({ status: 'inconclusive' })];
      const map = new Map<string, TestablePrediction>();
      map.set('PRED-001', makeTestable(preds[0]));
      const result = selectTestablePredictions(preds, map);
      expect(result).toHaveLength(1);
    });

    it('skips predictions without predicates', () => {
      const preds = [makePrediction()];
      const map = new Map<string, TestablePrediction>();
      map.set('PRED-001', makeTestable(preds[0], { predicates: [] }));
      const result = selectTestablePredictions(preds, map);
      expect(result).toHaveLength(0);
    });
  });

  describe('evaluatePredicate', () => {
    it('confirms when value is within tolerance', () => {
      const pred: PredictionPredicate = {
        outputKey: 'waterLevel',
        expectedValue: 0.5,
        tolerance: 0.1,
        toleranceType: 'absolute',
        operator: 'eq',
      };
      const result = evaluatePredicate(pred, { waterLevel: 0.55 });
      expect(result.passed).toBe(true);
      expect(result.outcome).toBe('confirmed');
    });

    it('falsifies when value is outside tolerance', () => {
      const pred: PredictionPredicate = {
        outputKey: 'waterLevel',
        expectedValue: 0.5,
        tolerance: 0.1,
        toleranceType: 'absolute',
        operator: 'eq',
      };
      const result = evaluatePredicate(pred, { waterLevel: 1.0 });
      expect(result.passed).toBe(false);
      expect(result.outcome).toBe('falsified');
    });

    it('returns inconclusive when output key is missing', () => {
      const pred: PredictionPredicate = {
        outputKey: 'missing',
        expectedValue: 1,
        tolerance: 0.1,
        toleranceType: 'absolute',
        operator: 'eq',
      };
      const result = evaluatePredicate(pred, { otherKey: 1 });
      expect(result.outcome).toBe('inconclusive');
    });
  });

  describe('determineOutcome', () => {
    it('returns confirmed when all predicates pass', () => {
      const results = [{ outcome: 'confirmed' } as never, { outcome: 'confirmed' } as never];
      expect(determineOutcome(results)).toBe('confirmed');
    });

    it('returns falsified when any predicate fails', () => {
      const results = [{ outcome: 'confirmed' } as never, { outcome: 'falsified' } as never];
      expect(determineOutcome(results)).toBe('falsified');
    });
  });

  describe('outcomeToStatus', () => {
    it('maps confirmed → confirmed', () => {
      expect(outcomeToStatus('confirmed')).toBe('confirmed');
    });
    it('maps falsified → contradicted', () => {
      expect(outcomeToStatus('falsified')).toBe('contradicted');
    });
    it('maps inconclusive → inconclusive', () => {
      expect(outcomeToStatus('inconclusive')).toBe('inconclusive');
    });
  });

  describe('computeConfidenceAdjustment', () => {
    it('returns positive for confirmed', () => {
      const results = [
        {
          outcome: 'confirmed',
          error: 0.01,
          tolerance: 0.1,
        } as never,
      ];
      const adj = computeConfidenceAdjustment(results, 'confirmed');
      expect(adj).toBeGreaterThan(0);
    });

    it('returns negative for falsified', () => {
      const results = [
        {
          outcome: 'falsified',
          error: 1.0,
          tolerance: 0.1,
        } as never,
      ];
      const adj = computeConfidenceAdjustment(results, 'falsified');
      expect(adj).toBeLessThan(0);
    });

    it('returns zero for inconclusive', () => {
      const adj = computeConfidenceAdjustment([], 'inconclusive');
      expect(adj).toBe(0);
    });
  });

  describe('detectFailure', () => {
    it('detects non-finite values in outputs', () => {
      const result = makeResult({ pressure: NaN });
      const failure = detectFailure(result);
      expect(failure).not.toBeNull();
      expect(failure!.type).toBe('divergence');
    });

    it('returns null for valid results', () => {
      const result = makeResult({ pressure: 100 });
      expect(detectFailure(result)).toBeNull();
    });
  });

  describe('generateValidationReport', () => {
    it('summarises results', () => {
      const results: PredictionValidationResult[] = [
        {
          predictionId: 'PRED-001',
          hypothesisId: 'THEORY-001',
          outcome: 'confirmed',
          newStatus: 'confirmed',
          confidenceAdjustment: 5,
          predicateResults: [],
          duration: 0.1,
        },
        {
          predictionId: 'PRED-002',
          hypothesisId: 'THEORY-001',
          outcome: 'falsified',
          newStatus: 'contradicted',
          confidenceAdjustment: -8,
          predicateResults: [],
          duration: 0.2,
        },
      ];
      const report = generateValidationReport(results);
      expect(report.totalPredictions).toBe(2);
      expect(report.confirmed).toBe(1);
      expect(report.falsified).toBe(1);
      expect(report.summary).toContain('2 prediction');
    });
  });

  describe('runPredictionSimulationLoop', () => {
    it('runs simulation and produces a report', () => {
      const pred = makePrediction();
      const testable = makeTestable(pred);
      const runner: SimulationRunner = () => makeResult({ waterLevel: 0.52 });
      const factory = () => makeMetadata();
      const report = runPredictionSimulationLoop([testable], runner, factory);
      expect(report.totalPredictions).toBe(1);
      expect(report.confirmed).toBe(1);
    });

    it('handles simulation errors gracefully', () => {
      const pred = makePrediction();
      const testable = makeTestable(pred);
      const runner: SimulationRunner = () => {
        throw new Error('solver crashed');
      };
      const factory = () => makeMetadata();
      const report = runPredictionSimulationLoop([testable], runner, factory);
      expect(report.totalPredictions).toBe(1);
      expect(report.inconclusive).toBe(1);
      expect(report.results[0].error).toContain('crashed');
    });
  });
});
