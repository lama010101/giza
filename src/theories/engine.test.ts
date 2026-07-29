import { describe, it, expect } from 'vitest';
import { HypothesisEngine } from './engine';
import { osirisHydraulicPlugin, osirisMainstreamPlugin } from './plugins';
import { loadAndValidateSeed } from '@/loaders/seed';
import type { HypothesisContext } from './types';

function context(): HypothesisContext {
  const seed = loadAndValidateSeed();
  return {
    evidence: seed.evidence,
    objects: seed.objects,
    locations: seed.locations,
    sources: seed.sources,
    simulations: [],
  };
}

function sourceById(id: string) {
  return loadAndValidateSeed().sources.find((s) => s.id === id);
}

describe('HypothesisEngine', () => {
  it('registers the two starter plugins', () => {
    const engine = new HypothesisEngine();
    engine.register(osirisHydraulicPlugin);
    engine.register(osirisMainstreamPlugin);
    expect(engine.getPluginIds()).toContain('THEORY-OSIRIS-001');
    expect(engine.getPluginIds()).toContain('THEORY-OSIRIS-002');
  });

  it('computes confidence per object and overall', () => {
    const engine = new HypothesisEngine();
    engine.register(osirisHydraulicPlugin);
    engine.register(osirisMainstreamPlugin);
    engine.activate(['THEORY-OSIRIS-001']);

    const ctx = context();
    const byObject = engine.computeConfidenceByObject(ctx, sourceById);
    expect(byObject['THEORY-OSIRIS-001']).toBeDefined();

    const overall = engine.computeOverallConfidence(byObject);
    expect(overall['THEORY-OSIRIS-001']).toBeGreaterThanOrEqual(0);
    expect(overall['THEORY-OSIRIS-001']).toBeLessThanOrEqual(100);
  });

  it('setActive replaces the active set and rejects unknown plugins', () => {
    const engine = new HypothesisEngine();
    engine.register(osirisHydraulicPlugin);
    engine.register(osirisMainstreamPlugin);

    engine.setActive(['THEORY-OSIRIS-001']);
    expect(engine.getActiveIds()).toEqual(['THEORY-OSIRIS-001']);

    engine.setActive(['THEORY-OSIRIS-002']);
    expect(engine.getActiveIds()).toEqual(['THEORY-OSIRIS-002']);

    engine.setActive([]);
    expect(engine.getActiveIds()).toEqual([]);

    expect(() => engine.setActive(['THEORY-UNKNOWN'])).toThrow(/not registered/);
  });

  it('returns active simulations for a hypothesis', () => {
    const engine = new HypothesisEngine();
    engine.register(osirisHydraulicPlugin);
    engine.activate(['THEORY-OSIRIS-001']);
    expect(engine.getActiveSimulations(context())).toContain('SIM-001');
  });
});
