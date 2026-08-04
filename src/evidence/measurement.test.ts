import { describe, it, expect } from 'vitest';
import {
  calculateDistance,
  calculateHeight,
  calculateAngle,
  calculateTriangleArea,
  calculateBoundingBoxVolume,
  createDistanceMeasurement,
  createHeightMeasurement,
  createAngleMeasurement,
  createAreaMeasurement,
  createVolumeMeasurement,
  formatMeasurement,
  measurementToJSON,
  measurementFromJSON,
} from './measurement';

describe('Measurement Tool (M08-T04)', () => {
  describe('distance', () => {
    it('calculates 3D distance between two points', () => {
      expect(calculateDistance({ x: 0, y: 0, z: 0 }, { x: 3, y: 4, z: 0 })).toBe(5);
      expect(calculateDistance({ x: 0, y: 0, z: 0 }, { x: 1, y: 1, z: 1 })).toBeCloseTo(
        Math.sqrt(3),
        5,
      );
    });

    it('creates a distance measurement with unit', () => {
      const m = createDistanceMeasurement({ x: 0, y: 0, z: 0 }, { x: 10, y: 0, z: 0 });
      expect(m.type).toBe('distance');
      expect(m.value).toBe(10);
      expect(m.unit).toBe('m');
    });
  });

  describe('height', () => {
    it('calculates vertical height (Y axis only)', () => {
      expect(calculateHeight({ x: 0, y: 0, z: 0 }, { x: 5, y: 100, z: 3 })).toBe(100);
    });

    it('handles negative heights (absolute value)', () => {
      expect(calculateHeight({ x: 0, y: 50, z: 0 }, { x: 0, y: 0, z: 0 })).toBe(50);
    });

    it('creates a height measurement', () => {
      const m = createHeightMeasurement({ x: 0, y: 0, z: 0 }, { x: 0, y: 146, z: 0 });
      expect(m.type).toBe('height');
      expect(m.value).toBe(146);
      expect(m.unit).toBe('m');
    });
  });

  describe('angle', () => {
    it('calculates angle at vertex between three points', () => {
      // Right angle: A at (1,0,0), vertex at origin, B at (0,1,0)
      expect(
        calculateAngle({ x: 1, y: 0, z: 0 }, { x: 0, y: 0, z: 0 }, { x: 0, y: 1, z: 0 }),
      ).toBeCloseTo(90, 1);
    });

    it('returns 0 when vertex coincides with a point', () => {
      expect(calculateAngle({ x: 0, y: 0, z: 0 }, { x: 0, y: 0, z: 0 }, { x: 1, y: 0, z: 0 })).toBe(
        0,
      );
    });

    it('calculates 180-degree angle (collinear)', () => {
      expect(
        calculateAngle({ x: 1, y: 0, z: 0 }, { x: 0, y: 0, z: 0 }, { x: -1, y: 0, z: 0 }),
      ).toBeCloseTo(180, 1);
    });

    it('creates an angle measurement in degrees', () => {
      const m = createAngleMeasurement(
        { x: 1, y: 0, z: 0 },
        { x: 0, y: 0, z: 0 },
        { x: 0, y: 1, z: 0 },
      );
      expect(m.type).toBe('angle');
      expect(m.value).toBeCloseTo(90, 1);
      expect(m.unit).toBe('deg');
    });
  });

  describe('area', () => {
    it('calculates triangle area using cross product', () => {
      // Right triangle with legs 3 and 4 → area = 6
      const area = calculateTriangleArea(
        { x: 0, y: 0, z: 0 },
        { x: 3, y: 0, z: 0 },
        { x: 0, y: 4, z: 0 },
      );
      expect(area).toBe(6);
    });

    it('creates an area measurement in square meters', () => {
      const m = createAreaMeasurement(
        { x: 0, y: 0, z: 0 },
        { x: 10, y: 0, z: 0 },
        { x: 0, y: 10, z: 0 },
      );
      expect(m.type).toBe('area');
      expect(m.value).toBe(50);
      expect(m.unit).toBe('m²');
    });
  });

  describe('volume', () => {
    it('calculates bounding box volume', () => {
      expect(calculateBoundingBoxVolume({ x: 0, y: 0, z: 0 }, { x: 10, y: 20, z: 30 })).toBe(6000);
    });

    it('creates a volume measurement in cubic meters', () => {
      const m = createVolumeMeasurement({ x: 0, y: 0, z: 0 }, { x: 230, y: 146, z: 230 });
      expect(m.type).toBe('volume');
      expect(m.value).toBe(7723400);
      expect(m.unit).toBe('m³');
    });
  });

  describe('formatting', () => {
    it('formats distance with 2 decimal places', () => {
      const m = createDistanceMeasurement({ x: 0, y: 0, z: 0 }, { x: 10.123, y: 0, z: 0 });
      expect(formatMeasurement(m)).toBe('10.12 m');
    });

    it('formats angle with 1 decimal place', () => {
      const m = createAngleMeasurement(
        { x: 1, y: 0, z: 0 },
        { x: 0, y: 0, z: 0 },
        { x: 0, y: 1, z: 0 },
      );
      expect(formatMeasurement(m)).toBe('90.0deg');
    });

    it('formats area with square meters', () => {
      const m = createAreaMeasurement(
        { x: 0, y: 0, z: 0 },
        { x: 10, y: 0, z: 0 },
        { x: 0, y: 10, z: 0 },
      );
      expect(formatMeasurement(m)).toBe('50.00 m²');
    });

    it('formats volume with cubic meters', () => {
      const m = createVolumeMeasurement({ x: 0, y: 0, z: 0 }, { x: 2, y: 3, z: 4 });
      expect(formatMeasurement(m)).toBe('24.00 m³');
    });
  });

  describe('serialization', () => {
    it('round-trips a measurement through JSON', () => {
      const m = createDistanceMeasurement({ x: 1, y: 2, z: 3 }, { x: 4, y: 5, z: 6 });
      const json = measurementToJSON(m);
      const restored = measurementFromJSON(json);
      expect(restored).toEqual(m);
    });
  });
});
