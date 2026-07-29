import { describe, it, expect } from 'vitest';
import { HypothesisEngine } from '@/theories/engine';
import { gpHydraulicPlugin, gpMainstreamPlugin } from '@/theories/plugins';
import type { HypothesisContext } from '@/theories/types';
import { loadSeedByMonument } from '@/loaders/seed';

function context(): HypothesisContext {
  const seed = loadSeedByMonument('great-pyramid');
  return {
    evidence: seed.evidence,
    objects: seed.objects,
    locations: seed.locations,
    sources: seed.sources,
    simulations: [],
  };
}

function sourceById(id: string) {
  return context().sources.find((s) => s.id === id);
}

describe('Great Pyramid Hypothesis Plugins', () => {
  it('registers both GP plugins', () => {
    const engine = new HypothesisEngine();
    engine.register(gpHydraulicPlugin);
    engine.register(gpMainstreamPlugin);
    expect(engine.getPluginIds()).toContain('THEORY-GP-001');
    expect(engine.getPluginIds()).toContain('THEORY-GP-002');
  });

  it('GP hydraulic plugin returns hypothesis with predictions', () => {
    const engine = new HypothesisEngine();
    engine.register(gpHydraulicPlugin);
    const h = engine.getHypothesis('THEORY-GP-001', context());
    expect(h.predictions.length).toBeGreaterThanOrEqual(3);
    expect(h.simulations).toContain('SIM-101');
    expect(h.tags).toContain('hydraulic');
  });

  it('GP mainstream plugin returns hypothesis with confirmed predictions', () => {
    const engine = new HypothesisEngine();
    engine.register(gpMainstreamPlugin);
    const h = engine.getHypothesis('THEORY-GP-002', context());
    expect(h.predictions.length).toBeGreaterThanOrEqual(3);
    expect(h.predictions.some((p) => p.status === 'confirmed')).toBe(true);
    expect(h.tags).toContain('mainstream');
  });

  it('GP hydraulic plugin has visualization rules for affected structures', () => {
    const engine = new HypothesisEngine();
    engine.register(gpHydraulicPlugin);
    engine.activate(['THEORY-GP-001']);
    const ctx = context();
    const rules = engine.getVisualizationRules('OBJ-0106', ctx);
    expect(rules.length).toBeGreaterThan(0);
    expect(rules[0].overlay).toBe('water');
  });

  it('GP mainstream plugin has visualization rules for sarcophagus', () => {
    const engine = new HypothesisEngine();
    engine.register(gpMainstreamPlugin);
    engine.activate(['THEORY-GP-002']);
    const ctx = context();
    const rules = engine.getVisualizationRules('OBJ-0112', ctx);
    expect(rules.length).toBeGreaterThan(0);
    expect(rules[0].overlay).toBe('highlight');
  });

  it('GP hydraulic plugin computes confidence per object', () => {
    const engine = new HypothesisEngine();
    engine.register(gpHydraulicPlugin);
    engine.activate(['THEORY-GP-001']);
    const ctx = context();
    const byObject = engine.computeConfidenceByObject(ctx, sourceById);
    expect(byObject['THEORY-GP-001']).toBeDefined();
    const overall = engine.computeOverallConfidence(byObject);
    expect(overall['THEORY-GP-001']).toBeGreaterThanOrEqual(0);
    expect(overall['THEORY-GP-001']).toBeLessThanOrEqual(100);
  });

  it('GP mainstream plugin computes confidence per object', () => {
    const engine = new HypothesisEngine();
    engine.register(gpMainstreamPlugin);
    engine.activate(['THEORY-GP-002']);
    const ctx = context();
    const byObject = engine.computeConfidenceByObject(ctx, sourceById);
    expect(byObject['THEORY-GP-002']).toBeDefined();
    const overall = engine.computeOverallConfidence(byObject);
    expect(overall['THEORY-GP-002']).toBeGreaterThanOrEqual(0);
    expect(overall['THEORY-GP-002']).toBeLessThanOrEqual(100);
  });

  it('GP hydraulic returns active simulations', () => {
    const engine = new HypothesisEngine();
    engine.register(gpHydraulicPlugin);
    engine.activate(['THEORY-GP-001']);
    expect(engine.getActiveSimulations(context())).toContain('SIM-101');
  });

  it('GP mainstream has no simulations', () => {
    const engine = new HypothesisEngine();
    engine.register(gpMainstreamPlugin);
    engine.activate(['THEORY-GP-002']);
    expect(engine.getActiveSimulations(context())).toHaveLength(0);
  });

  it('both GP plugins can be active simultaneously', () => {
    const engine = new HypothesisEngine();
    engine.register(gpHydraulicPlugin);
    engine.register(gpMainstreamPlugin);
    engine.setActive(['THEORY-GP-001', 'THEORY-GP-002']);
    expect(engine.getActiveIds()).toHaveLength(2);
  });

  it('all evidence referenced by GP plugins exists in seed', () => {
    const ctx = context();
    const evIds = new Set(ctx.evidence.map((e) => e.id));

    const engine = new HypothesisEngine();
    engine.register(gpHydraulicPlugin);
    engine.register(gpMainstreamPlugin);

    const h1 = engine.getHypothesis('THEORY-GP-001', ctx);
    const h2 = engine.getHypothesis('THEORY-GP-002', ctx);

    for (const evId of [...h1.supports, ...h1.contradicts, ...h1.requiredEvidence]) {
      expect(evIds.has(evId)).toBe(true);
    }
    for (const evId of [...h2.supports, ...h2.contradicts, ...h2.requiredEvidence]) {
      expect(evIds.has(evId)).toBe(true);
    }
  });

  it('all objects referenced by GP plugins exist in seed', () => {
    const ctx = context();
    const objIds = new Set(ctx.objects.map((o) => o.id));

    const engine = new HypothesisEngine();
    engine.register(gpHydraulicPlugin);
    engine.register(gpMainstreamPlugin);

    const h1 = engine.getHypothesis('THEORY-GP-001', ctx);
    const h2 = engine.getHypothesis('THEORY-GP-002', ctx);

    for (const objId of h1.affectedStructures) {
      expect(objIds.has(objId)).toBe(true);
    }
    for (const objId of h2.affectedStructures) {
      expect(objIds.has(objId)).toBe(true);
    }
  });

  it('all sources referenced by GP plugins exist in seed', () => {
    const ctx = context();
    const srcIds = new Set(ctx.sources.map((s) => s.id));

    const engine = new HypothesisEngine();
    engine.register(gpHydraulicPlugin);
    engine.register(gpMainstreamPlugin);

    const h1 = engine.getHypothesis('THEORY-GP-001', ctx);
    const h2 = engine.getHypothesis('THEORY-GP-002', ctx);

    for (const srcId of h1.references) {
      expect(srcIds.has(srcId)).toBe(true);
    }
    for (const srcId of h2.references) {
      expect(srcIds.has(srcId)).toBe(true);
    }
  });
});
