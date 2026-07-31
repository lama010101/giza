import { describe, it, expect } from 'vitest';
import {
  EVIDENCE_LIFECYCLE_TRANSITIONS,
  canTransition,
  assertTransition,
  transition,
  lifecyclePath,
} from './lifecycle';
import type { EvidenceStatus } from './evidence';

describe('EVIDENCE_LIFECYCLE_TRANSITIONS', () => {
  it('defines all 7 states', () => {
    const states = Object.keys(EVIDENCE_LIFECYCLE_TRANSITIONS);
    expect(states).toHaveLength(7);
    expect(states).toEqual(
      expect.arrayContaining([
        'Draft',
        'Submitted',
        'In Review',
        'Verified',
        'Published',
        'Superseded',
        'Retracted',
      ]),
    );
  });

  it('marks Retracted as terminal (null)', () => {
    expect(EVIDENCE_LIFECYCLE_TRANSITIONS.Retracted).toBeNull();
  });
});

describe('canTransition', () => {
  it('permits forward transitions', () => {
    expect(canTransition('Draft', 'Submitted')).toBe(true);
    expect(canTransition('Submitted', 'In Review')).toBe(true);
    expect(canTransition('In Review', 'Verified')).toBe(true);
    expect(canTransition('Verified', 'Published')).toBe(true);
    expect(canTransition('Published', 'Superseded')).toBe(true);
    expect(canTransition('Superseded', 'Retracted')).toBe(true);
  });

  it('permits the revise loop (In Review → Submitted)', () => {
    expect(canTransition('In Review', 'Submitted')).toBe(true);
  });

  it('rejects backward transitions except the revise loop', () => {
    expect(canTransition('Published', 'Verified')).toBe(false);
    expect(canTransition('Verified', 'In Review')).toBe(false);
    expect(canTransition('Submitted', 'Draft')).toBe(false);
  });

  it('rejects transitions out of Retracted', () => {
    expect(canTransition('Retracted', 'Published')).toBe(false);
    expect(canTransition('Retracted', 'Draft')).toBe(false);
  });

  it('rejects self-transitions', () => {
    expect(canTransition('Draft', 'Draft')).toBe(false);
  });

  it('rejects shortcut transitions (skipping review)', () => {
    expect(canTransition('Draft', 'Published')).toBe(false);
    expect(canTransition('Submitted', 'Published')).toBe(false);
  });
});

describe('assertTransition', () => {
  it('does not throw on valid transitions', () => {
    expect(() => assertTransition('Draft', 'Submitted')).not.toThrow();
  });

  it('throws on invalid transitions', () => {
    expect(() => assertTransition('Retracted', 'Published')).toThrow(/Invalid evidence lifecycle/);
    expect(() => assertTransition('Retracted', 'Published')).toThrow(/forward-only/);
  });
});

describe('transition', () => {
  it('returns the target state on success', () => {
    expect(transition('Draft', 'Submitted')).toBe('Submitted');
  });

  it('throws on invalid transitions', () => {
    expect(() => transition('Retracted', 'Published')).toThrow();
  });
});

describe('lifecyclePath', () => {
  it('returns the full forward path from Draft to Retracted', () => {
    const path = lifecyclePath('Draft', 'Retracted');
    expect(path).toEqual([
      'Draft',
      'Submitted',
      'In Review',
      'Verified',
      'Published',
      'Superseded',
      'Retracted',
    ]);
  });

  it('returns a single-element path when start === end', () => {
    expect(lifecyclePath('Published', 'Published')).toEqual(['Published']);
  });

  it('returns null when no forward path exists (backward)', () => {
    expect(lifecyclePath('Published', 'Draft')).toBeNull();
  });

  it('returns a partial path to an intermediate state', () => {
    expect(lifecyclePath('Draft', 'Verified')).toEqual([
      'Draft',
      'Submitted',
      'In Review',
      'Verified',
    ]);
  });

  it('returns null when end is unreachable from start', () => {
    // Retracted is terminal — no forward path to anything
    expect(lifecyclePath('Retracted', 'Draft' as EvidenceStatus)).toBeNull();
  });
});
