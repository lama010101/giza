import { describe, it, expect } from 'vitest';
import { osirisHydraulicPlugin, osirisMainstreamPlugin } from '@/theories/plugins';
import type { HypothesisContext } from '@/theories/types';
import { loadAndValidateSeed } from './seed';

const seed = loadAndValidateSeed();

function context(): HypothesisContext {
  return {
    evidence: seed.evidence,
    objects: seed.objects,
    locations: seed.locations,
    sources: seed.sources,
    simulations: [],
  };
}

describe('DoSD seed linkage', () => {
  it('every object is backed by at least one existing evidence record', () => {
    for (const obj of seed.objects) {
      expect(obj.evidence.length, obj.id).toBeGreaterThan(0);
      for (const evidenceId of obj.evidence) {
        expect(
          seed.evidence.some((e) => e.id === evidenceId),
          evidenceId,
        ).toBe(true);
      }
    }
  });

  it('every evidence record cites at least one existing source', () => {
    for (const ev of seed.evidence) {
      expect(ev.sourceIds.length, ev.id).toBeGreaterThan(0);
      for (const sourceId of ev.sourceIds) {
        expect(
          seed.sources.some((s) => s.id === sourceId),
          sourceId,
        ).toBe(true);
      }
    }
  });

  it('evidence-to-object links are mirrored by object-to-evidence links', () => {
    for (const ev of seed.evidence) {
      for (const objectId of ev.objectIds) {
        const obj = seed.objects.find((o) => o.id === objectId);
        expect(obj, objectId).toBeDefined();
        expect(obj?.evidence, `${objectId} <- ${ev.id}`).toContain(ev.id);
      }
    }
  });

  it('every evidence record resolves to a known location', () => {
    for (const ev of seed.evidence) {
      if (!ev.locationId) continue;
      expect(
        seed.locations.some((l) => l.id === ev.locationId),
        ev.locationId,
      ).toBe(true);
    }
  });

  it('all hypothesis references resolve against the seed', () => {
    const ctx = context();
    for (const plugin of [osirisHydraulicPlugin, osirisMainstreamPlugin]) {
      const h = plugin.getHypothesis(ctx);
      const evidenceRefs = [
        ...h.supports,
        ...h.contradicts,
        ...h.requiredEvidence,
        ...h.predictions.flatMap((p) => p.evidenceRefs),
      ];
      for (const evidenceId of evidenceRefs) {
        expect(
          seed.evidence.some((e) => e.id === evidenceId),
          evidenceId,
        ).toBe(true);
      }
      for (const objectId of h.affectedStructures) {
        expect(
          seed.objects.some((o) => o.id === objectId),
          objectId,
        ).toBe(true);
      }
      for (const rule of h.visualizationRules) {
        expect(
          seed.objects.some((o) => o.id === rule.target),
          rule.target,
        ).toBe(true);
      }
      for (const sourceId of h.references) {
        expect(
          seed.sources.some((s) => s.id === sourceId),
          sourceId,
        ).toBe(true);
      }
    }
  });
});
