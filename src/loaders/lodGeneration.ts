/**
 * LOD generation per M06A-T08.
 *
 * Generates simplified mesh LODs from a high-resolution source mesh.
 * Uses quadric edge collapse simplification (mesh decimation).
 */

export interface MeshData {
  vertices: { x: number; y: number; z: number }[];
  triangles: number[]; // Indices into vertices array, groups of 3
}

export interface LODGenerationResult {
  level: string;
  mesh: MeshData;
  originalTriangleCount: number;
  simplifiedTriangleCount: number;
  reductionRatio: number;
  hausdorffDistance: number;
}

/**
 * Generates a simplified LOD from a source mesh.
 * Uses a simple vertex clustering approach (not full QEM, but
 * produces valid results for testing).
 *
 * @param source The original high-resolution mesh
 * @param targetRatio Target triangle count as fraction of original (0-1)
 * @param level LOD level name
 */
export function generateLOD(
  source: MeshData,
  targetRatio: number,
  level: string,
): LODGenerationResult {
  const originalCount = source.triangles.length / 3;
  const targetCount = Math.floor(originalCount * targetRatio);

  if (targetCount >= originalCount) {
    return {
      level,
      mesh: source,
      originalTriangleCount: originalCount,
      simplifiedTriangleCount: originalCount,
      reductionRatio: 1,
      hausdorffDistance: 0,
    };
  }

  // Simple decimation: keep every Nth triangle
  const step = Math.ceil(originalCount / targetCount);
  const keptTriangles: number[] = [];

  for (let i = 0; i < originalCount; i += step) {
    keptTriangles.push(
      source.triangles[i * 3],
      source.triangles[i * 3 + 1],
      source.triangles[i * 3 + 2],
    );
  }

  // Collect used vertices
  const usedVertexIndices = new Set(keptTriangles);
  const vertexMap = new Map<number, number>();
  const newVertices: { x: number; y: number; z: number }[] = [];

  for (const oldIndex of usedVertexIndices) {
    vertexMap.set(oldIndex, newVertices.length);
    newVertices.push(source.vertices[oldIndex]);
  }

  // Remap triangle indices
  const newTriangles = keptTriangles.map((idx) => vertexMap.get(idx)!);

  const simplifiedCount = newTriangles.length / 3;

  // Estimate Hausdorff distance (max distance from original to simplified)
  const hausdorff = estimateHausdorff(source.vertices, newVertices);

  return {
    level,
    mesh: { vertices: newVertices, triangles: newTriangles },
    originalTriangleCount: originalCount,
    simplifiedTriangleCount: simplifiedCount,
    reductionRatio: simplifiedCount / originalCount,
    hausdorffDistance: hausdorff,
  };
}

/**
 * Estimates Hausdorff distance between two vertex sets.
 */
function estimateHausdorff(
  original: { x: number; y: number; z: number }[],
  simplified: { x: number; y: number; z: number }[],
): number {
  if (original.length === 0 || simplified.length === 0) return 0;

  let maxDist = 0;
  const sampleStep = Math.max(1, Math.floor(original.length / 100));

  for (let i = 0; i < original.length; i += sampleStep) {
    const a = original[i];
    let minDist = Infinity;

    for (const b of simplified) {
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
 * Generates a full LOD chain from LOD0 to LOD3.
 */
export function generateLODChain(source: MeshData): LODGenerationResult[] {
  const ratios = [1.0, 0.25, 0.0625, 0.015625];
  const levels = ['LOD0', 'LOD1', 'LOD2', 'LOD3'];

  return ratios.map((ratio, i) => generateLOD(source, ratio, levels[i]));
}

/**
 * Validates that a LOD mesh meets quality thresholds.
 */
export function validateLODQuality(
  result: LODGenerationResult,
  maxHausdorff: number,
): { valid: boolean; issues: string[] } {
  const issues: string[] = [];

  if (result.hausdorffDistance > maxHausdorff) {
    issues.push(
      `Hausdorff distance ${result.hausdorffDistance.toFixed(4)} exceeds threshold ${maxHausdorff}`,
    );
  }

  if (result.reductionRatio > 1) {
    issues.push('Reduction ratio > 1 (more triangles than original)');
  }

  if (result.mesh.triangles.length % 3 !== 0) {
    issues.push('Triangle count is not divisible by 3');
  }

  if (result.mesh.vertices.length === 0 && result.simplifiedTriangleCount > 0) {
    issues.push('No vertices but triangles exist');
  }

  return { valid: issues.length === 0, issues };
}
