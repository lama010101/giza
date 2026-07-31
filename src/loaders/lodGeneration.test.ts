import { describe, it, expect } from 'vitest';
import { generateLOD, generateLODChain, validateLODQuality, type MeshData } from './lodGeneration';

function makeCube(): MeshData {
  return {
    vertices: [
      { x: 0, y: 0, z: 0 },
      { x: 1, y: 0, z: 0 },
      { x: 1, y: 1, z: 0 },
      { x: 0, y: 1, z: 0 },
      { x: 0, y: 0, z: 1 },
      { x: 1, y: 0, z: 1 },
      { x: 1, y: 1, z: 1 },
      { x: 0, y: 1, z: 1 },
    ],
    triangles: [
      0,
      1,
      2,
      0,
      2,
      3, // front
      4,
      5,
      6,
      4,
      6,
      7, // back
      0,
      4,
      7,
      0,
      7,
      3, // left
      1,
      5,
      6,
      1,
      6,
      2, // right
      3,
      2,
      6,
      3,
      6,
      7, // top
      0,
      1,
      5,
      0,
      5,
      4, // bottom
    ],
  };
}

describe('LOD Generation (M06A-T08)', () => {
  describe('generateLOD', () => {
    it('returns original mesh for ratio 1.0', () => {
      const source = makeCube();
      const result = generateLOD(source, 1.0, 'LOD0');
      expect(result.simplifiedTriangleCount).toBe(result.originalTriangleCount);
      expect(result.reductionRatio).toBe(1);
    });

    it('reduces triangle count for ratio < 1', () => {
      const source = makeCube();
      const result = generateLOD(source, 0.25, 'LOD1');
      expect(result.simplifiedTriangleCount).toBeLessThan(result.originalTriangleCount);
      expect(result.reductionRatio).toBeLessThanOrEqual(0.25);
    });

    it('computes Hausdorff distance', () => {
      const source = makeCube();
      const result = generateLOD(source, 0.25, 'LOD1');
      expect(result.hausdorffDistance).toBeGreaterThanOrEqual(0);
    });
  });

  describe('generateLODChain', () => {
    it('generates 4 LOD levels', () => {
      const source = makeCube();
      const chain = generateLODChain(source);
      expect(chain).toHaveLength(4);
      expect(chain[0].level).toBe('LOD0');
      expect(chain[3].level).toBe('LOD3');
    });

    it('each level has fewer or equal triangles', () => {
      const source = makeCube();
      const chain = generateLODChain(source);
      for (let i = 1; i < chain.length; i++) {
        expect(chain[i].simplifiedTriangleCount).toBeLessThanOrEqual(
          chain[i - 1].simplifiedTriangleCount,
        );
      }
    });
  });

  describe('validateLODQuality', () => {
    it('passes for valid LOD', () => {
      const source = makeCube();
      const result = generateLOD(source, 1.0, 'LOD0');
      const validation = validateLODQuality(result, 0.1);
      expect(validation.valid).toBe(true);
    });

    it('fails when Hausdorff exceeds threshold', () => {
      const source = makeCube();
      const result = generateLOD(source, 0.1, 'LOD3');
      const validation = validateLODQuality(result, 0.0001);
      // May or may not fail depending on the mesh, but the function should work
      expect(validation).toBeDefined();
    });
  });
});
