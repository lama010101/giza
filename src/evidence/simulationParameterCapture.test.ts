import { describe, it, expect, beforeEach } from 'vitest';
import {
  captureSimulationParameters,
  linkParameterToEvidence,
  _resetParameterCounterForTests,
  type SimulationParameter,
} from './simulationParameterCapture';

describe('Simulation Parameter Capture (M03.5-T07)', () => {
  beforeEach(() => {
    _resetParameterCounterForTests();
  });

  describe('captureSimulationParameters', () => {
    it('captures water level with unit and provenance', () => {
      const text = 'The measured water level in the shaft was 18.4 m above the datum.';
      const params = captureSimulationParameters(text, {
        simulationId: 'SIM-001',
        evidenceIds: ['EV-100001'],
        provenance: 'Measured',
      });

      const water = params.find((p) => p.name === 'water level');
      expect(water).toBeDefined();
      expect(water!.value).toBe(18.4);
      expect(water!.unit).toBe('m');
      expect(water!.provenance).toBe('Measured');
      expect(water!.evidenceIds).toContain('EV-100001');
      expect(water!.simulationId).toBe('SIM-001');
    });

    it('captures temperature and density from text', () => {
      const text =
        'The chamber temperature was 22 °C and the published limestone density is 2700 kg/m³.';
      const params = captureSimulationParameters(text, {
        simulationId: 'SIM-002',
        provenance: 'Estimated',
      });

      const temp = params.find((p) => p.name === 'temperature');
      const density = params.find((p) => p.name === 'density');

      expect(temp).toBeDefined();
      expect(temp!.value).toBe(22);
      expect(temp!.unit).toBe('°C');

      expect(density).toBeDefined();
      expect(density!.value).toBe(2700);
      expect(density!.unit).toBe('kg/m³');
    });

    it('classifies provenance from surrounding text', () => {
      const text =
        'The estimated flow rate during the experiment was 0.7 m³/s, based on published measurements.';
      const params = captureSimulationParameters(text, {
        simulationId: 'SIM-003',
      });

      const flow = params.find((p) => p.name === 'flow rate');
      expect(flow).toBeDefined();
      expect(flow!.value).toBe(0.7);
      expect(['Estimated', 'Published']).toContain(flow!.provenance);
    });

    it('returns empty for unrelated text', () => {
      const params = captureSimulationParameters('The quick brown fox jumps.', {
        simulationId: 'SIM-001',
      });
      expect(params).toEqual([]);
    });

    it('deduplicates repeated identical matches', () => {
      const text = 'Water level 18.4 m. Water level 18.4 m.';
      const params = captureSimulationParameters(text, { simulationId: 'SIM-001' });
      const water = params.filter((p) => p.name === 'water level');
      expect(water).toHaveLength(1);
    });
  });

  describe('linkParameterToEvidence', () => {
    it('attaches an evidence ID to a parameter', () => {
      const param: SimulationParameter = {
        id: 'SP-0001',
        simulationId: 'SIM-001',
        name: 'water level',
        value: 18.4,
        provenance: 'Measured',
        evidenceIds: [],
        capturedAt: '2024-01-01T00:00:00Z',
      };

      const linked = linkParameterToEvidence(param, 'EV-100001');
      expect(linked.evidenceIds).toContain('EV-100001');
    });

    it('does not duplicate evidence IDs', () => {
      const param: SimulationParameter = {
        id: 'SP-0001',
        simulationId: 'SIM-001',
        name: 'water level',
        value: 18.4,
        provenance: 'Measured',
        evidenceIds: ['EV-100001'],
        capturedAt: '2024-01-01T00:00:00Z',
      };

      const linked = linkParameterToEvidence(param, 'EV-100001');
      expect(linked.evidenceIds).toHaveLength(1);
    });
  });
});
