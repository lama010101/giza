import { describe, it, expect, beforeEach } from 'vitest';
import { EvidenceStore } from './EvidenceStore';
import {
  submitEvidence,
  startReview,
  verifyEvidence,
  publishEvidence,
  supersedeEvidence,
} from './lifecycleController';
import { assignReviewer, recordReviewDecision, completeReviewAndPublish } from './reviewWorkflow';
import { DependencyGraph } from './dependencyGraph';
import { getAuditHistory, getAllAuditEntries, _resetAuditLogForTesting } from './auditLog';
import type { DependencyEdge } from '@/schemas/dependency';

/**
 * M02-T17: Integration test for the full evidence lifecycle.
 *
 * Covers: create → submit → review → publish → supersede → export;
 * audit trail verified at each step.
 *
 * Per GIZA - 08 §1.3, §1.12, §1.14, §1.22.
 */
describe('M02-T17: Full Evidence Lifecycle Integration', () => {
  let store: EvidenceStore;
  let graph: DependencyGraph;

  beforeEach(() => {
    _resetAuditLogForTesting();
    store = new EvidenceStore();
    graph = new DependencyGraph();
  });

  it('executes the full lifecycle: create → submit → review → publish → supersede', () => {
    const ev = store.create({
      title: "Sarcophagus dimensions in the King's Chamber",
      description: 'Direct measurement of the sarcophagus interior',
      category: 'Measurement',
      primaryClass: 'E2',
      confidence: 92,
      measurementQuality: 95,
      directObservation: 100,
      sourceIds: ['SRC-0001'],
      objectIds: ['OBJ-0001'],
      locationId: 'LOC-001',
      createdBy: 'author-001',
    });
    expect(ev.status).toBe('Draft');
    expect(ev.version).toBe(1);

    submitEvidence(ev.id, 'author-001', store);
    expect(store.getById(ev.id)?.status).toBe('Submitted');

    assignReviewer(
      {
        evidenceId: ev.id,
        reviewer: 'reviewer-001',
        orcid: '0000-0002-1825-0097',
        editor: 'editor-001',
      },
      store,
    );
    expect(store.getById(ev.id)?.status).toBe('In Review');

    recordReviewDecision(
      {
        evidenceId: ev.id,
        reviewer: 'reviewer-001',
        decision: 'approve',
        comment: 'Solid measurements',
      },
      store,
    );

    const published = completeReviewAndPublish(ev.id, 'editor-001', store);
    expect(published.status).toBe('Published');

    supersedeEvidence(ev.id, 'editor-001', store);
    expect(store.getById(ev.id)?.status).toBe('Superseded');
  });

  it('records audit entries at every lifecycle stage', () => {
    const ev = store.create({
      title: 'Test evidence for audit trail',
      category: 'Measurement',
      confidence: 80,
      createdBy: 'author-001',
    });

    submitEvidence(ev.id, 'author-001', store);
    startReview(ev.id, 'editor-001', store);
    verifyEvidence(ev.id, 'editor-001', store);
    publishEvidence(ev.id, 'editor-001', store);

    const history = getAuditHistory(ev.id);
    expect(history.length).toBeGreaterThanOrEqual(4);
    expect(history.every((e) => e.evidenceId === ev.id)).toBe(true);
    expect(history.every((e) => e.timestamp.length > 0)).toBe(true);
    expect(history.every((e) => e.actor.length > 0)).toBe(true);
  });

  it('tracks review log entries through the revise loop', () => {
    const ev = store.create({
      title: 'Evidence requiring revision',
      category: 'Inference',
      confidence: 70,
      createdBy: 'author-001',
    });

    submitEvidence(ev.id, 'author-001', store);
    assignReviewer({ evidenceId: ev.id, reviewer: 'reviewer-001', editor: 'editor-001' }, store);

    recordReviewDecision(
      {
        evidenceId: ev.id,
        reviewer: 'reviewer-001',
        decision: 'revise',
        comment: 'Add more sources',
      },
      store,
    );
    expect(store.getById(ev.id)?.status).toBe('Submitted');
    expect(store.getById(ev.id)?.reviewLog.length).toBe(1);

    startReview(ev.id, 'author-001', store);
    recordReviewDecision(
      { evidenceId: ev.id, reviewer: 'reviewer-001', decision: 'approve', comment: 'Much better' },
      store,
    );
    expect(store.getById(ev.id)?.reviewLog.length).toBe(2);

    expect(() => completeReviewAndPublish(ev.id, 'editor-001', store)).toThrow(/pending 'revise'/);
  });

  it('maintains a dependency DAG across multiple evidence records', () => {
    const ev1 = store.create({
      title: 'Foundation measurement',
      category: 'Measurement',
      confidence: 95,
    });
    const ev2 = store.create({
      title: 'Derived calculation',
      category: 'Inference',
      confidence: 85,
    });
    const ev3 = store.create({
      title: 'Higher-order theory',
      category: 'Reconstruction',
      confidence: 70,
    });

    graph.addEdge({ from: ev1.id, to: ev2.id, relation: 'supports', strength: 0.9, notes: '' });
    graph.addEdge({ from: ev2.id, to: ev3.id, relation: 'supports', strength: 0.8, notes: '' });

    expect(graph.size()).toBe(2);
    expect(graph.getDownstreamTransitive(ev1.id)).toContain(ev3.id);
    expect(graph.getUpstreamTransitive(ev3.id)).toContain(ev1.id);

    expect(() =>
      graph.addEdge({
        from: ev3.id,
        to: ev1.id,
        relation: 'supports',
        strength: 0.5,
        notes: '',
      } as DependencyEdge),
    ).toThrow(/Cycle rejected/);
  });

  it('prevents verification when evidence has pending revise decisions', () => {
    const ev = store.create({
      title: 'Evidence with pending revisions',
      category: 'Measurement',
      confidence: 75,
    });

    submitEvidence(ev.id, '', store);
    startReview(ev.id, '', store);
    recordReviewDecision(
      { evidenceId: ev.id, reviewer: 'reviewer-001', decision: 'revise', comment: 'Needs work' },
      store,
    );
    startReview(ev.id, '', store);

    expect(() => verifyEvidence(ev.id, '', store)).toThrow(/pending 'revise'/);
  });

  it('exports a complete audit trail as JSON', () => {
    const ev = store.create({
      title: 'Audit export test',
      category: 'Measurement',
      confidence: 88,
    });
    submitEvidence(ev.id, 'author', store);
    startReview(ev.id, 'editor', store);
    verifyEvidence(ev.id, 'editor', store);
    publishEvidence(ev.id, 'editor', store);

    const allEntries = getAllAuditEntries();
    expect(allEntries.length).toBeGreaterThan(0);
    const json = JSON.stringify(allEntries);
    const parsed = JSON.parse(json) as typeof allEntries;
    expect(parsed.length).toBe(allEntries.length);
  });

  it('increments version on every update', () => {
    const ev = store.create({
      title: 'Version tracking test',
      category: 'Measurement',
      confidence: 80,
    });
    expect(ev.version).toBe(1);

    const updated = store.update(ev.id, { title: 'Updated title' });
    expect(updated?.version).toBe(2);

    const updated2 = store.update(ev.id, { confidence: 85 });
    expect(updated2?.version).toBe(3);
  });

  it('prevents updates to retracted evidence', () => {
    const ev = store.create({
      title: 'To be retracted',
      category: 'Measurement',
      confidence: 50,
    });
    submitEvidence(ev.id, '', store);
    startReview(ev.id, '', store);
    verifyEvidence(ev.id, '', store);
    publishEvidence(ev.id, '', store);
    supersedeEvidence(ev.id, '', store);
    store.update(ev.id, { status: 'Retracted' });

    expect(() => store.update(ev.id, { title: 'Should fail' })).toThrow(/retracted/);
  });
});
