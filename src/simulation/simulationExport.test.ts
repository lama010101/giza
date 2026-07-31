import { describe, it, expect } from 'vitest';
import {
  exportToCSV,
  exportToJSON,
  exportSimulation,
  getMimeType,
  getFileExtension,
} from './simulationExport';
import type { SimulationResult } from './types';

function makeResult(): SimulationResult {
  return {
    metadata: {
      id: 'SIM-0001',
      softwareVersion: '1.0.0',
      date: '2026-01-01T00:00:00Z',
      parameters: {
        simulationType: 'hydraulic',
        version: 1,
        parameters: [
          { name: 'inflow', value: 10, provenance: 'Measured', unit: 'L/s' },
          { name: 'viscosity', value: 0.001, provenance: 'Published', unit: 'Pa·s' },
        ],
      },
      author: 'Test Author',
      geometryVersion: '1.0',
      theoryContext: 'THEORY-001',
      randomSeed: 42,
    },
    outputs: {
      maxVelocity: 1.5,
      maxPressure: 100000,
      flowRate: 10,
    },
    validation: {
      passed: true,
      checks: [
        {
          name: 'mass-balance',
          passed: true,
          message: 'Mass conserved',
          value: 0.001,
          threshold: 0.01,
        },
      ],
    },
  };
}

describe('Simulation Export (M10-T09)', () => {
  describe('exportToCSV', () => {
    it('exports metadata as comments', () => {
      const csv = exportToCSV(makeResult());
      expect(csv).toContain('# Simulation Export');
      expect(csv).toContain('# ID: SIM-0001');
      expect(csv).toContain('# Author: Test Author');
    });

    it('exports parameters as CSV', () => {
      const csv = exportToCSV(makeResult());
      expect(csv).toContain('name,value,provenance,unit');
      expect(csv).toContain('inflow,10,Measured,L/s');
    });

    it('exports outputs as CSV', () => {
      const csv = exportToCSV(makeResult());
      expect(csv).toContain('# Outputs');
    });

    it('exports validation results', () => {
      const csv = exportToCSV(makeResult());
      expect(csv).toContain('# Validation');
      expect(csv).toContain('mass-balance');
      expect(csv).toContain('PASSED');
    });
  });

  describe('exportToJSON', () => {
    it('exports as valid JSON', () => {
      const json = exportToJSON(makeResult());
      const parsed = JSON.parse(json) as Record<string, unknown>;
      const metadata = parsed.metadata as { id: string };
      expect(metadata).toBeDefined();
      expect(metadata.id).toBe('SIM-0001');
    });

    it('includes outputs', () => {
      const json = exportToJSON(makeResult());
      const parsed = JSON.parse(json) as Record<string, unknown>;
      const outputs = parsed.outputs as { maxVelocity: number };
      expect(outputs.maxVelocity).toBe(1.5);
    });

    it('includes validation', () => {
      const json = exportToJSON(makeResult());
      const parsed = JSON.parse(json) as Record<string, unknown>;
      const validation = parsed.validation as { passed: boolean };
      expect(validation.passed).toBe(true);
    });
  });

  describe('exportSimulation', () => {
    it('exports CSV format', () => {
      const result = exportSimulation(makeResult(), 'csv');
      expect(typeof result).toBe('string');
    });

    it('exports JSON format', () => {
      const result = exportSimulation(makeResult(), 'json');
      expect(typeof result).toBe('string');
    });

    it('exports PNG format as Blob', () => {
      const result = exportSimulation(makeResult(), 'png');
      expect(result).toBeInstanceOf(Blob);
    });

    it('exports MP4 format as Blob', () => {
      const result = exportSimulation(makeResult(), 'mp4');
      expect(result).toBeInstanceOf(Blob);
    });
  });

  describe('getMimeType', () => {
    it('returns correct MIME types', () => {
      expect(getMimeType('csv')).toBe('text/csv');
      expect(getMimeType('json')).toBe('application/json');
      expect(getMimeType('png')).toBe('image/png');
      expect(getMimeType('mp4')).toBe('video/mp4');
    });
  });

  describe('getFileExtension', () => {
    it('returns correct file extensions', () => {
      expect(getFileExtension('csv')).toBe('.csv');
      expect(getFileExtension('json')).toBe('.json');
      expect(getFileExtension('png')).toBe('.png');
      expect(getFileExtension('mp4')).toBe('.mp4');
    });
  });
});
