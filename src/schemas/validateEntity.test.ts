import { describe, it, expect } from 'vitest';
import { validateEntity } from './index';
import type { Evidence } from './evidence';
import type { Source } from './source';
import type { Media } from './media';
import type { Annotation } from './annotation';
import type { Bookmark, Measurement, User } from './user';
import type { DependencyEdge } from './dependency';
import type { ConflictRecord } from './conflict';

describe('validateEntity', () => {
  it('validates a valid evidence record', () => {
    const result = validateEntity<Evidence>('evidence', {
      id: 'EV-000001',
      title: 'Test',
      category: 'Measurement',
      confidence: 90,
      status: 'Draft',
    });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.id).toBe('EV-000001');
  });

  it('rejects an invalid evidence record', () => {
    const result = validateEntity<Evidence>('evidence', { id: 'EV-001' });
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.issues.length).toBeGreaterThan(0);
  });

  it('validates a valid source', () => {
    const result = validateEntity<Source>('source', {
      id: 'SRC-0001',
      title: 'Test Source',
      type: 'Journal',
    });
    expect(result.success).toBe(true);
  });

  it('validates a valid media record', () => {
    const result = validateEntity<Media>('media', {
      id: 'MED-0001',
      type: 'Photograph',
    });
    expect(result.success).toBe(true);
  });

  it('validates a valid annotation', () => {
    const result = validateEntity<Annotation>('annotation', {
      id: 'ANN-0001',
      type: 'Research Note',
      author: 'Jane',
      location: 'LOC-001',
    });
    expect(result.success).toBe(true);
  });

  it('validates a valid user', () => {
    const result = validateEntity<User>('user', {
      id: 'USER-0001',
      name: 'Jane Doe',
    });
    expect(result.success).toBe(true);
  });

  it('validates a valid bookmark', () => {
    const result = validateEntity<Bookmark>('bookmark', {
      id: 'BM-0001',
      userId: 'USER-0001',
      name: 'Test',
      camera: { position: { x: 0, y: 0, z: 0 }, target: { x: 0, y: 0, z: 0 } },
    });
    expect(result.success).toBe(true);
  });

  it('validates a valid measurement', () => {
    const result = validateEntity<Measurement>('measurement', {
      id: 'MEAS-0001',
      userId: 'USER-0001',
      type: 'Distance',
      points: [
        { x: 0, y: 0, z: 0 },
        { x: 1, y: 0, z: 0 },
      ],
      value: 1,
      geometryVersion: 'v1',
    });
    expect(result.success).toBe(true);
  });

  it('validates a valid dependency edge', () => {
    const result = validateEntity<DependencyEdge>('dependencyEdge', {
      from: 'EV-000001',
      to: 'EV-000002',
      relation: 'supports',
    });
    expect(result.success).toBe(true);
  });

  it('validates a valid conflict record', () => {
    const result = validateEntity<ConflictRecord>('conflictRecord', {
      id: 'CONF-0001',
      evidenceA: 'EV-000001',
      evidenceB: 'EV-000002',
    });
    expect(result.success).toBe(true);
  });

  it('throws on an unknown entity kind', () => {
    expect(() => validateEntity('unknown' as never, {})).toThrow(/Unknown entity kind/);
  });

  it('returns a discriminated union result', () => {
    const success = validateEntity('source', {
      id: 'SRC-0001',
      title: 'Test',
      type: 'Journal',
    });
    const failure = validateEntity('source', { id: 'BAD' });
    expect(success.success).toBe(true);
    expect(failure.success).toBe(false);
    // Narrowing works
    if (success.success) {
      expect((success.data as Source).title).toBe('Test');
    }
    if (!failure.success) {
      expect(failure.error.issues.length).toBeGreaterThan(0);
    }
  });
});
