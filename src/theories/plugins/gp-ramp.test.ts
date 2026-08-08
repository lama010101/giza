import { describe, it, expect } from 'vitest';
import { HypothesisEngine } from '@/theories/engine';
import { gpRampPlugin } from '@/theories/plugins';
import { loadSeedByMonument } from '@/loaders/seed';

function context() {
  const seed = loadSeedByMonument('great-pyramid');
  return {
    evidence: seed.evidence,
    objects: seed.objects,
    locations: seed.locations,
    sources: seed.sources,
    simulations: [],
  };
}

describe('Great Pyramid Ramp Hypothesis Plugin', () => {
  it('registers with the engine', () => {
    const engine = new HypothesisEngine();
    engine.register(gpRampPlugin);
    expect(engine.getPluginIds()).toContain('THEORY-GP-004');
  });

  it('returns hypothesis with predictions', () => {
    const engine = new HypothesisEngine();
    engine.register(gpRampPlugin);
    const h = engine.getHypothesis('THEORY-GP-004', context());
    expect(h.predictions.length).toBeGreaterThanOrEqual(3);
    expect(h.tags).toContain('ramp');
    expect(h.tags).toContain('construction');
  });

  it('references only existing evidence, objects, and sources', () => {
    const ctx = context();
    const evIds = new Set(ctx.evidence.map((e) => e.id));
    const objIds = new Set(ctx.objects.map((o) => o.id));
    const srcIds = new Set(ctx.sources.map((s) => s.id));

    const engine = new HypothesisEngine();
    engine.register(gpRampPlugin);
    const h = engine.getHypothesis('THEORY-GP-004', ctx);

    for (const evId of [...h.supports, ...h.contradicts, ...h.requiredEvidence]) {
      expect(evIds.has(evId)).toBe(true);
    }
    for (const objId of h.affectedStructures) {
      expect(objIds.has(objId)).toBe(true);
    }
    for (const srcId of h.references) {
      expect(srcIds.has(srcId)).toBe(true);
    }
  });

  it('provides visualization rules for affected structures', () => {
    const engine = new HypothesisEngine();
    engine.register(gpRampPlugin);
    engine.activate(['THEORY-GP-004']);
    const ctx = context();
    const rules = engine.getVisualizationRules('OBJ-0101', ctx);
    expect(rules.length).toBeGreaterThan(0);
    expect(rules[0].overlay).toBe('annotation');
  });
});
