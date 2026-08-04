/**
 * Simulation integration tests per M10-T19.
 *
 * Tests the full hydraulic simulation pipeline:
 *   1. Geometry extraction from Osiris Shaft blockout
 *   2. Solver execution with Level 3 geometry
 *   3. Validation against reference data
 *   4. Visualization generation
 *   5. Integration with Osiris Scene
 */

import { describe, it, expect } from 'vitest';
import {
  extractLevel3Geometry,
  runOsirisHydraulicSimulation,
  getWorldWaterLevel,
  DEFAULT_OSIRIS_HYDRAULIC_CONFIG,
  type OsirisHydraulicConfig,
} from './osirisHydraulicIntegration';
import { osirisBlockout } from '@db/blockouts/osiris-shaft';
import { solveHydraulicSystem } from './hydraulicSolver';
import { validateHydraulicSimulation, OSIRIS_SHAFT_REFERENCE } from './hydraulicValidation';
import { generateVisualization, DEFAULT_VISUALIZATION_CONFIG } from './hydraulicVisualization';

describe('Simulation Integration Tests (M10-T19)', () => {
  describe('extractLevel3Geometry', () => {
    it('extracts geometry from the Osiris Shaft blockout', () => {
      const geo = extractLevel3Geometry();
      expect(geo.chamberWidth).toBeGreaterThan(0);
      expect(geo.chamberDepth).toBeGreaterThan(0);
      expect(geo.chamberHeight).toBeGreaterThan(0);
    });

    it('matches Chamber I dimensions from blockout', () => {
      const geo = extractLevel3Geometry();
      const chamber = osirisBlockout.nodes.find((n) => n.id === 'chamber-i')!;
      expect(geo.chamberWidth).toBe(chamber.size.x);
      expect(geo.chamberDepth).toBe(chamber.size.z);
      expect(geo.chamberHeight).toBe(chamber.size.y);
    });

    it('extracts conduit dimensions', () => {
      const geo = extractLevel3Geometry();
      expect(geo.conduitDiameter).toBeGreaterThan(0);
      expect(geo.conduitLength).toBeGreaterThan(0);
    });

    it('computes floor and ceiling elevations', () => {
      const geo = extractLevel3Geometry();
      expect(geo.chamberFloorY).toBeLessThan(geo.chamberCeilingY);
    });
  });

  describe('runOsirisHydraulicSimulation (full pipeline)', () => {
    const result = runOsirisHydraulicSimulation();

    it('returns all integration components', () => {
      expect(result.geometry).toBeDefined();
      expect(result.inputs).toBeDefined();
      expect(result.solverResult).toBeDefined();
      expect(result.timeSeries).toBeDefined();
      expect(result.validation).toBeDefined();
      expect(result.visualization).toBeDefined();
    });

    it('uses Level 3 geometry in the solver inputs', () => {
      expect(result.inputs.chamberWidth).toBe(result.geometry.chamberWidth);
      expect(result.inputs.chamberDepth).toBe(result.geometry.chamberDepth);
      expect(result.inputs.conduitDiameter).toBe(result.geometry.conduitDiameter);
    });

    it('produces a time series with the configured duration', () => {
      expect(result.timeSeries.length).toBeGreaterThan(0);
      const lastTime = result.timeSeries[result.timeSeries.length - 1].time;
      expect(lastTime).toBeCloseTo(DEFAULT_OSIRIS_HYDRAULIC_CONFIG.simulationDuration, 0);
    });

    it('validation runs all checks', () => {
      expect(result.validation.checks.length).toBe(7);
    });

    it('visualization bundle is populated', () => {
      expect(result.visualization.velocityArrows.length).toBeGreaterThan(0);
      expect(result.visualization.pressureHeatmap.length).toBeGreaterThan(0);
    });
  });

  describe('getWorldWaterLevel', () => {
    it('converts local water level to world Y coordinate', () => {
      const result = runOsirisHydraulicSimulation();
      const worldLevel = getWorldWaterLevel(result, 0);
      // Should be floor + initial water level
      expect(worldLevel).toBeCloseTo(
        result.geometry.chamberFloorY + DEFAULT_OSIRIS_HYDRAULIC_CONFIG.initialWaterLevel,
        1,
      );
    });

    it('water level changes over time with inflow', () => {
      const config: OsirisHydraulicConfig = {
        ...DEFAULT_OSIRIS_HYDRAULIC_CONFIG,
        boundaryType: 'closed',
        initialWaterLevel: 0.1,
        simulationDuration: 120,
      };
      const result = runOsirisHydraulicSimulation(config);
      const earlyLevel = getWorldWaterLevel(result, 1);
      const lateLevel = getWorldWaterLevel(result, 100);
      expect(lateLevel).toBeGreaterThan(earlyLevel);
    });
  });

  describe('solver → validation → visualization pipeline', () => {
    it('solver output feeds into validation', () => {
      const geo = extractLevel3Geometry();
      const inputs = {
        chamberWidth: geo.chamberWidth,
        chamberDepth: geo.chamberDepth,
        chamberHeight: geo.chamberHeight,
        conduitDiameter: geo.conduitDiameter,
        conduitLength: geo.conduitLength,
        conduitSlope: geo.conduitSlope,
        inflowRate: 0.01,
        initialWaterLevel: 0.5,
        targetWaterLevel: 2.0,
        manningRoughness: 0.015,
        gravity: 9.81,
        restrictionCoefficient: 0.6,
        boundaryType: 'semi-open' as const,
        ambientPressure: 101325,
        waterDensity: 1000,
        waterViscosity: 0.001,
        timeStep: 0.1,
        maxIterations: 10000,
      };
      const solverResult = solveHydraulicSystem(inputs);
      const validation = validateHydraulicSimulation(
        inputs,
        solverResult,
        [],
        OSIRIS_SHAFT_REFERENCE,
      );
      expect(validation.checks.length).toBe(7);
    });

    it('solver output feeds into visualization', () => {
      const geo = extractLevel3Geometry();
      const inputs = {
        chamberWidth: geo.chamberWidth,
        chamberDepth: geo.chamberDepth,
        chamberHeight: geo.chamberHeight,
        conduitDiameter: geo.conduitDiameter,
        conduitLength: geo.conduitLength,
        conduitSlope: geo.conduitSlope,
        inflowRate: 0.01,
        initialWaterLevel: 0.5,
        targetWaterLevel: 2.0,
        manningRoughness: 0.015,
        gravity: 9.81,
        restrictionCoefficient: 0.6,
        boundaryType: 'semi-open' as const,
        ambientPressure: 101325,
        waterDensity: 1000,
        waterViscosity: 0.001,
        timeStep: 0.1,
        maxIterations: 10000,
      };
      const solverResult = solveHydraulicSystem(inputs);
      const viz = generateVisualization(solverResult, DEFAULT_VISUALIZATION_CONFIG, 0);
      expect(viz.velocityArrows.length).toBeGreaterThan(0);
    });
  });

  describe('different boundary configurations', () => {
    it('closed boundary: no draining', () => {
      const result = runOsirisHydraulicSimulation({
        ...DEFAULT_OSIRIS_HYDRAULIC_CONFIG,
        boundaryType: 'closed',
      });
      expect(result.solverResult.drainTime).toBe(Infinity);
    });

    it('open-outflow: finite drain time', () => {
      const result = runOsirisHydraulicSimulation({
        ...DEFAULT_OSIRIS_HYDRAULIC_CONFIG,
        boundaryType: 'open-outflow',
        inflowRate: 0,
      });
      expect(result.solverResult.drainTime).toBeLessThan(Infinity);
    });

    it('semi-open: both fill and drain', () => {
      const result = runOsirisHydraulicSimulation({
        ...DEFAULT_OSIRIS_HYDRAULIC_CONFIG,
        boundaryType: 'semi-open',
      });
      expect(result.solverResult.fillTime).toBeLessThan(Infinity);
      expect(result.solverResult.drainTime).toBeLessThan(Infinity);
    });
  });

  describe('mass conservation in transient simulation', () => {
    it('water volume is conserved over time', () => {
      const result = runOsirisHydraulicSimulation({
        ...DEFAULT_OSIRIS_HYDRAULIC_CONFIG,
        simulationDuration: 30,
      });
      // Check that mass conservation validation passes
      const massCheck = result.validation.checks.find((c) => c.name === 'Mass Conservation');
      expect(massCheck).toBeDefined();
      expect(massCheck!.passed).toBe(true);
    });
  });

  describe('Osiris Shaft reference data consistency', () => {
    it('reference data matches blockout geometry', () => {
      const geo = extractLevel3Geometry();
      // The chamber floor elevation in the reference should match the blockout
      expect(OSIRIS_SHAFT_REFERENCE.chamberFloorElevation).toBeCloseTo(geo.chamberFloorY, 1);
      expect(OSIRIS_SHAFT_REFERENCE.surveyedConduitLength).toBeCloseTo(geo.conduitLength, 1);
      expect(OSIRIS_SHAFT_REFERENCE.surveyedConduitDiameter).toBeCloseTo(geo.conduitDiameter, 1);
    });
  });
});
