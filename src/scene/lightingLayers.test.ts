import { describe, it, expect } from 'vitest';
import {
  createLightingLayer,
  getDefaultLightingLayers,
  applyLightingLayers,
  blendLightingLayers,
  type LightingLayer,
  type LightingLayerConfig,
} from './lightingLayers';

describe('Lighting Layers (M08.5-T02)', () => {
  describe('createLightingLayer', () => {
    it('creates a layer with defaults for optional fields', () => {
      const layer = createLightingLayer({
        id: 'test',
        name: 'Test',
        type: 'ambient',
        intensity: 0.5,
        color: '#ffffff',
      });
      expect(layer.enabled).toBe(true);
      expect(layer.position).toEqual({ x: 0, y: 0, z: 0 });
    });

    it('respects provided enabled and position', () => {
      const layer = createLightingLayer({
        id: 'test',
        name: 'Test',
        type: 'directional',
        intensity: 1,
        color: '#ff0000',
        enabled: false,
        position: { x: 1, y: 2, z: 3 },
      });
      expect(layer.enabled).toBe(false);
      expect(layer.position).toEqual({ x: 1, y: 2, z: 3 });
    });
  });

  describe('getDefaultLightingLayers', () => {
    it('returns exactly 5 layers', () => {
      const layers = getDefaultLightingLayers();
      expect(layers).toHaveLength(5);
    });

    it('includes ambient, key, fill, rim, and hemisphere layers', () => {
      const layers = getDefaultLightingLayers();
      const ids = layers.map((l) => l.id);
      expect(ids).toEqual(['ambient', 'key', 'fill', 'rim', 'hemisphere']);
    });

    it('uses correct light types per layer', () => {
      const layers = getDefaultLightingLayers();
      expect(layers[0].type).toBe('ambient');
      expect(layers[1].type).toBe('directional');
      expect(layers[2].type).toBe('directional');
      expect(layers[3].type).toBe('point');
      expect(layers[4].type).toBe('hemisphere');
    });

    it('all default layers are enabled', () => {
      const layers = getDefaultLightingLayers();
      for (const layer of layers) {
        expect(layer.enabled).toBe(true);
      }
    });
  });

  describe('applyLightingLayers', () => {
    it('groups uniforms by light type', () => {
      const uniforms = applyLightingLayers(getDefaultLightingLayers());
      expect(uniforms.ambient).toHaveLength(1);
      expect(uniforms.directional).toHaveLength(2);
      expect(uniforms.point).toHaveLength(1);
      expect(uniforms.hemisphere).toHaveLength(1);
    });

    it('counts only enabled layers', () => {
      const layers = getDefaultLightingLayers();
      layers[0].enabled = false;
      const uniforms = applyLightingLayers(layers);
      expect(uniforms.count).toBe(4);
    });

    it('converts hex color to normalized rgb', () => {
      const layer = createLightingLayer({
        id: 'red',
        name: 'Red',
        type: 'ambient',
        intensity: 1,
        color: '#ff0000',
      });
      const uniforms = applyLightingLayers([layer]);
      expect(uniforms.ambient[0].color).toEqual([1, 0, 0]);
    });

    it('marks disabled layers with enabled = 0 but retains them', () => {
      const layer = createLightingLayer({
        id: 'off',
        name: 'Off',
        type: 'point',
        intensity: 1,
        color: '#ffffff',
        enabled: false,
      });
      const uniforms = applyLightingLayers([layer]);
      expect(uniforms.point).toHaveLength(1);
      expect(uniforms.point[0].enabled).toBe(0);
    });
  });

  describe('blendLightingLayers', () => {
    it('returns source state at blendFactor 0', () => {
      const layers = getDefaultLightingLayers();
      const blended = blendLightingLayers(layers, 0);
      expect(blended[0].intensity).toBeCloseTo(layers[0].intensity);
      expect(blended[0].enabled).toBe(layers[0].enabled);
    });

    it('interpolates intensity at mid blend', () => {
      const layers = getDefaultLightingLayers();
      const sourceIntensity = layers[1].intensity;
      const blended = blendLightingLayers(layers, 0.5);
      // target intensity for an enabled layer = intensity * 0.5
      // blended = source * (1 - t) + target * t
      const expected = sourceIntensity * 0.5 + sourceIntensity * 0.5 * 0.5;
      expect(blended[1].intensity).toBeCloseTo(expected, 5);
    });

    it('clamps blendFactor outside [0, 1]', () => {
      const layers = getDefaultLightingLayers();
      const below = blendLightingLayers(layers, -1);
      const above = blendLightingLayers(layers, 2);
      expect(below[0].intensity).toBeCloseTo(layers[0].intensity);
      // at t=1, enabled layer intensity -> intensity * 0.5
      expect(above[0].intensity).toBeCloseTo(layers[0].intensity * 0.5, 5);
    });

    it('does not mutate the input array', () => {
      const layers: LightingLayer[] = getDefaultLightingLayers();
      const snapshot = layers.map((l) => ({ ...l }));
      blendLightingLayers(layers, 0.5);
      expect(layers).toEqual(snapshot);
    });

    it('toggles enabled flag at blendFactor >= 0.5', () => {
      const config: LightingLayerConfig = {
        id: 'x',
        name: 'X',
        type: 'ambient',
        intensity: 1,
        color: '#ffffff',
        enabled: true,
      };
      const layer = createLightingLayer(config);
      const blendedLow = blendLightingLayers([layer], 0.4);
      const blendedHigh = blendLightingLayers([layer], 0.6);
      expect(blendedLow[0].enabled).toBe(true);
      expect(blendedHigh[0].enabled).toBe(false);
    });
  });
});
