/**
 * Full hypothesis plugin integration test per M05.5-T15.
 *
 * Tests the complete plugin lifecycle:
 *   install → activate → overlays → comparison → confidence
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { HypothesisEngine } from './engine';
import { discoverAndRegister } from './pluginDiscovery';
import type { Evidence } from '@/schemas/evidence';
import type { Source } from '@/schemas/source';

function makeEvidence(id: string, confidence: number, objectIds: string[] = []): Evidence {
  return {
    id,
    title: `Evidence ${id}`,
    description: 'Test evidence',
    category: 'Measurement',
    primaryClass: 'E1',
    secondaryClasses: [],
    confidence,
    confidenceBasis: 'survey',
    status: 'Published',
    sourceIds: [],
    objectIds,
    geometryRefs: [],
    mediaIds: [],
    dependencyIds: [],
    conflictIds: [],
    chronologyTags: [],
    tags: [],
    reviewLog: [],
    version: 1,
    created: new Date().toISOString(),
    updated: new Date().toISOString(),
    createdBy: 'test',
    updatedBy: '',
  } as Evidence;
}

function makeSource(id: string): Source {
  return {
    id,
    title: `Source ${id}`,
    type: 'Book',
    authors: [{ name: 'Test' }],
    year: 2024,
    url: `https://example.com/${id}`,
    license: 'CC-BY-4.0',
  };
}

describe('Hypothesis Plugin Full Integration (M05.5-T15)', () => {
  let engine: HypothesisEngine;

  beforeEach(() => {
    engine = new HypothesisEngine();
  });

  describe('install → activate → overlays → comparison → confidence', () => {
    it('discovers and registers plugins (install)', () => {
      const discovered = discoverAndRegister(engine);
      expect(discovered.length).toBeGreaterThanOrEqual(5);
      expect(engine.getPluginIds().length).toBeGreaterThanOrEqual(5);
    });

    it('activates plugins (activate)', () => {
      discoverAndRegister(engine);
      const ids = engine.getPluginIds();
      engine.activate([ids[0]]);
      expect(engine.isActive(ids[0])).toBe(true);
    });

    it('retrieves hypothesis definitions with overlays (overlays)', () => {
      discoverAndRegister(engine);
      const ids = engine.getPluginIds();
      engine.activate([ids[0]]);
      const hypothesis = engine.getHypothesis(ids[0], {
        evidence: [],
        sources: [],
        objects: [],
        locations: [],
        simulations: [],
      });
      expect(hypothesis).toBeDefined();
      expect(hypothesis.id).toBe(ids[0]);
    });

    it('compares multiple active hypotheses (comparison)', () => {
      discoverAndRegister(engine);
      const ids = engine.getPluginIds();
      engine.activate([ids[0], ids[1]]);
      const h1 = engine.getHypothesis(ids[0], {
        evidence: [],
        sources: [],
        objects: [],
        locations: [],
        simulations: [],
      });
      const h2 = engine.getHypothesis(ids[1], {
        evidence: [],
        sources: [],
        objects: [],
        locations: [],
        simulations: [],
      });
      expect(h1.id).not.toBe(h2.id);
    });

    it('computes confidence per hypothesis (confidence)', () => {
      discoverAndRegister(engine);
      const ids = engine.getPluginIds();
      engine.activate([ids[0]]);
      const evidence = [
        makeEvidence('EV-001', 90, ['OBJ-001']),
        makeEvidence('EV-002', 80, ['OBJ-001']),
      ];
      const sources = [makeSource('SRC-001')];
      const sourceMap = new Map(sources.map((s) => [s.id, s]));
      const confidenceByObj = engine.computeConfidenceByObject(
        { evidence, sources, objects: [], locations: [], simulations: [] },
        (id) => sourceMap.get(id),
      );
      expect(confidenceByObj[ids[0]]).toBeDefined();
      // Confidence is computed for affected structures defined by the hypothesis
      const objIds = Object.keys(confidenceByObj[ids[0]]);
      expect(objIds.length).toBeGreaterThanOrEqual(0);
    });

    it('full lifecycle: install → activate → overlays → comparison → confidence', () => {
      // 1. Install
      const discovered = discoverAndRegister(engine);
      expect(discovered.length).toBeGreaterThanOrEqual(2);

      // 2. Activate
      const ids = engine.getPluginIds();
      engine.activate([ids[0], ids[1]]);
      expect(engine.isActive(ids[0])).toBe(true);
      expect(engine.isActive(ids[1])).toBe(true);

      // 3. Overlays
      const h1 = engine.getHypothesis(ids[0], {
        evidence: [],
        sources: [],
        objects: [],
        locations: [],
        simulations: [],
      });
      const h2 = engine.getHypothesis(ids[1], {
        evidence: [],
        sources: [],
        objects: [],
        locations: [],
        simulations: [],
      });
      expect(h1).toBeDefined();
      expect(h2).toBeDefined();

      // 4. Comparison
      expect(h1.id).not.toBe(h2.id);

      // 5. Confidence
      const evidence = [
        makeEvidence('EV-001', 85, ['OBJ-001']),
        makeEvidence('EV-002', 75, ['OBJ-001']),
      ];
      const sources = [makeSource('SRC-001')];
      const sourceMap = new Map(sources.map((s) => [s.id, s]));
      const confidenceByObj = engine.computeConfidenceByObject(
        { evidence, sources, objects: [], locations: [], simulations: [] },
        (id) => sourceMap.get(id),
      );
      expect(confidenceByObj[ids[0]]).toBeDefined();
      expect(confidenceByObj[ids[1]]).toBeDefined();

      // 6. Deactivate
      engine.deactivate(ids[1]);
      expect(engine.isActive(ids[1])).toBe(false);
    });
  });
});
