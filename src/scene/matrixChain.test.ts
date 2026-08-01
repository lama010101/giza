import { describe, it, expect } from 'vitest';
import {
  identityMatrix,
  translationMatrix,
  scaleMatrix,
  rotationMatrix,
  composeMatrix,
  multiplyMatrices,
  invertMatrix,
  matrixDeterminant,
  transformPoint,
  transformDirection,
  decomposeMatrix,
  computeLocalToWorldMatrix,
  localToWorldPoint,
  worldToLocalPoint,
  computeLevelMatrix,
  buildTransformChain,
  traverseChainLeafToRoot,
  traverseChainRootToLeaf,
  MATRIX_CHAIN_LEVELS,
  CHAIN_ORDER_LEAF_TO_ROOT,
  CHAIN_ORDER_ROOT_TO_LEAF,
  IDENTITY_LOCAL_TRANSFORM,
  GREAT_PYRAMID_MONUMENT_TRANSFORM,
  type Mat4,
  type TransformChain,
} from './matrixChain';

function approxEqual(actual: number, expected: number, epsilon = 1e-6): boolean {
  return Math.abs(actual - expected) < epsilon;
}

function expectMatrixClose(actual: Mat4, expected: Mat4, epsilon = 1e-6): void {
  for (let i = 0; i < 16; i++) {
    expect(approxEqual(actual[i], expected[i], epsilon)).toBe(true);
  }
}

