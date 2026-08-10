import { describe, it, expect } from 'vitest';
import {
  createProceduralStoneTexture,
  createProceduralStoneTextures,
  sampleProceduralStone,
  sampleProceduralStoneAlbedo,
  sampleProceduralStoneAO,
  sampleProceduralStoneCalcite,
  sampleProceduralStoneHeight,
  sampleProceduralStoneMoisture,
} from './proceduralStone';

describe('proceduralStone', () => {
  it('samples values in [0, 1]', () => {
    for (let u = 0; u <= 1; u += 0.25) {
      for (let v = 0; v <= 1; v += 0.25) {
        expect(sampleProceduralStone(u, v, 42)).toBeGreaterThanOrEqual(0);
        expect(sampleProceduralStone(u, v, 42)).toBeLessThanOrEqual(1);
      }
    }
  });

  it('is deterministic for the same seed', () => {
    expect(sampleProceduralStone(0.3, 0.7, 123)).toBe(sampleProceduralStone(0.3, 0.7, 123));
  });

  it('produces edge erosion (higher roughness near UV boundaries)', () => {
    const center = sampleProceduralStone(0.5, 0.5, 0);
    const corner = sampleProceduralStone(0.02, 0.02, 0);
    expect(corner).toBeGreaterThan(center);
  });

  it('creates a DataTexture with the requested size', () => {
    const texture = createProceduralStoneTexture({ seed: 1, size: 64 });
    expect(texture.image.width).toBe(64);
    expect(texture.image.height).toBe(64);
    expect(texture.image.data).toBeInstanceOf(Uint8Array);
    expect(texture.image.data.length).toBe(64 * 64 * 4);
  });

  describe('full PBR texture set', () => {
    it('creates all seven maps with the requested size', () => {
      const set = createProceduralStoneTextures({ seed: 7, size: 64 });
      for (const texture of [
        set.albedo,
        set.normal,
        set.ao,
        set.height,
        set.moisture,
        set.calcite,
        set.roughness,
      ]) {
        expect(texture.image.width).toBe(64);
        expect(texture.image.height).toBe(64);
        expect(texture.image.data).toBeInstanceOf(Uint8Array);
        expect(texture.image.data.length).toBe(64 * 64 * 4);
      }
    });

    it('samples every channel in [0, 1]', () => {
      const u = 0.37;
      const v = 0.62;
      const seed = 99;
      for (const sample of [
        sampleProceduralStoneHeight(u, v, seed),
        sampleProceduralStoneAlbedo(u, v, seed),
        sampleProceduralStoneAO(u, v, seed),
        sampleProceduralStoneMoisture(u, v, seed),
        sampleProceduralStoneCalcite(u, v, seed),
        sampleProceduralStone(u, v, seed),
      ]) {
        expect(sample).toBeGreaterThanOrEqual(0);
        expect(sample).toBeLessThanOrEqual(1);
      }
    });

    it('is deterministic for the same seed across channels', () => {
      expect(sampleProceduralStoneAlbedo(0.4, 0.4, 55)).toBe(
        sampleProceduralStoneAlbedo(0.4, 0.4, 55),
      );
      expect(sampleProceduralStoneHeight(0.4, 0.4, 55)).toBe(
        sampleProceduralStoneHeight(0.4, 0.4, 55),
      );
      expect(sampleProceduralStoneCalcite(0.4, 0.4, 55)).toBe(
        sampleProceduralStoneCalcite(0.4, 0.4, 55),
      );
    });
  });
});
