import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  InMemoryBackend,
  SQLiteBackend,
  getStorageBackend,
  setStorageBackend,
  resetStorageBackend,
  type StorageBackend,
} from './storageBackend';
import type { Evidence } from '@/schemas/evidence';
import type { Source } from '@/schemas/source';

function makeEvidence(id: string): Evidence {
  return {
    id,
    title: `Test ${id}`,
    description: 'Test evidence',
    category: 'Measurement',
    primaryClass: 'E1',
    secondaryClasses: [],
    confidence: 80,
    confidenceBasis: 'survey',
    status: 'Draft',
    sourceIds: [],
    objectIds: [],
    geometryRefs: [],
    mediaIds: [],
    dependencyIds: [],
    conflictIds: [],
    chronologyTags: [],
    tags: [],
    reviewLog: [],
    version: 1,
    created: new Date().toISOString(),
    updated: new Date().toISOString(),
    createdBy: 'test',
    updatedBy: '',
  } as Evidence;
}

function makeSource(id: string): Source {
  return {
    id,
    title: `Source ${id}`,
    type: 'Book',
    authors: [{ name: 'Test' }],
    year: 2024,
    url: `https://example.com/${id}`,
    license: 'CC-BY-4.0',
  };
}

describe('Storage Backend (M02-T01)', () => {
  describe('InMemoryBackend', () => {
    let backend: InMemoryBackend;

    beforeEach(() => {
      backend = new InMemoryBackend();
    });

    it('inserts and retrieves evidence', () => {
      const ev = makeEvidence('EV-001');
      backend.insertEvidence(ev);
      expect(backend.getEvidence('EV-001')).toBeDefined();
      expect(backend.getAllEvidence()).toHaveLength(1);
    });

    it('updates evidence', () => {
      const ev = makeEvidence('EV-001');
      backend.insertEvidence(ev);
      const updated = backend.updateEvidence('EV-001', { title: 'Updated' });
      expect(updated?.title).toBe('Updated');
    });

    it('deletes evidence', () => {
      backend.insertEvidence(makeEvidence('EV-001'));
      expect(backend.deleteEvidence('EV-001')).toBe(true);
      expect(backend.getEvidence('EV-001')).toBeUndefined();
    });

    it('inserts and retrieves sources', () => {
      backend.insertSource(makeSource('SRC-001'));
      expect(backend.getSource('SRC-001')).toBeDefined();
      expect(backend.getAllSources()).toHaveLength(1);
    });

    it('close and flush are no-ops', () => {
      expect(() => backend.close()).not.toThrow();
      expect(() => backend.flush()).not.toThrow();
    });
  });

  describe('SQLiteBackend', () => {
    it('throws on instantiation (not available)', () => {
      expect(() => new SQLiteBackend('test.db')).toThrow('not available');
    });
  });

  describe('getStorageBackend', () => {
    afterEach(() => {
      resetStorageBackend();
    });

    it('returns InMemoryBackend by default', () => {
      resetStorageBackend();
      const backend = getStorageBackend();
      expect(backend).toBeInstanceOf(InMemoryBackend);
    });

    it('returns the same instance on subsequent calls', () => {
      const b1 = getStorageBackend();
      const b2 = getStorageBackend();
      expect(b1).toBe(b2);
    });
  });

  describe('setStorageBackend', () => {
    afterEach(() => {
      resetStorageBackend();
    });

    it('sets a custom backend', () => {
      const custom: StorageBackend = new InMemoryBackend();
      setStorageBackend(custom);
      expect(getStorageBackend()).toBe(custom);
    });
  });

  describe('resetStorageBackend', () => {
    it('resets to null', () => {
      const b1 = getStorageBackend();
      resetStorageBackend();
      const b2 = getStorageBackend();
      expect(b1).not.toBe(b2);
    });
  });
});
