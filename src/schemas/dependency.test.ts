import { describe, it, expect } from 'vitest';
import { DependencyEdgeSchema, DependencyRelation } from './dependency';

const validEdge = {
  from: 'EV-000120',
  to: 'EV-000143',
  relation: 'validates',
  strength: 0.8,
  notes: 'Laser scan validates room dimensions',
};

describe('DependencyEdgeSchema', () => {
  it('accepts a valid edge', () => {
    const result = DependencyEdgeSchema.safeParse(validEdge);
    expect(result.success).toBe(true);
  });

  it('applies defaults for strength and notes', () => {
    const result = DependencyEdgeSchema.safeParse({
      from: 'EV-000001',
      to: 'EV-000002',
      relation: 'supports',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.strength).toBe(1);
      expect(result.data.notes).toBe('');
    }
  });

  it('rejects an invalid from evidence ID', () => {
    const result = DependencyEdgeSchema.safeParse({ ...validEdge, from: 'EV-001' });
    expect(result.success).toBe(false);
  });

  it('rejects an invalid to evidence ID', () => {
    const result = DependencyEdgeSchema.safeParse({ ...validEdge, to: 'EV-001' });
    expect(result.success).toBe(false);
  });

  it('rejects an unknown relation', () => {
    const result = DependencyEdgeSchema.safeParse({ ...validEdge, relation: 'invalidates' });
    expect(result.success).toBe(false);
  });

  it('rejects strength > 1', () => {
    const result = DependencyEdgeSchema.safeParse({ ...validEdge, strength: 1.5 });
    expect(result.success).toBe(false);
  });

  it('rejects strength < 0', () => {
    const result = DependencyEdgeSchema.safeParse({ ...validEdge, strength: -0.1 });
    expect(result.success).toBe(false);
  });

  it('exports all 7 dependency relations', () => {
    expect(DependencyRelation.options).toHaveLength(7);
    expect(DependencyRelation.options).toEqual(
      expect.arrayContaining([
        'validates',
        'supports',
        'contradicts',
        'refines',
        'supersedes',
        'influences',
        'derived_from',
      ]),
    );
  });
});
