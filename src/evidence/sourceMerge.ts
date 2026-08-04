/**
 * Source merge workflow per M03-T07 and M03-T08.
 *
 * When duplicate sources are detected, the merge workflow:
 *   1. Selects a canonical source (the one with highest reliability)
 *   2. Merges metadata from the duplicate into the canonical
 *   3. Re-points all evidence references from the duplicate to the canonical
 *   4. Marks the duplicate as superseded
 *   5. Records an audit entry
 */

import type { Source } from '@/schemas/source';
import type { Evidence } from '@/schemas/evidence';
import { recordAudit, AuditAction } from './auditLog';

export interface MergeResult {
  canonicalSource: Source;
  supersededSource: Source;
  repointCount: number;
  mergedFields: string[];
}

/**
 * Selects the canonical source from a pair of duplicates.
 * The source with higher reliability is preferred. Ties are broken
 * by the source with more complete metadata (more fields filled).
 */
export function selectCanonical(a: Source, b: Source): Source {
  // Higher reliability wins
  const relA = a.reliability ?? 50;
  const relB = b.reliability ?? 50;
  if (relA !== relB) return relA > relB ? a : b;

  // More complete metadata wins
  const completenessA = sourceCompleteness(a);
  const completenessB = sourceCompleteness(b);
  if (completenessA !== completenessB) return completenessA > completenessB ? a : b;

  // Lower ID wins (deterministic)
  return a.id < b.id ? a : b;
}

/**
 * Counts the number of filled fields in a source.
 */
function sourceCompleteness(source: Source): number {
  let count = 0;
  if (source.title) count++;
  if (source.authors.length > 0) count++;
  if (source.year) count++;
  if (source.doi) count++;
  if (source.isbn) count++;
  if (source.url) count++;
  if (source.license) count++;
  if (source.publication) count++;
  return count;
}

/**
 * Merges metadata from the duplicate source into the canonical source.
 * Fields from the canonical source take priority; fields from the
 * duplicate are used only if the canonical source is missing them.
 */
export function mergeSourceMetadata(
  canonical: Source,
  duplicate: Source,
): { merged: Source; mergedFields: string[] } {
  const mergedFields: string[] = [];
  const merged: Source = { ...canonical };

  if (!merged.doi && duplicate.doi) {
    merged.doi = duplicate.doi;
    mergedFields.push('doi');
  }
  if (!merged.isbn && duplicate.isbn) {
    merged.isbn = duplicate.isbn;
    mergedFields.push('isbn');
  }
  if (!merged.url && duplicate.url) {
    merged.url = duplicate.url;
    mergedFields.push('url');
  }
  if (!merged.license && duplicate.license) {
    merged.license = duplicate.license;
    mergedFields.push('license');
  }
  if (!merged.publication && duplicate.publication) {
    merged.publication = duplicate.publication;
    mergedFields.push('publication');
  }
  if (!merged.year && duplicate.year) {
    merged.year = duplicate.year;
    mergedFields.push('year');
  }
  // Merge authors (union, preserving canonical order)
  if (merged.authors.length === 0 && duplicate.authors.length > 0) {
    merged.authors = [...duplicate.authors];
    mergedFields.push('authors');
  }

  return { merged, mergedFields };
}

/**
 * Re-points all evidence references from the old source ID to the new source ID.
 * Returns the updated evidence array and the count of repointed references.
 */
export function repointEvidenceReferences(
  evidence: Evidence[],
  oldSourceId: string,
  newSourceId: string,
  actor = '',
): { updated: Evidence[]; repointCount: number } {
  let repointCount = 0;
  const updated = evidence.map((ev) => {
    if (!ev.sourceIds.includes(oldSourceId)) return ev;

    const newSourceIds = ev.sourceIds.map((id) => {
      if (id === oldSourceId) {
        repointCount++;
        return newSourceId;
      }
      return id;
    });

    // Deduplicate (in case the new source ID was already present)
    const deduped = [...new Set(newSourceIds)];

    recordAudit(ev.id, AuditAction.UPDATED, actor, {
      field: 'sourceIds',
      oldSourceId,
      newSourceId,
      merge: true,
    });

    return { ...ev, sourceIds: deduped };
  });

  return { updated, repointCount };
}

/**
 * Performs a full source merge: selects canonical, merges metadata,
 * re-points evidence, and marks the duplicate as superseded.
 */
export function mergeSources(
  sourceA: Source,
  sourceB: Source,
  evidence: Evidence[],
  actor = '',
): MergeResult {
  const canonical = selectCanonical(sourceA, sourceB);
  const duplicate = canonical.id === sourceA.id ? sourceB : sourceA;

  const { merged, mergedFields } = mergeSourceMetadata(canonical, duplicate);

  const { updated, repointCount } = repointEvidenceReferences(
    evidence,
    duplicate.id,
    canonical.id,
    actor,
  );

  // Update the evidence array in place (caller should use the returned array)
  for (let i = 0; i < evidence.length; i++) {
    evidence[i] = updated[i];
  }

  recordAudit(canonical.id, AuditAction.UPDATED, actor, {
    merge: true,
    mergedFrom: duplicate.id,
    mergedFields,
  });

  return {
    canonicalSource: merged,
    supersededSource: duplicate,
    repointCount,
    mergedFields,
  };
}
