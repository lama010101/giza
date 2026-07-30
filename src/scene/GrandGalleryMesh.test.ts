import { describe, it, expect } from 'vitest';
import { buildCorbelSegments } from './GrandGalleryMesh';
import { GP_GRAND_GALLERY } from '@db/measurements/great-pyramid-measurements';

describe('Grand Gallery Corbel Vault Geometry', () => {
  const segments = buildCorbelSegments(GP_GRAND_GALLERY);

  it('produces correct total segment count', () => {
    const expected =
      1 + // floor
      2 + // left + right ramp
      GP_GRAND_GALLERY.corbelCourses * 2 + // left + right per course
      1; // ceiling
    expect(segments.length).toBe(expected);
  });

  it('floor segment spans full floor width and length', () => {
    const floor = segments.find((s) => s.kind === 'floor');
    expect(floor).toBeDefined();
    expect(floor!.size[0]).toBeCloseTo(GP_GRAND_GALLERY.floorWidth, 2);
    expect(floor!.size[2]).toBeCloseTo(GP_GRAND_GALLERY.floorLength, 1);
  });

  it('ceiling segment spans top width and ceiling length', () => {
    const ceiling = segments.find((s) => s.kind === 'ceiling');
    expect(ceiling).toBeDefined();
    expect(ceiling!.size[0]).toBeCloseTo(GP_GRAND_GALLERY.topWidth, 2);
    expect(ceiling!.size[2]).toBeCloseTo(GP_GRAND_GALLERY.ceilingLength, 1);
  });

  it('ramp segments have correct dimensions', () => {
    const ramps = segments.filter((s) => s.kind === 'ramp');
    expect(ramps.length).toBe(2);
    for (const ramp of ramps) {
      expect(ramp.size[0]).toBeCloseTo(GP_GRAND_GALLERY.rampWidth, 2);
      expect(ramp.size[1]).toBeCloseTo(GP_GRAND_GALLERY.rampHeight, 2);
      expect(ramp.size[2]).toBeCloseTo(GP_GRAND_GALLERY.floorLength, 1);
    }
  });

  it('ramps are symmetric about x=0', () => {
    const ramps = segments.filter((s) => s.kind === 'ramp');
    expect(ramps[0].position[0]).toBeCloseTo(-ramps[1].position[0], 4);
  });

  it('ramps flank the central floor passage', () => {
    const ramps = segments.filter((s) => s.kind === 'ramp');
    const expectedX = GP_GRAND_GALLERY.centralFloorWidth / 2 + GP_GRAND_GALLERY.rampWidth / 2;
    expect(Math.abs(ramps[0].position[0])).toBeCloseTo(expectedX, 2);
    expect(Math.abs(ramps[1].position[0])).toBeCloseTo(expectedX, 2);
  });

  it('corbel segments narrow progressively from floor to ceiling', () => {
    const corbels = segments.filter((s) => s.kind === 'corbel');
    expect(corbels.length).toBe(GP_GRAND_GALLERY.corbelCourses * 2);

    const halfHeight = GP_GRAND_GALLERY.height / 2;
    const courseHeight =
      (GP_GRAND_GALLERY.height - GP_GRAND_GALLERY.rampHeight) / GP_GRAND_GALLERY.corbelCourses;

    for (let i = 0; i < GP_GRAND_GALLERY.corbelCourses; i++) {
      const leftCorbel = corbels[i * 2];
      const rightCorbel = corbels[i * 2 + 1];

      const innerHalfWidth =
        GP_GRAND_GALLERY.floorWidth / 2 - (i + 1) * GP_GRAND_GALLERY.corbelProjection;

      expect(leftCorbel.position[0]).toBeCloseTo(
        -(innerHalfWidth + GP_GRAND_GALLERY.corbelProjection / 2),
        4,
      );
      expect(rightCorbel.position[0]).toBeCloseTo(
        innerHalfWidth + GP_GRAND_GALLERY.corbelProjection / 2,
        4,
      );

      const expectedY = -halfHeight + GP_GRAND_GALLERY.rampHeight + (i + 0.5) * courseHeight;
      expect(leftCorbel.position[1]).toBeCloseTo(expectedY, 4);
      expect(rightCorbel.position[1]).toBeCloseTo(expectedY, 4);

      expect(leftCorbel.size[0]).toBeCloseTo(GP_GRAND_GALLERY.corbelProjection, 4);
      expect(rightCorbel.size[0]).toBeCloseTo(GP_GRAND_GALLERY.corbelProjection, 4);
      expect(leftCorbel.size[1]).toBeCloseTo(courseHeight, 4);
      expect(rightCorbel.size[1]).toBeCloseTo(courseHeight, 4);
    }
  });

  it('top corbel course inner width matches topWidth', () => {
    const corbels = segments.filter((s) => s.kind === 'corbel');
    const lastCourseIndex = GP_GRAND_GALLERY.corbelCourses - 1;
    const lastLeft = corbels[lastCourseIndex * 2];
    const lastRight = corbels[lastCourseIndex * 2 + 1];

    const innerWidth =
      lastRight.position[0] - lastLeft.position[0] - GP_GRAND_GALLERY.corbelProjection;
    expect(innerWidth).toBeCloseTo(GP_GRAND_GALLERY.topWidth, 2);
  });

  it('corbel courses stack from rampHeight to full height', () => {
    const corbels = segments.filter((s) => s.kind === 'corbel');
    const halfHeight = GP_GRAND_GALLERY.height / 2;
    const courseHeight =
      (GP_GRAND_GALLERY.height - GP_GRAND_GALLERY.rampHeight) / GP_GRAND_GALLERY.corbelCourses;

    const firstCourseBottom = corbels[0].position[1] - courseHeight / 2;
    const lastCourseTop = corbels[corbels.length - 2].position[1] + courseHeight / 2;

    expect(firstCourseBottom).toBeCloseTo(-halfHeight + GP_GRAND_GALLERY.rampHeight, 4);
    expect(lastCourseTop).toBeCloseTo(halfHeight, 4);
  });

  it('all segments span the full floor length in Z', () => {
    for (const seg of segments) {
      if (seg.kind === 'ceiling') {
        expect(seg.size[2]).toBeCloseTo(GP_GRAND_GALLERY.ceilingLength, 1);
      } else {
        expect(seg.size[2]).toBeCloseTo(GP_GRAND_GALLERY.floorLength, 1);
      }
    }
  });

  it('corbel projection produces correct narrowing', () => {
    const gg = GP_GRAND_GALLERY;
    const expectedTopWidth = gg.floorWidth - 2 * gg.corbelCourses * gg.corbelProjection;
    expect(expectedTopWidth).toBeCloseTo(gg.topWidth, 2);
  });

  it('floor width equals central passage plus two ramps', () => {
    const gg = GP_GRAND_GALLERY;
    expect(gg.centralFloorWidth + 2 * gg.rampWidth).toBeCloseTo(gg.floorWidth, 2);
  });
});
