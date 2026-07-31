import { describe, it, expect, beforeEach } from 'vitest';
import { EvidenceStore } from './EvidenceStore';
import {
  submitEvidence,
  startReview,
  verifyEvidence,
  publishEvidence,
  supersedeEvidence,
  retractEvidence,
  reviseEvidence,
  transitionEvidence,
  canTransitionEvidence,
} from './lifecycleController';
import { _resetAuditLogForTesting } from './auditLog';

describe('Evidence Lifecycle Controller', () => {
  let store: EvidenceStore;

  beforeEach(() => {
    _resetAuditLogForTesting();
    store = new EvidenceStore();
  });

  function createDraft(store: EvidenceStore): string {
    const ev = store.create({
      title: 'Test Evidence',
      category: 'Measurement',
      confidence: 90,
    });
    return ev.id;
  }

  it('transitions Draft → Submitted', () => {
    const id = createDraft(store);
    const result = submitEvidence(id, 'author', store);
    expect(result.from).toBe('Draft');
    expect(result.to).toBe('Submitted');
    expect(result.evidence.status).toBe('Submitted');
  });

  it('transitions through the full forward lifecycle', () => {
    const id = createDraft(store);
    submitEvidence(id, '', store);
    startReview(id, '', store);
    verifyEvidence(id, '', store);
    publishEvidence(id, '', store);
    supersedeEvidence(id, '', store);
    retractEvidence(id, '', store);
    expect(store.getById(id)?.status).toBe('Retracted');
  });

  it('rejects backward transitions', () => {
    const id = createDraft(store);
    submitEvidence(id, '', store);
    expect(() => transitionEvidence(id, 'Draft', '', store)).toThrow(/Invalid evidence lifecycle/);
  });

  it('rejects transitions from Retracted (terminal state)', () => {
    const id = createDraft(store);
    submitEvidence(id, '', store);
    startReview(id, '', store);
    verifyEvidence(id, '', store);
    publishEvidence(id, '', store);
    supersedeEvidence(id, '', store);
    retractEvidence(id, '', store);
    expect(() => publishEvidence(id, '', store)).toThrow(/Invalid evidence lifecycle/);
    expect(() => transitionEvidence(id, 'Published', '', store)).toThrow(/forward-only/);
  });

  it('rejects shortcut transitions (skipping review)', () => {
    const id = createDraft(store);
    expect(() => transitionEvidence(id, 'Published', '', store)).toThrow(
      /Invalid evidence lifecycle/,
    );
  });

  it('allows the revise loop (In Review → Submitted)', () => {
    const id = createDraft(store);
    submitEvidence(id, '', store);
    startReview(id, '', store);
    reviseEvidence(id, '', store);
    expect(store.getById(id)?.status).toBe('Submitted');
  });

  it('canTransitionEvidence returns false for invalid transitions', () => {
    const id = createDraft(store);
    expect(canTransitionEvidence(id, 'Submitted', store)).toBe(true);
    expect(canTransitionEvidence(id, 'Published', store)).toBe(false);
  });

  it('canTransitionEvidence returns false for unknown evidence', () => {
    expect(canTransitionEvidence('EV-999999', 'Submitted', store)).toBe(false);
  });

  it('throws on unknown evidence ID', () => {
    expect(() => transitionEvidence('EV-999999', 'Submitted', '', store)).toThrow(/not found/);
  });
});
