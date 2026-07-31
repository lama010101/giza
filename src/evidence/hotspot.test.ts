import { describe, it, expect } from 'vitest';
import { HotspotSchema, generateHotspotsFromObjects } from './hotspot';

describe('Evidence Hotspots (M08-T02)', () => {
  it('validates a well-formed hotspot', () => {
    const hotspot = HotspotSchema.parse({
      id: 'hotspot-1',
      position: { x: 1, y: 2, z: 3 },
      evidenceIds: ['EV-100001'],
      title: 'Test Hotspot',
    });
    expect(hotspot.id).toBe('hotspot-1');
    expect(hotspot.radius).toBe(1); // default
    expect(hotspot.priority).toBe(5); // default
    expect(hotspot.confidence).toBe(50); // default
  });

  it('requires at least one evidence ID', () => {
    expect(() =>
      HotspotSchema.parse({
        id: 'hotspot-1',
        position: { x: 0, y: 0, z: 0 },
        evidenceIds: [],
        title: 'Test',
      }),
    ).toThrow();
  });

  it('requires a position', () => {
    expect(() =>
      HotspotSchema.parse({
        id: 'hotspot-1',
        evidenceIds: ['EV-100001'],
        title: 'Test',
      }),
    ).toThrow();
  });

  it('generates hotspots from scene objects with evidence', () => {
    const objects = [
      {
        id: 'OBJ-0101',
        name: 'Great Pyramid Base',
        position: { x: 0, y: 0, z: 0 },
        evidence: ['EV-100001', 'EV-100002'],
        confidence: 95,
      },
      {
        id: 'OBJ-0102',
        name: 'No Evidence Object',
        position: { x: 10, y: 0, z: 0 },
        evidence: [],
      },
    ];
    const hotspots = generateHotspotsFromObjects(objects);
    expect(hotspots).toHaveLength(1);
    expect(hotspots[0].id).toBe('hotspot-OBJ-0101');
    expect(hotspots[0].evidenceIds).toEqual(['EV-100001', 'EV-100002']);
    expect(hotspots[0].title).toBe('Great Pyramid Base');
    expect(hotspots[0].confidence).toBe(95);
    expect(hotspots[0].objectId).toBe('OBJ-0101');
  });

  it('skips objects without evidence', () => {
    const objects = [
      { id: 'OBJ-0001', name: 'A', position: { x: 0, y: 0, z: 0 }, evidence: [] },
      { id: 'OBJ-0002', name: 'B', position: { x: 1, y: 0, z: 0 } },
    ];
    const hotspots = generateHotspotsFromObjects(objects);
    expect(hotspots).toHaveLength(0);
  });
});
