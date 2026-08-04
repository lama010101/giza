import { describe, it, expect } from 'vitest';
import {
  COORDINATE_SYSTEM,
  COORDINATE_LEVELS,
  MONUMENT_ORIGINS,
  localToWorld,
  worldToLocal,
  getCoordinateLevel,
} from './coordinateSystem';

describe('Coordinate System (M05-T02)', () => {
  describe('COORDINATE_SYSTEM', () => {
    it('uses Y-up', () => {
      expect(COORDINATE_SYSTEM.upAxis).toBe('y');
    });

    it('uses right-handed coordinates', () => {
      expect(COORDINATE_SYSTEM.handedness).toBe('right');
    });

    it('uses meters as unit', () => {
      expect(COORDINATE_SYSTEM.unit).toBe('meters');
    });

    it('defines north as -Z', () => {
      expect(COORDINATE_SYSTEM.northAxis.z).toBe(-1);
    });

    it('defines east as +X', () => {
      expect(COORDINATE_SYSTEM.eastAxis.x).toBe(1);
    });

    it('defines up as +Y', () => {
      expect(COORDINATE_SYSTEM.upVector.y).toBe(1);
    });
  });

  describe('COORDINATE_LEVELS', () => {
    it('has 5 levels', () => {
      expect(COORDINATE_LEVELS).toHaveLength(5);
    });

    it('includes world, plateau, monument, room, object', () => {
      expect(COORDINATE_LEVELS).toContain('world');
      expect(COORDINATE_LEVELS).toContain('plateau');
      expect(COORDINATE_LEVELS).toContain('monument');
      expect(COORDINATE_LEVELS).toContain('room');
      expect(COORDINATE_LEVELS).toContain('object');
    });
  });

  describe('MONUMENT_ORIGINS', () => {
    it('defines origins for known monuments', () => {
      expect(MONUMENT_ORIGINS['great-pyramid']).toBeDefined();
      expect(MONUMENT_ORIGINS['osiris-shaft']).toBeDefined();
    });
  });

  describe('localToWorld', () => {
    it('converts local coordinates to world coordinates', () => {
      const world = localToWorld({ x: 10, y: 5, z: 20 }, 'khafre');
      expect(world.x).toBe(10 + MONUMENT_ORIGINS.khafre.x);
      expect(world.y).toBe(5);
      expect(world.z).toBe(20 + MONUMENT_ORIGINS.khafre.z);
    });
  });

  describe('worldToLocal', () => {
    it('converts world coordinates to local coordinates', () => {
      const local = worldToLocal(
        {
          x: MONUMENT_ORIGINS.khafre.x + 10,
          y: 5,
          z: MONUMENT_ORIGINS.khafre.z + 20,
        },
        'khafre',
      );
      expect(local.x).toBe(10);
      expect(local.y).toBe(5);
      expect(local.z).toBe(20);
    });
  });

  describe('getCoordinateLevel', () => {
    it('returns world for world- prefix', () => {
      expect(getCoordinateLevel('world-root')).toBe('world');
    });

    it('returns plateau for plateau- prefix', () => {
      expect(getCoordinateLevel('plateau-grid')).toBe('plateau');
    });

    it('returns monument for gp- prefix', () => {
      expect(getCoordinateLevel('gp-root')).toBe('monument');
    });

    it('returns room for -room- in ID', () => {
      expect(getCoordinateLevel('gp-room-kings')).toBe('room');
    });

    it('returns object for other IDs', () => {
      expect(getCoordinateLevel('sarcophagus-1')).toBe('object');
    });
  });
});
