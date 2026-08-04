import { describe, it, expect, beforeEach } from 'vitest';
import { predictionStore, PREDICTION_TRANSITIONS } from './predictionStore';

describe('Prediction Store (M05.5-T04)', () => {
  beforeEach(() => {
    predictionStore._resetForTesting();
  });

  describe('create', () => {
    it('creates a prediction with default values', () => {
      const pred = predictionStore.create('THEORY-001', 'Test prediction');
      expect(pred.id).toMatch(/^PRED-\d{4}$/);
      expect(pred.hypothesisId).toBe('THEORY-001');
      expect(pred.description).toBe('Test prediction');
      expect(pred.status).toBe('untested');
      expect(pred.evidenceRefs).toEqual([]);
    });

    it('creates a prediction with predicted observation', () => {
      const pred = predictionStore.create('THEORY-001', 'Test prediction', 'Expected observation');
      expect(pred.predictedObservation).toBe('Expected observation');
    });
  });

  describe('get', () => {
    it('returns a prediction by ID', () => {
      const pred = predictionStore.create('THEORY-001', 'Test');
      const fetched = predictionStore.get(pred.id);
      expect(fetched).toBeDefined();
      expect(fetched?.id).toBe(pred.id);
    });

    it('returns undefined for unknown ID', () => {
      expect(predictionStore.get('PRED-9999')).toBeUndefined();
    });
  });

  describe('getByHypothesis', () => {
    it('returns predictions for a hypothesis', () => {
      predictionStore.create('THEORY-001', 'Test 1');
      predictionStore.create('THEORY-001', 'Test 2');
      predictionStore.create('THEORY-002', 'Test 3');

      const preds = predictionStore.getByHypothesis('THEORY-001');
      expect(preds).toHaveLength(2);
    });
  });

  describe('transition', () => {
    it('transitions from untested to confirmed', () => {
      const pred = predictionStore.create('THEORY-001', 'Test');
      const updated = predictionStore.transition(pred.id, 'confirmed');
      expect(updated?.status).toBe('confirmed');
    });

    it('throws on invalid transition', () => {
      const pred = predictionStore.create('THEORY-001', 'Test');
      const confirmed = predictionStore.transition(pred.id, 'confirmed');
      expect(() => predictionStore.transition(confirmed!.id, 'contradicted')).toThrow();
    });
  });

  describe('PREDICTION_TRANSITIONS', () => {
    it('defines transitions for untested', () => {
      expect(PREDICTION_TRANSITIONS.untested).toContain('confirmed');
      expect(PREDICTION_TRANSITIONS.untested).toContain('contradicted');
    });

    it('allows inconclusive to transition back', () => {
      expect(PREDICTION_TRANSITIONS.inconclusive).toContain('untested');
    });
  });

  describe('addEvidence', () => {
    it('adds evidence reference', () => {
      const pred = predictionStore.create('THEORY-001', 'Test');
      const updated = predictionStore.addEvidence(pred.id, 'EV-000001');
      expect(updated?.evidenceRefs).toContain('EV-000001');
    });

    it('does not duplicate evidence references', () => {
      const pred = predictionStore.create('THEORY-001', 'Test');
      predictionStore.addEvidence(pred.id, 'EV-000001');
      const updated = predictionStore.addEvidence(pred.id, 'EV-000001');
      expect(updated?.evidenceRefs).toHaveLength(1);
    });
  });

  describe('setComparisonResult', () => {
    it('sets the comparison result', () => {
      const pred = predictionStore.create('THEORY-001', 'Test');
      const updated = predictionStore.setComparisonResult(pred.id, { score: 0.85 });
      expect(updated?.comparisonResult).toEqual({ score: 0.85 });
    });
  });

  describe('delete', () => {
    it('deletes a prediction', () => {
      const pred = predictionStore.create('THEORY-001', 'Test');
      expect(predictionStore.delete(pred.id)).toBe(true);
      expect(predictionStore.get(pred.id)).toBeUndefined();
    });
  });

  describe('getByStatus', () => {
    it('returns predictions by status', () => {
      const p1 = predictionStore.create('THEORY-001', 'Test 1');
      predictionStore.create('THEORY-001', 'Test 2');
      predictionStore.transition(p1.id, 'confirmed');

      const confirmed = predictionStore.getByStatus('confirmed');
      expect(confirmed).toHaveLength(1);
    });
  });
});
