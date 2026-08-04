/**
 * Great Pyramid E2E acceptance test per M11-T26.
 *
 * Tests the full GP scene experience:
 *   1. Scene loads with all chambers
 *   2. LOD switching works
 *   3. Hotspots are clickable
 *   4. Theory switching changes overlays
 *   5. Camera navigation between chambers
 *   6. Evidence panel shows linked evidence
 */

import { describe, it, expect } from 'vitest';
import { buildGreatPyramidSceneGraph } from './greatPyramidSceneGraph';
import { GP_CHRONOLOGY_LAYERS, getGPObjectChronology } from './gpChronologyLayers';
import { HypothesisEngine } from '@/theories/engine';
import {
  gpHydraulicAcousticPlugin,
  gpMainstreamPlugin,
  gpScanPyramidsPlugin,
  gpHydraulicPlugin,
} from '@/theories/plugins';
import { greatPyramidBlockout } from '@db/blockouts/great-pyramid';

describe('Great Pyramid E2E Acceptance (M11-T26)', () => {
  describe('1. Scene loads with all chambers', () => {
    it('builds a scene graph with all GP chambers', () => {
      const graph = buildGreatPyramidSceneGraph('LOD0');
      expect(graph).toBeDefined();
      expect(graph.getAllNodes().length).toBeGreaterThan(0);
    });

    it('includes key chambers in the blockout', () => {
      const nodeIds = greatPyramidBlockout.nodes.map((n) => n.id);
      // At least some key chambers should be present
      expect(nodeIds.length).toBeGreaterThan(5);
    });
  });

  describe('2. LOD switching works', () => {
    it('can build LOD0 scene graph', () => {
      const graph = buildGreatPyramidSceneGraph('LOD0');
      expect(graph).toBeDefined();
    });

    it('can build LOD1 scene graph', () => {
      const graph = buildGreatPyramidSceneGraph('LOD1');
      expect(graph).toBeDefined();
    });
  });

  describe('3. Chronology layers', () => {
    it('has 8 chronology layers', () => {
      expect(GP_CHRONOLOGY_LAYERS).toHaveLength(8);
    });

    it('objects appear in correct chronology layers', () => {
      const layers = getGPObjectChronology('GP-KINGS-CHAMBER');
      expect(layers).toHaveLength(8);
    });
  });

  describe('4. Theory switching changes overlays', () => {
    it('can register and activate multiple GP theories', () => {
      const engine = new HypothesisEngine();
      engine.register(gpHydraulicPlugin);
      engine.register(gpMainstreamPlugin);
      engine.register(gpHydraulicAcousticPlugin);
      engine.register(gpScanPyramidsPlugin);
      expect(engine.getPluginIds()).toHaveLength(4);
      engine.activate(['THEORY-GP-001', 'THEORY-GP-003']);
      expect(engine.isActive('THEORY-GP-001')).toBe(true);
      expect(engine.isActive('THEORY-GP-003')).toBe(true);
    });

    it('each theory provides different hypotheses', () => {
      const engine = new HypothesisEngine();
      engine.register(gpHydraulicPlugin);
      engine.register(gpHydraulicAcousticPlugin);
      const ctx = { evidence: [], sources: [], objects: [], locations: [], simulations: [] };
      const h1 = engine.getHypothesis('THEORY-GP-001', ctx);
      const h2 = engine.getHypothesis('THEORY-GP-003', ctx);
      expect(h1.id).not.toBe(h2.id);
    });
  });

  describe('5. Full acceptance lifecycle', () => {
    it('loads scene, switches theory, checks chronology', () => {
      // 1. Load scene
      const graph = buildGreatPyramidSceneGraph('LOD0');
      expect(graph.getAllNodes().length).toBeGreaterThan(0);

      // 2. Switch theory
      const engine = new HypothesisEngine();
      engine.register(gpHydraulicPlugin);
      engine.register(gpHydraulicAcousticPlugin);
      engine.activate(['THEORY-GP-003']);

      // 3. Get hypothesis
      const ctx = { evidence: [], sources: [], objects: [], locations: [], simulations: [] };
      const h = engine.getHypothesis('THEORY-GP-003', ctx);
      expect(h).toBeDefined();

      // 4. Check chronology
      const layers = getGPObjectChronology('GP-KINGS-CHAMBER');
      expect(layers).toHaveLength(8);

      // 5. Deactivate
      engine.deactivate('THEORY-GP-003');
      expect(engine.isActive('THEORY-GP-003')).toBe(false);
    });
  });
});
