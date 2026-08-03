import { describe, it, expect } from 'vitest';
import { buildKingsChamberSegments } from './kingsChamberSegments';
import { GP_KINGS_CHAMBER } from '@db/measurements/great-pyramid-measurements';

describe("King's Chamber interior detail", () => {
  const segments = buildKingsChamberSegments(
    GP_KINGS_CHAMBER.width,
    GP_KINGS_CHAMBER.height,
    GP_KINGS_CHAMBER.depth,
  );

  it('renders a chamber shell', () => {
    const shell = segments.find((s) => s.kind === 'shell');
    expect(shell).toBeDefined();
    expect(shell!.size[0]).toBeCloseTo(GP_KINGS_CHAMBER.width, 4);
    expect(shell!.size[1]).toBeCloseTo(GP_KINGS_CHAMBER.height, 4);
    expect(shell!.size[2]).toBeCloseTo(GP_KINGS_CHAMBER.depth, 4);
  });

  it('renders floor and ceiling slabs', () => {
    const slabs = segments.filter((s) => s.kind === 'slab');
    expect(slabs.length).toBe(2);
    for (const slab of slabs) {
      expect(slab.size[0]).toBeLessThan(GP_KINGS_CHAMBER.width);
      expect(slab.size[2]).toBeLessThan(GP_KINGS_CHAMBER.depth);
    }
  });

  it('renders four inner wall slabs', () => {
    const walls = segments.filter((s) => s.kind === 'wall');
    expect(walls.length).toBe(4);
  });

  it('renders horizontal and vertical course joints', () => {
    const joints = segments.filter((s) => s.kind === 'joint');
    expect(joints.length).toBeGreaterThan(0);
  });

  it('renders stress fractures', () => {
    const fractures = segments.filter((s) => s.kind === 'fracture');
    expect(fractures.length).toBe(2);
  });

  it('renders north and south shaft entrance markers', () => {
    const markers = segments.filter((s) => s.kind === 'shaft-marker');
    expect(markers.length).toBe(2);
    expect(markers[0].position[2]).toBeCloseTo(-markers[1].position[2], 4);
  });
});
