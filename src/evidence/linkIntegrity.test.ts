import { describe, it, expect, beforeEach } from 'vitest';
import {
  checkSourceLinks,
  checkObjectLinks,
  checkLocationLinks,
  checkDependencyLinks,
  checkAllLinks,
} from './linkIntegrity';
import { _resetAuditLogForTesting } from './auditLog';
import type { Evidence } from '@/schemas/evidence';
import type { Source } from '@/schemas/source';
import type { Location } from '@/schemas/location';
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
    sourceIds: ['SRC-0001'],
    locationId: 'LOC-001',
    objectIds: ['OBJ-0001'],
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

function makeSource(id: string): Source {
  return {
    id,
    type: 'Journal',
    title: 'Test',
    authors: [],
    year: 2020,
    reliability: 80,
    license: 'CC-BY',
  } as unknown as Source;
}

function makeObject(id: string): SceneObject {
  return {
    id,
    name: 'Test',
    type: 'Architecture',
    objectClass: 'Original Architecture',
    mesh: 'mesh-1',
    confidence: 80,
    evidence: [],
    sourceIds: [],
  } as unknown as SceneObject;
}

function makeLocation(id: string): Location {
  return { id, name: 'Test' } as unknown as Location;
}

describe('Link Integrity (M02-T09)', () => {
  beforeEach(() => {
    _resetAuditLogForTesting();
  });

  describe('checkSourceLinks', () => {
    it('returns empty when all source links are valid', () => {
      const evidence = [makeEvidence({ sourceIds: ['SRC-0001'] })];
      const sources = [makeSource('SRC-0001')];
      const broken = checkSourceLinks(evidence, sources);
      expect(broken).toHaveLength(0);
    });

    it('detects broken source links', () => {
      const evidence = [makeEvidence({ sourceIds: ['SRC-0001', 'SRC-9999'] })];
      const sources = [makeSource('SRC-0001')];
      const broken = checkSourceLinks(evidence, sources);
      expect(broken).toHaveLength(1);
      expect(broken[0].linkType).toBe('source');
      expect(broken[0].brokenId).toBe('SRC-9999');
    });
  });

  describe('checkObjectLinks', () => {
    it('detects broken object links', () => {
      const evidence = [makeEvidence({ objectIds: ['OBJ-0001', 'OBJ-9999'] })];
      const objects = [makeObject('OBJ-0001')];
      const broken = checkObjectLinks(evidence, objects);
      expect(broken).toHaveLength(1);
      expect(broken[0].linkType).toBe('object');
    });
  });

  describe('checkLocationLinks', () => {
    it('detects broken location links', () => {
      const evidence = [makeEvidence({ locationId: 'LOC-999' })];
      const locations = [makeLocation('LOC-001')];
      const broken = checkLocationLinks(evidence, locations);
      expect(broken).toHaveLength(1);
      expect(broken[0].linkType).toBe('location');
    });

    it('does not flag missing locationId (optional)', () => {
      const evidence = [makeEvidence({ locationId: undefined })];
      const locations: Location[] = [];
      const broken = checkLocationLinks(evidence, locations);
      expect(broken).toHaveLength(0);
    });
  });

  describe('checkDependencyLinks', () => {
    it('detects broken dependency links', () => {
      const evidence = [
        makeEvidence({ id: 'EV-000001', dependencyIds: ['EV-000002'] }),
        makeEvidence({ id: 'EV-000003' }),
      ];
      const broken = checkDependencyLinks(evidence);
      expect(broken).toHaveLength(1);
      expect(broken[0].linkType).toBe('dependency');
      expect(broken[0].brokenId).toBe('EV-000002');
    });
  });

  describe('checkAllLinks', () => {
    it('combines all link checks', () => {
      const evidence = [
        makeEvidence({
          sourceIds: ['SRC-9999'],
          objectIds: ['OBJ-9999'],
          locationId: 'LOC-999',
          dependencyIds: ['EV-999999'],
        }),
      ];
      const broken = checkAllLinks(evidence, [], [], []);
      expect(broken).toHaveLength(4);
    });
  });
});
