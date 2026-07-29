import { describe, it, expect } from 'vitest';
import {
  computeHypothesisConfidenceForObject,
  computeObjectConfidence,
  computeOverallHypothesisConfidence,
} from './confidence';
import type { Evidence } from '@/schemas/evidence';
import type { Hypothesis } from '@/schemas/hypothesis';
import type { Source } from '@/schemas/source';

function source(id: string, reliability = 80): Source {
  return {
    id,
    authors: [],
    title: 'Test Source',
    type: 'Journal',
    reliability,
  } as Source;
}

function evidence(id: string, confidence: number, sourceIds: string[] = ['SRC-0001']): Evidence {
  return {
    id,
    title: 'Test Evidence',
    description: '',
    category: 'Measurement',
    primaryClass: 'E2',
    confidence,
    confidenceBasis: 'test',
    status: 'Published',
    sourceIds,
  } as Evidence;
}

function hypothesis(overrides: Partial<Hypothesis> = {}): Hypothesis {
  return {
    id: 'THEORY-001',
    name: 'Test Hypothesis',
    description: '',
    authors: [],
    confidence: 0,
    confidenceByObject: {},
    references: [],
    status: 'published',
    ...overrides,
  } as Hypothesis;
}

describe('computeObjectConfidence', () => {
  it('returns 0 when no evidence is provided', () => {
    expect(computeObjectConfidence([], () => undefined)).toBe(0);
  });

  it('uses source reliability as a weight', () => {
    const ev = evidence('EV-000001', 80, ['SRC-0001']);
    const src = source('SRC-0001', 100);
    const score = computeObjectConfidence([ev], (id) => (id === src.id ? src : undefined));
    expect(score).toBeGreaterThan(0);
    expect(score).toBeLessThanOrEqual(100);
  });

  it('weighs high-quality evidence more heavily than low-quality evidence', () => {
    const strong = { ...evidence('EV-000001', 80), measurementQuality: 100, consensus: 100 };
    const weak = { ...evidence('EV-000002', 40), measurementQuality: 0, consensus: 0 };
    const lookup = (id: string) => (id === 'SRC-0001' ? source('SRC-0001', 80) : undefined);

    const score = computeObjectConfidence([strong, weak], lookup);
    expect(score).toBeGreaterThan(60);

    const reversed = computeObjectConfidence(
      [
        { ...strong, confidence: 40 },
        { ...weak, confidence: 80 },
      ],
      lookup,
    );
    expect(reversed).toBeLessThan(60);
  });

  it('falls back to neutral factors when none are recorded', () => {
    const ev = evidence('EV-000001', 70);
    const score = computeObjectConfidence([ev], () => undefined);
    expect(score).toBe(70);
  });
});

describe('computeHypothesisConfidenceForObject', () => {
  it('caps confidence by required evidence', () => {
    const hyp = hypothesis();
    const supporting = [evidence('EV-000001', 95, ['SRC-0001'])];
    const required = [evidence('EV-000002', 40, ['SRC-0002'])];
    const score = computeHypothesisConfidenceForObject(hyp, supporting, [], required, (id) =>
      id === 'SRC-0001' ? source('SRC-0001', 100) : source('SRC-0002', 80),
    );
    expect(score).toBeLessThanOrEqual(40);
  });
});

describe('computeOverallHypothesisConfidence', () => {
  it('returns the mean of per-object values', () => {
    expect(computeOverallHypothesisConfidence({ 'OBJ-0001': 80, 'OBJ-0002': 60 })).toBe(70);
  });

  it('returns 0 for an empty record', () => {
    expect(computeOverallHypothesisConfidence({})).toBe(0);
  });
});
