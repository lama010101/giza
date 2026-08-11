import { describe, it, expect } from 'vitest';
import { runCoupledSimulation, type CoupledPhysicsInputs } from '@/simulation/coupledPhysics';
import {
  gpHydraulicAcousticPlugin,
  gpHydraulicPlugin,
  gpMainstreamPlugin,
} from '@/theories/plugins';
import { experimentalScenarios, userVariables } from '@/theories/plugins/gp-hydraulic-acoustic';
import { HypothesisEngine } from '@/theories/engine';
import { loadSeedByMonument } from '@/loaders/seed';
import type { HypothesisContext } from '@/theories/types';
import type { SimulationMetadata } from '@/simulation/types';

const DEFAULT_INPUTS: CoupledPhysicsInputs = {
  waterColumnHeight: 33.55,
  conduitDiameter: 1.2,
  conduitLength: 96.0,
  gravity: 9.81,
  waterDensity: 1000.0,
  chamberLength: 10.47,
  chamberWidth: 5.24,
  chamberHeight: 5.84,
  galleryLength: 46.11,
  galleryHeight: 8.74,
  graniteDensity: 2750,
  youngModulus: 50e9,
  poissonRatio: 0.25,
  dampingRatio: 0.01,
  ambientTemperature: 22,
  waterTemperature: 20,
  absorptionCoeff: 0.05,
  humidity: 50,
  frequencyStart: 10,
  frequencyEnd: 2000,
};

function makeMetadata(): SimulationMetadata {
  return {
    id: 'SIM-COUPLED-001',
    softwareVersion: '0.1.0',
    date: '2026-07-29',
    parameters: {
      simulationType: 'Coupled',
      version: 1,
      parameters: [],
    },
    author: 'GIZA Research Team',
    geometryVersion: 'gp-v1',
    theoryContext: 'THEORY-GP-003',
    randomSeed: 42,
  };
}

function context(): HypothesisContext {
  const osiris = loadSeedByMonument('osiris');
  const gp = loadSeedByMonument('great-pyramid');
  return {
    evidence: [...osiris.evidence, ...gp.evidence],
    objects: [...osiris.objects, ...gp.objects],
    locations: [...osiris.locations, ...gp.locations],
    sources: [...osiris.sources, ...gp.sources],
    simulations: [],
  };
}

