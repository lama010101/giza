import { describe, it, expect } from 'vitest';
import {
  validateHypothesis,
  validatePredictions,
  validateSimulation,
  validateEvidence,
  validatePeerReview,
  runValidationPipeline,
  generateValidationReport,
  revalidate,
  DEFAULT_CONFIG,
  type ValidationPipelineConfig,
  type PeerReviewEntry,
} from './validationPipeline';
import type { HypothesisPlugin } from './types';
import type { Hypothesis } from '@/schemas/hypothesis';
import type { Evidence } from '@/schemas/evidence';
import type { Source } from '@/schemas/source';
import type { Prediction } from '@/schemas/prediction';

function makePlugin(overrides: Partial<HypothesisPlugin> = {}): HypothesisPlugin {
  return {
    id: 'THEORY-001',
    name: 'Hydraulic-Acoustic Hypothesis',
    description: 'The Great Pyramid was a hydraulic-acoustic machine.',
    version: '1.0.0',
    getHypothesis: () => makeHypothesis(),
    ...overrides,
  };
}

function makePrediction(overrides: Partial<Prediction> = {}): Prediction {
  return {
    id: 'PRED-001',
    hypothesisId: 'THEORY-001',
    description: 'Water level reaches 0.5 m in Chamber I',
    predictedObservation: 'measured water level',
    evidenceRefs: [],
    status: 'untested',
    ...overrides,
  };
}

function makeHypothesis(overrides: Partial<Hypothesis> = {}): Hypothesis {
  return {
    id: 'THEORY-001',
    name: 'Hydraulic-Acoustic Hypothesis',
    description: 'The Great Pyramid was a hydraulic-acoustic machine.',
    authors: [{ name: 'Test Author', orcid: '0000-0000-0000-0000' }],
    scientificAssumptions: ['Water was present in the shaft'],
    predictions: [makePrediction()],
    affectedStructures: ['OBJ-0111'],
    supports: ['EV-100011'],
    contradicts: [],
    requiredEvidence: ['EV-100011'],
    simulations: [],
    visualizationRules: [],
    confidence: 60,
    confidenceByObject: {},
    references: ['SRC-0101'],
    bibliography: [],
    status: 'published',
    tags: [],
    ...overrides,
  };
}

function makeEvidence(): Evidence[] {
  return [
    {
      id: 'EV-100011',
      type: 'Measurement',
      sourceIds: ['SRC-0101'],
      description: 'Chamber dimensions',
      confidence: 80,
      status: 'Published',
      tags: [],
    } as unknown as Evidence,
  ];
}

function makeSources(): Source[] {
  return [
    {
      id: 'SRC-0101',
      type: 'Journal',
      title: 'Journal of Egyptian Archaeology',
      authors: [],
      year: 2007,
      reliability: 80,
      license: 'CC-BY-4.0',
    } as unknown as Source,
  ];
}

