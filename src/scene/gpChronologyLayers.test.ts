import { describe, it, expect } from 'vitest';
import {
  GP_CHRONOLOGY_LAYERS,
  getGPObjectChronology,
  getGPChronologyConfidence,
  filterGPObjectsByChronology,
  getGPChronologyLayerOrder,
} from './gpChronologyLayers';

describe('Great Pyramid Chronology Layers (M11-T17)', () => {
  describe('GP_CHRONOLOGY_LAYERS', () => {
    it('defines 8 chronology layers', () => {
      expect(GP_CHRONOLOGY_LAYERS).toHaveLength(8);
    });

    it('each layer has required fields', () => {
      for (const layer of GP_CHRONOLOGY_LAYERS) {
        expect(layer.id).toBeDefined();
        expect(layer.label).toBeDefined();
        expect(layer.confidence).toBeGreaterThanOrEqual(0);
        expect(layer.confidence).toBeLessThanOrEqual(100);
        expect(layer.dateRange).toBeDefined();
        expect(layer.description).toBeDefined();
      }
    });

    it('layers are in chronological order', () => {
      for (let i = 1; i < GP_CHRONOLOGY_LAYERS.length; i++) {
        expect(GP_CHRONOLOGY_LAYERS[i].dateRange.start).toBeGreaterThanOrEqual(
          GP_CHRONOLOGY_LAYERS[i - 1].dateRange.start,
        );
      }
    });
  });

  describe('getGPObjectChronology', () => {
    it('returns all layers for permanent architecture', () => {
      const layers = getGPObjectChronology('GP-KINGS-CHAMBER');
      expect(layers).toHaveLength(8);
    });

    it('returns specific layers for movable objects', () => {
      const layers = getGPObjectChronology('GP-SARCOPHAGUS');
      expect(layers).toContain('gp-construction');
      expect(layers).toContain('gp-modern');
      expect(layers).not.toContain('gp-roman');
    });

    it('returns all layers for unknown objects', () => {
      const layers = getGPObjectChronology('UNKNOWN');
      expect(layers).toHaveLength(8);
    });
  });

  describe('getGPChronologyConfidence', () => {
    it('returns confidence for present objects', () => {
      const conf = getGPChronologyConfidence('GP-KINGS-CHAMBER', 'gp-modern');
      expect(conf).toBe(100);
    });

    it('returns 0 for objects not in that layer', () => {
      const conf = getGPChronologyConfidence('GP-SARCOPHAGUS', 'gp-roman');
      expect(conf).toBe(0);
    });
  });

  describe('filterGPObjectsByChronology', () => {
    it('filters objects by chronology layer', () => {
      const all = ['GP-KINGS-CHAMBER', 'GP-SARCOPHAGUS', 'GP-MODERN-STAIRCASE'];
      const modern = filterGPObjectsByChronology(all, 'gp-modern');
      expect(modern).toHaveLength(3);
      const construction = filterGPObjectsByChronology(all, 'gp-construction');
      expect(construction).toContain('GP-KINGS-CHAMBER');
      expect(construction).toContain('GP-SARCOPHAGUS');
      expect(construction).not.toContain('GP-MODERN-STAIRCASE');
    });
  });

  describe('getGPChronologyLayerOrder', () => {
    it('returns 8 layer IDs in order', () => {
      const order = getGPChronologyLayerOrder();
      expect(order).toHaveLength(8);
      expect(order[0]).toBe('gp-construction');
      expect(order[7]).toBe('gp-modern');
    });
  });
});
