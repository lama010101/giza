/**
 * Link integrity checker per M02-T09.
 *
 * When evidence-source, evidence-object, or evidence-location links break
 * (e.g., a source is deleted), the system records an audit entry and
 * flags the affected evidence.
 */

import type { Evidence } from '@/schemas/evidence';
import type { Source } from '@/schemas/source';
import type { Location } from '@/schemas/location';
import type { SceneObject } from '@/schemas/object';
import { recordAudit, AuditAction } from './auditLog';

export interface BrokenLink {
  evidenceId: string;
  linkType: 'source' | 'object' | 'location' | 'dependency' | 'conflict';
  brokenId: string;
  detectedAt: string;
}

/**
 * Checks all evidence records for broken source links.
 */
export function checkSourceLinks(
  evidence: Evidence[],
  sources: Source[],
  actor = '',
): BrokenLink[] {
  const sourceIds = new Set(sources.map((s) => s.id));
  const broken: BrokenLink[] = [];

  for (const ev of evidence) {
    for (const sourceId of ev.sourceIds) {
      if (!sourceIds.has(sourceId)) {
        broken.push({
          evidenceId: ev.id,
          linkType: 'source',
          brokenId: sourceId,
          detectedAt: new Date().toISOString(),
        });
        recordAudit(ev.id, AuditAction.LINK_BROKEN, actor, {
          linkType: 'source',
          brokenId: sourceId,
        });
      }
    }
  }

  return broken;
}

/**
 * Checks all evidence records for broken object links.
 */
export function checkObjectLinks(
  evidence: Evidence[],
  objects: SceneObject[],
  actor = '',
): BrokenLink[] {
  const objectIds = new Set(objects.map((o) => o.id));
  const broken: BrokenLink[] = [];

  for (const ev of evidence) {
    for (const objectId of ev.objectIds) {
      if (!objectIds.has(objectId)) {
        broken.push({
          evidenceId: ev.id,
          linkType: 'object',
          brokenId: objectId,
          detectedAt: new Date().toISOString(),
        });
        recordAudit(ev.id, AuditAction.LINK_BROKEN, actor, {
          linkType: 'object',
          brokenId: objectId,
        });
      }
    }
  }

  return broken;
}

/**
 * Checks all evidence records for broken location links.
 */
export function checkLocationLinks(
  evidence: Evidence[],
  locations: Location[],
  actor = '',
): BrokenLink[] {
  const locationIds = new Set(locations.map((l) => l.id));
  const broken: BrokenLink[] = [];

  for (const ev of evidence) {
    if (ev.locationId && !locationIds.has(ev.locationId)) {
      broken.push({
        evidenceId: ev.id,
        linkType: 'location',
        brokenId: ev.locationId,
        detectedAt: new Date().toISOString(),
      });
      recordAudit(ev.id, AuditAction.LINK_BROKEN, actor, {
        linkType: 'location',
        brokenId: ev.locationId,
      });
    }
  }

  return broken;
}

/**
 * Checks all evidence records for broken dependency links.
 */
export function checkDependencyLinks(evidence: Evidence[], actor = ''): BrokenLink[] {
  const evidenceIds = new Set(evidence.map((e) => e.id));
  const broken: BrokenLink[] = [];

  for (const ev of evidence) {
    for (const depId of ev.dependencyIds) {
      if (!evidenceIds.has(depId)) {
        broken.push({
          evidenceId: ev.id,
          linkType: 'dependency',
          brokenId: depId,
          detectedAt: new Date().toISOString(),
        });
        recordAudit(ev.id, AuditAction.LINK_BROKEN, actor, {
          linkType: 'dependency',
          brokenId: depId,
        });
      }
    }
  }

  return broken;
}

/**
 * Runs all link checks and returns all broken links.
 */
export function checkAllLinks(
  evidence: Evidence[],
  sources: Source[],
  objects: SceneObject[],
  locations: Location[],
  actor = '',
): BrokenLink[] {
  return [
    ...checkSourceLinks(evidence, sources, actor),
    ...checkObjectLinks(evidence, objects, actor),
    ...checkLocationLinks(evidence, locations, actor),
    ...checkDependencyLinks(evidence, actor),
  ];
}
