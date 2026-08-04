import { describe, it, expect, beforeEach } from 'vitest';
import { EvidenceStore } from './EvidenceStore';
import {
  submitExtractedEvidence,
  routeToReview,
  processPipelineReviewDecision,
  runPipelineReviewBridge,
} from './contentPipelineReviewBridge';
import type { ExtractedEvidence, ReviewableEvidence } from './evidenceExtraction';

function makeExtracted(overrides: Partial<ExtractedEvidence> = {}): ExtractedEvidence {
  return {
    title: 'Test Evidence',
    text: 'A measurement of 5.24m was recorded.',
    evidenceClass: 'E1',
    confidence: 75,
    page: 1,
    rawText: 'A measurement of 5.24m was recorded.',
    ...overrides,
  };
}

function makeReviewable(
  draftId: string,
  evidence: Partial<ExtractedEvidence> = {},
): ReviewableEvidence {
  return {
    draftId,
    evidence: makeExtracted(evidence),
    status: 'pending',
    reviewLog: [],
    createdAt: new Date().toISOString(),
  };
}

describe('Content Pipeline Review Bridge (M03.5-T04)', () => {
  let store: EvidenceStore;

  beforeEach(() => {
    store = new EvidenceStore();
  });

  describe('submitExtractedEvidence', () => {
    it('submits extracted evidence to the store', () => {
      const reviewables = [makeReviewable('draft-001')];
      const results = submitExtractedEvidence(reviewables, store);
      expect(results).toHaveLength(1);
      expect(results[0].status).toBe('submitted');
      expect(store.getById(results[0].evidenceId)).toBeDefined();
    });

    it('generates canonical EV- IDs', () => {
      const reviewables = [makeReviewable('draft-001')];
      const results = submitExtractedEvidence(reviewables, store);
      expect(results[0].evidenceId).toMatch(/^EV-\d{6}$/);
    });

    it('creates separate evidence for duplicate drafts', () => {
      const reviewables = [makeReviewable('draft-001')];
      const results1 = submitExtractedEvidence(reviewables, store);
      const results2 = submitExtractedEvidence(reviewables, store);
      // Each submission creates a new evidence record with a new ID
      expect(results2[0].status).toBe('submitted');
      expect(results2[0].evidenceId).not.toBe(results1[0].evidenceId);
    });
  });

  describe('routeToReview', () => {
    it('assigns a reviewer to submitted evidence', () => {
      const reviewables = [makeReviewable('draft-001')];
      const submissions = submitExtractedEvidence(reviewables, store);
      const routing = routeToReview(
        submissions,
        {
          defaultReviewer: 'reviewer-1',
          editor: 'editor-1',
        },
        store,
      );
      expect(routing).toHaveLength(1);
      expect(routing[0].status).toBe('in_review');
      expect(routing[0].assignedReviewers).toContain('reviewer-1');
    });

    it('skips failed submissions', () => {
      const routing = routeToReview(
        [{ evidenceId: 'bad', status: 'failed' }],
        { defaultReviewer: 'r', editor: 'e' },
        store,
      );
      expect(routing).toHaveLength(0);
    });
  });

  describe('processPipelineReviewDecision', () => {
    it('records an approval decision', () => {
      const reviewables = [makeReviewable('draft-001')];
      const submissions = submitExtractedEvidence(reviewables, store);
      routeToReview(submissions, { defaultReviewer: 'r1', editor: 'e1' }, store);
      const result = processPipelineReviewDecision(
        submissions[0].evidenceId,
        'approve',
        'Looks good',
        'r1',
        { defaultReviewer: 'r1', editor: 'e1', autoPublish: true },
        store,
      );
      expect(result.published).toBe(true);
      expect(store.getById(submissions[0].evidenceId)?.status).toBe('Published');
    });

    it('records a rejection without publishing', () => {
      const reviewables = [makeReviewable('draft-002')];
      const submissions = submitExtractedEvidence(reviewables, store);
      routeToReview(submissions, { defaultReviewer: 'r1', editor: 'e1' }, store);
      const result = processPipelineReviewDecision(
        submissions[0].evidenceId,
        'reject',
        'Not convinced',
        'r1',
        { defaultReviewer: 'r1', editor: 'e1', autoPublish: true },
        store,
      );
      expect(result.published).toBe(false);
    });
  });

  describe('runPipelineReviewBridge', () => {
    it('runs the full bridge: submit → route → auto-approve', () => {
      const reviewables = [makeReviewable('draft-001'), makeReviewable('draft-002')];
      const result = runPipelineReviewBridge(
        reviewables,
        {
          defaultReviewer: 'r1',
          editor: 'e1',
          autoPublish: true,
        },
        store,
      );
      expect(result.submissions).toHaveLength(2);
      expect(result.routing).toHaveLength(2);
      expect(result.published).toHaveLength(2);
      expect(result.errors).toHaveLength(0);
    });

    it('does not auto-publish when autoPublish is false', () => {
      const reviewables = [makeReviewable('draft-003')];
      const result = runPipelineReviewBridge(
        reviewables,
        {
          defaultReviewer: 'r1',
          editor: 'e1',
          autoPublish: false,
        },
        store,
      );
      expect(result.published).toHaveLength(0);
    });
  });
});