describe('Matrix Chain (M05-T03)', () => {
  describe('MATRIX_CHAIN_LEVELS', () => {
    it('defines 5 hierarchy levels', () => {
      expect(MATRIX_CHAIN_LEVELS).toHaveLength(5);
    });

    it('orders from object (leaf) to world (root)', () => {
      expect(MATRIX_CHAIN_LEVELS[0]).toBe('object');
      expect(MATRIX_CHAIN_LEVELS[4]).toBe('world');
    });

    it('has root-to-leaf order as reverse', () => {
      expect(CHAIN_ORDER_ROOT_TO_LEAF[0]).toBe('world');
      expect(CHAIN_ORDER_ROOT_TO_LEAF[4]).toBe('object');
      expect(CHAIN_ORDER_LEAF_TO_ROOT).toHaveLength(5);
    });
  });

  describe('identityMatrix', () => {
    it('produces the 4×4 identity', () => {
      const id = identityMatrix();
      expect(id[0]).toBe(1);
      expect(id[5]).toBe(1);
      expect(id[10]).toBe(1);
      expect(id[15]).toBe(1);
      expect(id[1]).toBe(0);
      expect(id[12]).toBe(0);
    });
  });

  describe('translationMatrix', () => {
    it('places translation in the last column', () => {
      const m = translationMatrix({ x: 5, y: 10, z: -3 });
      expect(m[12]).toBe(5);
      expect(m[13]).toBe(10);
      expect(m[14]).toBe(-3);
    });
  });

  describe('scaleMatrix', () => {
    it('places scale on the diagonal', () => {
      const m = scaleMatrix({ x: 2, y: 3, z: 4 });
      expect(m[0]).toBe(2);
      expect(m[5]).toBe(3);
      expect(m[10]).toBe(4);
    });
  });

  describe('rotationMatrix', () => {
    it('produces identity for zero rotation', () => {
      const m = rotationMatrix({ x: 0, y: 0, z: 0 });
      expectMatrixClose(m, identityMatrix());
    });

    it('rotates 90° around Y correctly', () => {
      const m = rotationMatrix({ x: 0, y: Math.PI / 2, z: 0 });
      // A point (1,0,0) should map to (0,0,-1) after 90° Y rotation
      const p = transformPoint(m, { x: 1, y: 0, z: 0 });
      expect(approxEqual(p.x, 0)).toBe(true);
      expect(approxEqual(p.y, 0)).toBe(true);
      expect(approxEqual(p.z, -1)).toBe(true);
    });
  });

  describe('composeMatrix', () => {
    it('composes translation, rotation, and scale', () => {
      const m = composeMatrix({
        translation: { x: 10, y: 0, z: 0 },
        rotation: { x: 0, y: 0, z: 0 },
        scale: { x: 2, y: 1, z: 1 },
      });
      // Point at origin → translated to (10,0,0)
      const p = transformPoint(m, { x: 0, y: 0, z: 0 });
      expect(p.x).toBe(10);
      // Point at (1,0,0) → scaled to (2,0,0) then translated to (12,0,0)
      const p2 = transformPoint(m, { x: 1, y: 0, z: 0 });
      expect(p2.x).toBe(12);
    });
  });

  describe('multiplyMatrices', () => {
    it('identity × identity = identity', () => {
      const result = multiplyMatrices(identityMatrix(), identityMatrix());
      expectMatrixClose(result, identityMatrix());
    });

    it('is not commutative for translation and scale', () => {
      const t = translationMatrix({ x: 5, y: 0, z: 0 });
      const s = scaleMatrix({ x: 2, y: 1, z: 1 });
      const ts = multiplyMatrices(t, s);
      const st = multiplyMatrices(s, t);
      // T*S: translate(5) then scale(2) → point (1,0,0) → (2,0,0) → (7,0,0)
      // S*T: scale(2) then translate(5) → point (1,0,0) → (6,0,0) → (12,0,0)
      const p1 = transformPoint(ts, { x: 1, y: 0, z: 0 });
      const p2 = transformPoint(st, { x: 1, y: 0, z: 0 });
      expect(p1.x).toBe(7);
      expect(p2.x).toBe(12);
    });
  });

  describe('invertMatrix', () => {
    it('inverts a translation matrix', () => {
      const t = translationMatrix({ x: 5, y: 10, z: -3 });
      const inv = invertMatrix(t);
      const p = transformPoint(inv, { x: 5, y: 10, z: -3 });
      expect(approxEqual(p.x, 0)).toBe(true);
      expect(approxEqual(p.y, 0)).toBe(true);
      expect(approxEqual(p.z, 0)).toBe(true);
    });

    it('inverts a composed TRS matrix', () => {
      const m = composeMatrix({
        translation: { x: 10, y: 5, z: 3 },
        rotation: { x: 0, y: Math.PI / 4, z: 0 },
        scale: { x: 2, y: 3, z: 1 },
      });
      const inv = invertMatrix(m);
      const product = multiplyMatrices(m, inv);
      expectMatrixClose(product, identityMatrix(), 1e-5);
    });

    it('returns identity for singular matrix', () => {
      const singular = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0] as unknown as Mat4;
      const inv = invertMatrix(singular);
      expectMatrixClose(inv, identityMatrix());
    });
  });

  describe('matrixDeterminant', () => {
    it('returns 1 for identity', () => {
      expect(matrixDeterminant(identityMatrix())).toBe(1);
    });

    it('returns the squared scale for a scale matrix', () => {
      const m = scaleMatrix({ x: 2, y: 3, z: 4 });
      expect(matrixDeterminant(m)).toBe(24);
    });
  });

  describe('transformDirection', () => {
    it('ignores translation', () => {
      const m = translationMatrix({ x: 100, y: 200, z: 300 });
      const d = transformDirection(m, { x: 1, y: 0, z: 0 });
      expect(d.x).toBe(1);
      expect(d.y).toBe(0);
      expect(d.z).toBe(0);
    });
  });

  describe('decomposeMatrix', () => {
    it('extracts translation from a pure translation matrix', () => {
      const m = translationMatrix({ x: 10, y: 20, z: 30 });
      const d = decomposeMatrix(m);
      expect(d.translation.x).toBe(10);
      expect(d.translation.y).toBe(20);
      expect(d.translation.z).toBe(30);
      expect(d.scale.x).toBe(1);
      expect(d.scale.y).toBe(1);
      expect(d.scale.z).toBe(1);
    });

    it('extracts scale from a pure scale matrix', () => {
      const m = scaleMatrix({ x: 2, y: 4, z: 6 });
      const d = decomposeMatrix(m);
      expect(approxEqual(d.scale.x, 2)).toBe(true);
      expect(approxEqual(d.scale.y, 4)).toBe(true);
      expect(approxEqual(d.scale.z, 6)).toBe(true);
    });

    it('round-trips a composed TRS matrix', () => {
      const original = {
        translation: { x: 10, y: 5, z: 3 },
        rotation: { x: 0.3, y: 0.7, z: 0.2 },
        scale: { x: 2, y: 3, z: 1.5 },
      };
      const m = composeMatrix(original);
      const d = decomposeMatrix(m);
      expect(approxEqual(d.translation.x, 10)).toBe(true);
      expect(approxEqual(d.translation.y, 5)).toBe(true);
      expect(approxEqual(d.translation.z, 3)).toBe(true);
      expect(approxEqual(d.scale.x, 2)).toBe(true);
      expect(approxEqual(d.scale.y, 3)).toBe(true);
      expect(approxEqual(d.scale.z, 1.5)).toBe(true);
      expect(approxEqual(d.rotation.x, 0.3)).toBe(true);
      expect(approxEqual(d.rotation.y, 0.7)).toBe(true);
      expect(approxEqual(d.rotation.z, 0.2)).toBe(true);
    });
  });

  describe('computeLocalToWorldMatrix', () => {
    it('returns identity for an empty chain', () => {
      const m = computeLocalToWorldMatrix({});
      expectMatrixClose(m, identityMatrix());
    });

    it('chains object translation through to world', () => {
      const chain: TransformChain = {
        object: {
          translation: { x: 5, y: 0, z: 0 },
          rotation: { x: 0, y: 0, z: 0 },
          scale: { x: 1, y: 1, z: 1 },
        },
      };
      const p = localToWorldPoint(chain, { x: 0, y: 0, z: 0 });
      expect(p.x).toBe(5);
    });

    it('accumulates translations across all levels', () => {
      const chain: TransformChain = {
        object: {
          translation: { x: 1, y: 0, z: 0 },
          rotation: { x: 0, y: 0, z: 0 },
          scale: { x: 1, y: 1, z: 1 },
        },
        room: {
          translation: { x: 2, y: 0, z: 0 },
          rotation: { x: 0, y: 0, z: 0 },
          scale: { x: 1, y: 1, z: 1 },
        },
        monument: {
          translation: { x: 3, y: 0, z: 0 },
          rotation: { x: 0, y: 0, z: 0 },
          scale: { x: 1, y: 1, z: 1 },
        },
        plateau: {
          translation: { x: 4, y: 0, z: 0 },
          rotation: { x: 0, y: 0, z: 0 },
          scale: { x: 1, y: 1, z: 1 },
        },
      };
      const p = localToWorldPoint(chain, { x: 0, y: 0, z: 0 });
      expect(p.x).toBe(10); // 1+2+3+4
    });

    it('applies parent scale to child translation', () => {
      const chain: TransformChain = {
        room: {
          translation: { x: 0, y: 0, z: 0 },
          rotation: { x: 0, y: 0, z: 0 },
          scale: { x: 2, y: 1, z: 1 },
        },
        object: {
          translation: { x: 5, y: 0, z: 0 },
          rotation: { x: 0, y: 0, z: 0 },
          scale: { x: 1, y: 1, z: 1 },
        },
      };
      const p = localToWorldPoint(chain, { x: 0, y: 0, z: 0 });
      expect(p.x).toBe(10); // object translation (5) scaled by room scale (2)
    });
  });

  describe('computeWorldToLocalMatrix', () => {
    it('is the inverse of local-to-world', () => {
      const chain: TransformChain = {
        monument: {
          translation: { x: 100, y: 50, z: 25 },
          rotation: { x: 0, y: 0.5, z: 0 },
          scale: { x: 2, y: 1, z: 1 },
        },
        room: {
          translation: { x: 10, y: 5, z: 0 },
          rotation: { x: 0, y: 0, z: 0 },
          scale: { x: 1, y: 1, z: 1 },
        },
      };
      const worldPoint = localToWorldPoint(chain, { x: 3, y: 2, z: 1 });
      const backToLocal = worldToLocalPoint(chain, worldPoint);
      expect(approxEqual(backToLocal.x, 3, 1e-5)).toBe(true);
      expect(approxEqual(backToLocal.y, 2, 1e-5)).toBe(true);
      expect(approxEqual(backToLocal.z, 1, 1e-5)).toBe(true);
    });
  });

  describe('computeLevelMatrix', () => {
    it('returns identity for the world level with no transforms', () => {
      const m = computeLevelMatrix({}, 'world');
      expectMatrixClose(m, identityMatrix());
    });

    it('accumulates transforms down to the specified level', () => {
      const chain: TransformChain = {
        plateau: {
          translation: { x: 100, y: 0, z: 0 },
          rotation: { x: 0, y: 0, z: 0 },
          scale: { x: 1, y: 1, z: 1 },
        },
        monument: {
          translation: { x: 50, y: 0, z: 0 },
          rotation: { x: 0, y: 0, z: 0 },
          scale: { x: 1, y: 1, z: 1 },
        },
      };
      const monumentMatrix = computeLevelMatrix(chain, 'monument');
      const p = transformPoint(monumentMatrix, { x: 0, y: 0, z: 0 });
      expect(p.x).toBe(150); // plateau(100) + monument(50)
    });
  });

  describe('buildTransformChain', () => {
    it('builds a chain from partial level transforms', () => {
      const chain = buildTransformChain({
        object: {
          translation: { x: 1, y: 2, z: 3 },
          rotation: { x: 0, y: 0, z: 0 },
          scale: { x: 1, y: 1, z: 1 },
        },
      });
      expect(chain.object?.translation.x).toBe(1);
      expect(chain.room).toBeUndefined();
    });
  });

  describe('traverseChainLeafToRoot / traverseChainRootToLeaf', () => {
    it('returns 5 transforms leaf-to-root', () => {
      const chain = buildTransformChain({
        room: {
          translation: { x: 5, y: 0, z: 0 },
          rotation: { x: 0, y: 0, z: 0 },
          scale: { x: 1, y: 1, z: 1 },
        },
      });
      const leafToRoot = traverseChainLeafToRoot(chain);
      expect(leafToRoot).toHaveLength(5);
      // Object is first (identity), room is second (has translation)
      expect(leafToRoot[0]).toEqual(IDENTITY_LOCAL_TRANSFORM);
      expect(leafToRoot[1].translation.x).toBe(5);
    });

    it('returns 5 transforms root-to-leaf', () => {
      const chain = buildTransformChain({
        room: {
          translation: { x: 5, y: 0, z: 0 },
          rotation: { x: 0, y: 0, z: 0 },
          scale: { x: 1, y: 1, z: 1 },
        },
      });
      const rootToLeaf = traverseChainRootToLeaf(chain);
      expect(rootToLeaf).toHaveLength(5);
      // World is first (identity), room is fourth (index 3)
      expect(rootToLeaf[0]).toEqual(IDENTITY_LOCAL_TRANSFORM);
      expect(rootToLeaf[3].translation.x).toBe(5);
    });
  });

  describe('GREAT_PYRAMID_MONUMENT_TRANSFORM', () => {
    it('has zero translation (origin at plateau center)', () => {
      expect(GREAT_PYRAMID_MONUMENT_TRANSFORM.translation.x).toBe(0);
      expect(GREAT_PYRAMID_MONUMENT_TRANSFORM.translation.y).toBe(0);
      expect(GREAT_PYRAMID_MONUMENT_TRANSFORM.translation.z).toBe(0);
    });
  });
});
