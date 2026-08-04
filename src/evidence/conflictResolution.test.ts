import { describe, it, expect, beforeEach } from 'vitest';
import { conflictManager } from './conflictResolution';

describe('Conflict Resolution (M02-T08)', () => {
  beforeEach(() => {
    conflictManager._resetForTesting();
  });

  describe('record', () => {
    it('records a conflict between two evidence records', () => {
      const conflict = conflictManager.record(
        'EV-000001',
        'EV-000002',
        'Contradictory measurements',
      );
      expect(conflict.id).toMatch(/^CONF-\d{4}$/);
      expect(conflict.evidenceA).toBe('EV-000001');
      expect(conflict.evidenceB).toBe('EV-000002');
      expect(conflict.relation).toBe('contradicts');
      expect(conflict.resolution).toBe('unresolved');
    });

    it('supports refines and supersedes relations', () => {
      const refines = conflictManager.record('EV-000001', 'EV-000002', 'Refines', 'refines');
      expect(refines.relation).toBe('refines');

      const supersedes = conflictManager.record(
        'EV-000003',
        'EV-000004',
        'Supersedes',
        'supersedes',
      );
      expect(supersedes.relation).toBe('supersedes');
    });
  });

  describe('resolve', () => {
    it('updates the resolution state', () => {
      const conflict = conflictManager.record('EV-000001', 'EV-000002', 'Test');
      const resolved = conflictManager.resolve(conflict.id, 'contextual', 'Resolved by context');
      expect(resolved?.resolution).toBe('contextual');
      expect(resolved?.notes).toBe('Resolved by context');
    });

    it('returns undefined for unknown conflict ID', () => {
      expect(conflictManager.resolve('CONF-9999', 'unresolved')).toBeUndefined();
    });
  });

  describe('getConflictsForEvidence', () => {
    it('returns all conflicts involving an evidence record', () => {
      conflictManager.record('EV-000001', 'EV-000002', 'Conflict 1');
      conflictManager.record('EV-000001', 'EV-000003', 'Conflict 2');
      conflictManager.record('EV-000004', 'EV-000005', 'Unrelated');

      const conflicts = conflictManager.getConflictsForEvidence('EV-000001');
      expect(conflicts).toHaveLength(2);
    });

    it('returns conflicts where evidence is the B side', () => {
      conflictManager.record('EV-000001', 'EV-000002', 'Conflict');
      const conflicts = conflictManager.getConflictsForEvidence('EV-000002');
      expect(conflicts).toHaveLength(1);
    });
  });

  describe('getUnresolved', () => {
    it('returns only unresolved conflicts', () => {
      const c1 = conflictManager.record('EV-000001', 'EV-000002', 'C1');
      conflictManager.record('EV-000003', 'EV-000004', 'C2');
      conflictManager.resolve(c1.id, 'contextual');

      const unresolved = conflictManager.getUnresolved();
      expect(unresolved).toHaveLength(1);
      expect(unresolved[0].id).not.toBe(c1.id);
    });
  });

  describe('getVisualizationData', () => {
    it('returns severity and count per evidence ID', () => {
      conflictManager.record('EV-000001', 'EV-000002', 'C1');
      conflictManager.record('EV-000001', 'EV-000003', 'C2');

      const viz = conflictManager.getVisualizationData();
      expect(viz.get('EV-000001')?.count).toBe(2);
      expect(viz.get('EV-000001')?.severity).toBe(1.0);
      expect(viz.get('EV-000002')?.count).toBe(1);
    });

    it('reduces severity for resolved conflicts', () => {
      const c = conflictManager.record('EV-000001', 'EV-000002', 'C1');
      conflictManager.resolve(c.id, 'superseded');

      const viz = conflictManager.getVisualizationData();
      expect(viz.get('EV-000001')?.severity).toBeLessThan(1.0);
    });
  });

  describe('getAll', () => {
    it('returns all conflict records', () => {
      conflictManager.record('EV-000001', 'EV-000002', 'C1');
      conflictManager.record('EV-000003', 'EV-000004', 'C2');
      expect(conflictManager.getAll()).toHaveLength(2);
    });
  });
});
