import { describe, it, expect } from 'vitest';
import { UserSchema, BookmarkSchema, MeasurementSchema, UserRole, MeasurementType } from './user';

describe('UserSchema', () => {
  const validUser = {
    id: 'USER-0001',
    name: 'Jane Doe',
    orcid: '0000-0001-2345-6789',
    role: 'Researcher',
  };

  it('accepts a valid user', () => {
    const result = UserSchema.safeParse(validUser);
    expect(result.success).toBe(true);
  });

  it('defaults role to Researcher', () => {
    const result = UserSchema.safeParse({ id: 'USER-0002', name: 'Bob' });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.role).toBe('Researcher');
  });

  it('rejects an invalid id', () => {
    const result = UserSchema.safeParse({ ...validUser, id: 'USER-01' });
    expect(result.success).toBe(false);
  });

  it('rejects an empty name', () => {
    const result = UserSchema.safeParse({ ...validUser, name: '' });
    expect(result.success).toBe(false);
  });

  it('rejects an unknown role', () => {
    const result = UserSchema.safeParse({ ...validUser, role: 'Superuser' });
    expect(result.success).toBe(false);
  });

  it('exports 4 user roles', () => {
    expect(UserRole.options).toHaveLength(4);
  });
});

describe('BookmarkSchema', () => {
  const validBookmark = {
    id: 'BM-0001',
    userId: 'USER-0001',
    name: "King's Chamber overview",
    camera: {
      position: { x: 0, y: 5, z: 10 },
      target: { x: 0, y: 0, z: 0 },
    },
    layers: ['Geometry', 'Evidence'],
    activeHypotheses: ['THEORY-001'],
    lighting: { ambient: 0.5 },
    selectedObject: 'OBJ-0001',
    notes: 'Best view of the sarcophagus',
  };

  it('accepts a valid bookmark', () => {
    const result = BookmarkSchema.safeParse(validBookmark);
    expect(result.success).toBe(true);
  });

  it('applies defaults for arrays and notes', () => {
    const result = BookmarkSchema.safeParse({
      id: 'BM-0002',
      userId: 'USER-0001',
      name: 'Test',
      camera: { position: { x: 0, y: 0, z: 0 }, target: { x: 0, y: 0, z: 0 } },
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.layers).toEqual([]);
      expect(result.data.activeHypotheses).toEqual([]);
      expect(result.data.lighting).toEqual({});
      expect(result.data.notes).toBe('');
    }
  });

  it('rejects an invalid bookmark id', () => {
    const result = BookmarkSchema.safeParse({ ...validBookmark, id: 'BM-1' });
    expect(result.success).toBe(false);
  });

  it('rejects an invalid hypothesis ID in activeHypotheses', () => {
    const result = BookmarkSchema.safeParse({
      ...validBookmark,
      activeHypotheses: ['theory-001-lowercase'],
    });
    expect(result.success).toBe(false);
  });

  it('rejects a bookmark with missing camera', () => {
    const result = BookmarkSchema.safeParse({ ...validBookmark, camera: undefined });
    expect(result.success).toBe(false);
  });

  it('rejects fov outside the 10–120 range', () => {
    const result = BookmarkSchema.safeParse({
      ...validBookmark,
      camera: { ...validBookmark.camera, fov: 200 },
    });
    expect(result.success).toBe(false);
  });
});

describe('MeasurementSchema', () => {
  const validMeasurement = {
    id: 'MEAS-0001',
    userId: 'USER-0001',
    type: 'Distance',
    points: [
      { x: 0, y: 0, z: 0 },
      { x: 1, y: 0, z: 0 },
    ],
    value: 1.0,
    unit: 'm',
    geometryVersion: 'gp-v1.0.0',
  };

  it('accepts a valid measurement', () => {
    const result = MeasurementSchema.safeParse(validMeasurement);
    expect(result.success).toBe(true);
  });

  it('applies defaults for unit and annotation', () => {
    const result = MeasurementSchema.safeParse({
      id: 'MEAS-0002',
      userId: 'USER-0001',
      type: 'Angle',
      points: [
        { x: 0, y: 0, z: 0 },
        { x: 1, y: 0, z: 0 },
        { x: 1, y: 1, z: 0 },
      ],
      value: 45,
      geometryVersion: 'gp-v1.0.0',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.unit).toBe('m');
      expect(result.data.annotation).toBe('');
    }
  });

  it('rejects a measurement with fewer than 2 points', () => {
    const result = MeasurementSchema.safeParse({
      ...validMeasurement,
      points: [{ x: 0, y: 0, z: 0 }],
    });
    expect(result.success).toBe(false);
  });

  it('rejects an invalid id', () => {
    const result = MeasurementSchema.safeParse({ ...validMeasurement, id: 'M-0001' });
    expect(result.success).toBe(false);
  });

  it('rejects an unknown measurement type', () => {
    const result = MeasurementSchema.safeParse({ ...validMeasurement, type: 'Circumference' });
    expect(result.success).toBe(false);
  });

  it('rejects a missing geometryVersion', () => {
    const result = MeasurementSchema.safeParse({ ...validMeasurement, geometryVersion: '' });
    expect(result.success).toBe(false);
  });

  it('exports 5 measurement types', () => {
    expect(MeasurementType.options).toHaveLength(5);
  });
});
