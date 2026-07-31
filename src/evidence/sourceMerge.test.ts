import { describe, it, expect, beforeEach } from 'vitest';
import {
  selectCanonical,
  mergeSourceMetadata,
  repointEvidenceReferences,
  mergeSources,
} from './sourceMerge';
import { _resetAuditLogForTesting } from './auditLog';
import type { Source } from '@/schemas/source';
import type { Evidence } from '@/schemas/evidence';

function makeSource(overrides: Partial<Source> = {}): Source {
  return {
    id: 'SRC-0001',
    type: 'Journal',
    title: 'Test Source',
    authors: [],
    year: 2020,
    reliability: 80,
    ...overrides,
  } as unknown as Source;
}

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

describe('Source Merge (M03-T07/T08)', () => {
  beforeEach(() => {
    _resetAuditLogForTesting();
  });

  describe('selectCanonical', () => {
    it('selects the source with higher reliability', () => {
      const a = makeSource({ id: 'SRC-0001', reliability: 70 });
      const b = makeSource({ id: 'SRC-0002', reliability: 90 });
      expect(selectCanonical(a, b).id).toBe('SRC-0002');
    });

    it('selects more complete source on tie', () => {
      const a = makeSource({ id: 'SRC-0001', reliability: 80, doi: '10.1/test' });
      const b = makeSource({ id: 'SRC-0002', reliability: 80 });
      expect(selectCanonical(a, b).id).toBe('SRC-0001');
    });

    it('selects lower ID on full tie', () => {
      const a = makeSource({ id: 'SRC-0002', reliability: 80 });
      const b = makeSource({ id: 'SRC-0001', reliability: 80 });
      expect(selectCanonical(a, b).id).toBe('SRC-0001');
    });
  });

  describe('mergeSourceMetadata', () => {
    it('fills missing fields from duplicate', () => {
      const canonical = makeSource({ id: 'SRC-0001', doi: undefined, isbn: undefined });
      const duplicate = makeSource({ id: 'SRC-0002', doi: '10.1/test', isbn: '9783161484100' });
      const { merged, mergedFields } = mergeSourceMetadata(canonical, duplicate);
      expect(merged.doi).toBe('10.1/test');
      expect(merged.isbn).toBe('9783161484100');
      expect(mergedFields).toContain('doi');
      expect(mergedFields).toContain('isbn');
    });

    it('does not overwrite existing fields', () => {
      const canonical = makeSource({ id: 'SRC-0001', doi: '10.1/canonical' });
      const duplicate = makeSource({ id: 'SRC-0002', doi: '10.1/duplicate' });
      const { merged } = mergeSourceMetadata(canonical, duplicate);
      expect(merged.doi).toBe('10.1/canonical');
    });
  });

  describe('repointEvidenceReferences', () => {
    it('repoints evidence from old source to new source', () => {
      const evidence = [
        makeEvidence({ id: 'EV-000001', sourceIds: ['SRC-0001', 'SRC-0002'] }),
        makeEvidence({ id: 'EV-000002', sourceIds: ['SRC-0002'] }),
        makeEvidence({ id: 'EV-000003', sourceIds: ['SRC-0003'] }),
      ];
      const { updated, repointCount } = repointEvidenceReferences(evidence, 'SRC-0002', 'SRC-0001');
      expect(repointCount).toBe(2);
      expect(updated[0].sourceIds).toContain('SRC-0001');
      expect(updated[0].sourceIds).not.toContain('SRC-0002');
      expect(updated[1].sourceIds).toEqual(['SRC-0001']);
      expect(updated[2].sourceIds).toEqual(['SRC-0003']);
    });

    it('deduplicates if new source ID already present', () => {
      const evidence = [makeEvidence({ sourceIds: ['SRC-0001', 'SRC-0002'] })];
      const { updated } = repointEvidenceReferences(evidence, 'SRC-0002', 'SRC-0001');
      expect(updated[0].sourceIds).toEqual(['SRC-0001']);
    });
  });

  describe('mergeSources', () => {
    it('performs full merge workflow', () => {
      const sourceA = makeSource({ id: 'SRC-0001', reliability: 90, doi: '10.1/a' });
      const sourceB = makeSource({ id: 'SRC-0002', reliability: 70, isbn: '9783161484100' });
      const evidence = [
        makeEvidence({ id: 'EV-000001', sourceIds: ['SRC-0002'] }),
        makeEvidence({ id: 'EV-000002', sourceIds: ['SRC-0001', 'SRC-0002'] }),
      ];

      const result = mergeSources(sourceA, sourceB, evidence);

      expect(result.canonicalSource.id).toBe('SRC-0001');
      expect(result.supersededSource.id).toBe('SRC-0002');
      expect(result.repointCount).toBe(2);
      expect(result.mergedFields).toContain('isbn');

      // Evidence should be repointed
      expect(evidence[0].sourceIds).toEqual(['SRC-0001']);
      expect(evidence[1].sourceIds).toEqual(['SRC-0001']);
    });
  });
});
