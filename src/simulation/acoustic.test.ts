import { describe, it, expect, beforeEach } from 'vitest';
import {
  solveAcoustic,
  defaultAcousticParameters,
  type AcousticInputs,
  type AcousticOutputs,
} from '@/simulation/acousticSolver';
import {
  buildPressureIsosurfaces,
  buildHeatmap,
  buildWavefronts,
  buildParticleMotion,
  buildFrequencySpectrum,
  buildAcousticVisualization,
} from '@/simulation/acousticVisualization';
import { SimulationLifecycle } from '@/simulation/lifecycle';
import { LIFECYCLE_ORDER } from '@/simulation/types';
import { ParameterStore } from '@/simulation/parameters';
import { SCIENTIFIC_TRANSPARENCY_DISCLAIMER } from '@/simulation/types';
import type { SimulationMetadata } from '@/simulation/types';

const KINGS_CHAMBER: AcousticInputs = {
  chamberLength: 10.47,
  chamberWidth: 5.24,
  chamberHeight: 5.97,
  absorptionCoeff: 0.05,
  airTemperature: 22,
  humidity: 50,
  sourceLocation: { x: 5.235, y: 2.985, z: 2.62 },
  frequencyStart: 10,
  frequencyEnd: 2000,
  frequencySteps: 100,
};

function makeMetadata(): SimulationMetadata {
  return {
    id: 'SIM-102',
    softwareVersion: '0.1.0',
    date: '2026-07-29',
    parameters: {
      simulationType: 'Acoustic',
      version: 1,
      parameters: defaultAcousticParameters(10.47, 5.24, 5.97),
    },
    author: 'GIZA Research Team',
    geometryVersion: 'gp-v1',
    theoryContext: 'THEORY-GP-002',
    randomSeed: 42,
  };
}

describe('Acoustic Solver', () => {
  const result = solveAcoustic(KINGS_CHAMBER, makeMetadata());
  const outputs = result.outputs as unknown as AcousticOutputs;

  it('computes resonant frequencies within the sweep range', () => {
    expect(outputs.resonantFrequencies.length).toBeGreaterThan(0);
    for (const r of outputs.resonantFrequencies) {
      expect(r.frequency).toBeGreaterThanOrEqual(KINGS_CHAMBER.frequencyStart);
      expect(r.frequency).toBeLessThanOrEqual(KINGS_CHAMBER.frequencyEnd);
      expect(r.wavelength).toBeGreaterThan(0);
    }
  });

  it('includes the fundamental (1,0,0) mode', () => {
    const fundamental = outputs.resonantFrequencies.find(
      (r) => r.mode.nx === 1 && r.mode.ny === 0 && r.mode.nz === 0,
    );
    expect(fundamental).toBeDefined();
    const c = 343.0 * Math.sqrt(1 + 22 / 273.15);
    const expected = c / (2 * KINGS_CHAMBER.chamberLength);
    expect(fundamental!.frequency).toBeCloseTo(expected, 1);
  });

  it('computes standing waves with amplitude and nodes', () => {
    expect(outputs.standingWaves.length).toBeGreaterThan(0);
    for (const sw of outputs.standingWaves) {
      expect(sw.amplitude).toBeGreaterThan(0);
      expect(sw.amplitude).toBeLessThanOrEqual(1);
      expect(sw.nodes).toBeGreaterThanOrEqual(1);
    }
  });

  it('computes reflection paths with decreasing attenuation', () => {
    expect(outputs.reflectionPaths.length).toBe(10);
    for (let i = 1; i < outputs.reflectionPaths.length; i++) {
      expect(outputs.reflectionPaths[i].attenuation).toBeLessThan(
        outputs.reflectionPaths[i - 1].attenuation,
      );
    }
  });

  it('computes RT60 using Sabine equation', () => {
    const V = 10.47 * 5.24 * 5.97;
    const S = 2 * (10.47 * 5.24 + 10.47 * 5.97 + 5.24 * 5.97);
    const expected = (0.161 * V) / (S * 0.05);
    expect(outputs.reverberationTimeRT60).toBeCloseTo(expected, 2);
    expect(outputs.reverberationTimeRT60).toBeGreaterThan(0);
  });

  it('computes energy decay as negative dB over time', () => {
    expect(outputs.energyDecay.length).toBeGreaterThan(0);
    expect(outputs.energyDecay[0].energyDb).toBeCloseTo(0, 5);
    for (let i = 1; i < outputs.energyDecay.length; i++) {
      expect(outputs.energyDecay[i].energyDb).toBeLessThan(outputs.energyDecay[i - 1].energyDb);
    }
  });

  it('computes wave interference values', () => {
    expect(outputs.waveInterference.length).toBeGreaterThan(0);
    for (const wi of outputs.waveInterference) {
      expect(wi.maxInterference).toBe(2);
      expect(wi.minInterference).toBe(0);
    }
  });

  it('computes frequency response across the sweep', () => {
    expect(outputs.frequencyResponse.length).toBe(KINGS_CHAMBER.frequencySteps + 1);
    expect(outputs.frequencyResponse[0].frequency).toBeCloseTo(KINGS_CHAMBER.frequencyStart, 5);
    const last = outputs.frequencyResponse[outputs.frequencyResponse.length - 1];
    expect(last.frequency).toBeCloseTo(KINGS_CHAMBER.frequencyEnd, 5);
  });

  it('computes pressure distribution on a grid', () => {
    expect(outputs.pressureDistribution.length).toBe(6 * 6 * 6);
    for (const p of outputs.pressureDistribution) {
      expect(p.pressure).toBeGreaterThanOrEqual(-1);
      expect(p.pressure).toBeLessThanOrEqual(1);
    }
  });

  it('returns validation results', () => {
    expect(result.validation).toBeDefined();
    expect(result.validation.checks.length).toBe(3);
    expect(result.validation.checks.map((c) => c.name)).toEqual([
      'Energy conservation',
      'Mesh resolution adequacy',
      'Frequency convergence',
    ]);
  });

  it('metadata is preserved in the result', () => {
    expect(result.metadata.id).toBe('SIM-102');
    expect(result.metadata.theoryContext).toBe('THEORY-GP-002');
  });
});

