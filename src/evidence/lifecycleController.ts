import { assertTransition, canTransition } from '@/schemas/lifecycle';
import type { EvidenceStatus } from '@/schemas/evidence';
import type { Evidence } from '@/schemas/evidence';
import { evidenceStore, type EvidenceStore } from './EvidenceStore';
import { recordAudit, AuditAction } from './auditLog';

/**
 * Evidence lifecycle controller per GIZA - 08 §1.3 and §1.12.
 *
 * Wraps EvidenceStore to enforce forward-only state transitions and
 * record audit entries on every state change. The review workflow
 * (§1.12) is integrated: `revise` decisions block transition to Verified.
 */

export interface TransitionResult {
  evidence: Evidence;
  from: EvidenceStatus;
  to: EvidenceStatus;
  timestamp: string;
}

/**
 * Transitions an evidence record to a new lifecycle state.
 * Throws on invalid transitions. Records an audit entry.
 */
export function transitionEvidence(
  id: string,
  to: EvidenceStatus,
  actor = '',
  store: EvidenceStore = evidenceStore,
): TransitionResult {
  const current = store.getById(id);
  if (!current) {
    throw new Error(`Evidence ${id} not found`);
  }

  const from = current.status;
  assertTransition(from, to);

  // Review workflow gate: cannot transition to Verified if there are
  // unresolved `revise` decisions in the review log (§1.12).
  if (to === 'Verified') {
    const hasPendingRevise = current.reviewLog.some((entry) => entry.decision === 'revise');
    if (hasPendingRevise) {
      throw new Error(
        `Cannot transition ${id} to Verified: pending 'revise' decisions ` +
          'must be resolved first (GIZA - 08 §1.12).',
      );
    }
  }

  const updated = store.update(id, { status: to, updatedBy: actor });
  if (!updated) {
    throw new Error(`Failed to update evidence ${id}`);
  }

  recordAudit(id, AuditAction.LIFECYCLE_TRANSITION, actor, { from, to });

  return {
    evidence: updated,
    from,
    to,
    timestamp: updated.updated,
  };
}

/**
 * Convenience methods for each lifecycle transition.
 */
export function submitEvidence(id: string, actor = '', store?: EvidenceStore): TransitionResult {
  return transitionEvidence(id, 'Submitted', actor, store);
}

export function startReview(id: string, actor = '', store?: EvidenceStore): TransitionResult {
  return transitionEvidence(id, 'In Review', actor, store);
}

export function verifyEvidence(id: string, actor = '', store?: EvidenceStore): TransitionResult {
  return transitionEvidence(id, 'Verified', actor, store);
}

export function publishEvidence(id: string, actor = '', store?: EvidenceStore): TransitionResult {
  return transitionEvidence(id, 'Published', actor, store);
}

export function supersedeEvidence(id: string, actor = '', store?: EvidenceStore): TransitionResult {
  return transitionEvidence(id, 'Superseded', actor, store);
}

export function retractEvidence(id: string, actor = '', store?: EvidenceStore): TransitionResult {
  return transitionEvidence(id, 'Retracted', actor, store);
}

/**
 * Returns to Submitted from In Review (the revise loop).
 * Used when reviewers request changes and the author must revise.
 */
export function reviseEvidence(id: string, actor = '', store?: EvidenceStore): TransitionResult {
  return transitionEvidence(id, 'Submitted', actor, store);
}

/**
 * Checks whether a transition is valid without performing it.
 */
export function canTransitionEvidence(
  id: string,
  to: EvidenceStatus,
  store: EvidenceStore = evidenceStore,
): boolean {
  const current = store.getById(id);
  if (!current) return false;
  return canTransition(current.status, to);
}
