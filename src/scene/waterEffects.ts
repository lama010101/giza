/**
 * Advanced water effects per M08.5-T04 and GIZA-04 §6.12.
 *
 * Provides pure, framework-agnostic helpers for the water shader pass:
 *   - Fresnel term computation
 *   - Screen-space reflection (SSR) factor approximation
 *   - Refraction UV offset
 *   - Ripple perturbation
 *   - Shader uniform assembly
 *
 * Vector types are plain objects so the module can be unit-tested without
 * pulling in Three.js.
 */

/** 2D vector. */
export interface Vector2 {
  x: number;
  y: number;
}

/** 3D vector. */
export interface Vector3 {
  x: number;
  y: number;
  z: number;
}

/** Tunable parameters for the water effect pass. */
export interface WaterEffectParams {
  /** Whether screen-space reflections are enabled. */
  ssrEnabled: boolean;
  /** Fresnel edge-bias power (higher = tighter rim). */
  fresnelPower: number;
  /** Refraction UV displacement strength. */
  refractionAmount: number;
  /** Spatial scale of the ripple pattern. */
  rippleScale: number;
  /** Temporal speed of the ripple animation. */
  rippleSpeed: number;
  /** Normal map UV scale. */
  normalMapScale: number;
  /** Water surface depth in world units. */
  depth: number;
}

/**
 * Returns the default water effect parameters used by the benchmark scene.
 */
export function getDefaultWaterParams(): WaterEffectParams {
  return {
    ssrEnabled: true,
    fresnelPower: 3.0,
    refractionAmount: 0.02,
    rippleScale: 12.0,
    rippleSpeed: 0.8,
    normalMapScale: 4.0,
    depth: 1.5,
  };
}

/** Returns the squared length of a 3D vector. */
function lengthSq3(v: Vector3): number {
  return v.x * v.x + v.y * v.y + v.z * v.z;
}

/** Normalizes a 3D vector, returning a zero vector if input is zero. */
function normalize3(v: Vector3): Vector3 {
  const len = Math.sqrt(lengthSq3(v));
  if (len === 0) return { x: 0, y: 0, z: 0 };
  return { x: v.x / len, y: v.y / len, z: v.z / len };
}

/** Dot product of two 3D vectors. */
function dot3(a: Vector3, b: Vector3): number {
  return a.x * b.x + a.y * b.y + a.z * b.z;
}

/**
 * Computes the Fresnel reflectance term using Schlick's approximation.
 *
 * @param viewDir - Direction from surface point toward the camera.
 * @param normal - Surface normal (need not be normalized).
 * @param power - Fresnel power controlling the edge falloff.
 * @returns Reflectance in the range [0, 1].
 */
export function computeFresnel(viewDir: Vector3, normal: Vector3, power: number): number {
  const v = normalize3(viewDir);
  const n = normalize3(normal);
  const cosTheta = Math.min(1, Math.max(0, dot3(v, n)));
  // Schlick: R = (1 - cos)^power
  return Math.pow(1 - cosTheta, power);
}

/**
 * Computes a screen-space reflection factor approximation.
 *
 * Deeper water and rougher surfaces reduce the SSR contribution. The result is
 * clamped to [0, 1].
 *
 * @param depth - Water depth in world units.
 * @param roughness - Surface roughness in [0, 1].
 * @returns SSR blend factor in [0, 1].
 */
export function computeSSR(depth: number, roughness: number): number {
  const depthFactor = 1 / (1 + depth * 0.5);
  const roughnessFactor = 1 - Math.min(1, Math.max(0, roughness));
  return Math.min(1, Math.max(0, depthFactor * roughnessFactor));
}

/**
 * Computes a refraction UV offset driven by a sinusoidal ripple.
 *
 * @param uv - Base UV coordinate.
 * @param amount - Displacement strength.
 * @param time - Time in seconds.
 * @returns Perturbed UV coordinate.
 */
export function computeRefraction(uv: Vector2, amount: number, time: number): Vector2 {
  const wave = Math.sin((uv.x + uv.y) * 10.0 + time * 1.5);
  return {
    x: uv.x + wave * amount,
    y: uv.y + Math.cos(time * 1.2 + uv.x * 8.0) * amount,
  };
}

