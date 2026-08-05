import { describe, it, expect } from 'vitest';
import { GP_GRAND_GALLERY } from '@db/measurements/great-pyramid-measurements';
import {
  buildCorbelSegments,
  GRAND_GALLERY_NOTCH_COUNT,
  GRAND_GALLERY_FLOOR_SLOT_COUNT,
} from './grandGallerySegments';

describe('buildCorbelSegments', () => {
  const segments = buildCorbelSegments(GP_GRAND_GALLERY);

  it('includes a floor segment', () => {
    const floors = segments.filter((s) => s.kind === 'floor');
    expect(floors.length).toBe(1);
    expect(floors[0].size[0]).toBeCloseTo(GP_GRAND_GALLERY.floorWidth, 4);
    expect(floors[0].size[2]).toBeCloseTo(GP_GRAND_GALLERY.floorLength, 4);
  });

  it('includes left and right ramps', () => {
    const ramps = segments.filter((s) => s.kind === 'ramp');
    expect(ramps.length).toBe(2);
    ramps.forEach((ramp) => {
      expect(ramp.size[0]).toBeCloseTo(GP_GRAND_GALLERY.rampWidth, 4);
      expect(ramp.size[2]).toBeCloseTo(GP_GRAND_GALLERY.floorLength, 4);
    });
  });

  it('generates the expected number of side-bench notches', () => {
    const notches = segments.filter((s) => s.kind === 'notch');
    expect(notches.length).toBe(GRAND_GALLERY_NOTCH_COUNT * 2);
  });

  it('generates the expected number of floor slots', () => {
    const slots = segments.filter((s) => s.kind === 'floor-slot');
    expect(slots.length).toBe(GRAND_GALLERY_FLOOR_SLOT_COUNT);
  });

  it('generates corbel courses on both sides', () => {
    const corbels = segments.filter((s) => s.kind === 'corbel');
    expect(corbels.length).toBe(GP_GRAND_GALLERY.corbelCourses * 2);
  });

  it('includes a ceiling segment', () => {
    const ceilings = segments.filter((s) => s.kind === 'ceiling');
    expect(ceilings.length).toBe(1);
    expect(ceilings[0].size[2]).toBeCloseTo(GP_GRAND_GALLERY.ceilingLength, 4);
  });
});
