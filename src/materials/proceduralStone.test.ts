import { describe, it, expect } from 'vitest';
import { createProceduralStoneTexture, sampleProceduralStone } from './proceduralStone';

describe('proceduralStone', () => {
  it('samples values in [0, 1]', () => {
    for (let u = 0; u <= 1; u += 0.25) {
      for (let v = 0; v <= 1; v += 0.25) {
        const value = sampleProceduralStone(u, v, 42);
        expect(value).toBeGreaterThanOrEqual(0);
        expect(value).toBeLessThanOrEqual(1);
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
});
