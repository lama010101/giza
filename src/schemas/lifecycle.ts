import { EvidenceStatus } from './evidence';

/**
 * Evidence lifecycle state machine per GIZA - 08 Evidence Database
 * Specification §1.3.
 *
 * State transitions are auditable and irreversible in the forward direction.
 * A retracted record cannot return to Published without a new record ID.
 *
 *   Draft → Submitted → In Review → Verified → Published → Superseded → Retracted
 */

export const EVIDENCE_LIFECYCLE_TRANSITIONS: Record<EvidenceStatus, EvidenceStatus | null> = {
  Draft: 'Submitted',
  Submitted: 'In Review',
  'In Review': 'Verified',
  Verified: 'Published',
  Published: 'Superseded',
  Superseded: 'Retracted',
  Retracted: null,
};

/**
 * Returns true if transitioning from `from` to `to` is permitted by the
 * forward-only lifecycle. Revise transitions (In Review → Submitted) are
 * allowed when reviewers request changes (see §1.12 Review Workflow).
 */
export function canTransition(from: EvidenceStatus, to: EvidenceStatus): boolean {
  if (from === to) return false;
  // Forward-only transitions
  if (EVIDENCE_LIFECYCLE_TRANSITIONS[from] === to) return true;
  // Revise loop: In Review → Submitted (author revises per reviewer feedback)
  if (from === 'In Review' && to === 'Submitted') return true;
  // Early publication shortcuts are NOT permitted — every record passes review.
  return false;
}

/**
 * Asserts a lifecycle transition is valid. Throws on invalid transitions.
 */
export function assertTransition(from: EvidenceStatus, to: EvidenceStatus): void {
  if (!canTransition(from, to)) {
    throw new Error(
      `Invalid evidence lifecycle transition: ${from} → ${to}. ` +
        'Transitions are forward-only (see GIZA - 08 §1.3). ' +
        'A retracted record cannot return to Published without a new record ID.',
    );
  }
}

/**
 * Applies a lifecycle transition, returning the new state. Throws on invalid
 * transitions. The caller is responsible for recording the audit entry.
 */
export function transition(from: EvidenceStatus, to: EvidenceStatus): EvidenceStatus {
  assertTransition(from, to);
  return to;
}

/**
 * Returns the full lifecycle path from `start` to `end` inclusive, or null
 * if no valid forward path exists.
 */
export function lifecyclePath(start: EvidenceStatus, end: EvidenceStatus): EvidenceStatus[] | null {
  if (start === end) return [start];
  const path: EvidenceStatus[] = [start];
  let current: EvidenceStatus = start;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const next: EvidenceStatus | null = EVIDENCE_LIFECYCLE_TRANSITIONS[current];
    if (next === null) break;
    path.push(next);
    if (next === end) return path;
    current = next;
  }
  return null;
}
