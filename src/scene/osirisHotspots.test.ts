import { describe, it, expect } from 'vitest';
import {
  generateOsirisHotspots,
  getUniqueEvidenceCount,
  filterHotspotsByLayer,
  groupHotspotsByLevel,
} from './osirisHotspots';

describe('Osiris Evidence Hotspots (M09-T21)', () => {
  const hotspots = generateOsirisHotspots();

  it('generates at least 10 hotspots (exit criteria)', () => {
    expect(hotspots.length).toBeGreaterThanOrEqual(10);
  });

  it('every hotspot has evidence IDs', () => {
    for (const h of hotspots) {
      expect(h.evidenceIds).toBeDefined();
      expect(h.evidenceIds.length).toBeGreaterThan(0);
      for (const eid of h.evidenceIds) {
        expect(eid).toMatch(/^EV-\d+$/);
      }
    }
  });

  it('every hotspot has a position', () => {
    for (const h of hotspots) {
      expect(h.position).toBeDefined();
      expect(typeof h.position.x).toBe('number');
      expect(typeof h.position.y).toBe('number');
      expect(typeof h.position.z).toBe('number');
    }
  });

  it('every hotspot has a label', () => {
    for (const h of hotspots) {
      expect(h.label.length).toBeGreaterThan(0);
    }
  });

  it('every hotspot has a layer', () => {
    for (const h of hotspots) {
      expect(h.layer).toBeDefined();
    }
  });

  it('hotspots span multiple levels', () => {
    const groups = groupHotspotsByLevel(hotspots);
    const levelCount = Object.keys(groups).length;
    expect(levelCount).toBeGreaterThanOrEqual(3);
  });

  it('references unique evidence IDs', () => {
    const uniqueCount = getUniqueEvidenceCount(hotspots);
    expect(uniqueCount).toBeGreaterThanOrEqual(10);
  });

  describe('filterHotspotsByLayer', () => {
    it('filters to only hotspots in the specified layer', () => {
      const level3 = filterHotspotsByLayer(hotspots, 'level-3');
      for (const h of level3) {
        expect(h.layer).toBe('level-3');
      }
    });

    it('returns empty array for non-existent layer', () => {
      const result = filterHotspotsByLayer(hotspots, 'nonexistent');
      expect(result).toEqual([]);
    });
  });

  describe('groupHotspotsByLevel', () => {
    it('groups hotspots by layer', () => {
      const groups = groupHotspotsByLevel(hotspots);
      for (const [layer, layerHotspots] of Object.entries(groups)) {
        for (const h of layerHotspots) {
          expect(h.layer).toBe(layer);
        }
      }
    });
  });
});
