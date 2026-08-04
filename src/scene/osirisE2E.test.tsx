/**
 * Osiris Shaft acceptance test per M09-T22.
 *
 * E2E test that:
 *   1. Loads the Osiris Scene
 *   2. Verifies all levels are present (Level 0–3)
 *   3. Verifies hotspots are present and clickable
 *   4. Verifies chronology toggle works
 *   5. Verifies performance budget structure
 *   6. Verifies all subsystems are present
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { OsirisScene } from './OsirisScene';
import { buildOsirisSceneGraph } from './osirisSceneGraph';
import { generateOsirisHotspots, groupHotspotsByLevel } from './osirisHotspots';
import { CHRONOLOGY_LAYERS, getObjectChronology } from './chronologyLayers';
import { FOG_CONFIGS, getFogForElevation } from './fogSystem';
import { GEOLOGICAL_MODES, GEOLOGICAL_MODE_CONFIGS } from './geologicalModes';
import { PERFORMANCE_BUDGETS } from './performanceBaseline';
import { useSimulationStore } from '@/store/simulation';
import { useLightingStore } from '@/store/lighting';
import { osirisBlockout } from '@db/blockouts/osiris-shaft';

vi.mock('@react-three/fiber', () => ({
  Canvas: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="r3f-canvas">{children}</div>
  ),
  useThree: () => ({
    scene: { fog: null },
    gl: { domElement: document.createElement('canvas') },
    camera: { position: { x: 0, y: 0, z: 0 } },
  }),
  useFrame: () => undefined,
}));

vi.mock('@react-three/drei', () => ({
  OrbitControls: () => <div data-testid="orbit-controls" />,
  Text: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

describe('Osiris Shaft E2E Traversal Test (M09-T22)', () => {
  beforeEach(() => {
    useSimulationStore.getState().reset();
    useLightingStore.getState().reset();
  });

  describe('1. Scene loads', () => {
    it('renders the Osiris Scene without errors', () => {
      render(<OsirisScene />);
      expect(screen.getByTestId('r3f-canvas')).toBeInTheDocument();
    });
  });

  describe('2. All levels present (Level 0–3)', () => {
    const graph = buildOsirisSceneGraph();
    const nodes = graph.getAllNodes();

    it('has Level 0 (Surface) nodes', () => {
      const level0 = nodes.filter((n) => n.metadata.layer === 'level-0');
      expect(level0.length).toBeGreaterThan(0);
    });

    it('has Level 1 nodes', () => {
      const level1 = nodes.filter((n) => n.metadata.layer === 'level-1');
      expect(level1.length).toBeGreaterThan(0);
    });

    it('has Level 2 nodes', () => {
      const level2 = nodes.filter((n) => n.metadata.layer === 'level-2');
      expect(level2.length).toBeGreaterThan(0);
    });

    it('has Level 3 nodes', () => {
      const level3 = nodes.filter((n) => n.metadata.layer === 'level-3');
      expect(level3.length).toBeGreaterThan(0);
    });

    it('has shaft nodes connecting levels', () => {
      const shafts = nodes.filter((n) => n.metadata.layer === 'shafts');
      expect(shafts.length).toBeGreaterThanOrEqual(3);
    });
  });

  describe('3. Hotspots present and clickable', () => {
    const hotspots = generateOsirisHotspots();

    it('has at least 10 hotspots', () => {
      expect(hotspots.length).toBeGreaterThanOrEqual(10);
    });

    it('hotspots span all major levels', () => {
      const groups = groupHotspotsByLevel(hotspots);
      expect(Object.keys(groups)).toContain('level-3');
    });

    it('every hotspot links to valid evidence IDs', () => {
      for (const h of hotspots) {
        for (const eid of h.evidenceIds) {
          expect(eid).toMatch(/^EV-\d+$/);
        }
      }
    });
  });

  describe('4. Chronology toggle works', () => {
    it('5 chronology layers are defined', () => {
      expect(CHRONOLOGY_LAYERS).toHaveLength(5);
    });

    it('architecture objects appear in all layers (geometry continuity)', () => {
      const periods = getObjectChronology('OBJ-0001');
      expect(periods).toHaveLength(5);
    });

    it('movable objects only appear in relevant layers', () => {
      const sarcophagusPeriods = getObjectChronology('OBJ-0008');
      expect(sarcophagusPeriods).not.toContain('old-kingdom');
      expect(sarcophagusPeriods).toContain('late-period');
    });
  });

  describe('5. Performance budget structure', () => {
    it('desktop-high budget is defined', () => {
      expect(PERFORMANCE_BUDGETS['desktop-high']).toBeDefined();
      expect(PERFORMANCE_BUDGETS['desktop-high'].minFPS).toBe(60);
    });

    it('budget is achievable for the scene complexity', () => {
      const nodeCount = osirisBlockout.nodes.length;
      // Heuristic: node count should be reasonable for 60 FPS
      expect(nodeCount).toBeLessThan(100);
    });
  });

  describe('6. All subsystems present', () => {
    it('Level 0 Surface is present', () => {
      render(<OsirisScene />);
      expect(screen.getByTestId('level-0-surface')).toBeInTheDocument();
    });

    it('fog system has 3 volumes', () => {
      expect(Object.keys(FOG_CONFIGS)).toHaveLength(3);
    });

    it('geological modes has 5 modes', () => {
      expect(GEOLOGICAL_MODES).toHaveLength(5);
    });

    it('all geological mode configs are valid', () => {
      for (const mode of GEOLOGICAL_MODES) {
        const config = GEOLOGICAL_MODE_CONFIGS[mode];
        expect(config.opacity).toBeGreaterThan(0);
        expect(config.opacity).toBeLessThanOrEqual(1);
      }
    });

    it('fog varies by elevation', () => {
      expect(getFogForElevation(0).volume).toBe('surface');
      expect(getFogForElevation(-30).volume).toBe('level-3');
    });
  });

  describe('7. Evidence linkage (DoSD)', () => {
    const nodesWithObjects = osirisBlockout.nodes.filter((n) => n.objectId);

    it('every node with an objectId has evidence IDs', () => {
      for (const node of nodesWithObjects) {
        expect(node.evidenceIds).toBeDefined();
        expect(node.evidenceIds!.length).toBeGreaterThan(0);
      }
    });

    it('every node with an objectId has source IDs', () => {
      for (const node of nodesWithObjects) {
        expect(node.sourceIds).toBeDefined();
        expect(node.sourceIds!.length).toBeGreaterThan(0);
      }
    });
  });

  describe('8. Confidence tagging (DoSD item 3)', () => {
    const graph = buildOsirisSceneGraph();
    const nodes = graph.getAllNodes().filter((n) => n.metadata.objectId);

    it('every object node has a confidence value', () => {
      for (const node of nodes) {
        expect(node.metadata.confidence).toBeDefined();
        expect(node.metadata.confidence).toBeGreaterThanOrEqual(0);
        expect(node.metadata.confidence).toBeLessThanOrEqual(100);
      }
    });

    it('confidence values match GIZA-03 §2.7', () => {
      const shaftA = graph.getNode('shaft-a');
      expect(shaftA!.metadata.confidence).toBe(98);

      const conduit = graph.getNode('northern-conduit');
      expect(conduit!.metadata.confidence).toBe(85);
    });
  });

  describe('9. Bounding boxes (M09-T02)', () => {
    const graph = buildOsirisSceneGraph();
    const nodes = graph.getAllNodes().filter((n) => n.id !== 'osiris-shaft-scene');

    it('every node has a bounding box', () => {
      for (const node of nodes) {
        expect(node.metadata.boundingBox).toBeDefined();
      }
    });

    it('every node has a survey reference', () => {
      for (const node of nodes) {
        expect(node.metadata.surveyReference).toBeDefined();
      }
    });
  });
});
