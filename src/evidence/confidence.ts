import type { Evidence } from '@/schemas/evidence';
import type { Hypothesis } from '@/schemas/hypothesis';
import type { Source } from '@/schemas/source';

export interface ConfidenceFactors {
  sourceReliability: number;
  measurementQuality: number;
  consensus: number;
  directObservation: number;
}

export const DEFAULT_CONFIDENCE_WEIGHTS: ConfidenceFactors = {
  sourceReliability: 0.35,
  measurementQuality: 0.3,
  consensus: 0.2,
  directObservation: 0.15,
};

function clamp(value: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, value));
}

const NEUTRAL_FACTOR = 50;

function sourceReliability(source: Source | undefined): number {
  return source?.reliability ?? NEUTRAL_FACTOR;
}

function normalizedFactor(value: number | undefined): number {
  return (value ?? NEUTRAL_FACTOR) / 100;
}

/**
 * Compute object-level confidence from supporting evidence.
 *
 * Each evidence item contributes its confidence weighted by its source's
 * reliability. This is the first step in the confidence propagation chain:
 * Evidence → Object Confidence → Hypothesis Confidence → Simulation Confidence.
 */
export function computeObjectConfidence(
  evidence: Evidence[],
  sourceById: (id: string) => Source | undefined,
  weights: ConfidenceFactors = DEFAULT_CONFIDENCE_WEIGHTS,
): number {
  return computeWeightedScore(evidence, sourceById, weights);
}

/**
 * Compute per-object-per-hypothesis confidence.
 *
 * Supporting evidence increases confidence, contradicting evidence decreases it,
 * and required evidence caps the result at its own confidence value.
 */
export function computeHypothesisConfidenceForObject(
  hypothesis: Hypothesis,
  supporting: Evidence[],
  contradicting: Evidence[],
  required: Evidence[],
  sourceById: (id: string) => Source | undefined,
  weights: ConfidenceFactors = DEFAULT_CONFIDENCE_WEIGHTS,
): number {
  const activeWeights = hypothesis.confidenceModel?.weights ?? weights;
  const supportScore = computeWeightedScore(supporting, sourceById, activeWeights);
  const contradictScore = computeWeightedScore(contradicting, sourceById, activeWeights);

  let value = supportScore - contradictScore;

  const requiredConfidence = required.reduce((min, ev) => Math.min(min, ev.confidence), 100);
  if (required.length > 0) {
    value = Math.min(value, requiredConfidence);
  }

  return clamp(value);
}

function computeWeightedScore(
  evidence: Evidence[],
  sourceById: (id: string) => Source | undefined,
  weights: ConfidenceFactors,
): number {
  if (evidence.length === 0) {
    return 0;
  }

  let total = 0;
  let weightSum = 0;

  for (const ev of evidence) {
    const weight =
      normalizedFactor(sourceReliability(sourceById(ev.sourceIds[0]))) * weights.sourceReliability +
      normalizedFactor(ev.measurementQuality) * weights.measurementQuality +
      normalizedFactor(ev.consensus) * weights.consensus +
      normalizedFactor(ev.directObservation) * weights.directObservation;
    total += ev.confidence * weight;
    weightSum += weight;
  }

  if (weightSum === 0) {
    return 0;
  }

  return clamp(total / weightSum);
}

/**
 * Aggregate per-object confidence values into the overall hypothesis confidence.
 */
export function computeOverallHypothesisConfidence(
  confidenceByObject: Record<string, number>,
): number {
  const values = Object.values(confidenceByObject);
  if (values.length === 0) {
    return 0;
  }
  const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
  return clamp(mean);
}
