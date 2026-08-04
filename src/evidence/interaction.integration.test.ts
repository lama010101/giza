import { describe, it, expect } from 'vitest';
import {
  createDistanceMeasurement,
  createAngleMeasurement,
  createAreaMeasurement,
  createVolumeMeasurement,
  measurementToJSON,
  measurementFromJSON,
} from './measurement';
import {
  createBookmark,
  bookmarkToJSON,
  bookmarkFromJSON,
  bookmarkToBase64,
  bookmarkFromBase64,
} from './bookmark';
import { unifiedSearch, searchByType } from './unifiedSearch';
import { getOverlayColor } from './evidenceOverlay';
import { generateHotspotsFromObjects, HotspotSchema } from './hotspot';
import { resolveInteractionType, shouldOpenEvidenceView } from '@/scene/interaction';
import { loadAndValidateSeed } from '@/loaders/seed';

/**
 * Integration tests for the interaction and research tools (M08-T11).
 * Tests raycast hit resolution, measurement accuracy, bookmark round-trip,
 * and search integration against the real seed dataset.
 */
describe('Interaction Integration Tests (M08-T11)', () => {
  const seed = loadAndValidateSeed();

  describe('raycast hit → evidence view integration', () => {
    it('every seed object with evidence produces a valid hotspot', () => {
      const objectsWithEvidence = seed.objects.filter((o) => o.evidence.length > 0);
      const hotspots = generateHotspotsFromObjects(
        objectsWithEvidence.map((o) => ({
          id: o.id,
          name: o.name,
          position: { x: 0, y: 0, z: 0 },
          evidence: o.evidence,
          confidence: o.confidence,
        })),
      );

      expect(hotspots.length).toBeGreaterThan(0);

      for (const hotspot of hotspots) {
        const parsed = HotspotSchema.safeParse(hotspot);
        expect(parsed.success, `Hotspot ${hotspot.id} should be valid`).toBe(true);
        // Every evidence ID in the hotspot should resolve to a real evidence record
        for (const evId of hotspot.evidenceIds) {
          expect(
            seed.evidence.some((e) => e.id === evId),
            `Evidence ${evId} should exist`,
          ).toBe(true);
        }
      }
    });

    it('shouldOpenEvidenceView returns true for all hotspots', () => {
      const objectsWithEvidence = seed.objects.filter((o) => o.evidence.length > 0);
      const hotspots = generateHotspotsFromObjects(
        objectsWithEvidence.map((o) => ({
          id: o.id,
          name: o.name,
          position: { x: 0, y: 0, z: 0 },
          evidence: o.evidence,
        })),
      );

      for (const hotspot of hotspots) {
        expect(
          shouldOpenEvidenceView({
            nodeId: hotspot.id,
            evidenceIds: hotspot.evidenceIds,
            point: hotspot.position,
            distance: 0,
          }),
        ).toBe(true);
      }
    });
  });

  describe('measurement accuracy', () => {
    it('distance measurement matches manual calculation', () => {
      const a = { x: 1, y: 2, z: 3 };
      const b = { x: 4, y: 6, z: 3 };
      const expected = 5; // sqrt((4-1)² + (6-2)² + 0²) = sqrt(9+16) = 5
      const m = createDistanceMeasurement(a, b);
      expect(m.value).toBeCloseTo(expected, 5);
    });

    it('angle measurement produces correct degrees for right angle', () => {
      const m = createAngleMeasurement(
        { x: 1, y: 0, z: 0 },
        { x: 0, y: 0, z: 0 },
        { x: 0, y: 1, z: 0 },
      );
      expect(m.value).toBeCloseTo(90, 1);
    });

    it('area measurement matches triangle formula', () => {
      const m = createAreaMeasurement(
        { x: 0, y: 0, z: 0 },
        { x: 6, y: 0, z: 0 },
        { x: 0, y: 8, z: 0 },
      );
      // Right triangle: (6 * 8) / 2 = 24
      expect(m.value).toBe(24);
    });

    it('volume measurement matches bounding box formula', () => {
      const m = createVolumeMeasurement({ x: 0, y: 0, z: 0 }, { x: 10, y: 20, z: 30 });
      expect(m.value).toBe(6000);
    });

    it('measurement JSON round-trip preserves all data', () => {
      const m = createDistanceMeasurement({ x: 1.5, y: 2.3, z: -4.1 }, { x: 10, y: 20, z: 30 });
      const restored = measurementFromJSON(measurementToJSON(m));
      expect(restored).toEqual(m);
    });
  });

  describe('bookmark round-trip integration', () => {
    it('bookmark with real seed data round-trips through JSON', () => {
      const bm = createBookmark({
        id: 'bm-integration-1',
        name: 'Great Pyramid Base',
        camera: {
          position: { x: 100, y: 80, z: 100 },
          target: { x: 0, y: 70, z: 0 },
          mode: 'orbit',
        },
        visibleLayers: ['exterior'],
        hiddenLayers: ['passages', 'subterranean'],
        activeHypothesisIds: ['hydraulic'],
        lighting: { ambient: 0.3, directional: 0.7 },
        selectedObjectId: 'OBJ-0101',
        selectedEvidenceId: 'EV-100001',
        notes: 'Base survey view',
      });

      const json = bookmarkToJSON(bm);
      const restored = bookmarkFromJSON(json);
      expect(restored).toEqual(bm);
    });

    it('bookmark round-trips through base64 encoding', () => {
      const bm = createBookmark({
        id: 'bm-integration-2',
        name: 'Osiris Level 3',
        camera: {
          position: { x: -1.4, y: -15, z: -7 },
          target: { x: -1.4, y: -20, z: -7 },
          mode: 'walk',
        },
        visibleLayers: ['level-3'],
        hiddenLayers: ['level-1', 'level-2'],
        activeHypothesisIds: ['hydraulic'],
        notes: 'Hydraulic simulation view',
      });

      const encoded = bookmarkToBase64(bm);
      const restored = bookmarkFromBase64(encoded);
      expect(restored).toEqual(bm);
    });
  });

  describe('search integration with seed data', () => {
    it('search finds evidence records from the seed', () => {
      const results = unifiedSearch({ query: 'chamber', types: ['evidence'] });
      expect(results.length).toBeGreaterThan(0);
      for (const r of results) {
        expect(seed.evidence.some((e) => e.id === r.id)).toBe(true);
      }
    });

    it('search finds sources from the seed', () => {
      const results = unifiedSearch({ query: 'Petrie', types: ['source'] });
      expect(results.length).toBeGreaterThan(0);
    });

    it('search finds objects from the seed', () => {
      const results = unifiedSearch({ query: 'pyramid', types: ['object'] });
      expect(results.length).toBeGreaterThan(0);
    });

    it('searchByType returns only the requested type', () => {
      const results = searchByType('shaft', 'evidence');
      expect(results.every((r) => r.type === 'evidence')).toBe(true);
    });
  });

  describe('evidence overlay integration', () => {
    it('every seed evidence record maps to a valid overlay color', () => {
      for (const ev of seed.evidence) {
        const color = getOverlayColor(ev);
        expect(color).toMatch(/^#[0-9a-f]{6}$/i);
      }
    });

    it('overlay color is consistent for same evidence class', () => {
      const e2Evidence = seed.evidence.filter((e) => e.primaryClass === 'E2');
      expect(e2Evidence.length).toBeGreaterThan(0);
      const colors = new Set(e2Evidence.map((e) => getOverlayColor(e)));
      // All E2 evidence should map to blue (unless tagged as simulation/contradictory)
      expect(colors.has('#3b82f6')).toBe(true);
    });
  });

  describe('interaction type resolution', () => {
    it('Research mode resolves to inspect', () => {
      expect(resolveInteractionType('Research', false, false)).toBe('inspect');
    });

    it('measurement mode takes priority', () => {
      expect(resolveInteractionType('Research', true, true)).toBe('measure');
    });
  });
});
