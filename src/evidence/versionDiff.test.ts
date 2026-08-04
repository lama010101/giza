import { describe, it, expect } from 'vitest';
import { diffEvidenceVersions, getChangedFields, hasBreakingChanges } from './versionDiff';
import type { Evidence } from '@/schemas/evidence';

function makeEvidence(overrides: Partial<Evidence> = {}): Evidence {
  return {
    id: 'EV-000001',
    title: 'Test Evidence',
    description: 'A test evidence record',
    category: 'Survey',
    primaryClass: 'E2',
    secondaryClasses: [],
    confidence: 80,
    confidenceBasis: 'Direct measurement',
    measurementQuality: 90,
    consensus: 70,
    directObservation: 85,
    status: 'Draft',
    sourceIds: ['SRC-0001'],
    locationId: 'LOC-001',
    objectIds: ['OBJ-0001'],
    geometryRefs: [],
    mediaIds: [],
    dependencyIds: [],
    conflictIds: [],
    chronologyTags: [],
    tags: ['test'],
    reviewLog: [],
    version: 1,
    created: '2026-01-01T00:00:00Z',
    updated: '2026-01-01T00:00:00Z',
    createdBy: 'user1',
    updatedBy: '',
    ...overrides,
  };
}

describe('Version Diff (M02-T07)', () => {
  describe('diffEvidenceVersions', () => {
    it('returns no changes for identical evidence', () => {
      const e = makeEvidence();
      const diff = diffEvidenceVersions(e, e);
      expect(diff.changes).toHaveLength(0);
      expect(diff.changeSummary).toBe('No changes');
    });

    it('detects modified title', () => {
      const old = makeEvidence({ version: 1, title: 'Old Title' });
      const newE = makeEvidence({ version: 2, title: 'New Title' });
      const diff = diffEvidenceVersions(old, newE);
      const titleChange = diff.changes.find((c) => c.field === 'title');
      expect(titleChange).toBeDefined();
      expect(titleChange?.changeType).toBe('modified');
      expect(titleChange?.oldValue).toBe('Old Title');
      expect(titleChange?.newValue).toBe('New Title');
    });

    it('detects modified confidence as breaking change', () => {
      const old = makeEvidence({ version: 1, confidence: 0.8 });
      const newE = makeEvidence({ version: 2, confidence: 0.5 });
      const diff = diffEvidenceVersions(old, newE);
      expect(diff.hasBreakingChanges).toBe(true);
    });

    it('detects modified primaryClass as breaking change', () => {
      const old = makeEvidence({ version: 1, primaryClass: 'E2' });
      const newE = makeEvidence({ version: 2, primaryClass: 'E3' });
      const diff = diffEvidenceVersions(old, newE);
      expect(diff.hasBreakingChanges).toBe(true);
    });

    it('does not flag title change as breaking', () => {
      const old = makeEvidence({ version: 1, title: 'Old' });
      const newE = makeEvidence({ version: 2, title: 'New' });
      const diff = diffEvidenceVersions(old, newE);
      expect(diff.hasBreakingChanges).toBe(false);
    });

    it('detects added sourceIds as breaking change', () => {
      const old = makeEvidence({ version: 1, sourceIds: ['SRC-0001'] });
      const newE = makeEvidence({ version: 2, sourceIds: ['SRC-0001', 'SRC-0002'] });
      const diff = diffEvidenceVersions(old, newE);
      expect(diff.hasBreakingChanges).toBe(true);
    });

    it('skips updated and updatedBy fields', () => {
      const old = makeEvidence({ version: 1, updated: '2026-01-01', updatedBy: 'user1' });
      const newE = makeEvidence({ version: 2, updated: '2026-01-02', updatedBy: 'user2' });
      const diff = diffEvidenceVersions(old, newE);
      expect(diff.changes.find((c) => c.field === 'updated')).toBeUndefined();
      expect(diff.changes.find((c) => c.field === 'updatedBy')).toBeUndefined();
    });

    it('generates a readable change summary', () => {
      const old = makeEvidence({ version: 1, title: 'Old', confidence: 0.8 });
      const newE = makeEvidence({ version: 2, title: 'New', confidence: 0.9 });
      const diff = diffEvidenceVersions(old, newE);
      expect(diff.changeSummary).toContain('~ title');
      expect(diff.changeSummary).toContain('~ confidence');
    });

    it('records version numbers', () => {
      const old = makeEvidence({ version: 1 });
      const newE = makeEvidence({ version: 2 });
      const diff = diffEvidenceVersions(old, newE);
      expect(diff.fromVersion).toBe(1);
      expect(diff.toVersion).toBe(2);
    });

    it('detects array changes', () => {
      const old = makeEvidence({ version: 1, tags: ['a', 'b'] });
      const newE = makeEvidence({ version: 2, tags: ['a', 'c'] });
      const diff = diffEvidenceVersions(old, newE);
      const tagsChange = diff.changes.find((c) => c.field === 'tags');
      expect(tagsChange).toBeDefined();
      expect(tagsChange?.changeType).toBe('modified');
    });
  });

  describe('getChangedFields', () => {
    it('returns list of changed field names', () => {
      const old = makeEvidence({ version: 1, title: 'Old', confidence: 0.8 });
      const newE = makeEvidence({ version: 2, title: 'New', confidence: 0.9 });
      const fields = getChangedFields(old, newE);
      expect(fields).toContain('title');
      expect(fields).toContain('confidence');
    });
  });

  describe('hasBreakingChanges', () => {
    it('returns true for breaking changes', () => {
      const old = makeEvidence({ version: 1, confidence: 0.8 });
      const newE = makeEvidence({ version: 2, confidence: 0.5 });
      expect(hasBreakingChanges(old, newE)).toBe(true);
    });

    it('returns false for non-breaking changes', () => {
      const old = makeEvidence({ version: 1, title: 'Old' });
      const newE = makeEvidence({ version: 2, title: 'New' });
      expect(hasBreakingChanges(old, newE)).toBe(false);
    });
  });
});