describe('Hydraulic-Acoustic Plugin', () => {
  it('has correct hypothesis identity', () => {
    const engine = new HypothesisEngine();
    engine.register(gpHydraulicAcousticPlugin);
    const h = engine.getHypothesis('THEORY-GP-003', context());
    expect(h.id).toBe('THEORY-GP-003');
    expect(h.name).toBe('Hydraulic-Acoustic System Hypothesis');
    expect(h.tags).toContain('hydraulic');
    expect(h.tags).toContain('acoustic');
    expect(h.tags).toContain('resonance');
  });

  it('has 8 scientific assumptions', () => {
    const engine = new HypothesisEngine();
    engine.register(gpHydraulicAcousticPlugin);
    const h = engine.getHypothesis('THEORY-GP-003', context());
    expect(h.scientificAssumptions).toHaveLength(8);
  });

  it('has 7 predictions all with status untested', () => {
    const engine = new HypothesisEngine();
    engine.register(gpHydraulicAcousticPlugin);
    const h = engine.getHypothesis('THEORY-GP-003', context());
    expect(h.predictions).toHaveLength(7);
    for (const pred of h.predictions) {
      expect(pred.status).toBe('untested');
      expect(pred.hypothesisId).toBe('THEORY-GP-003');
    }
  });

  it('has 8 affected structures mapped to existing object IDs', () => {
    const engine = new HypothesisEngine();
    engine.register(gpHydraulicAcousticPlugin);
    const h = engine.getHypothesis('THEORY-GP-003', context());
    expect(h.affectedStructures).toHaveLength(8);
    const ctx = context();
    const objIds = new Set(ctx.objects.map((o) => o.id));
    for (const id of h.affectedStructures) {
      expect(objIds.has(id)).toBe(true);
    }
  });

  it('has 4 linked simulations', () => {
    const engine = new HypothesisEngine();
    engine.register(gpHydraulicAcousticPlugin);
    const h = engine.getHypothesis('THEORY-GP-003', context());
    expect(h.simulations).toHaveLength(4);
    expect(h.simulations).toContain('SIM-201');
    expect(h.simulations).toContain('SIM-202');
    expect(h.simulations).toContain('SIM-203');
    expect(h.simulations).toContain('SIM-204');
  });

  it('derives SIM-201 parameters from surveyed geometry', () => {
    const sims = gpHydraulicAcousticPlugin.getSimulations?.() ?? [];
    const sim = sims.find((s) => s.id === 'SIM-201')!;
    expect(sim.parameters.conduitLength).toBe(415.99);
    expect(sim.parameters.conduitSlope).toBe(0.29);
    expect(sim.parameters.conduitDiameter).toBe(0.6);
    expect(sim.parameters.chamberVolume).toBe(414.74);
  });

  it('uses GP_KINGS_CHAMBER.height in SIM-202 and SIM-203', () => {
    const sims = gpHydraulicAcousticPlugin.getSimulations?.() ?? [];
    const sim202 = sims.find((s) => s.id === 'SIM-202')!;
    const sim203 = sims.find((s) => s.id === 'SIM-203')!;
    expect(sim202.parameters.kingsChamberHeight).toBe(5.84);
    expect(sim203.parameters.chamberHeight).toBe(5.84);
  });

  it('has 11 visualization rules for 8 structures', () => {
    const engine = new HypothesisEngine();
    engine.register(gpHydraulicAcousticPlugin);
    const h = engine.getHypothesis('THEORY-GP-003', context());
    expect(h.visualizationRules).toHaveLength(11);
    const targets = new Set(h.visualizationRules.map((r) => r.target));
    expect(targets.size).toBe(8);
  });

  it('has initial confidence of 23', () => {
    const engine = new HypothesisEngine();
    engine.register(gpHydraulicAcousticPlugin);
    const h = engine.getHypothesis('THEORY-GP-003', context());
    expect(h.confidence).toBe(23);
  });

  it('has per-object confidence for all 8 affected structures', () => {
    const engine = new HypothesisEngine();
    engine.register(gpHydraulicAcousticPlugin);
    const h = engine.getHypothesis('THEORY-GP-003', context());
    for (const objId of h.affectedStructures) {
      expect(h.confidenceByObject[objId]).toBeDefined();
      expect(h.confidenceByObject[objId]).toBeGreaterThan(0);
      expect(h.confidenceByObject[objId]).toBeLessThanOrEqual(100);
    }
  });

  it('returns active simulations when activated', () => {
    const engine = new HypothesisEngine();
    engine.register(gpHydraulicAcousticPlugin);
    engine.activate(['THEORY-GP-003']);
    const ctx = context();
    const simIds = engine.getActiveSimulations(ctx);
    expect(simIds).toContain('SIM-201');
    expect(simIds).toContain('SIM-202');
    expect(simIds).toContain('SIM-203');
    expect(simIds).toContain('SIM-204');
  });

  it('returns visualization rules for specific objects', () => {
    const engine = new HypothesisEngine();
    engine.register(gpHydraulicAcousticPlugin);
    engine.activate(['THEORY-GP-003']);
    const ctx = context();
    const rules = engine.getVisualizationRules('OBJ-0106', ctx);
    expect(rules.length).toBeGreaterThan(0);
    expect(rules[0].overlay).toBe('highlight');
  });
});

describe('Experimental Scenarios', () => {
  it('has 8 scenarios A through H', () => {
    expect(experimentalScenarios).toHaveLength(8);
    const ids = experimentalScenarios.map((s) => s.id);
    expect(ids).toContain('SCENARIO-A');
    expect(ids).toContain('SCENARIO-H');
  });

  it('each scenario has distinct parameters', () => {
    const paramSets = experimentalScenarios.map((s) => JSON.stringify(s.parameters));
    expect(new Set(paramSets).size).toBe(8);
  });

  it('Scenario A is dry (no water)', () => {
    const scenarioA = experimentalScenarios.find((s) => s.id === 'SCENARIO-A')!;
    expect(scenarioA.parameters.waterColumnHeight).toBe(0);
  });

  it('Scenario C has oscillation parameters', () => {
    const scenarioC = experimentalScenarios.find((s) => s.id === 'SCENARIO-C')!;
    expect(scenarioC.parameters.oscillationAmplitude).toBeDefined();
    expect(scenarioC.parameters.oscillationPeriod).toBeDefined();
  });
});

