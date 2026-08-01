import { describe, it, expect, beforeEach } from 'vitest';
import { HypothesisStore, getHypothesisStore, resetHypothesisStore } from './hypothesisStore';

describe('Hypothesis Store (M05.5-T03)', () => {
  let store: HypothesisStore;

  beforeEach(() => {
    store = new HypothesisStore();
  });

  describe('create', () => {
    it('creates a hypothesis', () => {
      const h = store.create({
        id: 'H-001',
        name: 'Test Hypothesis',
        description: 'A test',
        author: 'Test',
        version: '1.0.0',
        category: 'mainstream',
      });
      expect(h.id).toBe('H-001');
      expect(h.name).toBe('Test Hypothesis');
    });

    it('throws on duplicate ID', () => {
      store.create({
        id: 'H-001',
        name: 'A',
        description: '',
        author: '',
        version: '1',
        category: 'mainstream',
      });
      expect(() =>
        store.create({
          id: 'H-001',
          name: 'B',
          description: '',
          author: '',
          version: '1',
          category: 'mainstream',
        }),
      ).toThrow('already exists');
    });
  });

  describe('getById', () => {
    it('returns hypothesis by ID', () => {
      store.create({
        id: 'H-001',
        name: 'A',
        description: '',
        author: '',
        version: '1',
        category: 'mainstream',
      });
      expect(store.getById('H-001')).toBeDefined();
    });

    it('returns undefined for unknown ID', () => {
      expect(store.getById('unknown')).toBeUndefined();
    });
  });

  describe('getAll', () => {
    it('returns all hypotheses', () => {
      store.create({
        id: 'H-001',
        name: 'A',
        description: '',
        author: '',
        version: '1',
        category: 'mainstream',
      });
      store.create({
        id: 'H-002',
        name: 'B',
        description: '',
        author: '',
        version: '1',
        category: 'alternative',
      });
      expect(store.getAll()).toHaveLength(2);
    });
  });

  describe('update', () => {
    it('updates a hypothesis', () => {
      store.create({
        id: 'H-001',
        name: 'A',
        description: '',
        author: '',
        version: '1',
        category: 'mainstream',
      });
      const updated = store.update('H-001', { name: 'Updated' });
      expect(updated?.name).toBe('Updated');
    });

    it('returns undefined for unknown ID', () => {
      expect(store.update('unknown', { name: 'x' })).toBeUndefined();
    });
  });

  describe('delete', () => {
    it('deletes a hypothesis', () => {
      store.create({
        id: 'H-001',
        name: 'A',
        description: '',
        author: '',
        version: '1',
        category: 'mainstream',
      });
      expect(store.delete('H-001')).toBe(true);
      expect(store.getById('H-001')).toBeUndefined();
    });
  });

  describe('activate/deactivate', () => {
    it('activates a hypothesis', () => {
      store.create({
        id: 'H-001',
        name: 'A',
        description: '',
        author: '',
        version: '1',
        category: 'mainstream',
      });
      expect(store.activate('H-001')).toBe(true);
      expect(store.isActive('H-001')).toBe(true);
      expect(store.getActive()).toHaveLength(1);
    });

    it('deactivates a hypothesis', () => {
      store.create({
        id: 'H-001',
        name: 'A',
        description: '',
        author: '',
        version: '1',
        category: 'mainstream',
      });
      store.activate('H-001');
      expect(store.deactivate('H-001')).toBe(true);
      expect(store.isActive('H-001')).toBe(false);
    });

    it('returns false for unknown ID', () => {
      expect(store.activate('unknown')).toBe(false);
    });
  });

  describe('getByCategory', () => {
    it('filters by category', () => {
      store.create({
        id: 'H-001',
        name: 'A',
        description: '',
        author: '',
        version: '1',
        category: 'mainstream',
      });
      store.create({
        id: 'H-002',
        name: 'B',
        description: '',
        author: '',
        version: '1',
        category: 'alternative',
      });
      expect(store.getByCategory('mainstream')).toHaveLength(1);
    });
  });

  describe('singleton', () => {
    it('returns same instance', () => {
      resetHypothesisStore();
      const s1 = getHypothesisStore();
      const s2 = getHypothesisStore();
      expect(s1).toBe(s2);
    });
  });
});
