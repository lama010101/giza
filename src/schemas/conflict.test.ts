import { describe, it, expect } from 'vitest';
import { ConflictRecordSchema, ConflictResolutionState } from './conflict';

const validConflict = {
  id: 'CONF-0001',
  evidenceA: 'EV-000143',
  evidenceB: 'EV-000210',
  relation: 'contradicts',
  description: '0.5 m discrepancy in chamber floor elevation',
  resolution: 'unresolved',
  notes: '',
};

describe('ConflictRecordSchema', () => {
  it('accepts a valid conflict record', () => {
    const result = ConflictRecordSchema.safeParse(validConflict);
    expect(result.success).toBe(true);
  });

  it('applies defaults for relation, resolution, notes, dates', () => {
    const result = ConflictRecordSchema.safeParse({
      id: 'CONF-0002',
      evidenceA: 'EV-000001',
      evidenceB: 'EV-000002',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.relation).toBe('contradicts');
      expect(result.data.resolution).toBe('unresolved');
      expect(result.data.notes).toBe('');
      expect(result.data.created).toBe('');
    }
  });

  it('rejects an invalid id', () => {
    const result = ConflictRecordSchema.safeParse({ ...validConflict, id: 'C-0001' });
    expect(result.success).toBe(false);
  });

  it('rejects an invalid evidenceA ID', () => {
    const result = ConflictRecordSchema.safeParse({ ...validConflict, evidenceA: 'EV-001' });
    expect(result.success).toBe(false);
  });

  it('rejects an invalid evidenceB ID', () => {
    const result = ConflictRecordSchema.safeParse({ ...validConflict, evidenceB: 'EV-001' });
    expect(result.success).toBe(false);
  });

  it('rejects an unknown relation', () => {
    const result = ConflictRecordSchema.safeParse({ ...validConflict, relation: 'invalidates' });
    expect(result.success).toBe(false);
  });

  it('rejects an unknown resolution state', () => {
    const result = ConflictRecordSchema.safeParse({ ...validConflict, resolution: 'rejected' });
    expect(result.success).toBe(false);
  });

  it('exports all 4 resolution states', () => {
    expect(ConflictResolutionState.options).toHaveLength(4);
    expect(ConflictResolutionState.options).toEqual(
      expect.arrayContaining(['unresolved', 'partial', 'superseded', 'contextual']),
    );
  });
});