describe('User Variables', () => {
  it('has 12 user-controlled variables', () => {
    expect(userVariables).toHaveLength(12);
  });

  it('includes all required variables from spec §11', () => {
    const names = userVariables.map((v) => v.name);
    expect(names).toContain('waterLevel');
    expect(names).toContain('flowRate');
    expect(names).toContain('pressure');
    expect(names).toContain('temperature');
    expect(names).toContain('rockDensity');
    expect(names).toContain('airPressure');
    expect(names).toContain('humidity');
    expect(names).toContain('gravity');
    expect(names).toContain('surfaceRoughness');
    expect(names).toContain('shaftObstruction');
    expect(names).toContain('openingSize');
  });

  it('each variable has min, max, and provenance', () => {
    for (const v of userVariables) {
      expect(v.min).toBeLessThan(v.max);
      expect(v.provenance).toBeDefined();
    }
  });
});

describe('Coupled Physics', () => {
  const result = runCoupledSimulation(DEFAULT_INPUTS, makeMetadata());

  it('computes hydraulic pressure from water column', () => {
    expect(result.hydraulic.pressure).toBeCloseTo(1000 * 9.81 * 33.55, 0);
    expect(result.hydraulic.pressure).toBeGreaterThan(0);
  });

  it('computes hydraulic flow rate through conduit', () => {
    expect(result.hydraulic.flowRate).toBeGreaterThan(0);
  });

  it('computes hydraulic oscillation frequency', () => {
    expect(result.hydraulic.oscillationFrequency).toBeGreaterThan(0);
    expect(result.hydraulic.oscillationFrequency).toBeLessThan(100);
  });

  it('marks hydraulic as stable with water present', () => {
    expect(result.hydraulic.stable).toBe(true);
  });

  it('computes acoustic resonant frequencies', () => {
    const acousticOutputs = result.acoustic.outputs;
    const resonant = acousticOutputs.resonantFrequencies as { frequency: number }[];
    expect(resonant.length).toBeGreaterThan(0);
  });

  it('computes structural modal frequencies', () => {
    expect(result.structural.modalFrequencies.length).toBe(4);
    for (const f of result.structural.modalFrequencies) {
      expect(f).toBeGreaterThan(0);
    }
  });

  it('computes thermal effects on density', () => {
    expect(result.thermal.waterDensity).toBeGreaterThan(900);
    expect(result.thermal.airDensity).toBeGreaterThan(1.0);
    expect(result.thermal.airDensity).toBeLessThan(1.3);
  });

  it('computes energy transfer efficiency', () => {
    expect(result.energyTransferEfficiency).toBeGreaterThanOrEqual(0);
    expect(result.energyTransferEfficiency).toBeLessThanOrEqual(1);
  });

  it('has the full energy pathway', () => {
    expect(result.pathway).toHaveLength(10);
    expect(result.pathway[0]).toBe('Water Supply');
    expect(result.pathway[1]).toBe('Osiris Shaft');
    expect(result.pathway[result.pathway.length - 1]).toBe('Granite Resonance');
  });

  it('dry scenario produces zero hydraulic pressure', () => {
    const dryInputs = { ...DEFAULT_INPUTS, waterColumnHeight: 0 };
    const dryResult = runCoupledSimulation(dryInputs, makeMetadata());
    expect(dryResult.hydraulic.pressure).toBe(0);
    expect(dryResult.hydraulic.stable).toBe(false);
    expect(dryResult.energyTransferEfficiency).toBe(0);
  });
});

describe('Hydraulic-Acoustic Plugin Integration', () => {
  it('can be active simultaneously with other GP hypotheses', () => {
    const engine = new HypothesisEngine();
    engine.register(gpHydraulicAcousticPlugin);
    engine.register(gpMainstreamPlugin);
    engine.register(gpHydraulicPlugin);
    engine.setActive(['THEORY-GP-001', 'THEORY-GP-002', 'THEORY-GP-003']);
    expect(engine.getActiveIds()).toHaveLength(3);
  });

  it('all affected structures exist in combined seed data', () => {
    const engine = new HypothesisEngine();
    engine.register(gpHydraulicAcousticPlugin);
    const h = engine.getHypothesis('THEORY-GP-003', context());
    const ctx = context();
    const objIds = new Set(ctx.objects.map((o) => o.id));
    for (const id of h.affectedStructures) {
      expect(objIds.has(id)).toBe(true);
    }
  });

  it('all referenced sources exist in seed data', () => {
    const engine = new HypothesisEngine();
    engine.register(gpHydraulicAcousticPlugin);
    const h = engine.getHypothesis('THEORY-GP-003', context());
    const ctx = context();
    const srcIds = new Set(ctx.sources.map((s) => s.id));
    for (const srcId of h.references) {
      expect(srcIds.has(srcId)).toBe(true);
    }
  });
});
