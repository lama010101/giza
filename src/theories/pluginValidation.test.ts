import { describe, it, expect } from 'vitest';
import { validatePlugin, validatePluginSet, isValidPluginId } from './pluginValidation';
import type { HypothesisPlugin } from './types';

function makePlugin(overrides: Partial<HypothesisPlugin> = {}): HypothesisPlugin {
  return {
    id: 'THEORY-001',
    name: 'Test Hypothesis',
    description: 'A test hypothesis plugin',
    version: '1.0.0',
    getHypothesis: () =>
      ({
        id: 'THEORY-001',
        name: 'Test',
        description: 'Test',
        authors: [],
        scientificAssumptions: [],
        predictions: [],
        affectedStructures: [],
        supports: [],
        contradicts: [],
        requiredEvidence: [],
        simulations: [],
        visualizationRules: [],
        confidence: 50,
        confidenceByObject: {},
        references: [],
        bibliography: [],
        status: 'draft',
        tags: [],
      }) as never,
    ...overrides,
  };
}

describe('Plugin Validation (M05.5-T13)', () => {
  describe('validatePlugin', () => {
    it('passes for a valid plugin', () => {
      const result = validatePlugin(makePlugin());
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('fails for missing ID', () => {
      const result = validatePlugin(makePlugin({ id: '' }));
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Plugin ID is required');
    });

    it('fails for invalid ID format', () => {
      const result = validatePlugin(makePlugin({ id: 'theory-001' }));
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes('THEORY-NNN'))).toBe(true);
    });

    it('fails for missing name', () => {
      const result = validatePlugin(makePlugin({ name: '' }));
      expect(result.valid).toBe(false);
    });

    it('fails for missing description', () => {
      const result = validatePlugin(makePlugin({ description: '' }));
      expect(result.valid).toBe(false);
    });

    it('fails for missing getHypothesis', () => {
      const result = validatePlugin(makePlugin({ getHypothesis: undefined as never }));
      expect(result.valid).toBe(false);
    });

    it('warns about missing optional methods', () => {
      const result = validatePlugin(makePlugin());
      expect(result.warnings.length).toBeGreaterThan(0);
    });
  });

  describe('validatePluginSet', () => {
    it('passes for unique plugins', () => {
      const plugins = [makePlugin({ id: 'THEORY-001' }), makePlugin({ id: 'THEORY-002' })];
      const result = validatePluginSet(plugins);
      expect(result.valid).toBe(true);
    });

    it('fails for duplicate IDs', () => {
      const plugins = [makePlugin({ id: 'THEORY-001' }), makePlugin({ id: 'THEORY-001' })];
      const result = validatePluginSet(plugins);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes('Duplicate'))).toBe(true);
    });
  });

  describe('isValidPluginId', () => {
    it('returns true for valid ID', () => {
      expect(isValidPluginId('THEORY-001')).toBe(true);
    });

    it('returns false for lowercase', () => {
      expect(isValidPluginId('theory-001')).toBe(false);
    });

    it('returns false for wrong digit count', () => {
      expect(isValidPluginId('THEORY-0001')).toBe(false);
    });
  });
});
