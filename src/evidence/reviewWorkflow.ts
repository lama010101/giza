import type { Evidence, ReviewEntry } from '@/schemas/evidence';
import { evidenceStore, type EvidenceStore } from './EvidenceStore';
import { recordAudit, AuditAction } from './auditLog';
import {
  startReview,
  verifyEvidence,
  reviseEvidence,
  publishEvidence,
} from './lifecycleController';

/**
 * Review workflow per GIZA - 08 §1.12.
 *
 * Author submits → Editor assigns reviewers → Reviewers comment →
 * Author revises → Reviewers approve or reject → Editor publishes.
 *
 * Reviewers are tracked by ORCID where available.
 * `revise` decisions block transition to Verified.
 */

export interface AssignReviewerInput {
  evidenceId: string;
  reviewer: string;
  orcid?: string;
  editor: string;
}

export interface AddCommentInput {
  evidenceId: string;
  reviewer: string;
  comment: string;
  orcid?: string;
}

export interface ReviewDecisionInput {
  evidenceId: string;
  reviewer: string;
  decision: 'approve' | 'reject' | 'revise';
  comment: string;
  orcid?: string;
}

/**
 * Assigns a reviewer to an evidence record.
 * The evidence must be in "Submitted" or "In Review" state.
 */
export function assignReviewer(
  input: AssignReviewerInput,
  store: EvidenceStore = evidenceStore,
): Evidence {
  const current = store.getById(input.evidenceId);
  if (!current) throw new Error(`Evidence ${input.evidenceId} not found`);
  if (current.status !== 'In Review' && current.status !== 'Submitted') {
    throw new Error(
      `Cannot assign reviewer to ${input.evidenceId}: status is ${current.status}, ` +
        'must be Submitted or In Review (GIZA - 08 §1.12).',
    );
  }

  // Auto-transition to In Review if still Submitted
  if (current.status === 'Submitted') {
    startReview(input.evidenceId, input.editor, store);
  }

  recordAudit(input.evidenceId, AuditAction.REVIEW_ASSIGNED, input.editor, {
    reviewer: input.reviewer,
    orcid: input.orcid,
  });

  return store.getById(input.evidenceId)!;
}

/**
 * Adds a reviewer comment to the audit log.
 */
export function addReviewComment(
  input: AddCommentInput,
  store: EvidenceStore = evidenceStore,
): Evidence {
  const current = store.getById(input.evidenceId);
  if (!current) throw new Error(`Evidence ${input.evidenceId} not found`);
  if (current.status !== 'In Review') {
    throw new Error(
      `Cannot comment on ${input.evidenceId}: status is ${current.status}, ` +
        'must be In Review (GIZA - 08 §1.12).',
    );
  }

  // Pure comments are recorded as audit entries, not review log entries.
  // Only explicit decisions (approve/reject/revise) go into the review log.
  recordAudit(input.evidenceId, AuditAction.REVIEW_COMMENTED, input.reviewer, {
    comment: input.comment,
    orcid: input.orcid,
  });

  return store.getById(input.evidenceId)!;
}

/**
 * Records a review decision (approve, reject, or revise).
 * - approve: adds to review log, checks if all reviewers approved
 * - reject: adds to review log, prevents verification
 * - revise: adds to review log, blocks transition to Verified until resolved
 */
export function recordReviewDecision(
  input: ReviewDecisionInput,
  store: EvidenceStore = evidenceStore,
): Evidence {
  const current = store.getById(input.evidenceId);
  if (!current) throw new Error(`Evidence ${input.evidenceId} not found`);
  if (current.status !== 'In Review') {
    throw new Error(
      `Cannot record decision on ${input.evidenceId}: status is ${current.status}, ` +
        'must be In Review (GIZA - 08 §1.12).',
    );
  }

  const entry: ReviewEntry = {
    iteration: current.reviewLog.length + 1,
    reviewer: input.reviewer,
    decision: input.decision,
    comments: input.comment,
    date: new Date().toISOString(),
  };

  const updated = store.update(input.evidenceId, {
    reviewLog: [...current.reviewLog, entry],
    updatedBy: input.reviewer,
  });
  if (!updated) throw new Error(`Failed to update evidence ${input.evidenceId}`);

  const auditAction =
    input.decision === 'approve'
      ? AuditAction.REVIEW_APPROVED
      : input.decision === 'reject'
        ? AuditAction.REVIEW_REJECTED
        : AuditAction.REVIEW_REVISED;

  recordAudit(input.evidenceId, auditAction, input.reviewer, {
    decision: input.decision,
    comment: input.comment,
    orcid: input.orcid,
  });

  // If decision is 'revise', send back to Submitted for author revision
  if (input.decision === 'revise') {
    reviseEvidence(input.evidenceId, input.reviewer, store);
  }

  return store.getById(input.evidenceId)!;
}

/**
 * Checks if all review decisions are 'approve' (no pending revise/reject).
 */
export function allReviewsApproved(
  evidenceId: string,
  store: EvidenceStore = evidenceStore,
): boolean {
  const current = store.getById(evidenceId);
  if (!current) return false;
  if (current.reviewLog.length === 0) return false;
  return current.reviewLog.every((entry) => entry.decision === 'approve');
}

/**
 * Checks if there are any pending 'revise' decisions that block verification.
 */
export function hasPendingRevisions(
  evidenceId: string,
  store: EvidenceStore = evidenceStore,
): boolean {
  const current = store.getById(evidenceId);
  if (!current) return false;
  return current.reviewLog.some((entry) => entry.decision === 'revise');
}

/**
 * Full review workflow: verify + publish in one step.
 * Only succeeds if all reviews are approved and no pending revisions.
 */
export function completeReviewAndPublish(
  evidenceId: string,
  editor: string,
  store: EvidenceStore = evidenceStore,
): Evidence {
  if (hasPendingRevisions(evidenceId, store)) {
    throw new Error(
      `Cannot complete review for ${evidenceId}: pending 'revise' decisions ` +
        'must be resolved first (GIZA - 08 §1.12).',
    );
  }
  if (!allReviewsApproved(evidenceId, store)) {
    throw new Error(
      `Cannot complete review for ${evidenceId}: not all reviews are approved (GIZA - 08 §1.12).`,
    );
  }

  verifyEvidence(evidenceId, editor, store);
  const result = publishEvidence(evidenceId, editor, store);
  return result.evidence;
}