describe('Validation Pipeline (M11.5-T14)', () => {
  describe('validateHypothesis', () => {
    it('passes a valid plugin', () => {
      const result = validateHypothesis(makePlugin());
      expect(result.status).toBe('passed');
      expect(result.errors).toHaveLength(0);
    });

    it('fails with invalid theory ID format', () => {
      const result = validateHypothesis(makePlugin({ id: 'bad-id' }));
      expect(result.status).toBe('failed');
      expect(result.errors.some((e) => e.includes('THEORY-NNN'))).toBe(true);
    });
  });

  describe('validatePredictions', () => {
    it('passes when predictions have descriptions', () => {
      const result = validatePredictions(makeHypothesis());
      expect(result.status).toBe('passed');
    });

    it('warns when no predictions are defined', () => {
      const result = validatePredictions(makeHypothesis({ predictions: [] }));
      expect(result.warnings.some((w) => w.includes('no predictions'))).toBe(true);
    });

    it('fails when a prediction lacks a description', () => {
      const pred = makePrediction({ description: '' });
      const result = validatePredictions(makeHypothesis({ predictions: [pred] }));
      expect(result.status).toBe('failed');
    });
  });

  describe('validateSimulation', () => {
    it('is skipped when no report is provided', () => {
      const result = validateSimulation(undefined);
      expect(result.status).toBe('skipped');
    });

    it('passes when simulation has confirmed predictions', () => {
      const result = validateSimulation({
        passed: true,
        summary: 'All good',
        confirmed: 3,
        falsified: 0,
      });
      expect(result.status).toBe('passed');
    });
  });

  describe('validateEvidence', () => {
    it('passes with sufficient evidence', () => {
      const result = validateEvidence(
        makeHypothesis(),
        makeEvidence(),
        makeSources(),
        DEFAULT_CONFIG,
      );
      expect(result.status).toBe('passed');
    });

    it('fails with insufficient evidence refs', () => {
      const config: ValidationPipelineConfig = { ...DEFAULT_CONFIG, minEvidenceRefs: 10 };
      const result = validateEvidence(makeHypothesis(), makeEvidence(), makeSources(), config);
      expect(result.status).toBe('failed');
    });

    it('warns on low-reliability sources', () => {
      const sources = makeSources();
      sources[0].reliability = 20;
      const result = validateEvidence(makeHypothesis(), makeEvidence(), sources, DEFAULT_CONFIG);
      expect(result.warnings.some((w) => w.includes('reliability'))).toBe(true);
    });
  });

  describe('validatePeerReview', () => {
    it('is skipped when not required', () => {
      const result = validatePeerReview([], DEFAULT_CONFIG);
      expect(result.status).toBe('skipped');
    });

    it('passes with enough approvals', () => {
      const config: ValidationPipelineConfig = {
        ...DEFAULT_CONFIG,
        requirePeerReview: true,
        minReviewers: 1,
      };
      const reviews: PeerReviewEntry[] = [
        { reviewer: 'Alice', status: 'approved', comments: 'Good', reviewedAt: '2026-08-01' },
      ];
      const result = validatePeerReview(reviews, config);
      expect(result.status).toBe('passed');
    });

    it('fails with rejections', () => {
      const config: ValidationPipelineConfig = {
        ...DEFAULT_CONFIG,
        requirePeerReview: true,
        minReviewers: 1,
      };
      const reviews: PeerReviewEntry[] = [
        { reviewer: 'Bob', status: 'rejected', comments: 'Bad', reviewedAt: '2026-08-01' },
      ];
      const result = validatePeerReview(reviews, config);
      expect(result.status).toBe('failed');
    });
  });

  describe('runValidationPipeline', () => {
    it('runs all stages and produces a report', () => {
      const report = runValidationPipeline({
        plugin: makePlugin(),
        hypothesis: makeHypothesis(),
        evidence: makeEvidence(),
        sources: makeSources(),
      });
      expect(report.stages).toHaveLength(5);
      expect(report.overallPassed).toBe(true);
    });

    it('fails when hypothesis validation fails', () => {
      const report = runValidationPipeline({
        plugin: makePlugin({ id: 'invalid' }),
        hypothesis: makeHypothesis(),
        evidence: makeEvidence(),
        sources: makeSources(),
      });
      expect(report.overallPassed).toBe(false);
    });
  });

  describe('generateValidationReport', () => {
    it('produces a human-readable string', () => {
      const report = runValidationPipeline({
        plugin: makePlugin(),
        hypothesis: makeHypothesis(),
        evidence: makeEvidence(),
        sources: makeSources(),
      });
      const text = generateValidationReport(report);
      expect(text).toContain('Validation Report');
      expect(text).toContain('THEORY-001');
      expect(text).toContain('PASSED');
    });
  });

  describe('revalidate', () => {
    it('re-runs the pipeline after updates', async () => {
      const input = {
        plugin: makePlugin(),
        hypothesis: makeHypothesis(),
        evidence: makeEvidence(),
        sources: makeSources(),
      };
      const r1 = runValidationPipeline(input);
      await new Promise((r) => setTimeout(r, 10));
      const r2 = revalidate(input);
      expect(r2.overallPassed).toBe(r1.overallPassed);
      expect(r2.validatedAt).not.toBe(r1.validatedAt);
    });
  });
});
