import {
  DataTexture,
  RGBAFormat,
  UnsignedByteType,
  RepeatWrapping,
  LinearFilter,
  NoColorSpace,
} from 'three';

export interface ProceduralStoneOptions {
  /** Deterministic seed for reproducible variation. */
  seed?: number;
  /** Texture resolution (square). */
  size?: number;
}

interface SeededRng {
  next: () => number;
}

function createSeededRng(seed: number): SeededRng {
  // LCG parameters from Numerical Recipes
  let state = Math.abs(seed) % 2147483647;
  if (state === 0) state = 1;
  return {
    next: () => {
      state = (state * 16807) % 2147483647;
      return state / 2147483647;
    },
  };
}

function hash2d(x: number, y: number, seed: number): number {
  const n = Math.sin(x * 12.9898 + y * 78.233 + seed * 0.5) * 43758.5453;
  return n - Math.floor(n);
}

function noise2d(x: number, y: number, seed: number): number {
  const ix = Math.floor(x);
  const iy = Math.floor(y);
  const fx = x - ix;
  const fy = y - iy;

  const a = hash2d(ix, iy, seed);
  const b = hash2d(ix + 1, iy, seed);
  const c = hash2d(ix, iy + 1, seed);
  const d = hash2d(ix + 1, iy + 1, seed);

  // Smoothstep interpolation
  const ux = fx * fx * (3 - 2 * fx);
  const uy = fy * fy * (3 - 2 * fy);

  return a + (b - a) * ux + (c - a) * uy + (a - b - c + d) * ux * uy;
}

function fbm(x: number, y: number, seed: number, octaves = 4): number {
  let value = 0;
  let amplitude = 0.5;
  let frequency = 1;
  let maxValue = 0;
  for (let i = 0; i < octaves; i++) {
    value += noise2d(x * frequency, y * frequency, seed + i) * amplitude;
    maxValue += amplitude;
    amplitude *= 0.5;
    frequency *= 2;
  }
  return value / maxValue;
}

function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

/**
 * Procedurally sample the stone surface detail at a given UV coordinate.
 *
 * The returned value is a roughness/bump intensity in the range [0, 1] where
 * higher values represent rougher, more weathered areas (edge erosion,
 * micro-cracks) and lower values represent smoother intact stone.
 */
export function sampleProceduralStone(u: number, v: number, seed = 0): number {
  const rng = createSeededRng(seed);

  // Base roughness for clean limestone
  let value = 0.48;

  // Edge erosion: rougher (lighter) near UV boundaries, simulating worn corners
  const edgeDist = Math.min(u, 1 - u, v, 1 - v) * 2;
  const erosion = Math.pow(1 - edgeDist, 2) * 0.18;
  value += erosion;

  // Mineral streaks: a few angled bands
  const streaks = Math.floor(rng.next() * 3) + 2;
  for (let i = 0; i < streaks; i++) {
    const angle = rng.next() * Math.PI;
    const freq = 4 + rng.next() * 12;
    const phase = rng.next() * Math.PI * 2;
    const projection = u * Math.cos(angle) + v * Math.sin(angle);
    const rawStreak = Math.sin(projection * freq + phase + fbm(u * 2, v * 2, seed, 3) * 2);
    const streak = Math.pow(Math.abs(rawStreak), 6) * 0.12;
    value += streak;
  }

  // Micro-cracks: high-frequency fbm with threshold
  const crackNoise = fbm(u * 60 + seed, v * 60 + seed, seed + 7, 5);
  const crack = smoothstep(0.58, 0.68, crackNoise) * 0.2;
  value += crack;

  // Dust / surface variation: low-frequency fbm
  const dust = fbm(u * 3, v * 3, seed + 13, 3) * 0.08;
  value += dust;

  return Math.max(0, Math.min(1, value));
}

/**
 * Creates a square roughness/bump DataTexture for stone surfaces.
 *
 * The texture is fully procedural and deterministic. It contains no baked
 * dirt or photographic texture data, so it can be regenerated identically on
 * every client.
 */
export function createProceduralStoneTexture(options: ProceduralStoneOptions = {}): DataTexture {
  const { seed = 0, size = 256 } = options;
  const data = new Uint8Array(size * size * 4);

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const u = x / (size - 1);
      const v = y / (size - 1);
      const intensity = sampleProceduralStone(u, v, seed);
      const byte = Math.round(intensity * 255);
      const index = (y * size + x) * 4;
      data[index] = byte;
      data[index + 1] = byte;
      data[index + 2] = byte;
      data[index + 3] = 255;
    }
  }

  const texture = new DataTexture(data, size, size, RGBAFormat, UnsignedByteType);
  texture.wrapS = RepeatWrapping;
  texture.wrapT = RepeatWrapping;
  texture.magFilter = LinearFilter;
  texture.minFilter = LinearFilter;
  texture.colorSpace = NoColorSpace;
  texture.needsUpdate = true;
  return texture;
}
