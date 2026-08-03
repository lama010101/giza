import { describe, it, expect } from 'vitest';
import { buildQueensChamberSegments } from './queensChamberSegments';
import { GP_QUEENS_CHAMBER } from '@db/measurements/great-pyramid-measurements';

describe("Queen's Chamber interior detail", () => {
  const segments = buildQueensChamberSegments(
    GP_QUEENS_CHAMBER.width,
    GP_QUEENS_CHAMBER.height,
    GP_QUEENS_CHAMBER.depth,
  );

  it('renders a chamber shell', () => {
    const shell = segments.find((s) => s.kind === 'shell');
    expect(shell).toBeDefined();
    expect(shell!.size[0]).toBeCloseTo(GP_QUEENS_CHAMBER.width, 4);
    expect(shell!.size[1]).toBeCloseTo(GP_QUEENS_CHAMBER.height, 4);
    expect(shell!.size[2]).toBeCloseTo(GP_QUEENS_CHAMBER.depth, 4);
  });

  it('renders two gable roof panels', () => {
    const gables = segments.filter((s) => s.kind === 'gable');
    expect(gables.length).toBe(2);
    expect(gables[0].rotation![2]).toBeCloseTo(-gables[1].rotation![2], 4);
    expect(gables[0].position[0]).toBeCloseTo(-gables[1].position[0], 4);
  });

  it('renders north and south shaft entrance markers', () => {
    const markers = segments.filter((s) => s.kind === 'shaft-marker');
    expect(markers.length).toBe(2);
    expect(markers[0].position[2]).toBeCloseTo(-markers[1].position[2], 4);
  });

  it('renders the Dixon vent hole marker', () => {
    const vent = segments.find((s) => s.kind === 'dixon-vent');
    expect(vent).toBeDefined();
  });
});
