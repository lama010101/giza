export interface QueensChamberSegment {
  position: [number, number, number];
  rotation?: [number, number, number];
  size: [number, number, number];
  kind: 'shell' | 'gable' | 'shaft-marker' | 'dixon-vent';
}

const ROOF_THICKNESS = 0.08;
const SHAFT_SIZE = 0.21;
const SHAFT_DEPTH = 0.04;
const INSET = 0.02;

export function buildQueensChamberSegments(
  width: number,
  height: number,
  depth: number,
): QueensChamberSegment[] {
  const halfWidth = width / 2;
  const halfHeight = height / 2;
  const halfDepth = depth / 2;

  const segments: QueensChamberSegment[] = [];

  // Translucent outer shell
  segments.push({
    position: [0, 0, 0],
    size: [width, height, depth],
    kind: 'shell',
  });

  // Gabled roof: two thin sloped panels meeting at the apex, ridge along Z
  const slopeLength = Math.sqrt(halfWidth * halfWidth + height * height);
  const theta = Math.atan2(height, halfWidth);

  segments.push({
    position: [-halfWidth / 2, 0, 0],
    rotation: [0, 0, theta],
    size: [slopeLength, ROOF_THICKNESS, depth],
    kind: 'gable',
  });
  segments.push({
    position: [halfWidth / 2, 0, 0],
    rotation: [0, 0, -theta],
    size: [slopeLength, ROOF_THICKNESS, depth],
    kind: 'gable',
  });

  // Shaft openings in north and south walls, inferred ~1.6 m above floor
  // and slightly west of centre (distance from eastern wall ~2.9 m)
  const shaftY = -halfHeight + 1.6;
  const shaftX = -0.3;
  const shaftZ = halfDepth - SHAFT_DEPTH / 2 - INSET;

  segments.push({
    position: [shaftX, shaftY, -shaftZ],
    size: [SHAFT_SIZE, SHAFT_SIZE, SHAFT_DEPTH],
    kind: 'shaft-marker',
  });
  segments.push({
    position: [shaftX, shaftY, shaftZ],
    size: [SHAFT_SIZE, SHAFT_SIZE, SHAFT_DEPTH],
    kind: 'shaft-marker',
  });

  // 1872 Dixon vent hole — the exploratory breach in the south wall that
  // revealed the southern shaft; shown just east of the shaft opening.
  segments.push({
    position: [shaftX + 0.45, shaftY, shaftZ],
    size: [0.18, 0.18, SHAFT_DEPTH],
    kind: 'dixon-vent',
  });

  return segments;
}
