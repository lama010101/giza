import { describe, it, expect } from 'vitest';
import {
  extractKingsChamberGeometry,
  extractGrandGalleryGeometry,
  configureAcousticSolver,
  runGPAcousticSimulation,
  validateAgainstMeasurements,
  getGPAcousticIntegration,
  createSimulationResult,
  ACOUSTIC_REFERENCES,
} from './gpAcousticIntegration';
import type { AcousticOutputs } from './acousticSolver';

describe('GP Acoustic Integration (M11-T25)', () => {
  describe('extractKingsChamberGeometry', () => {
    it('extracts geometry from the blockout', () => {
      const geo = extractKingsChamberGeometry();
      expect(geo.chamberId).toBe('kings-chamber');
      expect(geo.length).toBeGreaterThan(5);
      expect(geo.width).toBeGreaterThan(3);
      expect(geo.height).toBeGreaterThan(3);
    });

    it('identifies granite wall material', () => {
      const geo = extractKingsChamberGeometry();
      expect(geo.wallMaterial).toBe('granite');
    });
  });

  describe('extractGrandGalleryGeometry', () => {
    it('extracts a long corridor', () => {
      const geo = extractGrandGalleryGeometry();
      expect(geo.chamberId).toBe('grand-gallery');
      expect(geo.length).toBeGreaterThan(30);
    });

    it('identifies limestone wall material', () => {
      const geo = extractGrandGalleryGeometry();
      expect(geo.wallMaterial).toBe('limestone');
    });
  });

  describe('configureAcousticSolver', () => {
    it('configures inputs for King’s Chamber', () => {
      const inputs = configureAcousticSolver('kings-chamber');
      expect(inputs.chamberLength).toBeGreaterThan(5);
      expect(inputs.absorptionCoeff).toBeLessThan(0.1);
    });

    it('uses different absorption for limestone', () => {
      const kings = configureAcousticSolver('kings-chamber');
      const gallery = configureAcousticSolver('grand-gallery');
      expect(gallery.absorptionCoeff).toBeGreaterThan(kings.absorptionCoeff);
    });
  });

  describe('runGPAcousticSimulation', () => {
    it('produces acoustic outputs for King’s Chamber', () => {
      const result = runGPAcousticSimulation('kings-chamber');
      expect(result.outputs.resonantFrequencies.length).toBeGreaterThan(0);
      expect(result.outputs.reverberationTimeRT60).toBeGreaterThan(0);
    });

    it('produces acoustic outputs for Grand Gallery', () => {
      const result = runGPAcousticSimulation('grand-gallery');
      expect(result.outputs.resonantFrequencies.length).toBeGreaterThan(0);
    });

    it('includes validation checks', () => {
      const result = runGPAcousticSimulation('kings-chamber');
      expect(result.validation.checks.length).toBeGreaterThan(0);
    });
  });

  describe('validateAgainstMeasurements', () => {
    it('validates RT60 against reference', () => {
      const outputs: AcousticOutputs = {
        resonantFrequencies: [{ frequency: 27, mode: { nx: 1, ny: 0, nz: 0 }, wavelength: 12.7 }],
        standingWaves: [],
        reflectionPaths: [],
        reverberationTimeRT60: 1.0,
        energyDecay: [],
        waveInterference: [],
        frequencyResponse: [],
        pressureDistribution: [],
      };
      const validation = validateAgainstMeasurements('kings-chamber', outputs);
      const rt60Check = validation.checks.find((c) => c.name.includes('RT60'));
      expect(rt60Check).toBeDefined();
      expect(rt60Check!.passed).toBe(true);
    });
  });

  describe('getGPAcousticIntegration', () => {
    it('runs both chambers and returns a summary', () => {
      const result = getGPAcousticIntegration();
      expect(result.chambers).toHaveLength(2);
      expect(result.summary).toContain('GP Acoustic Integration');
    });
  });

  describe('createSimulationResult', () => {
    it('creates a SimulationResult for the store', () => {
      const result = createSimulationResult('kings-chamber');
      expect(
        result.metadata.simulationType || result.metadata.parameters.simulationType,
      ).toBeTruthy();
      expect(result.outputs).toBeDefined();
      expect(result.validation).toBeDefined();
    });
  });

  describe('ACOUSTIC_REFERENCES', () => {
    it('contains references for both chambers', () => {
      expect(ACOUSTIC_REFERENCES.length).toBeGreaterThanOrEqual(2);
      expect(ACOUSTIC_REFERENCES.some((r) => r.chamberId === 'kings-chamber')).toBe(true);
      expect(ACOUSTIC_REFERENCES.some((r) => r.chamberId === 'grand-gallery')).toBe(true);
    });
  });
});
