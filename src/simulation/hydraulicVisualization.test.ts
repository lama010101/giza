import { describe, it, expect } from 'vitest';
import {
  generateStreamlines,
  generateVelocityArrows,
  generatePressureHeatmap,
  generateVelocityHeatmap,
  buildVisualization,
  HYDRAULIC_COLOR_MAP,
  type Vector3,
} from './hydraulicVisualization';

function makeVelocityField(): { position: Vector3; velocity: Vector3 }[] {
  return [
    { position: { x: 0, y: 0, z: 0 }, velocity: { x: 1, y: 0, z: 0 } },
    { position: { x: 1, y: 0, z: 0 }, velocity: { x: 1, y: 0, z: 0 } },
    { position: { x: 2, y: 0, z: 0 }, velocity: { x: 0.5, y: 0, z: 0 } },
    { position: { x: 0, y: 1, z: 0 }, velocity: { x: 0, y: 1, z: 0 } },
    { position: { x: 0, y: 0, z: 1 }, velocity: { x: 0, y: 0, z: 0.5 } },
  ];
}

function makePressureField(): { position: Vector3; pressure: number }[] {
  return [
    { position: { x: 0, y: 0, z: 0 }, pressure: 100000 },
    { position: { x: 1, y: 0, z: 0 }, pressure: 90000 },
    { position: { x: 2, y: 0, z: 0 }, pressure: 80000 },
  ];
}

describe('Hydraulic Visualization (M10-T13)', () => {
  describe('HYDRAULIC_COLOR_MAP', () => {
    it('has 5 colors', () => {
      expect(HYDRAULIC_COLOR_MAP).toHaveLength(5);
    });

    it('starts with blue and ends with red', () => {
      expect(HYDRAULIC_COLOR_MAP[0]).toBe('#0000ff');
      expect(HYDRAULIC_COLOR_MAP[4]).toBe('#ff0000');
    });
  });

  describe('generateStreamlines', () => {
    it('generates streamlines from seed points', () => {
      const field = makeVelocityField();
      const seeds: Vector3[] = [{ x: 0, y: 0, z: 0 }];
      const streamlines = generateStreamlines(field, seeds, 10, 0.5);
      expect(streamlines).toHaveLength(1);
      expect(streamlines[0].points.length).toBeGreaterThan(1);
    });

    it('stops at stagnation', () => {
      const field = [{ position: { x: 0, y: 0, z: 0 }, velocity: { x: 0, y: 0, z: 0 } }];
      const seeds: Vector3[] = [{ x: 0, y: 0, z: 0 }];
      const streamlines = generateStreamlines(field, seeds, 10, 0.5);
      // Should stop quickly (seed + maybe one more point before stagnation)
      expect(streamlines[0].points.length).toBeLessThanOrEqual(2);
    });
  });

  describe('generateVelocityArrows', () => {
    it('generates arrows from velocity field', () => {
      const field = makeVelocityField();
      const arrows = generateVelocityArrows(field, 1);
      expect(arrows.length).toBeGreaterThan(0);
      expect(arrows[0].direction).toBeDefined();
      expect(arrows[0].magnitude).toBeGreaterThan(0);
    });

    it('normalizes direction vectors', () => {
      const field = [{ position: { x: 0, y: 0, z: 0 }, velocity: { x: 3, y: 4, z: 0 } }];
      const arrows = generateVelocityArrows(field, 1);
      const len = Math.sqrt(
        arrows[0].direction.x ** 2 + arrows[0].direction.y ** 2 + arrows[0].direction.z ** 2,
      );
      expect(len).toBeCloseTo(1, 5);
    });
  });

  describe('generatePressureHeatmap', () => {
    it('normalizes pressure values to 0-1', () => {
      const field = makePressureField();
      const heatmap = generatePressureHeatmap(field);
      expect(heatmap[0].value).toBeGreaterThanOrEqual(0);
      expect(heatmap[0].value).toBeLessThanOrEqual(1);
      expect(heatmap[1].value).toBeLessThan(heatmap[0].value);
    });
  });

  describe('generateVelocityHeatmap', () => {
    it('normalizes velocity magnitudes to 0-1', () => {
      const field = makeVelocityField();
      const heatmap = generateVelocityHeatmap(field);
      for (const cell of heatmap) {
        expect(cell.value).toBeGreaterThanOrEqual(0);
        expect(cell.value).toBeLessThanOrEqual(1);
      }
    });
  });

  describe('buildVisualization', () => {
    it('builds streamlines visualization', () => {
      const field = makeVelocityField();
      const viz = buildVisualization('streamlines', field);
      expect(viz.type).toBe('streamlines');
      expect(viz.streamlines).toBeDefined();
      expect(viz.units).toBe('m/s');
    });

    it('builds velocity-arrows visualization', () => {
      const field = makeVelocityField();
      const viz = buildVisualization('velocity-arrows', field);
      expect(viz.type).toBe('velocity-arrows');
      expect(viz.velocityArrows).toBeDefined();
    });

    it('builds pressure-heatmap visualization', () => {
      const field = makeVelocityField();
      const pressure = makePressureField();
      const viz = buildVisualization('pressure-heatmap', field, pressure);
      expect(viz.type).toBe('pressure-heatmap');
      expect(viz.heatmap).toBeDefined();
      expect(viz.units).toBe('Pa');
    });

    it('builds velocity-heatmap visualization', () => {
      const field = makeVelocityField();
      const viz = buildVisualization('velocity-heatmap', field);
      expect(viz.type).toBe('velocity-heatmap');
      expect(viz.heatmap).toBeDefined();
    });
  });
});
