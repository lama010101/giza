import { describe, it, expect, beforeEach } from 'vitest';
import { EvidenceStore } from './EvidenceStore';
import {
  assignReviewer,
  recordReviewDecision,
  allReviewsApproved,
  hasPendingRevisions,
  completeReviewAndPublish,
} from './reviewWorkflow';
import { submitEvidence, startReview } from './lifecycleController';
import { _resetAuditLogForTesting } from './auditLog';

describe('Review Workflow', () => {
  let store: EvidenceStore;

  beforeEach(() => {
    _resetAuditLogForTesting();
    store = new EvidenceStore();
  });

  function createAndSubmit(store: EvidenceStore): string {
    const ev = store.create({
      title: 'Test Evidence',
      category: 'Measurement',
      confidence: 90,
      createdBy: 'author',
    });
    submitEvidence(ev.id, 'author', store);
    return ev.id;
  }

  it('assigns a reviewer and transitions to In Review', () => {
    const id = createAndSubmit(store);
    const updated = assignReviewer(
      {
        evidenceId: id,
        reviewer: 'Jane Doe',
        orcid: '0000-0002-1825-0097',
        editor: 'Editor',
      },
      store,
    );
    expect(updated.status).toBe('In Review');
  });

  it('rejects assignment when evidence is not Submitted or In Review', () => {
    const ev = store.create({
      title: 'Test',
      category: 'Measurement',
      confidence: 90,
    });
    // Still Draft
    expect(() =>
      assignReviewer(
        {
          evidenceId: ev.id,
          reviewer: 'Jane',
          editor: 'Editor',
        },
        store,
      ),
    ).toThrow(/must be Submitted or In Review/);
  });

  it('records an approve decision', () => {
    const id = createAndSubmit(store);
    startReview(id, '', store);
    recordReviewDecision(
      {
        evidenceId: id,
        reviewer: 'Jane Doe',
        decision: 'approve',
        comment: 'Looks good',
      },
      store,
    );
    expect(allReviewsApproved(id, store)).toBe(true);
    expect(hasPendingRevisions(id, store)).toBe(false);
  });

  it('records a revise decision and sends back to Submitted', () => {
    const id = createAndSubmit(store);
    startReview(id, '', store);
    recordReviewDecision(
      {
        evidenceId: id,
        reviewer: 'Jane Doe',
        decision: 'revise',
        comment: 'Please add more detail',
      },
      store,
    );
    expect(hasPendingRevisions(id, store)).toBe(true);
    expect(store.getById(id)?.status).toBe('Submitted');
  });

  it('records a reject decision', () => {
    const id = createAndSubmit(store);
    startReview(id, '', store);
    recordReviewDecision(
      {
        evidenceId: id,
        reviewer: 'Jane Doe',
        decision: 'reject',
        comment: 'Insufficient evidence',
      },
      store,
    );
    expect(allReviewsApproved(id, store)).toBe(false);
  });

  it('completeReviewAndPublish succeeds when all reviews are approved', () => {
    const id = createAndSubmit(store);
    startReview(id, '', store);
    recordReviewDecision(
      { evidenceId: id, reviewer: 'Jane', decision: 'approve', comment: 'Good' },
      store,
    );
    recordReviewDecision(
      { evidenceId: id, reviewer: 'Bob', decision: 'approve', comment: 'Approved' },
      store,
    );
    const published = completeReviewAndPublish(id, 'Editor', store);
    expect(published.status).toBe('Published');
  });

  it('completeReviewAndPublish fails when there are pending revisions', () => {
    const id = createAndSubmit(store);
    startReview(id, '', store);
    recordReviewDecision(
      { evidenceId: id, reviewer: 'Jane', decision: 'revise', comment: 'Needs work' },
      store,
    );
    // revise decision sends it back to Submitted; author re-enters review
    startReview(id, '', store);
    expect(() => completeReviewAndPublish(id, 'Editor', store)).toThrow(/pending 'revise'/);
  });

  it('completeReviewAndPublish fails when not all reviews are approved', () => {
    const id = createAndSubmit(store);
    startReview(id, '', store);
    recordReviewDecision(
      { evidenceId: id, reviewer: 'Jane', decision: 'approve', comment: 'Good' },
      store,
    );
    recordReviewDecision(
      { evidenceId: id, reviewer: 'Bob', decision: 'reject', comment: 'Bad' },
      store,
    );
    expect(() => completeReviewAndPublish(id, 'Editor', store)).toThrow(
      /not all reviews are approved/,
    );
  });

  it('rejects review decisions when not In Review', () => {
    const id = createAndSubmit(store);
    // Still Submitted (not yet In Review)
    expect(() =>
      recordReviewDecision(
        { evidenceId: id, reviewer: 'Jane', decision: 'approve', comment: 'Good' },
        store,
      ),
    ).toThrow(/must be In Review/);
  });
});
