import { describe, it, expect, beforeEach } from 'vitest';
import { EvidenceStore } from './EvidenceStore';
import {
  detectObjectReferences,
  createObjectGeometryRef,
  linkEvidenceToObject,
  linkEvidenceToObjects,
  getEvidenceForObject,
  getObjectsForEvidence,
} from './objectLinkage';
import type { SceneObject } from '@/schemas/object';

function makeObject(id: string, name: string): SceneObject {
  return {
    id,
    name,
    type: 'Architecture',
    objectClass: 'Original Architecture',
    confidence: 80,
    evidence: [],
    sourceIds: [],
  };
}

describe('Object Linkage Tooling (M03.5-T05)', () => {
  let store: EvidenceStore;

  beforeEach(() => {
    store = new EvidenceStore();
  });

  describe('detectObjectReferences', () => {
    it('finds object names mentioned in text', () => {
      const objects = [
        makeObject('OBJ-0001', "King's Chamber"),
        makeObject('OBJ-0002', 'Grand Gallery'),
      ];
      const text = 'The Grand Gallery slope was measured at 26.5 degrees.';
      const refs = detectObjectReferences(text, objects);
      expect(refs).toHaveLength(1);
      expect(refs[0].objectId).toBe('OBJ-0002');
      expect(refs[0].objectName).toBe('Grand Gallery');
    });

    it('prefers longer matches over substring matches', () => {
      const objects = [makeObject('OBJ-0001', "King's Chamber"), makeObject('OBJ-0002', 'Chamber')];
      const text = "The King's Chamber is 5.24m wide.";
      const refs = detectObjectReferences(text, objects);
      const ids = refs.map((r) => r.objectId);
      expect(ids).toContain('OBJ-0001');
      expect(ids).not.toContain('OBJ-0002');
    });

    it('returns empty array when no objects match', () => {
      const objects = [makeObject('OBJ-0001', 'Subterranean Chamber')];
      const refs = detectObjectReferences('The sky is blue.', objects);
      expect(refs).toEqual([]);
    });
  });

  describe('createObjectGeometryRef', () => {
    it('produces a valid geometry reference', () => {
      const ref = createObjectGeometryRef('OBJ-0001', 'measured_from', 0.9);
      expect(ref.meshId).toBe('OBJ-0001');
      expect(ref.relation).toBe('measured_from');
      expect(ref.confidenceContribution).toBe(0.9);
    });

    it('clamps confidence contribution between 0 and 1', () => {
      expect(createObjectGeometryRef('OBJ-0001', 'inferred_from', 1.5).confidenceContribution).toBe(
        1,
      );
      expect(
        createObjectGeometryRef('OBJ-0001', 'inferred_from', -0.5).confidenceContribution,
      ).toBe(0);
    });
  });

  describe('linkEvidenceToObject', () => {
    it('adds an object ID and geometry reference to evidence', () => {
      const ev = store.create({
        title: 'Test evidence',
        category: 'Measurement',
        confidence: 75,
      });

      const updated = linkEvidenceToObject(
        ev.id,
        'OBJ-0001',
        { relation: 'measured_from', confidenceContribution: 0.95 },
        store,
      );

      expect(updated).toBeDefined();
      expect(updated!.objectIds).toContain('OBJ-0001');
      expect(updated!.geometryRefs).toHaveLength(1);
      expect(updated!.geometryRefs[0].relation).toBe('measured_from');
    });

    it('does not duplicate object links', () => {
      const ev = store.create({
        title: 'Test evidence',
        category: 'Measurement',
        confidence: 75,
      });

      linkEvidenceToObject(ev.id, 'OBJ-0001', {}, store);
      linkEvidenceToObject(ev.id, 'OBJ-0001', { relation: 'inferred_from' }, store);

      const updated = store.getById(ev.id);
      expect(updated!.objectIds).toHaveLength(1);
      expect(updated!.geometryRefs).toHaveLength(1);
    });

    it('returns undefined for missing evidence', () => {
      expect(linkEvidenceToObject('EV-999999', 'OBJ-0001', {}, store)).toBeUndefined();
    });
  });

  describe('linkEvidenceToObjects', () => {
    it('links multiple objects in one call', () => {
      const ev = store.create({
        title: 'Test evidence',
        category: 'Measurement',
        confidence: 75,
      });

      const refs = [
        { objectId: 'OBJ-0001', objectName: 'A', confidence: 80 },
        { objectId: 'OBJ-0002', objectName: 'B', confidence: 80 },
      ];

      const updated = linkEvidenceToObjects(ev.id, refs, { relation: 'measured_from' }, store);

      expect(updated!.objectIds).toEqual(['OBJ-0001', 'OBJ-0002']);
      expect(updated!.geometryRefs).toHaveLength(2);
    });
  });

  describe('query helpers', () => {
    it('getEvidenceForObject returns linked evidence', () => {
      const ev = store.create({
        title: 'Test evidence',
        category: 'Measurement',
        confidence: 75,
        objectIds: ['OBJ-0001'],
      });
      const found = getEvidenceForObject('OBJ-0001', store);
      expect(found).toContainEqual(expect.objectContaining({ id: ev.id }));
    });

    it('getObjectsForEvidence returns linked object IDs', () => {
      const ev = store.create({
        title: 'Test evidence',
        category: 'Measurement',
        confidence: 75,
        objectIds: ['OBJ-0001'],
      });
      expect(getObjectsForEvidence(ev.id, store)).toContain('OBJ-0001');
    });
  });
});
