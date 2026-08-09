import type { Material } from 'three';
import type { MicroDetailConfig } from '@/materials/masterMaterials';

type Shader = Parameters<NonNullable<Material['onBeforeCompile']>>[0];

/**
 * Pseudo-random hash function for GLSL noise.
 */
const HASH_GLSL = `
float hash(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}
`;

/**
 * Returns a meshStandardMaterial onBeforeCompile callback that adds procedural
 * limestone micro-detail: edge erosion, mineral streaks, micro cracks, and dust.
 *
 * The shader forces `USE_UV` so `vUv` is available even when no texture maps
 * are bound. Effects are driven by the `MicroDetailConfig` intensities and are
 * intentionally subtle to preserve readability of the blockout geometry.
 */
export function createOsirisStoneOnBeforeCompile(config: MicroDetailConfig) {
  return (shader: Shader): void => {
    shader.uniforms.uErosion = { value: config.erosion };
    shader.uniforms.uMineralStreaks = { value: config.mineralStreaks };
    shader.uniforms.uMicroCracks = { value: config.microCracks };
    shader.uniforms.uDust = { value: config.dust };

    const uniformDecls = `
uniform float uErosion;
uniform float uMineralStreaks;
uniform float uMicroCracks;
uniform float uDust;
${HASH_GLSL}
`;

    const forceUv = `#ifndef USE_UV\n#define USE_UV\n#endif\n`;

    shader.vertexShader = forceUv + shader.vertexShader;
    shader.fragmentShader = forceUv + uniformDecls + shader.fragmentShader;

    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <color_fragment>',
      `
  #include <color_fragment>
  {
    vec2 uv = vUv;
    float n = hash(uv * 512.0);

    // Edge erosion: darken near UV boundaries where block edges are.
    float edgeDist = min(min(uv.x, uv.y), min(1.0 - uv.x, 1.0 - uv.y));
    float erosion = (1.0 - smoothstep(0.0, 0.12 * uErosion, edgeDist)) * uErosion;
    diffuseColor.rgb *= (1.0 - erosion * 0.25);

    // Mineral streaks: low-frequency diagonal variation.
    float streak = sin((uv.x + uv.y) * 30.0 + n * 2.0) * 0.5 + 0.5;
    streak = smoothstep(0.55, 0.65, streak) * uMineralStreaks;
    diffuseColor.rgb += streak * vec3(0.08, 0.05, 0.02);

    // Micro cracks: high-frequency dark lines.
    float crackA = sin(uv.x * 260.0 + n * 10.0) * sin(uv.y * 260.0 + n * 10.0);
    float crackB = sin((uv.x - uv.y) * 180.0 + n * 8.0);
    float crack = step(0.965, crackA) * step(0.0, crackB) * uMicroCracks;
    diffuseColor.rgb *= (1.0 - crack * 0.35);

    // Dust/deposits: subtle lightness variation in recessed areas.
    float dust = n * uDust * 0.08;
    diffuseColor.rgb += vec3(dust);
  }
  `,
    );
  };
}
