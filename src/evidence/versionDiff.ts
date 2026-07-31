/**
 * Evidence version diff and comparison per M02-T07.
 *
 * Computes a structured diff between two evidence versions, identifying
 * added, removed, and changed fields. Used for audit history and review
 * workflow.
 */

import type { Evidence } from '@/schemas/evidence';

export type FieldChangeType = 'added' | 'removed' | 'modified';

export interface FieldChange {
  field: string;
  changeType: FieldChangeType;
  oldValue: unknown;
  newValue: unknown;
}

export interface VersionDiff {
  fromVersion: number;
  toVersion: number;
  changes: FieldChange[];
  changeSummary: string;
  hasBreakingChanges: boolean;
}

// Fields that constitute breaking changes (require re-review)
const BREAKING_FIELDS = new Set([
  'primaryClass',
  'category',
  'confidence',
  'sourceIds',
  'dependencyIds',
  'conflictIds',
]);

// Fields to skip in diff (metadata, not content)
const SKIP_FIELDS = new Set(['updated', 'updatedBy']);

/**
 * Computes a structured diff between two evidence versions.
 */
export function diffEvidenceVersions(oldVersion: Evidence, newVersion: Evidence): VersionDiff {
  const changes: FieldChange[] = [];
  const allFields = new Set([...Object.keys(oldVersion), ...Object.keys(newVersion)]);

  for (const field of allFields) {
    if (SKIP_FIELDS.has(field)) continue;

    const oldVal = (oldVersion as Record<string, unknown>)[field];
    const newVal = (newVersion as Record<string, unknown>)[field];

    if (oldVal === undefined && newVal !== undefined) {
      changes.push({ field, changeType: 'added', oldValue: undefined, newValue: newVal });
    } else if (oldVal !== undefined && newVal === undefined) {
      changes.push({ field, changeType: 'removed', oldValue: oldVal, newValue: undefined });
    } else if (!deepEqual(oldVal, newVal)) {
      changes.push({ field, changeType: 'modified', oldValue: oldVal, newValue: newVal });
    }
  }

  const hasBreakingChanges = changes.some(
    (c) => BREAKING_FIELDS.has(c.field) && c.changeType !== 'added',
  );

  const changeSummary = generateChangeSummary(changes);

  return {
    fromVersion: oldVersion.version,
    toVersion: newVersion.version,
    changes,
    changeSummary,
    hasBreakingChanges,
  };
}

/**
 * Deep equality check for values (handles arrays and objects).
 */
function deepEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (a === null || b === null) return false;
  if (typeof a !== typeof b) return false;

  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;
    return a.every((item, i) => deepEqual(item, b[i]));
  }

  if (typeof a === 'object' && typeof b === 'object') {
    const aKeys = Object.keys(a as Record<string, unknown>);
    const bKeys = Object.keys(b as Record<string, unknown>);
    if (aKeys.length !== bKeys.length) return false;
    return aKeys.every((key) =>
      deepEqual((a as Record<string, unknown>)[key], (b as Record<string, unknown>)[key]),
    );
  }

  return false;
}

/**
 * Generates a human-readable summary of changes.
 */
function generateChangeSummary(changes: FieldChange[]): string {
  if (changes.length === 0) return 'No changes';

  const parts: string[] = [];
  for (const change of changes) {
    switch (change.changeType) {
      case 'added':
        parts.push(`+ ${change.field}`);
        break;
      case 'removed':
        parts.push(`- ${change.field}`);
        break;
      case 'modified':
        parts.push(`~ ${change.field}`);
        break;
    }
  }

  return parts.join(', ');
}

/**
 * Returns a list of fields that changed between two versions.
 */
export function getChangedFields(oldVersion: Evidence, newVersion: Evidence): string[] {
  return diffEvidenceVersions(oldVersion, newVersion).changes.map((c) => c.field);
}

/**
 * Returns true if the diff contains any breaking changes.
 */
export function hasBreakingChanges(oldVersion: Evidence, newVersion: Evidence): boolean {
  return diffEvidenceVersions(oldVersion, newVersion).hasBreakingChanges;
}
