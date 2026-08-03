import { GP_GRAND_GALLERY } from '@db/measurements/great-pyramid-measurements';

export interface CorbelSegment {
  position: [number, number, number];
  size: [number, number, number];
  kind: 'floor' | 'ramp' | 'corbel' | 'ceiling' | 'notch' | 'floor-slot';
}

export const GRAND_GALLERY_NOTCH_COUNT = 25;
export const GRAND_GALLERY_FLOOR_SLOT_COUNT = 4;

const SLAB_THICKNESS = 0.2;
const NOTCH_WIDTH = 0.08;
const NOTCH_HEIGHT = 0.15;
const NOTCH_DEPTH = 0.06;
const NOTCH_TOP_OFFSET = 0.05;
const FLOOR_SLOT_WIDTH = 0.12;
const FLOOR_SLOT_DEPTH = 0.04;

export function buildCorbelSegments(gg: typeof GP_GRAND_GALLERY): CorbelSegment[] {
  const halfHeight = gg.height / 2;
  const courseHeight = (gg.height - gg.rampHeight) / gg.corbelCourses;
  const segments: CorbelSegment[] = [];

  segments.push({
    position: [0, -halfHeight, 0],
    size: [gg.floorWidth, SLAB_THICKNESS, gg.floorLength],
    kind: 'floor',
  });

  const rampY = -halfHeight + gg.rampHeight / 2;
  const leftRampX = -(gg.centralFloorWidth / 2 + gg.rampWidth / 2);
  const rightRampX = gg.centralFloorWidth / 2 + gg.rampWidth / 2;
  segments.push({
    position: [leftRampX, rampY, 0],
    size: [gg.rampWidth, gg.rampHeight, gg.floorLength],
    kind: 'ramp',
  });
  segments.push({
    position: [rightRampX, rampY, 0],
    size: [gg.rampWidth, gg.rampHeight, gg.floorLength],
    kind: 'ramp',
  });

  // Regular side-bench notches (inferred count and dimensions; visual placeholders)
  const notchY = -halfHeight + gg.rampHeight - NOTCH_TOP_OFFSET - NOTCH_HEIGHT / 2;
  const notchSpacing = gg.floorLength / (GRAND_GALLERY_NOTCH_COUNT + 1);
  for (let i = 0; i < GRAND_GALLERY_NOTCH_COUNT; i++) {
    const z = -gg.floorLength / 2 + (i + 1) * notchSpacing;
    // Left bench notches
    segments.push({
      position: [leftRampX + gg.rampWidth / 2 - NOTCH_DEPTH / 2, notchY, z],
      size: [NOTCH_DEPTH, NOTCH_HEIGHT, NOTCH_WIDTH],
      kind: 'notch',
    });
    // Right bench notches
    segments.push({
      position: [rightRampX - gg.rampWidth / 2 + NOTCH_DEPTH / 2, notchY, z],
      size: [NOTCH_DEPTH, NOTCH_HEIGHT, NOTCH_WIDTH],
      kind: 'notch',
    });
  }

  // Floor ramp slots (transverse recesses in the central floor, inferred)
  const floorSlotZSpacing = gg.floorLength / (GRAND_GALLERY_FLOOR_SLOT_COUNT + 1);
  const floorSlotY = -halfHeight + SLAB_THICKNESS / 2 + FLOOR_SLOT_DEPTH / 2 + 0.005;
  for (let i = 0; i < GRAND_GALLERY_FLOOR_SLOT_COUNT; i++) {
    const z = -gg.floorLength / 2 + (i + 1) * floorSlotZSpacing;
    segments.push({
      position: [0, floorSlotY, z],
      size: [gg.centralFloorWidth * 0.6, FLOOR_SLOT_DEPTH, FLOOR_SLOT_WIDTH],
      kind: 'floor-slot',
    });
  }

  for (let i = 0; i < gg.corbelCourses; i++) {
    const innerHalfWidth = gg.floorWidth / 2 - (i + 1) * gg.corbelProjection;
    const yCenter = -halfHeight + gg.rampHeight + (i + 0.5) * courseHeight;
    const wallThickness = gg.corbelProjection;

    segments.push({
      position: [-(innerHalfWidth + wallThickness / 2), yCenter, 0],
      size: [wallThickness, courseHeight, gg.floorLength],
      kind: 'corbel',
    });
    segments.push({
      position: [innerHalfWidth + wallThickness / 2, yCenter, 0],
      size: [wallThickness, courseHeight, gg.floorLength],
      kind: 'corbel',
    });
  }

  segments.push({
    position: [0, halfHeight, 0],
    size: [gg.topWidth, SLAB_THICKNESS, gg.ceilingLength],
    kind: 'ceiling',
  });

  return segments;
}
