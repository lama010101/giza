/**
 * LOD manager with Hausdorff distance thresholds per M05-T07.
 *
 * Selects LOD level based on Hausdorff distance between the original
 * mesh and the simplified mesh. The Hausdorff distance measures the
 * maximum deviation between two surfaces.
 */

export type LODLevel = 'LOD0' | 'LOD1' | 'LOD2' | 'LOD3';

export interface LODThreshold {
  level: LODLevel;
  maxHausdorffDistance: number; // in meters
  maxTriangleRatio: number; // fraction of LOD0 triangles
  screenSpaceError: number; // pixels
}

export const LOD_THRESHOLDS: LODThreshold[] = [
  {
    level: 'LOD0',
    maxHausdorffDistance: 0,
    maxTriangleRatio: 1.0,
    screenSpaceError: 0,
  },
  {
    level: 'LOD1',
    maxHausdorffDistance: 0.01, // 1cm
    maxTriangleRatio: 0.25,
    screenSpaceError: 2,
  },
  {
    level: 'LOD2',
    maxHausdorffDistance: 0.05, // 5cm
    maxTriangleRatio: 0.0625,
    screenSpaceError: 8,
  },
  {
    level: 'LOD3',
    maxHausdorffDistance: 0.2, // 20cm
    maxTriangleRatio: 0.015625,
    screenSpaceError: 32,
  },
];

export interface LODSelection {
  level: LODLevel;
  threshold: LODThreshold;
  distance: number;
  screenSpaceError: number;
}

/**
 * Computes the Hausdorff distance between two point sets.
 * This is the maximum minimum distance from any point in set A
 * to the closest point in set B.
 */
export function hausdorffDistance(
  pointsA: { x: number; y: number; z: number }[],
  pointsB: { x: number; y: number; z: number }[],
): number {
  if (pointsA.length === 0 || pointsB.length === 0) return 0;

  let maxDist = 0;

  for (const a of pointsA) {
    let minDist = Infinity;
    for (const b of pointsB) {
      const dx = a.x - b.x;
      const dy = a.y - b.y;
      const dz = a.z - b.z;
      const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
      if (dist < minDist) minDist = dist;
    }
    if (minDist > maxDist) maxDist = minDist;
  }

  return maxDist;
}

/**
 * Selects the appropriate LOD level based on distance and screen space error.
 */
export function selectLODLevel(distance: number, screenSize: number, pixelError = 1): LODSelection {
  // Compute screen space error based on distance and screen size
  const sse = (distance * pixelError) / screenSize;

  // Find the highest LOD (lowest number) that satisfies the threshold
  for (const threshold of LOD_THRESHOLDS) {
    // LOD0 (screenSpaceError=0) is for very close objects (sse < 1 pixel)
    if (threshold.screenSpaceError === 0) {
      if (sse < 1) {
        return { level: threshold.level, threshold, distance, screenSpaceError: sse };
      }
      continue;
    }
    if (sse <= threshold.screenSpaceError) {
      return {
        level: threshold.level,
        threshold,
        distance,
        screenSpaceError: sse,
      };
    }
  }

  // Fall back to lowest LOD
  const last = LOD_THRESHOLDS[LOD_THRESHOLDS.length - 1];
  return {
    level: last.level,
    threshold: last,
    distance,
    screenSpaceError: sse,
  };
}

/**
 * Returns the target triangle count for a LOD level.
 */
export function getTargetTriangleCount(lod0Triangles: number, level: LODLevel): number {
  const threshold = LOD_THRESHOLDS.find((t) => t.level === level);
  if (!threshold) return lod0Triangles;
  return Math.floor(lod0Triangles * threshold.maxTriangleRatio);
}

/**
 * Returns true if a mesh simplification meets the Hausdorff threshold.
 */
export function meetsHausdorffThreshold(hausdorffDist: number, level: LODLevel): boolean {
  const threshold = LOD_THRESHOLDS.find((t) => t.level === level);
  if (!threshold) return false;
  return hausdorffDist <= threshold.maxHausdorffDistance;
}

/**
 * Returns all LOD thresholds.
 */
export function getLODThresholds(): LODThreshold[] {
  return [...LOD_THRESHOLDS];
}
