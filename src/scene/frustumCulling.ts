/**
 * Frustum culling and occlusion hints per M05-T08.
 *
 * Provides frustum culling using 6-plane extraction from a
 * projection-view matrix, and occlusion hint generation for
 * the render pipeline.
 */

import type { SceneNode } from './sceneGraph';

export interface Plane {
  normal: { x: number; y: number; z: number };
  distance: number;
}

export interface BoundingBox {
  min: { x: number; y: number; z: number };
  max: { x: number; y: number; z: number };
}

export type FrustumSide = 'left' | 'right' | 'top' | 'bottom' | 'near' | 'far';

export interface Frustum {
  planes: Record<FrustumSide, Plane>;
}

/**
 * Extracts 6 frustum planes from a projection-view matrix.
 * The matrix is a 4x4 matrix in column-major order.
 */
export function extractFrustumPlanes(matrix: number[]): Frustum {
  // Matrix elements (column-major)
  const m = matrix;
  const planes = {
    left: {
      normal: { x: m[3] + m[0], y: m[7] + m[4], z: m[11] + m[8] },
      distance: m[15] + m[12],
    },
    right: {
      normal: { x: m[3] - m[0], y: m[7] - m[4], z: m[11] - m[8] },
      distance: m[15] - m[12],
    },
    top: {
      normal: { x: m[3] - m[1], y: m[7] - m[5], z: m[11] - m[9] },
      distance: m[15] - m[13],
    },
    bottom: {
      normal: { x: m[3] + m[1], y: m[7] + m[5], z: m[11] + m[9] },
      distance: m[15] + m[13],
    },
    near: {
      normal: { x: m[3] + m[2], y: m[7] + m[6], z: m[11] + m[10] },
      distance: m[15] + m[14],
    },
    far: {
      normal: { x: m[3] - m[2], y: m[7] - m[6], z: m[11] - m[10] },
      distance: m[15] - m[14],
    },
  };

  // Normalize planes
  for (const plane of Object.values(planes)) {
    const len = Math.sqrt(
      plane.normal.x * plane.normal.x +
        plane.normal.y * plane.normal.y +
        plane.normal.z * plane.normal.z,
    );
    if (len > 0) {
      plane.normal.x /= len;
      plane.normal.y /= len;
      plane.normal.z /= len;
      plane.distance /= len;
    }
  }

  return { planes };
}

/**
 * Tests if a bounding box is inside or intersects the frustum.
 */
export function isBoxInFrustum(box: BoundingBox, frustum: Frustum): boolean {
  for (const plane of Object.values(frustum.planes)) {
    // Find the positive vertex (the one furthest in the direction of the normal)
    const px = plane.normal.x >= 0 ? box.max.x : box.min.x;
    const py = plane.normal.y >= 0 ? box.max.y : box.min.y;
    const pz = plane.normal.z >= 0 ? box.max.z : box.min.z;

    const distance =
      plane.normal.x * px + plane.normal.y * py + plane.normal.z * pz + plane.distance;

    if (distance < 0) return false; // Box is entirely behind this plane
  }

  return true;
}

/**
 * Culls nodes that are outside the frustum.
 */
export function frustumCullNodes(
  nodes: SceneNode[],
  frustum: Frustum,
): { visible: SceneNode[]; culled: SceneNode[] } {
  const visible: SceneNode[] = [];
  const culled: SceneNode[] = [];

  for (const node of nodes) {
    const bb = node.metadata.boundingBox;
    if (!bb) {
      // No bounding box = always visible
      visible.push(node);
      continue;
    }

    if (isBoxInFrustum(bb, frustum)) {
      visible.push(node);
    } else {
      culled.push(node);
    }
  }

  return { visible, culled };
}

export interface OcclusionHint {
  nodeId: string;
  occluder: boolean; // Can this node occlude others?
  occludee: boolean; // Can this node be occluded?
  priority: number; // Higher = more likely to be occluded
}

/**
 * Generates occlusion hints for the render pipeline.
 * Large, opaque nodes are occluders. Small or transparent nodes are occludees.
 */
export function generateOcclusionHints(nodes: SceneNode[]): Map<string, OcclusionHint> {
  const hints = new Map<string, OcclusionHint>();

  for (const node of nodes) {
    const bb = node.metadata.boundingBox;
    if (!bb) {
      hints.set(node.id, {
        nodeId: node.id,
        occluder: false,
        occludee: true,
        priority: 0,
      });
      continue;
    }

    const size = (bb.max.x - bb.min.x) * (bb.max.y - bb.min.y) * (bb.max.z - bb.min.z);

    hints.set(node.id, {
      nodeId: node.id,
      occluder: size > 10, // Large objects are occluders
      occludee: size < 100, // Small objects can be occluded
      priority: Math.min(1 / size, 1),
    });
  }

  return hints;
}
