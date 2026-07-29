import { describe, it, expect, beforeEach } from 'vitest';
import {
  getEvidenceById,
  getEvidenceByObject,
  getEvidenceByLocation,
  getEvidenceBySource,
  getObjectConfidence,
  searchEvidence,
  getEvidencePanelData,
  getEvidenceByFilters,
  createEvidence,
  updateEvidence,
  deleteEvidence,
} from './repository';
import { EvidenceStore } from './EvidenceStore';

describe('EvidenceRepository', () => {
  it('finds evidence by object', () => {
    const evidence = getEvidenceByObject('OBJ-0001');
    expect(evidence.length).toBeGreaterThanOrEqual(1);
    expect(evidence.some((e) => e.id === 'EV-000001')).toBe(true);
  });

  it('finds evidence by location', () => {
    const evidence = getEvidenceByLocation('LOC-004');
    expect(evidence.length).toBeGreaterThanOrEqual(2);
  });

  it('finds evidence by source', () => {
    const evidence = getEvidenceBySource('SRC-0001');
    expect(evidence.length).toBeGreaterThan(0);
  });

  it('searches evidence by title', () => {
    const results = searchEvidence('sarcophagus');
    expect(results.some((e) => e.id === 'EV-000008')).toBe(true);
  });

  it('filters evidence by class and category', () => {
    const results = getEvidenceByFilters({ primaryClass: 'E2', category: 'Measurement' });
    expect(results.length).toBeGreaterThan(0);
    expect(results.every((e) => e.primaryClass === 'E2' && e.category === 'Measurement')).toBe(
      true,
    );
  });

  it('returns evidence panel data with sources and objects', () => {
    const panel = getEvidencePanelData('EV-000001');
    expect(panel).toBeDefined();
    expect(panel?.sources.length).toBeGreaterThan(0);
    expect(panel?.objects.length).toBeGreaterThan(0);
  });

  it('computes object confidence', () => {
    const confidence = getObjectConfidence('OBJ-0001');
    expect(confidence).toBeGreaterThanOrEqual(0);
    expect(confidence).toBeLessThanOrEqual(100);
  });

  it('returns undefined for unknown IDs', () => {
    expect(getEvidenceById('EV-999999')).toBeUndefined();
  });
});

describe('EvidenceStore CRUD', () => {
  let store: EvidenceStore;

  beforeEach(() => {
    store = new EvidenceStore();
  });

  it('creates evidence with auto-generated ID and Draft status', () => {
    const ev = store.create({
      title: 'Test evidence record',
      category: 'Observation',
      confidence: 75,
      sourceIds: ['SRC-0001'],
      objectIds: ['OBJ-0001'],
    });

    expect(ev.id).toMatch(/^EV-\d{6}$/);
    expect(ev.title).toBe('Test evidence record');
    expect(ev.status).toBe('Draft');
    expect(ev.version).toBe(1);
    expect(ev.created).not.toBe('');
  });

  it('updates evidence fields and increments version', () => {
    const created = store.create({
      title: 'Original title',
      category: 'Measurement',
      confidence: 50,
    });

    const updated = store.update(created.id, {
      title: 'Updated title',
      confidence: 80,
      status: 'Submitted',
    });

    expect(updated).toBeDefined();
    expect(updated?.title).toBe('Updated title');
    expect(updated?.confidence).toBe(80);
    expect(updated?.status).toBe('Submitted');
    expect(updated?.version).toBe(2);
  });

  it('soft-deletes evidence by setting status to Retracted', () => {
    const created = store.create({
      title: 'To be retracted',
      category: 'Observation',
      confidence: 30,
    });

    const deleted = store.softDelete(created.id);

    expect(deleted).toBeDefined();
    expect(deleted?.status).toBe('Retracted');
    expect(store.getById(created.id)).toBeDefined();
  });

  it('throws when updating retracted evidence', () => {
    const created = store.create({
      title: 'Will be retracted',
      category: 'Observation',
      confidence: 30,
    });

    store.softDelete(created.id);

    expect(() => store.update(created.id, { title: 'New title' })).toThrow(
      /Cannot update retracted/,
    );
  });

  it('returns undefined when updating unknown ID', () => {
    expect(store.update('EV-999999', { title: 'Nope' })).toBeUndefined();
  });

  it('returns undefined when deleting unknown ID', () => {
    expect(store.softDelete('EV-999999')).toBeUndefined();
  });

  it('generates sequential IDs after seed data', () => {
    const initialCount = store.getAll().length;
    const ev1 = store.create({ title: 'First new', category: 'Observation', confidence: 50 });
    const ev2 = store.create({ title: 'Second new', category: 'Observation', confidence: 50 });

    expect(ev1.id).not.toBe(ev2.id);
    expect(store.getAll().length).toBe(initialCount + 2);
  });
});

describe('Repository CRUD functions', () => {
  it('creates evidence via repository function', () => {
    const ev = createEvidence({
      title: 'Repository-created evidence',
      category: 'Measurement',
      confidence: 85,
      sourceIds: ['SRC-0001'],
    });

    expect(ev.id).toMatch(/^EV-\d{6}$/);
    expect(getEvidenceById(ev.id)).toBeDefined();
  });

  it('updates evidence via repository function', () => {
    const ev = createEvidence({
      title: 'Before update',
      category: 'Measurement',
      confidence: 50,
    });

    const updated = updateEvidence(ev.id, { title: 'After update', confidence: 90 });
    expect(updated?.title).toBe('After update');
    expect(updated?.confidence).toBe(90);
    expect(updated?.version).toBe(2);
  });

  it('soft-deletes evidence via repository function', () => {
    const ev = createEvidence({
      title: 'To delete',
      category: 'Observation',
      confidence: 20,
    });

    const deleted = deleteEvidence(ev.id);
    expect(deleted?.status).toBe('Retracted');
  });
});
