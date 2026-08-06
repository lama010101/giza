import {
  DataTexture,
  RGBAFormat,
  UnsignedByteType,
  RepeatWrapping,
  LinearFilter,
  NoColorSpace,
  SRGBColorSpace,
} from 'three';

export interface ProceduralStoneOptions {
  /** Deterministic seed for reproducible variation. */
  seed?: number;
  /** Texture resolution (square). */
  size?: number;
}

export interface ProceduralStoneTextureSet {
  albedo: DataTexture;
  normal: DataTexture;
  ao: DataTexture;
  height: DataTexture;
  moisture: DataTexture;
  calcite: DataTexture;
  roughness: DataTexture;
}

interface StoneSample {
  height: number;
  albedo: number;
  roughness: number;
  ao: number;
  moisture: number;
  calcite: number;
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

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

/**
 * Encodes a linear-light value to the sRGB transfer curve.
 *
 * This is used when storing albedo values in a DataTexture that will be
 * sampled by Three.js with SRGBColorSpace, so the shader decodes back to the
 * original linear value.
 */
function linearToSRGB(linear: number): number {
  if (linear <= 0.0031308) return 12.92 * linear;
  return 1.055 * Math.pow(linear, 1 / 2.4) - 0.055;
}

/**
 * Procedurally sample the full limestone surface at a given UV coordinate.
 *
 * The returned channels are all in [0, 1] and model physically-motivated
 * limestone behaviour: edge erosion, mineral streaks, micro-cracks, dust,
 * moisture darkening in crevices, and calcite deposits on sheltered raised
 * surfaces.
 */
function sampleStoneSurface(u: number, v: number, seed: number): StoneSample {
  const rng = createSeededRng(seed);

  // Distance from the nearest UV boundary (0 at edge, 1 at center)
  const edgeDist = Math.min(u, 1 - u, v, 1 - v) * 2;

  // --- height (source for normal/displacement/bump) ---
  let height = 0.92;

  // Edge erosion: mechanical wear removes material near block boundaries
  const erosion = Math.pow(1 - edgeDist, 2) * 0.18;
  height -= erosion;

  // Mineral streaks: angled bands of slightly recessed, discoloured stone
  const streaks = Math.floor(rng.next() * 3) + 2;
  let streakDarkening = 0;
  for (let i = 0; i < streaks; i++) {
    const angle = rng.next() * Math.PI;
    const freq = 4 + rng.next() * 12;
    const phase = rng.next() * Math.PI * 2;
    const projection = u * Math.cos(angle) + v * Math.sin(angle);
    const rawStreak = Math.sin(projection * freq + phase + fbm(u * 2, v * 2, seed, 3) * 2);
    const streak = Math.pow(Math.abs(rawStreak), 6) * 0.08;
    streakDarkening += streak;
    height -= streak;
  }
  streakDarkening = clamp01(streakDarkening);

  // Micro-cracks: high-frequency fbm with threshold
  const crackNoise = fbm(u * 60 + seed, v * 60 + seed, seed + 7, 5);
  const crack = smoothstep(0.6, 0.68, crackNoise) * 0.12;
  height -= crack;

  // Dust / surface variation: low-frequency fbm (slightly raised)
  const dust = fbm(u * 3, v * 3, seed + 13, 3) * 0.03;
  height += dust;

  // Moisture mask: accumulates in sheltered low areas
  const moistureNoise = fbm(u * 8, v * 8, seed + 17, 3);
  const moisture = clamp01(
    smoothstep(0.3, 0.1, height) * smoothstep(0.2, 0.5, moistureNoise) * (0.3 + 0.7 * edgeDist),
  );

  // Calcite mask: crystalline deposits on sheltered, slightly raised surfaces
  const calciteNoise = fbm(u * 25, v * 25, seed + 23, 4);
  const calcite = clamp01(smoothstep(0.74, 0.86, calciteNoise) * (0.2 + 0.8 * edgeDist) * 0.8);

  // Calcite raises the local surface slightly
  height += calcite * 0.04;
  height = clamp01(height);

  // --- albedo (diffuse reflectance, neutral so the block color tints it) ---
  let albedo = 0.95;
  albedo -= streakDarkening * 0.15;
  albedo -= crack * 0.2;
  albedo -= moisture * 0.25;
  albedo += calcite * 0.25;
  albedo += dust * 0.05;
  // Eroded edges are slightly bleached
  albedo += erosion * 0.04;
  albedo = clamp01(albedo);

  // --- roughness multiplier ---
  let roughness = 0.9;
  roughness += erosion * 0.08;
  roughness += crack * 0.15;
  roughness += dust * 0.04;
  // Streaks and deposits are smoother than the surrounding stone
  roughness -= streakDarkening * 0.05;
  roughness -= moisture * 0.12;
  roughness -= calcite * 0.1;
  roughness = clamp01(roughness);

  // --- ambient occlusion derived from local height ---
  const ao = smoothstep(0.2, 0.7, height);

  return { height, albedo, roughness, ao, moisture, calcite };
}

/**
 * Sample a single roughness intensity at (u, v).
 *
 * Kept for backwards compatibility with code that only needs the Stone
 * roughness/bump multiplier.
 */
export function sampleProceduralStone(u: number, v: number, seed = 0): number {
  return sampleStoneSurface(u, v, seed).roughness;
}

export function sampleProceduralStoneHeight(u: number, v: number, seed = 0): number {
  return sampleStoneSurface(u, v, seed).height;
}

export function sampleProceduralStoneAlbedo(u: number, v: number, seed = 0): number {
  return sampleStoneSurface(u, v, seed).albedo;
}

export function sampleProceduralStoneAO(u: number, v: number, seed = 0): number {
  return sampleStoneSurface(u, v, seed).ao;
}

export function sampleProceduralStoneMoisture(u: number, v: number, seed = 0): number {
  return sampleStoneSurface(u, v, seed).moisture;
}

export function sampleProceduralStoneCalcite(u: number, v: number, seed = 0): number {
  return sampleStoneSurface(u, v, seed).calcite;
}

function configureTexture(texture: DataTexture): void {
  texture.wrapS = RepeatWrapping;
  texture.wrapT = RepeatWrapping;
  texture.magFilter = LinearFilter;
  texture.minFilter = LinearFilter;
  texture.colorSpace = NoColorSpace;
  texture.needsUpdate = true;
}

function fillStoneMaps(
  size: number,
  seed: number,
  albedo: Uint8Array,
  roughness: Uint8Array,
  ao: Uint8Array,
  height: Uint8Array,
  moisture: Uint8Array,
  calcite: Uint8Array,
): void {
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const u = x / (size - 1);
      const v = y / (size - 1);
      const sample = sampleStoneSurface(u, v, seed);
      const index = (y * size + x) * 4;
      const albedoByte = Math.round(linearToSRGB(sample.albedo) * 255);
      const roughnessByte = Math.round(sample.roughness * 255);
      const aoByte = Math.round(sample.ao * 255);
      const heightByte = Math.round(sample.height * 255);
      const moistureByte = Math.round(sample.moisture * 255);
      const calciteByte = Math.round(sample.calcite * 255);

      for (const [target, byte] of [
        [albedo, albedoByte],
        [roughness, roughnessByte],
        [ao, aoByte],
        [height, heightByte],
        [moisture, moistureByte],
        [calcite, calciteByte],
      ] as const) {
        target[index] = byte;
        target[index + 1] = byte;
        target[index + 2] = byte;
        target[index + 3] = 255;
      }
    }
  }
}

