/**
 * Prediction store and lifecycle per M05.5-T04.
 *
 * Manages prediction records (CRUD + status transitions) for the
 * hypothesis framework. Predictions are testable claims derived
 * from a hypothesis that can be validated against evidence.
 */

import type { Prediction, PredictionStatus } from '@/schemas/prediction';

export const PREDICTION_TRANSITIONS: Record<PredictionStatus, PredictionStatus[]> = {
  untested: ['confirmed', 'partially-confirmed', 'contradicted', 'inconclusive'],
  confirmed: ['inconclusive'],
  'partially-confirmed': ['confirmed', 'contradicted', 'inconclusive'],
  contradicted: ['inconclusive'],
  inconclusive: ['untested', 'confirmed', 'partially-confirmed', 'contradicted'],
};

let predictionCounter = 0;

function nextPredictionId(): string {
  predictionCounter += 1;
  return `PRED-${String(predictionCounter).padStart(4, '0')}`;
}

class PredictionStore {
  private predictions = new Map<string, Prediction>();

  /**
   * Creates a new prediction.
   */
  create(hypothesisId: string, description: string, predictedObservation = ''): Prediction {
    const id = nextPredictionId();
    const prediction: Prediction = {
      id,
      hypothesisId,
      description,
      predictedObservation,
      evidenceRefs: [],
      status: 'untested',
    };

    this.predictions.set(id, prediction);
    return prediction;
  }

  /**
   * Returns a prediction by ID.
   */
  get(id: string): Prediction | undefined {
    return this.predictions.get(id);
  }

  /**
   * Returns all predictions for a hypothesis.
   */
  getByHypothesis(hypothesisId: string): Prediction[] {
    return [...this.predictions.values()].filter((p) => p.hypothesisId === hypothesisId);
  }

  /**
   * Returns all predictions.
   */
  getAll(): Prediction[] {
    return [...this.predictions.values()];
  }

  /**
   * Updates a prediction's status.
   */
  transition(id: string, newStatus: PredictionStatus): Prediction | undefined {
    const prediction = this.predictions.get(id);
    if (!prediction) return undefined;

    const allowed = PREDICTION_TRANSITIONS[prediction.status];
    if (!allowed.includes(newStatus)) {
      throw new Error(`Invalid transition from ${prediction.status} to ${newStatus}`);
    }

    const updated: Prediction = { ...prediction, status: newStatus };
    this.predictions.set(id, updated);
    return updated;
  }

  /**
   * Adds evidence reference to a prediction.
   */
  addEvidence(id: string, evidenceId: string): Prediction | undefined {
    const prediction = this.predictions.get(id);
    if (!prediction) return undefined;

    if (!prediction.evidenceRefs.includes(evidenceId)) {
      const updated: Prediction = {
        ...prediction,
        evidenceRefs: [...prediction.evidenceRefs, evidenceId],
      };
      this.predictions.set(id, updated);
      return updated;
    }

    return prediction;
  }

  /**
   * Sets the comparison result for a prediction.
   */
  setComparisonResult(id: string, result: unknown): Prediction | undefined {
    const prediction = this.predictions.get(id);
    if (!prediction) return undefined;

    const updated: Prediction = { ...prediction, comparisonResult: result };
    this.predictions.set(id, updated);
    return updated;
  }

  /**
   * Deletes a prediction.
   */
  delete(id: string): boolean {
    return this.predictions.delete(id);
  }

  /**
   * Returns predictions by status.
   */
  getByStatus(status: PredictionStatus): Prediction[] {
    return [...this.predictions.values()].filter((p) => p.status === status);
  }

  /**
   * Resets the store. Intended for testing.
   */
  _resetForTesting(): void {
    this.predictions.clear();
    predictionCounter = 0;
  }
}

export const predictionStore = new PredictionStore();
