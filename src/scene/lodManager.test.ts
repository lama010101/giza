import { describe, it, expect } from 'vitest';
import {
  LOD_THRESHOLDS,
  hausdorffDistance,
  selectLODLevel,
  getTargetTriangleCount,
  meetsHausdorffThreshold,
  getLODThresholds,
} from './lodManager';

describe('LOD Manager (M05-T07)', () => {
  describe('LOD_THRESHOLDS', () => {
    it('has 4 LOD levels', () => {
      expect(LOD_THRESHOLDS).toHaveLength(4);
    });

    it('LOD0 has zero Hausdorff distance', () => {
      expect(LOD_THRESHOLDS[0].maxHausdorffDistance).toBe(0);
    });

    it('each level has decreasing triangle ratio', () => {
      for (let i = 1; i < LOD_THRESHOLDS.length; i++) {
        expect(LOD_THRESHOLDS[i].maxTriangleRatio).toBeLessThan(
          LOD_THRESHOLDS[i - 1].maxTriangleRatio,
        );
      }
    });
  });

  describe('hausdorffDistance', () => {
    it('returns 0 for identical point sets', () => {
      const points = [
        { x: 0, y: 0, z: 0 },
        { x: 1, y: 0, z: 0 },
      ];
      expect(hausdorffDistance(points, points)).toBe(0);
    });

    it('returns max distance for different points', () => {
      const a = [{ x: 0, y: 0, z: 0 }];
      const b = [{ x: 1, y: 0, z: 0 }];
      expect(hausdorffDistance(a, b)).toBe(1);
    });

    it('returns 0 for empty sets', () => {
      expect(hausdorffDistance([], [])).toBe(0);
    });
  });

  describe('selectLODLevel', () => {
    it('returns LOD0 for close objects', () => {
      const selection = selectLODLevel(1, 1000);
      expect(selection.level).toBe('LOD0');
    });

    it('returns lower LOD for distant objects', () => {
      const selection = selectLODLevel(10000, 1000);
      // At large distance, should not be LOD0
      expect(selection.level).not.toBe('LOD0');
    });
  });

  describe('getTargetTriangleCount', () => {
    it('returns full count for LOD0', () => {
      expect(getTargetTriangleCount(10000, 'LOD0')).toBe(10000);
    });

    it('returns reduced count for LOD1', () => {
      expect(getTargetTriangleCount(10000, 'LOD1')).toBe(2500);
    });

    it('returns further reduced count for LOD2', () => {
      expect(getTargetTriangleCount(10000, 'LOD2')).toBe(625);
    });
  });

  describe('meetsHausdorffThreshold', () => {
    it('returns true when within threshold', () => {
      expect(meetsHausdorffThreshold(0.001, 'LOD1')).toBe(true);
    });

    it('returns false when exceeding threshold', () => {
      expect(meetsHausdorffThreshold(1.0, 'LOD1')).toBe(false);
    });
  });

  describe('getLODThresholds', () => {
    it('returns all thresholds', () => {
      expect(getLODThresholds()).toHaveLength(4);
    });
  });
});
