import { describe, it, expect } from 'vitest';
import { findMeshesWithoutEvidence, getMeshEvidenceSummary } from './meshEvidenceFlagging';
import type { Evidence } from '@/schemas/evidence';
import type { SceneObject } from '@/schemas/object';

function makeEvidence(overrides: Partial<Evidence> = {}): Evidence {
  return {
    id: 'EV-000001',
    title: 'Test',
    description: '',
    category: 'Survey',
    primaryClass: 'E2',
    secondaryClasses: [],
    confidence: 80,
    confidenceBasis: '',
    status: 'Draft',
    sourceIds: [],
    locationId: undefined,
    objectIds: [],
    geometryRefs: [],
    mediaIds: [],
    dependencyIds: [],
    conflictIds: [],
    chronologyTags: [],
    tags: [],
    reviewLog: [],
    version: 1,
    created: '',
    updated: '',
    createdBy: '',
    updatedBy: '',
    ...overrides,
  };
}

function makeObject(id: string, hasMesh: boolean, name = 'Test'): SceneObject {
  return {
    id,
    name,
    type: 'Architecture',
    objectClass: 'Original Architecture',
    mesh: hasMesh ? 'mesh-1' : undefined,
    confidence: 80,
    evidence: [],
    sourceIds: [],
  } as unknown as SceneObject;
}

describe('Mesh Evidence Flagging (M02-T10)', () => {
  describe('findMeshesWithoutEvidence', () => {
    it('flags objects with geometry but no evidence', () => {
      const objects = [makeObject('OBJ-0001', true), makeObject('OBJ-0002', true)];
      const evidence: Evidence[] = [makeEvidence({ objectIds: ['OBJ-0001'] })];

      const issues = findMeshesWithoutEvidence(objects, evidence);
      expect(issues).toHaveLength(1);
      expect(issues[0].objectId).toBe('OBJ-0002');
      expect(issues[0].severity).toBe('critical');
    });

    it('does not flag objects without geometry', () => {
      const objects = [makeObject('OBJ-0001', false)];
      const issues = findMeshesWithoutEvidence(objects, []);
      expect(issues).toHaveLength(0);
    });

    it('does not flag objects with evidence', () => {
      const objects = [makeObject('OBJ-0001', true)];
      const evidence = [makeEvidence({ objectIds: ['OBJ-0001'] })];
      const issues = findMeshesWithoutEvidence(objects, evidence);
      expect(issues).toHaveLength(0);
    });
  });

  describe('getMeshEvidenceSummary', () => {
    it('returns summary statistics', () => {
      const objects = [
        makeObject('OBJ-0001', true),
        makeObject('OBJ-0002', true),
        makeObject('OBJ-0003', false),
      ];
      const evidence = [makeEvidence({ objectIds: ['OBJ-0001'] })];

      const summary = getMeshEvidenceSummary(objects, evidence);
      expect(summary.totalObjects).toBe(3);
      expect(summary.objectsWithGeometry).toBe(2);
      expect(summary.objectsWithoutEvidence).toBe(1);
      expect(summary.objectsWithEvidence).toBe(1);
      expect(summary.criticalCount).toBe(1);
    });
  });
});