describe('Acoustic Validation', () => {
  it("passes for King's Chamber dimensions", () => {
    const result = solveAcoustic(KINGS_CHAMBER, makeMetadata());
    const failed = result.validation.checks.filter((c) => !c.passed);
    expect(failed).toEqual([]);
  });

  it('fails mesh resolution for very small chambers', () => {
    const inputs: AcousticInputs = {
      ...KINGS_CHAMBER,
      chamberLength: 0.5,
      chamberWidth: 0.5,
      chamberHeight: 0.5,
    };
    const result = solveAcoustic(inputs, makeMetadata());
    const meshCheck = result.validation.checks.find((c) => c.name === 'Mesh resolution adequacy');
    expect(meshCheck?.passed).toBe(false);
  });

  it('reports energy conservation check', () => {
    const result = solveAcoustic(KINGS_CHAMBER, makeMetadata());
    const energyCheck = result.validation.checks.find((c) => c.name === 'Energy conservation');
    expect(energyCheck).toBeDefined();
    expect(energyCheck?.value).toBeLessThan(energyCheck!.threshold!);
  });
});

describe('Acoustic Visualization', () => {
  const result = solveAcoustic(KINGS_CHAMBER, makeMetadata());
  const outputs = result.outputs as unknown as AcousticOutputs;

  it('builds pressure isosurfaces at specified levels', () => {
    const isosurfaces = buildPressureIsosurfaces(outputs, [-0.5, 0, 0.5]);
    expect(isosurfaces).toHaveLength(3);
    expect(isosurfaces[0].level).toBe(-0.5);
    expect(isosurfaces[1].level).toBe(0);
    expect(isosurfaces[2].level).toBe(0.5);
  });

  it('builds heatmap with pressure range', () => {
    const heatmap = buildHeatmap(outputs);
    expect(heatmap.unit).toBe('Pa (relative)');
    expect(heatmap.range.min).toBeLessThanOrEqual(heatmap.range.max);
    expect(heatmap.grid.length).toBeGreaterThan(0);
  });

  it('builds wavefronts expanding from source', () => {
    const source = { x: 5, y: 3, z: 2.5 };
    const wavefronts = buildWavefronts(source, 343, 0.1, 10);
    expect(wavefronts).toHaveLength(10);
    for (let i = 1; i < wavefronts.length; i++) {
      expect(wavefronts[i].radius).toBeGreaterThan(wavefronts[i - 1].radius);
      expect(wavefronts[i].amplitude).toBeLessThan(wavefronts[i - 1].amplitude);
    }
  });

  it('builds particle motion data', () => {
    const pm = buildParticleMotion(outputs, 50);
    expect(pm.positions).toHaveLength(50);
    expect(pm.velocities).toHaveLength(50);
  });

  it('builds frequency spectrum with peaks at resonances', () => {
    const spectrum = buildFrequencySpectrum(outputs);
    expect(spectrum.frequencies.length).toBe(KINGS_CHAMBER.frequencySteps + 1);
    expect(spectrum.unit).toBe('dB SPL');
    expect(spectrum.peaks.length).toBeGreaterThan(0);
  });

  it('builds complete visualization with all 5 layers', () => {
    const viz = buildAcousticVisualization(outputs, KINGS_CHAMBER.sourceLocation, 343);
    expect(viz.isosurfaces.length).toBeGreaterThan(0);
    expect(viz.heatmaps.length).toBeGreaterThan(0);
    expect(viz.wavefronts.length).toBeGreaterThan(0);
    expect(viz.particleMotion.positions.length).toBeGreaterThan(0);
    expect(viz.frequencySpectrum.frequencies.length).toBeGreaterThan(0);
    expect(viz.activeLayers.size).toBe(5);
    expect(viz.unitsDisplayed).toBe(true);
  });
});

