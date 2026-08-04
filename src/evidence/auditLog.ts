/**
 * Immutable audit log per GIZA - 08 §1.22.
 *
 * Every modification to an evidence record is auditable. Entries are
 * immutable (append-only). The log is exportable as JSON.
 */

export enum AuditAction {
  CREATED = 'created',
  UPDATED = 'updated',
  LIFECYCLE_TRANSITION = 'lifecycle_transition',
  REVIEW_SUBMITTED = 'review_submitted',
  REVIEW_ASSIGNED = 'review_assigned',
  REVIEW_COMMENTED = 'review_commented',
  REVIEW_REVISED = 'review_revised',
  REVIEW_APPROVED = 'review_approved',
  REVIEW_REJECTED = 'review_rejected',
  PUBLISHED = 'published',
  SOFT_DELETED = 'soft_deleted',
  DEPENDENCY_ADDED = 'dependency_added',
  DEPENDENCY_REMOVED = 'dependency_removed',
  CONFLICT_RECORDED = 'conflict_recorded',
  CONFLICT_RESOLVED = 'conflict_resolved',
  LINK_BROKEN = 'link_broken',
}

export interface AuditEntry {
  readonly id: string;
  readonly timestamp: string;
  readonly evidenceId: string;
  readonly action: AuditAction;
  readonly actor: string;
  readonly details: Record<string, unknown>;
}

const auditLog: AuditEntry[] = [];
let auditCounter = 0;

function nextAuditId(): string {
  auditCounter += 1;
  return `AUDIT-${String(auditCounter).padStart(6, '0')}`;
}

/**
 * Records an immutable audit entry. Entries cannot be modified or deleted.
 */
export function recordAudit(
  evidenceId: string,
  action: AuditAction,
  actor: string,
  details: Record<string, unknown> = {},
): AuditEntry {
  const entry: AuditEntry = {
    id: nextAuditId(),
    timestamp: new Date().toISOString(),
    evidenceId,
    action,
    actor,
    details,
  };
  auditLog.push(entry);
  return entry;
}

/**
 * Returns all audit entries for a given evidence record, in chronological order.
 */
export function getAuditHistory(evidenceId: string): AuditEntry[] {
  return auditLog.filter((e) => e.evidenceId === evidenceId);
}

/**
 * Returns all audit entries, in chronological order.
 */
export function getAllAuditEntries(): AuditEntry[] {
  return [...auditLog];
}

/**
 * Exports the audit log as a JSON string (per §1.22 "exportable").
 */
export function exportAuditLog(): string {
  return JSON.stringify(auditLog, null, 2);
}

/**
 * Exports audit entries for a single evidence record as JSON.
 */
export function exportAuditHistory(evidenceId: string): string {
  return JSON.stringify(getAuditHistory(evidenceId), null, 2);
}

/**
 * Resets the audit log. Intended for testing only.
 */
export function _resetAuditLogForTesting(): void {
  auditLog.length = 0;
  auditCounter = 0;
}
