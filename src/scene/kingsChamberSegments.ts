export interface KingsChamberSegment {
  position: [number, number, number];
  rotation?: [number, number, number];
  size: [number, number, number];
  kind: 'shell' | 'slab' | 'wall' | 'joint' | 'fracture' | 'shaft-marker';
}

const SLAB_THICKNESS = 0.1;
const WALL_THICKNESS = 0.05;
const INSET = 0.02;
const JOINT_THICKNESS = 0.015;
const WALL_COURSES = 5;

export function buildKingsChamberSegments(
  width: number,
  height: number,
  depth: number,
): KingsChamberSegment[] {
  const halfWidth = width / 2;
  const halfHeight = height / 2;
  const halfDepth = depth / 2;

  const segments: KingsChamberSegment[] = [];

  // Translucent outer shell
  segments.push({
    position: [0, 0, 0],
    size: [width, height, depth],
    kind: 'shell',
  });

  // Floor and ceiling slabs
  segments.push({
    position: [0, -halfHeight + SLAB_THICKNESS / 2 + INSET, 0],
    size: [width - 2 * INSET, SLAB_THICKNESS, depth - 2 * INSET],
    kind: 'slab',
  });
  segments.push({
    position: [0, halfHeight - SLAB_THICKNESS / 2 - INSET, 0],
    size: [width - 2 * INSET, SLAB_THICKNESS, depth - 2 * INSET],
    kind: 'slab',
  });

  // Inner wall slabs (polished granite facing)
  segments.push({
    position: [0, 0, -halfDepth + WALL_THICKNESS / 2 + INSET],
    size: [width - 2 * INSET, height - 2 * INSET, WALL_THICKNESS],
    kind: 'wall',
  });
  segments.push({
    position: [0, 0, halfDepth - WALL_THICKNESS / 2 - INSET],
    size: [width - 2 * INSET, height - 2 * INSET, WALL_THICKNESS],
    kind: 'wall',
  });
  segments.push({
    position: [-halfWidth + WALL_THICKNESS / 2 + INSET, 0, 0],
    size: [WALL_THICKNESS, height - 2 * INSET, depth - 2 * INSET],
    kind: 'wall',
  });
  segments.push({
    position: [halfWidth - WALL_THICKNESS / 2 - INSET, 0, 0],
    size: [WALL_THICKNESS, height - 2 * INSET, depth - 2 * INSET],
    kind: 'wall',
  });

  // Horizontal course joints on all four walls
  const courseHeight = (height - 2 * INSET) / WALL_COURSES;
  for (let i = 1; i < WALL_COURSES; i += 1) {
    const y = -halfHeight + INSET + i * courseHeight;
    // North and south walls
    segments.push({
      position: [0, y, -halfDepth + WALL_THICKNESS / 2 + INSET],
      size: [width - 2 * INSET, JOINT_THICKNESS, JOINT_THICKNESS],
      kind: 'joint',
    });
    segments.push({
      position: [0, y, halfDepth - WALL_THICKNESS / 2 - INSET],
      size: [width - 2 * INSET, JOINT_THICKNESS, JOINT_THICKNESS],
      kind: 'joint',
    });
    // East and west walls
    segments.push({
      position: [-halfWidth + WALL_THICKNESS / 2 + INSET, y, 0],
      size: [JOINT_THICKNESS, JOINT_THICKNESS, depth - 2 * INSET],
      kind: 'joint',
    });
    segments.push({
      position: [halfWidth - WALL_THICKNESS / 2 - INSET, y, 0],
      size: [JOINT_THICKNESS, JOINT_THICKNESS, depth - 2 * INSET],
      kind: 'joint',
    });
  }

  // Vertical joints (two per wall)
  const verticalJointCount = 2;
  for (let i = 1; i <= verticalJointCount; i += 1) {
    const xOffset = (width - 2 * INSET) * (i / (verticalJointCount + 1)) - (width - 2 * INSET) / 2;
    const zOffset = (depth - 2 * INSET) * (i / (verticalJointCount + 1)) - (depth - 2 * INSET) / 2;
    // North and south walls (vertical in x direction)
    segments.push({
      position: [xOffset, 0, -halfDepth + WALL_THICKNESS / 2 + INSET],
      size: [JOINT_THICKNESS, height - 2 * INSET, JOINT_THICKNESS],
      kind: 'joint',
    });
    segments.push({
      position: [xOffset, 0, halfDepth - WALL_THICKNESS / 2 - INSET],
      size: [JOINT_THICKNESS, height - 2 * INSET, JOINT_THICKNESS],
      kind: 'joint',
    });
    // East and west walls (vertical in z direction)
    segments.push({
      position: [-halfWidth + WALL_THICKNESS / 2 + INSET, 0, zOffset],
      size: [JOINT_THICKNESS, height - 2 * INSET, JOINT_THICKNESS],
      kind: 'joint',
    });
    segments.push({
      position: [halfWidth - WALL_THICKNESS / 2 - INSET, 0, zOffset],
      size: [JOINT_THICKNESS, height - 2 * INSET, JOINT_THICKNESS],
      kind: 'joint',
    });
  }

  // Stress fractures: one diagonal on the ceiling, one on the west wall
  const ceilingDiagonal = Math.sqrt(width * width + depth * depth) * 0.9;
  segments.push({
    position: [0, halfHeight - SLAB_THICKNESS / 2 - INSET - 0.01, 0],
    rotation: [0, Math.PI / 4, 0],
    size: [ceilingDiagonal, JOINT_THICKNESS, JOINT_THICKNESS],
    kind: 'fracture',
  });

  const wallDiagonal = Math.sqrt(height * height + depth * depth) * 0.7;
  segments.push({
    position: [-halfWidth + WALL_THICKNESS / 2 + INSET + 0.01, 0.2, 0],
    rotation: [Math.PI / 6, 0, 0],
    size: [JOINT_THICKNESS, JOINT_THICKNESS, wallDiagonal],
    kind: 'fracture',
  });

  // Shaft entrance markers on north and south walls near ceiling
  const shaftMarkerSize = 0.25;
  const shaftY = halfHeight - 0.4;
  const shaftZ = halfDepth - WALL_THICKNESS / 2 - INSET - 0.01;
  segments.push({
    position: [0, shaftY, -shaftZ],
    size: [shaftMarkerSize, shaftMarkerSize, 0.04],
    kind: 'shaft-marker',
  });
  segments.push({
    position: [0, shaftY, shaftZ],
    size: [shaftMarkerSize, shaftMarkerSize, 0.04],
    kind: 'shaft-marker',
  });

  return segments;
}