describe('Simulation Lifecycle', () => {
  let lifecycle: SimulationLifecycle;

  beforeEach(() => {
    lifecycle = new SimulationLifecycle();
  });

  it('starts in Idle state', () => {
    expect(lifecycle.getState()).toBe('Idle');
  });

  it('transitions through all states in order', () => {
    const states = LIFECYCLE_ORDER.slice(1);
    for (const state of states) {
      lifecycle.transition(state);
    }
    expect(lifecycle.getState()).toBe('Export');
  });

  it('rejects invalid transitions', () => {
    expect(() => lifecycle.transition('Simulation')).toThrow(/Invalid transition/);
  });

  it('resets to Idle', () => {
    lifecycle.transition('ParameterSelection');
    lifecycle.reset();
    expect(lifecycle.getState()).toBe('Idle');
  });

  it('records state history', () => {
    lifecycle.transition('ParameterSelection');
    lifecycle.transition('Validation');
    expect(lifecycle.getStateHistory().length).toBeGreaterThanOrEqual(2);
  });

  it('canTransitionTo returns correct value', () => {
    expect(lifecycle.canTransitionTo('ParameterSelection')).toBe(true);
    expect(lifecycle.canTransitionTo('Simulation')).toBe(false);
    expect(lifecycle.canTransitionTo('Idle')).toBe(true);
  });
});

describe('Parameter Store', () => {
  let store: ParameterStore;

  beforeEach(() => {
    store = new ParameterStore();
  });

  it('creates versioned parameter sets', () => {
    const params = defaultAcousticParameters(10.47, 5.24, 5.97);
    const set1 = store.create('Acoustic', params);
    expect(set1.version).toBe(1);
    const set2 = store.create('Acoustic', params);
    expect(set2.version).toBe(2);
  });

  it('retrieves by key', () => {
    const params = defaultAcousticParameters(10.47, 5.24, 5.97);
    const set = store.create('Acoustic', params);
    const retrieved = store.get(`Acoustic-v${set.version}`);
    expect(retrieved).toBeDefined();
    expect(retrieved?.simulationType).toBe('Acoustic');
  });

  it('gets latest version', () => {
    const params = defaultAcousticParameters(10.47, 5.24, 5.97);
    store.create('Acoustic', params);
    store.create('Acoustic', params);
    const latest = store.getLatest('Acoustic');
    expect(latest?.version).toBe(2);
  });

  it('validates provenance values', () => {
    const errors = store.validateParameters([
      { name: 'test', value: 1, provenance: 'Invalid' as never },
    ]);
    expect(errors.length).toBe(1);
    expect(errors[0]).toContain('invalid provenance');
  });

  it('serializes to and from JSON', () => {
    const params = defaultAcousticParameters(10.47, 5.24, 5.97);
    const set = store.create('Acoustic', params);
    const json = store.toJSON(`Acoustic-v${set.version}`);
    expect(json).not.toBeNull();

    const store2 = new ParameterStore();
    const restored = store2.fromJSON(json!);
    expect(restored.simulationType).toBe('Acoustic');
    expect(restored.version).toBe(set.version);
  });

  it('default acoustic parameters include all 12 required fields', () => {
    const params = defaultAcousticParameters(10.47, 5.24, 5.97);
    expect(params).toHaveLength(12);
    const names = params.map((p) => p.name);
    expect(names).toContain('chamberLength');
    expect(names).toContain('absorptionCoeff');
    expect(names).toContain('airTemperature');
    expect(names).toContain('frequencyStart');
    expect(names).toContain('frequencyEnd');
  });

  it('parameters have provenance classification', () => {
    const params = defaultAcousticParameters(10.47, 5.24, 5.97);
    for (const p of params) {
      expect(p.provenance).toBeDefined();
    }
    const measured = params.filter((p) => p.provenance === 'Measured');
    expect(measured.length).toBe(3);
  });
});

describe('Scientific Transparency Disclaimer', () => {
  it('contains required disclaimer text', () => {
    expect(SCIENTIFIC_TRANSPARENCY_DISCLAIMER).toContain('assumptions');
    expect(SCIENTIFIC_TRANSPARENCY_DISCLAIMER).toContain('not establish');
    expect(SCIENTIFIC_TRANSPARENCY_DISCLAIMER).toContain('historically correct');
  });
});
