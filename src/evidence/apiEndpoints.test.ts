import { describe, it, expect, beforeEach } from 'vitest';
import { EvidenceStore } from './EvidenceStore';
import {
  listEvidence,
  getEvidence,
  createEvidence,
  updateEvidence,
  deleteEvidence,
  listSources,
  getSource,
  getSourceEvidence,
  healthCheck,
} from './apiEndpoints';

describe('API Endpoints (M02-T15, M03-T14)', () => {
  let store: EvidenceStore;

  beforeEach(() => {
    store = new EvidenceStore();
  });

  describe('listEvidence', () => {
    it('returns paginated evidence', () => {
      const result = listEvidence({}, store);
      expect(result.data.length).toBeGreaterThan(0);
      expect(result.total).toBeGreaterThan(0);
      expect(result.page).toBe(1);
    });

    it('filters by status', () => {
      const result = listEvidence({ status: 'Published' }, store);
      for (const ev of result.data) {
        expect(ev.status).toBe('Published');
      }
    });

    it('filters by minConfidence', () => {
      const result = listEvidence({ minConfidence: 80 }, store);
      for (const ev of result.data) {
        expect(ev.confidence).toBeGreaterThanOrEqual(80);
      }
    });

    it('paginates results', () => {
      const page1 = listEvidence({ page: 1, pageSize: 5 }, store);
      const page2 = listEvidence({ page: 2, pageSize: 5 }, store);
      expect(page1.pageSize).toBe(5);
      expect(page2.page).toBe(2);
    });
  });

  describe('getEvidence', () => {
    it('returns evidence by ID', () => {
      const all = listEvidence({}, store);
      const id = all.data[0].id;
      const result = getEvidence(id, store);
      expect(result.status).toBe(200);
      expect(result.data?.id).toBe(id);
    });

    it('returns 404 for unknown ID', () => {
      const result = getEvidence('EV-999999', store);
      expect(result.status).toBe(404);
      expect(result.data).toBeNull();
    });
  });

  describe('createEvidence', () => {
    it('creates evidence and returns 201', () => {
      const result = createEvidence(
        {
          title: 'API Test Evidence',
          category: 'Measurement',
          confidence: 75,
          createdBy: 'api-test',
        },
        store,
      );
      expect(result.status).toBe(201);
      expect(result.data.title).toBe('API Test Evidence');
    });
  });

  describe('updateEvidence', () => {
    it('updates evidence', () => {
      const created = createEvidence(
        {
          title: 'Update Test',
          category: 'Observation',
          confidence: 60,
        },
        store,
      );
      const result = updateEvidence(created.data.id, { title: 'Updated Title' }, store);
      expect(result.status).toBe(200);
      expect(result.data?.title).toBe('Updated Title');
    });

    it('returns 404 for unknown ID', () => {
      const result = updateEvidence('EV-999999', { title: 'x' }, store);
      expect(result.status).toBe(404);
    });
  });

  describe('deleteEvidence', () => {
    it('soft-deletes evidence', () => {
      const created = createEvidence(
        {
          title: 'Delete Test',
          category: 'Observation',
          confidence: 50,
        },
        store,
      );
      const result = deleteEvidence(created.data.id, store);
      expect(result.status).toBe(200);
      expect(result.data).toBe(true);
    });

    it('returns 404 for unknown ID', () => {
      const result = deleteEvidence('EV-999999', store);
      expect(result.status).toBe(404);
    });
  });

  describe('listSources', () => {
    it('returns paginated sources', () => {
      const result = listSources({}, store);
      expect(result.data.length).toBeGreaterThan(0);
      expect(result.total).toBeGreaterThan(0);
    });

    it('filters by type', () => {
      const all = listSources({}, store);
      if (all.data.length > 0) {
        const type = all.data[0].type;
        const filtered = listSources({ type }, store);
        for (const s of filtered.data) {
          expect(s.type).toBe(type);
        }
      }
    });
  });

  describe('getSource', () => {
    it('returns source by ID', () => {
      const all = listSources({}, store);
      if (all.data.length > 0) {
        const id = all.data[0].id;
        const result = getSource(id, store);
        expect(result.status).toBe(200);
        expect(result.data?.id).toBe(id);
      }
    });

    it('returns 404 for unknown ID', () => {
      const result = getSource('SRC-999999', store);
      expect(result.status).toBe(404);
    });
  });

  describe('getSourceEvidence', () => {
    it('returns evidence linked to a source', () => {
      const sources = listSources({}, store);
      if (sources.data.length > 0) {
        const result = getSourceEvidence(sources.data[0].id, store);
        expect(result.status).toBe(200);
        expect(Array.isArray(result.data)).toBe(true);
      }
    });
  });

  describe('healthCheck', () => {
    it('returns health status', () => {
      const result = healthCheck(store);
      expect(result.status).toBe(200);
      expect(result.data.status).toBe('ok');
      expect(result.data.evidenceCount).toBeGreaterThan(0);
    });
  });
});
