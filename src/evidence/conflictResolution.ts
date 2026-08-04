/**
 * Conflict resolution manager per M02-T08.
 *
 * Manages conflict records and their resolution states.
 * Provides visualization data for the UI (red halos, contradiction list).
 */

import type { ConflictRecord, ConflictResolutionState } from '@/schemas/conflict';
import { ConflictRecordSchema } from '@/schemas/conflict';
import { recordAudit, AuditAction } from './auditLog';

class ConflictManager {
  private conflicts = new Map<string, ConflictRecord>();
  private counter = 0;

  /**
   * Records a conflict between two evidence records.
   */
  record(
    evidenceA: string,
    evidenceB: string,
    description: string,
    relation: 'contradicts' | 'refines' | 'supersedes' = 'contradicts',
    actor = '',
  ): ConflictRecord {
    this.counter += 1;
    const id = `CONF-${String(this.counter).padStart(4, '0')}`;
    const now = new Date().toISOString();

    const raw: Record<string, unknown> = {
      id,
      evidenceA,
      evidenceB,
      relation,
      description,
      resolution: 'unresolved',
      notes: '',
      created: now,
      updated: now,
    };

    const parsed = ConflictRecordSchema.parse(raw);
    this.conflicts.set(id, parsed);

    recordAudit(evidenceA, AuditAction.CONFLICT_RECORDED, actor, {
      conflictId: id,
      evidenceB,
      relation,
    });

    return parsed;
  }

  /**
   * Updates the resolution state of a conflict.
   */
  resolve(
    conflictId: string,
    resolution: ConflictResolutionState,
    notes = '',
    actor = '',
  ): ConflictRecord | undefined {
    const conflict = this.conflicts.get(conflictId);
    if (!conflict) return undefined;

    const updated: ConflictRecord = {
      ...conflict,
      resolution,
      notes: notes || conflict.notes,
      updated: new Date().toISOString(),
    };

    this.conflicts.set(conflictId, updated);

    recordAudit(conflict.evidenceA, AuditAction.CONFLICT_RESOLVED, actor, {
      conflictId,
      resolution,
      notes,
    });

    return updated;
  }

  /**
   * Returns all conflicts involving the given evidence ID.
   */
  getConflictsForEvidence(evidenceId: string): ConflictRecord[] {
    return [...this.conflicts.values()].filter(
      (c) => c.evidenceA === evidenceId || c.evidenceB === evidenceId,
    );
  }

  /**
   * Returns all unresolved conflicts.
   */
  getUnresolved(): ConflictRecord[] {
    return [...this.conflicts.values()].filter((c) => c.resolution === 'unresolved');
  }

  /**
   * Returns all conflict records.
   */
  getAll(): ConflictRecord[] {
    return [...this.conflicts.values()];
  }

  /**
   * Returns conflict visualization data for the UI.
   * Maps evidence IDs to conflict severity (for red halos).
   */
  getVisualizationData(): Map<string, { severity: number; count: number }> {
    const result = new Map<string, { severity: number; count: number }>();

    for (const conflict of this.conflicts.values()) {
      const severity =
        conflict.resolution === 'unresolved' ? 1.0 : conflict.resolution === 'partial' ? 0.5 : 0.1;

      for (const evidenceId of [conflict.evidenceA, conflict.evidenceB]) {
        const existing = result.get(evidenceId);
        if (existing) {
          existing.severity = Math.max(existing.severity, severity);
          existing.count += 1;
        } else {
          result.set(evidenceId, { severity, count: 1 });
        }
      }
    }

    return result;
  }

  /**
   * Clears all conflicts. Intended for testing only.
   */
  _resetForTesting(): void {
    this.conflicts.clear();
    this.counter = 0;
  }
}

export const conflictManager = new ConflictManager();
