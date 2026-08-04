import { describe, it, expect } from 'vitest';
import {
  extractFrustumPlanes,
  isBoxInFrustum,
  frustumCullNodes,
  generateOcclusionHints,
  type BoundingBox,
} from './frustumCulling';
import type { SceneNode } from './sceneGraph';

function makeIdentityMatrix(): number[] {
  return [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
}

function makeNode(id: string, bb?: BoundingBox): SceneNode {
  return {
    id,
    name: id,
    parentId: null,
    localTransform: {
      position: { x: 0, y: 0, z: 0 },
      rotation: { x: 0, y: 0, z: 0 },
      scale: { x: 1, y: 1, z: 1 },
    },
    metadata: bb ? { boundingBox: bb } : {},
    visible: true,
    children: [],
  } as SceneNode;
}

describe('Frustum Culling (M05-T08)', () => {
  describe('extractFrustumPlanes', () => {
    it('extracts 6 planes from identity matrix', () => {
      const frustum = extractFrustumPlanes(makeIdentityMatrix());
      expect(frustum.planes.left).toBeDefined();
      expect(frustum.planes.right).toBeDefined();
      expect(frustum.planes.top).toBeDefined();
      expect(frustum.planes.bottom).toBeDefined();
      expect(frustum.planes.near).toBeDefined();
      expect(frustum.planes.far).toBeDefined();
    });
  });

  describe('isBoxInFrustum', () => {
    it('returns true for box at origin with identity frustum', () => {
      const frustum = extractFrustumPlanes(makeIdentityMatrix());
      const box: BoundingBox = { min: { x: -1, y: -1, z: -1 }, max: { x: 1, y: 1, z: 1 } };
      expect(isBoxInFrustum(box, frustum)).toBe(true);
    });
  });

  describe('frustumCullNodes', () => {
    it('keeps nodes without bounding boxes', () => {
      const nodes = [makeNode('a')];
      const frustum = extractFrustumPlanes(makeIdentityMatrix());
      const { visible, culled } = frustumCullNodes(nodes, frustum);
      expect(visible).toHaveLength(1);
      expect(culled).toHaveLength(0);
    });

    it('separates visible and culled nodes', () => {
      const nodes = [
        makeNode('visible', { min: { x: -1, y: -1, z: -1 }, max: { x: 1, y: 1, z: 1 } }),
        makeNode('also-visible'),
      ];
      const frustum = extractFrustumPlanes(makeIdentityMatrix());
      const { visible } = frustumCullNodes(nodes, frustum);
      expect(visible.length).toBeGreaterThan(0);
    });
  });

  describe('generateOcclusionHints', () => {
    it('generates hints for all nodes', () => {
      const nodes = [
        makeNode('large', { min: { x: 0, y: 0, z: 0 }, max: { x: 20, y: 20, z: 20 } }),
        makeNode('small', { min: { x: 0, y: 0, z: 0 }, max: { x: 1, y: 1, z: 1 } }),
        makeNode('no-bb'),
      ];
      const hints = generateOcclusionHints(nodes);
      expect(hints.size).toBe(3);
      expect(hints.get('large')?.occluder).toBe(true);
      expect(hints.get('small')?.occluder).toBe(false);
    });
  });
});
