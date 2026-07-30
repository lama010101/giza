import { GP_GRAND_GALLERY } from '@db/measurements/great-pyramid-measurements';

export interface CorbelSegment {
  position: [number, number, number];
  size: [number, number, number];
  kind: 'floor' | 'ramp' | 'corbel' | 'ceiling';
}

const SLAB_THICKNESS = 0.2;

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
  segments.push({
    position: [-(gg.centralFloorWidth / 2 + gg.rampWidth / 2), rampY, 0],
    size: [gg.rampWidth, gg.rampHeight, gg.floorLength],
    kind: 'ramp',
  });
  segments.push({
    position: [gg.centralFloorWidth / 2 + gg.rampWidth / 2, rampY, 0],
    size: [gg.rampWidth, gg.rampHeight, gg.floorLength],
    kind: 'ramp',
  });

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