/**
 * Assembles the shader uniforms for the water pass from effect params and time.
 *
 * @param params - Water effect parameters.
 * @param time - Current time in seconds.
 * @returns A uniform map suitable for a THREE.ShaderMaterial.
 */
export function getWaterShaderUniforms(
  params: WaterEffectParams,
  time: number,
): Record<string, unknown> {
  return {
    uSSREnabled: { value: params.ssrEnabled ? 1 : 0 },
    uFresnelPower: { value: params.fresnelPower },
    uRefractionAmount: { value: params.refractionAmount },
    uRippleScale: { value: params.rippleScale },
    uRippleSpeed: { value: params.rippleSpeed },
    uNormalMapScale: { value: params.normalMapScale },
    uDepth: { value: params.depth },
    uTime: { value: time },
  };
}

/**
 * Vertex shader for the water pass.
 *
 * Displaces vertices with a sum-of-sines ripple and forwards world-space
 * position, normal, and UV to the fragment stage.
 */
export const WaterVertexShader = /* glsl */ `
uniform float uRippleScale;
uniform float uRippleSpeed;
uniform float uTime;
uniform float uDepth;

varying vec2 vUv;
varying vec3 vWorldPos;
varying vec3 vNormal;

void main() {
  vUv = uv * uNormalMapScale;
  vec3 pos = position;

  // Sum-of-sines ripple displacement (gerstner-like approximation).
  float t = uTime * uRippleSpeed;
  float wave1 = sin(pos.x * uRippleScale + t) * 0.05;
  float wave2 = cos(pos.z * uRippleScale * 0.8 + t * 1.2) * 0.04;
  pos.y += wave1 + wave2;

  // Approximate normal from ripple gradients.
  float dx = cos(pos.x * uRippleScale + t) * uRippleScale * 0.05;
  float dz = -sin(pos.z * uRippleScale * 0.8 + t * 1.2) * uRippleScale * 0.8 * 0.04;
  vNormal = normalize(vec3(-dx, 1.0, -dz));

  vec4 worldPos = modelMatrix * vec4(pos, 1.0);
  vWorldPos = worldPos.xyz;
  gl_Position = projectionMatrix * viewMatrix * worldPos;
}
`;

/**
 * Fragment shader for the water pass.
 *
 * Combines Fresnel reflectance, screen-space reflections, refraction, and
 * ripple perturbation into the final water color.
 */
export const WaterFragmentShader = /* glsl */ `
uniform int uSSREnabled;
uniform float uFresnelPower;
uniform float uRefractionAmount;
uniform float uDepth;
uniform float uTime;

varying vec2 vUv;
varying vec3 vWorldPos;
varying vec3 vNormal;

void main() {
  vec3 viewDir = normalize(cameraPosition - vWorldPos);
  vec3 normal = normalize(vNormal);

  // Fresnel rim term.
  float fresnel = pow(1.0 - max(dot(viewDir, normal), 0.0), uFresnelPower);

  // Screen-space reflection approximation (depth-attenuated).
  float ssr = 0.0;
  if (uSSREnabled == 1) {
    ssr = 1.0 / (1.0 + uDepth * 0.5);
  }

  // Refraction UV perturbation.
  vec2 refractionUv = vUv + vec2(
    sin(vUv.x * 10.0 + uTime * 1.5) * uRefractionAmount,
    cos(uTime * 1.2 + vUv.x * 8.0) * uRefractionAmount
  );

  vec3 shallowColor = vec3(0.20, 0.45, 0.55);
  vec3 deepColor = vec3(0.05, 0.15, 0.25);
  vec3 waterColor = mix(deepColor, shallowColor, refractionUv.y);

  vec3 reflectionColor = vec3(0.6, 0.7, 0.8);
  vec3 finalColor = mix(waterColor, reflectionColor, fresnel + ssr * 0.3);

  gl_FragColor = vec4(finalColor, 0.85);
}
`;
