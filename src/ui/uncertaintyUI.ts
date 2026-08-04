/**
 * Uncertainty UI component per M07-T16.
 *
 * Provides UI elements for displaying uncertainty indicators when
 * evidence is missing or incomplete for a given object or hypothesis.
 * This helps users understand the confidence level of what they're
 * viewing and where evidence gaps exist.
 */

import type { Evidence } from '@/schemas/evidence';

// ─── Types ───────────────────────────────────────────────────────────────────

export type UncertaintyLevel = 'none' | 'low' | 'medium' | 'high' | 'critical';

export interface UncertaintyIndicator {
  objectId: string;
  level: UncertaintyLevel;
  message: string;
  missingEvidenceCount: number;
  conflictingEvidenceCount: number;
  suggestedActions: string[];
}

// ─── Uncertainty assessment ──────────────────────────────────────────────────

/**
 * Determines the uncertainty level for an object based on evidence.
 */
export function assessUncertainty(
  objectId: string,
  evidence: Evidence[],
  requiredEvidenceCount = 3,
): UncertaintyIndicator {
  const linked = evidence.filter((e) => e.objectIds.includes(objectId));
  const conflicting = linked.filter((e) => e.conflictIds.length > 0);
  const lowConfidence = linked.filter((e) => e.confidence < 50);

  let level: UncertaintyLevel = 'none';
  const actions: string[] = [];

  if (linked.length === 0) {
    level = 'critical';
    actions.push('No evidence linked — this object is purely hypothetical');
    actions.push('Link evidence records to support this object');
  } else if (linked.length < requiredEvidenceCount) {
    level = 'high';
    actions.push(`Only ${linked.length} evidence record(s) — target is ${requiredEvidenceCount}`);
    actions.push('Add more evidence to improve confidence');
  } else if (conflicting.length > 0 || lowConfidence.length > linked.length / 2) {
    level = 'medium';
    if (conflicting.length > 0) {
      actions.push(`${conflicting.length} evidence record(s) have conflicts — resolve conflicts`);
    }
    if (lowConfidence.length > linked.length / 2) {
      actions.push('Majority of evidence has low confidence — review sources');
    }
  } else if (lowConfidence.length > 0) {
    level = 'low';
    actions.push(`${lowConfidence.length} evidence record(s) have low confidence`);
  }

  const messages: Record<UncertaintyLevel, string> = {
    none: 'Well-supported by evidence',
    low: 'Minor uncertainty — some low-confidence evidence',
    medium: 'Moderate uncertainty — conflicts or low confidence',
    high: 'High uncertainty — insufficient evidence',
    critical: 'Critical uncertainty — no evidence linked',
  };

  return {
    objectId,
    level,
    message: messages[level],
    missingEvidenceCount: Math.max(0, requiredEvidenceCount - linked.length),
    conflictingEvidenceCount: conflicting.length,
    suggestedActions: actions,
  };
}

/**
 * Returns a color code for an uncertainty level (for UI rendering).
 */
export function getUncertaintyColor(level: UncertaintyLevel): string {
  const colors: Record<UncertaintyLevel, string> = {
    none: '#4caf50', // green
    low: '#8bc34a', // light green
    medium: '#ff9800', // orange
    high: '#f44336', // red
    critical: '#b71c1c', // dark red
  };
  return colors[level];
}

/**
 * Returns an icon name for an uncertainty level.
 */
export function getUncertaintyIcon(level: UncertaintyLevel): string {
  const icons: Record<UncertaintyLevel, string> = {
    none: 'check-circle',
    low: 'info',
    medium: 'warning',
    high: 'error',
    critical: 'cancel',
  };
  return icons[level];
}

/**
 * Batch-assesses uncertainty for multiple objects.
 */
export function assessBatchUncertainty(
  objectIds: string[],
  evidence: Evidence[],
  requiredEvidenceCount?: number,
): UncertaintyIndicator[] {
  return objectIds.map((id) => assessUncertainty(id, evidence, requiredEvidenceCount));
}

/**
 * Filters objects to only those with uncertainty above a threshold.
 */
export function filterUncertainObjects(
  indicators: UncertaintyIndicator[],
  minLevel: UncertaintyLevel = 'medium',
): UncertaintyIndicator[] {
  const order: UncertaintyLevel[] = ['none', 'low', 'medium', 'high', 'critical'];
  const minIndex = order.indexOf(minLevel);
  return indicators.filter((i) => order.indexOf(i.level) >= minIndex);
}