function computeNormalMap(
  size: number,
  height: Uint8Array,
  normal: Uint8Array,
  strength = 4,
): void {
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const xL = (x - 1 + size) % size;
      const xR = (x + 1) % size;
      const yD = (y - 1 + size) % size;
      const yU = (y + 1) % size;

      const hL = height[(y * size + xL) * 4] / 255;
      const hR = height[(y * size + xR) * 4] / 255;
      const hD = height[(yD * size + x) * 4] / 255;
      const hU = height[(yU * size + x) * 4] / 255;

      const dX = (hR - hL) * strength;
      const dY = (hU - hD) * strength;
      const len = Math.sqrt(dX * dX + dY * dY + 1);

      const nx = -dX / len;
      const ny = -dY / len;
      const nz = 1 / len;

      const index = (y * size + x) * 4;
      normal[index] = Math.round((nx * 0.5 + 0.5) * 255);
      normal[index + 1] = Math.round((ny * 0.5 + 0.5) * 255);
      normal[index + 2] = Math.round((nz * 0.5 + 0.5) * 255);
      normal[index + 3] = 255;
    }
  }
}

/**
 * Creates a complete procedural limestone PBR texture set.
 *
 * Produces albedo, normal, AO, height, moisture mask, calcite mask, and
 * roughness maps. The maps are deterministic and contain no baked dirt or
 * photographic data, so they can be regenerated identically on every client.
 */
export function createProceduralStoneTextures(
  options: ProceduralStoneOptions = {},
): ProceduralStoneTextureSet {
  const { seed = 0, size = 128 } = options;

  const albedo = new Uint8Array(size * size * 4);
  const roughness = new Uint8Array(size * size * 4);
  const ao = new Uint8Array(size * size * 4);
  const height = new Uint8Array(size * size * 4);
  const moisture = new Uint8Array(size * size * 4);
  const calcite = new Uint8Array(size * size * 4);
  const normal = new Uint8Array(size * size * 4);

  fillStoneMaps(size, seed, albedo, roughness, ao, height, moisture, calcite);
  computeNormalMap(size, height, normal, 4);

  const albedoTexture = new DataTexture(albedo, size, size, RGBAFormat, UnsignedByteType);
  const normalTexture = new DataTexture(normal, size, size, RGBAFormat, UnsignedByteType);
  const aoTexture = new DataTexture(ao, size, size, RGBAFormat, UnsignedByteType);
  const heightTexture = new DataTexture(height, size, size, RGBAFormat, UnsignedByteType);
  const moistureTexture = new DataTexture(moisture, size, size, RGBAFormat, UnsignedByteType);
  const calciteTexture = new DataTexture(calcite, size, size, RGBAFormat, UnsignedByteType);
  const roughnessTexture = new DataTexture(roughness, size, size, RGBAFormat, UnsignedByteType);

  for (const texture of [
    normalTexture,
    aoTexture,
    heightTexture,
    moistureTexture,
    calciteTexture,
    roughnessTexture,
  ]) {
    configureTexture(texture);
  }
  // Albedo is a color map, so it must be marked as sRGB and encoded with the
  // sRGB transfer curve for meshStandardMaterial.map to decode correctly.
  configureTexture(albedoTexture);
  albedoTexture.colorSpace = SRGBColorSpace;

  return {
    albedo: albedoTexture,
    normal: normalTexture,
    ao: aoTexture,
    height: heightTexture,
    moisture: moistureTexture,
    calcite: calciteTexture,
    roughness: roughnessTexture,
  };
}

/**
 * Creates a single square roughness/bump DataTexture for stone surfaces.
 *
 * Equivalent to the `roughness` channel from {@link createProceduralStoneTextures}.
 */
export function createProceduralStoneTexture(options: ProceduralStoneOptions = {}): DataTexture {
  return createProceduralStoneTextures(options).roughness;
}
