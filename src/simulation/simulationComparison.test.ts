import { describe, it, expect } from 'vitest';
import { compareSimulations, formatComparisonTable } from './simulationComparison';
import type { SimulationResult } from './types';

function makeResult(overrides: Partial<SimulationResult> = {}): SimulationResult {
  return {
    metadata: {
      id: 'SIM-0001',
      softwareVersion: '1.0.0',
      date: '2026-01-01',
      parameters: {
        simulationType: 'hydraulic',
        version: 1,
        parameters: [
          { name: 'inflow', value: 10, provenance: 'Measured', unit: 'L/s' },
          { name: 'viscosity', value: 0.001, provenance: 'Published', unit: 'Pa·s' },
        ],
      },
      author: 'Test',
      geometryVersion: '1.0',
      theoryContext: 'THEORY-001',
      randomSeed: 42,
    },
    outputs: {
      maxVelocity: 1.5,
      maxPressure: 100000,
    },
    validation: {
      passed: true,
      checks: [
        { name: 'mass-balance', passed: true, message: 'OK', value: 0.001, threshold: 0.01 },
      ],
    },
    ...overrides,
  };
}

describe('Simulation Comparison (M10-T08)', () => {
  describe('compareSimulations', () => {
    it('detects no changes for identical results', () => {
      const a = makeResult();
      const b = makeResult();
      const comparison = compareSimulations(a, b);
      expect(comparison.summary.changedParameters).toBe(0);
      expect(comparison.summary.changedOutputs).toBe(0);
      expect(comparison.summary.bothPassed).toBe(true);
    });

    it('detects parameter changes', () => {
      const a = makeResult();
      const b = makeResult({
        metadata: {
          ...a.metadata,
          parameters: {
            ...a.metadata.parameters,
            parameters: [
              { name: 'inflow', value: 20, provenance: 'Measured', unit: 'L/s' },
              { name: 'viscosity', value: 0.001, provenance: 'Published', unit: 'Pa·s' },
            ],
          },
        },
      });
      const comparison = compareSimulations(a, b);
      expect(comparison.summary.changedParameters).toBeGreaterThan(0);
    });

    it('detects output changes', () => {
      const a = makeResult();
      const b = makeResult({
        outputs: { maxVelocity: 3.0, maxPressure: 200000 },
      });
      const comparison = compareSimulations(a, b);
      expect(comparison.summary.changedOutputs).toBeGreaterThan(0);
    });

    it('detects validation differences', () => {
      const a = makeResult();
      const b = makeResult({
        validation: {
          passed: false,
          checks: [
            { name: 'mass-balance', passed: false, message: 'Failed', value: 0.1, threshold: 0.01 },
          ],
        },
      });
      const comparison = compareSimulations(a, b);
      expect(comparison.summary.bothPassed).toBe(false);
    });
  });

  describe('formatComparisonTable', () => {
    it('produces readable output', () => {
      const a = makeResult();
      const b = makeResult({ outputs: { maxVelocity: 3.0, maxPressure: 100000 } });
      const comparison = compareSimulations(a, b);
      const text = formatComparisonTable(comparison);
      expect(text).toContain('Simulation Comparison');
      expect(text).toContain('Parameters');
      expect(text).toContain('Outputs');
      expect(text).toContain('Summary');
    });
  });
});
