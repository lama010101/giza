import { describe, it, expect } from 'vitest';
import { solveHydraulicSystem, type HydraulicInputs } from './hydraulicSolver';
import {
  generateVisualization,
  generateStreamlines,
  generateVelocityArrows,
  generatePressureHeatmap,
  generateParticleTracers,
  generateSurfaceAnimation,
  colorScaleValue,
  DEFAULT_VISUALIZATION_CONFIG,
  ALL_VISUALIZATION_LAYERS,
  type VisualizationConfig,
} from './hydraulicVisualization';

const DEFAULT_INPUTS: HydraulicInputs = {
  chamberWidth: 6.5,
  chamberDepth: 9.0,
  chamberHeight: 3.0,
  conduitDiameter: 0.6,
  conduitLength: 6.8,
  conduitSlope: 5,
  inflowRate: 0.01,
  initialWaterLevel: 0.5,
  targetWaterLevel: 2.0,
  manningRoughness: 0.015,
  gravity: 9.81,
  restrictionCoefficient: 0.6,
  boundaryType: 'semi-open',
  ambientPressure: 101325,
  waterDensity: 1000,
  waterViscosity: 0.001,
  timeStep: 0.1,
  maxIterations: 1000,
};

describe('Hydraulic Visualization (M10-T13, GIZA-06 §1.10)', () => {
  const result = solveHydraulicSystem(DEFAULT_INPUTS);

  describe('ALL_VISUALIZATION_LAYERS', () => {
    it('defines all 5 visualization layers', () => {
      expect(ALL_VISUALIZATION_LAYERS).toHaveLength(5);
      expect(ALL_VISUALIZATION_LAYERS).toContain('streamlines');
      expect(ALL_VISUALIZATION_LAYERS).toContain('velocity-arrows');
      expect(ALL_VISUALIZATION_LAYERS).toContain('pressure-heatmap');
      expect(ALL_VISUALIZATION_LAYERS).toContain('surface-animation');
      expect(ALL_VISUALIZATION_LAYERS).toContain('particle-tracers');
    });
  });

  describe('colorScaleValue', () => {
    it('returns valid rgb strings for viridis', () => {
      const color = colorScaleValue(0.5, 0, 1, 'viridis');
      expect(color).toMatch(/^rgb\(/);
    });

    it('clamps values outside range', () => {
      const below = colorScaleValue(-1, 0, 1, 'viridis');
      const atMin = colorScaleValue(0, 0, 1, 'viridis');
      const above = colorScaleValue(2, 0, 1, 'viridis');
      const atMax = colorScaleValue(1, 0, 1, 'viridis');
      expect(below).toBe(atMin); // clamped to min
      expect(above).toBe(atMax); // clamped to max
    });

    it('supports all 4 color scales', () => {
      for (const scale of ['viridis', 'plasma', 'coolwarm', 'grayscale'] as const) {
        const color = colorScaleValue(0.5, 0, 1, scale);
        expect(color).toMatch(/^rgb\(/);
      }
    });
  });

  describe('generateStreamlines', () => {
    it('generates streamlines from velocity field', () => {
      const streamlines = generateStreamlines(result, 10);
      expect(streamlines.length).toBeGreaterThan(0);
      expect(streamlines[0].points.length).toBeGreaterThan(0);
    });

    it('respects density parameter', () => {
      const streamlines = generateStreamlines(result, 20);
      expect(streamlines.length).toBeLessThanOrEqual(20);
    });
  });

  describe('generateVelocityArrows', () => {
    it('generates arrows with units label', () => {
      const arrows = generateVelocityArrows(result, 1.0, true);
      expect(arrows.length).toBeGreaterThan(0);
      expect(arrows[0].label).toContain('m/s');
    });

    it('generates arrows without units when showUnits is false', () => {
      const arrows = generateVelocityArrows(result, 1.0, false);
      expect(arrows[0].label).not.toContain('m/s');
    });
  });

  describe('generatePressureHeatmap', () => {
    it('generates heatmap points with colors', () => {
      const heatmap = generatePressureHeatmap(result, 'viridis', true);
      expect(heatmap.length).toBeGreaterThan(0);
      expect(heatmap[0].color).toMatch(/^rgb\(/);
    });

    it('includes pressure in kPa', () => {
      const heatmap = generatePressureHeatmap(result, 'viridis', true);
      expect(heatmap[0].pressureKPa).toBeGreaterThan(0);
      expect(heatmap[0].label).toContain('kPa');
    });
  });

  describe('generateParticleTracers', () => {
    it('generates the requested number of particles', () => {
      const particles = generateParticleTracers(result, 50);
      expect(particles.length).toBeLessThanOrEqual(50);
    });

    it('each particle has a lifetime', () => {
      const particles = generateParticleTracers(result, 10);
      for (const p of particles) {
        expect(p.lifetime).toBeGreaterThan(0);
      }
    });
  });

  describe('generateSurfaceAnimation', () => {
    it('generates animation config with amplitude and frequency', () => {
      const anim = generateSurfaceAnimation(result, 0);
      expect(anim.amplitude).toBeGreaterThanOrEqual(0);
      expect(anim.frequency).toBeGreaterThanOrEqual(0);
    });

    it('amplitude increases with turbulence', () => {
      const lowTurb = generateSurfaceAnimation({ ...result, turbulenceIntensity: 0 }, 0);
      const highTurb = generateSurfaceAnimation({ ...result, turbulenceIntensity: 1 }, 0);
      expect(highTurb.amplitude).toBeGreaterThan(lowTurb.amplitude);
    });
  });

  describe('generateVisualization (bundle)', () => {
    it('generates all enabled layers', () => {
      const config: VisualizationConfig = {
        ...DEFAULT_VISUALIZATION_CONFIG,
        enabledLayers: new Set(ALL_VISUALIZATION_LAYERS),
      };
      const bundle = generateVisualization(result, config, 0);
      expect(bundle.streamlines.length).toBeGreaterThan(0);
      expect(bundle.velocityArrows.length).toBeGreaterThan(0);
      expect(bundle.pressureHeatmap.length).toBeGreaterThan(0);
      expect(bundle.particleTracers.length).toBeGreaterThan(0);
      expect(bundle.surfaceAnimation.amplitude).toBeGreaterThanOrEqual(0);
    });

    it('skips disabled layers', () => {
      const config: VisualizationConfig = {
        ...DEFAULT_VISUALIZATION_CONFIG,
        enabledLayers: new Set(),
      };
      const bundle = generateVisualization(result, config, 0);
      expect(bundle.streamlines).toHaveLength(0);
      expect(bundle.velocityArrows).toHaveLength(0);
      expect(bundle.pressureHeatmap).toHaveLength(0);
      expect(bundle.particleTracers).toHaveLength(0);
    });

    it('multiple overlays can be displayed simultaneously', () => {
      const config: VisualizationConfig = {
        ...DEFAULT_VISUALIZATION_CONFIG,
        enabledLayers: new Set(['velocity-arrows', 'pressure-heatmap', 'streamlines']),
      };
      const bundle = generateVisualization(result, config, 0);
      expect(bundle.velocityArrows.length).toBeGreaterThan(0);
      expect(bundle.pressureHeatmap.length).toBeGreaterThan(0);
      expect(bundle.streamlines.length).toBeGreaterThan(0);
    });
  });
});
