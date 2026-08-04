/**
 * Mesh-without-evidence flagging per M02-T10.
 *
 * Flags any scene object that has geometry (mesh) but no evidence records
 * linked to it. This supports the DoSD requirement that every visible
 * object needs evidence linkage.
 */

import type { Evidence } from '@/schemas/evidence';
import type { SceneObject } from '@/schemas/object';

export interface MeshWithoutEvidence {
  objectId: string;
  objectName: string;
  hasGeometry: boolean;
  evidenceCount: number;
  severity: 'critical' | 'warning';
}

/**
 * Finds all objects that have geometry but no evidence.
 */
export function findMeshesWithoutEvidence(
  objects: SceneObject[],
  evidence: Evidence[],
): MeshWithoutEvidence[] {
  // Build a map of object ID → evidence count
  const evidenceCountByObject = new Map<string, number>();
  for (const ev of evidence) {
    for (const objectId of ev.objectIds) {
      evidenceCountByObject.set(objectId, (evidenceCountByObject.get(objectId) ?? 0) + 1);
    }
  }

  const result: MeshWithoutEvidence[] = [];

  for (const obj of objects) {
    const hasGeometry = Boolean(obj.mesh);
    const evidenceCount = evidenceCountByObject.get(obj.id) ?? 0;

    if (hasGeometry && evidenceCount === 0) {
      result.push({
        objectId: obj.id,
        objectName: obj.name,
        hasGeometry,
        evidenceCount,
        severity: 'critical',
      });
    } else if (hasGeometry && evidenceCount < 1) {
      result.push({
        objectId: obj.id,
        objectName: obj.name,
        hasGeometry,
        evidenceCount,
        severity: 'warning',
      });
    }
  }

  return result;
}

/**
 * Returns a summary of mesh-without-evidence issues.
 */
export function getMeshEvidenceSummary(
  objects: SceneObject[],
  evidence: Evidence[],
): {
  totalObjects: number;
  objectsWithGeometry: number;
  objectsWithEvidence: number;
  objectsWithoutEvidence: number;
  criticalCount: number;
  warningCount: number;
} {
  const issues = findMeshesWithoutEvidence(objects, evidence);
  const objectsWithGeometry = objects.filter((o) => Boolean(o.mesh)).length;

  return {
    totalObjects: objects.length,
    objectsWithGeometry,
    objectsWithEvidence: objectsWithGeometry - issues.length,
    objectsWithoutEvidence: issues.length,
    criticalCount: issues.filter((i) => i.severity === 'critical').length,
    warningCount: issues.filter((i) => i.severity === 'warning').length,
  };
}
