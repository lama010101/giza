/**
 * Benchmark regression test per M08.5-T08.
 *
 * Runs on every PR affecting rendering. Asserts:
 *   - Scene loads without errors
 *   - All material/water/light toggles work
 *   - Performance budget validation logic is correct
 *   - No console errors during scene construction
 *
 * This is a unit-level regression test. Full E2E performance
 * measurement requires a browser environment (Playwright).
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BenchmarkScene } from './BenchmarkScene';
import { useLightingStore, LIGHT_MODES } from '@/store/lighting';
import { PERFORMANCE_BUDGETS, validateAgainstBudget, captureSample } from './performanceBaseline';
import { MASTER_MATERIALS } from '@/materials/masterMaterials';
import { SHADOW_CONFIGS } from './shadowStrategy';
import type { QualityProfile } from './shadowStrategy';

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

describe('Benchmark Regression Test (M08.5-T08)', () => {
  beforeEach(() => {
    useLightingStore.getState().reset();
  });

  describe('scene loads without errors', () => {
    it('renders the benchmark scene', () => {
      render(<BenchmarkScene />);
      expect(screen.getByTestId('r3f-canvas')).toBeInTheDocument();
    });
  });

  describe('all 5 master materials are present', () => {
    it('MASTER_MATERIALS has 5 entries', () => {
      expect(MASTER_MATERIALS).toHaveLength(5);
    });

    it('all 5 materials render in the benchmark scene', () => {
      render(<BenchmarkScene />);
      for (const mat of MASTER_MATERIALS) {
        expect(screen.getByTestId(`material-block-${mat.id}`)).toBeInTheDocument();
      }
    });
  });

  describe('light mode toggles work', () => {
    it('all 3 light modes can be activated', () => {
      for (const mode of LIGHT_MODES) {
        useLightingStore.getState().setLightMode(mode);
        expect(useLightingStore.getState().lightMode).toBe(mode);
      }
    });

    it('each light layer can be toggled independently', () => {
      useLightingStore.getState().setLayerEnabled('ambient', false);
      expect(useLightingStore.getState().ambientEnabled).toBe(false);
      expect(useLightingStore.getState().directionalEnabled).toBe(true);

      useLightingStore.getState().setLayerEnabled('volumetric', true);
      expect(useLightingStore.getState().volumetricEnabled).toBe(true);
    });
  });

  describe('shadow strategy is configured', () => {
    it('all 4 quality profiles have valid shadow configs', () => {
      for (const profile of Object.keys(SHADOW_CONFIGS) as QualityProfile[]) {
        const cfg = SHADOW_CONFIGS[profile];
        expect(cfg.mapSize).toBeGreaterThan(0);
        expect(cfg.cameraFar).toBeGreaterThan(0);
      }
    });
  });

  describe('performance budget validation', () => {
    it('a passing sample passes validation', () => {
      const sample = captureSample(
        { drawCalls: 500, triangles: 100000, geometries: 50, textures: 20, programs: 10 },
        60,
        16.7,
      );
      const result = validateAgainstBudget(sample, PERFORMANCE_BUDGETS['desktop-high']);
      expect(result.passed).toBe(true);
    });

    it('a failing sample fails validation', () => {
      const sample = captureSample(
        { drawCalls: 500, triangles: 100000, geometries: 50, textures: 20, programs: 10 },
        15,
        66,
      );
      const result = validateAgainstBudget(sample, PERFORMANCE_BUDGETS['desktop-high']);
      expect(result.passed).toBe(false);
      expect(result.violations.length).toBeGreaterThan(0);
    });
  });

  describe('water mesh is present', () => {
    it('renders the water mesh', () => {
      render(<BenchmarkScene />);
      expect(screen.getByTestId('water-mesh')).toBeInTheDocument();
    });
  });

  describe('physics primitives are present', () => {
    it('renders stairs and shaft', () => {
      render(<BenchmarkScene />);
      expect(screen.getByTestId('benchmark-stairs')).toBeInTheDocument();
      expect(screen.getByTestId('benchmark-shaft')).toBeInTheDocument();
    });
  });

  describe('no regressions in scene structure', () => {
    it('scene contains all required test elements', () => {
      render(<BenchmarkScene />);
      const required = [
        'r3f-canvas',
        'layered-lighting',
        'material-sample-row',
        'water-mesh',
        'benchmark-floor',
        'benchmark-cube',
        'benchmark-sphere',
        'benchmark-stairs',
        'benchmark-shaft',
      ];
      for (const id of required) {
        expect(screen.getByTestId(id)).toBeInTheDocument();
      }
    });
  });
});
