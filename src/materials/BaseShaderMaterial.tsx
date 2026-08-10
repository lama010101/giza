import { DoubleSide, Vector2 } from 'three';
import { MASTER_MATERIALS } from './masterMaterials';
import { createProceduralStoneTextures } from './proceduralStone';

/** Lazily-initialized shared procedural limestone PBR texture set. */
let stoneTextures: ReturnType<typeof createProceduralStoneTextures> | undefined;

function getStoneTextures() {
  return (stoneTextures ??= createProceduralStoneTextures({ seed: 0, size: 128 }));
}

const NORMAL_SCALE = new Vector2(0.5, 0.5);

export interface BaseShaderMaterialProps {
  /** Master material id used to look up the base shader and default properties. */
  materialId?: string;
  /** Fallback color when the master material has no albedo tint. */
  color: string;
  /** Opacity (0..1). */
  opacity?: number;
  /** PBR roughness/metalness already resolved for the target object. */
  pbr: { metalness: number; roughness: number };
  /** Whether the object is currently hovered for emphasis. */
  hovered?: boolean;
  /** Apply procedural stone detail (micro-cracks, mineral streaks, edge erosion). */
  proceduralDetail?: boolean;
}

/**
 * Base shader material system.
 *
 * Maps `baseShader` strings from `masterMaterials.ts` to concrete Three.js
 * material components. Currently supports the `Stone` base shader via
 * `meshStandardMaterial` with a shared procedural limestone PBR texture set
 * (albedo, normal, AO, height, roughness). Future base shaders (e.g.
 * `Water`, `Metal`) can be added here without touching scene components.
 */
export function BaseShaderMaterial({
  materialId,
  color,
  opacity = 1,
  pbr,
  hovered = false,
  proceduralDetail = true,
}: BaseShaderMaterialProps): JSX.Element {
  const master = materialId ? MASTER_MATERIALS.find((m) => m.id === materialId) : undefined;
  const baseShader = master?.baseShader ?? 'Stone';
  const stone = proceduralDetail ? getStoneTextures() : undefined;

  if (baseShader === 'Stone') {
    return (
      <meshStandardMaterial
        color={color}
        transparent={opacity < 1}
        opacity={opacity}
        side={DoubleSide}
        metalness={pbr.metalness}
        roughness={pbr.roughness}
        map={stone?.albedo}
        normalMap={stone?.normal}
        normalScale={NORMAL_SCALE}
        aoMap={stone?.ao}
        aoMapIntensity={0.8}
        bumpMap={stone?.height}
        bumpScale={proceduralDetail ? 0.005 : 0}
        roughnessMap={stone?.roughness}
        emissive={hovered ? '#3b82f6' : '#000000'}
        emissiveIntensity={hovered ? 0.35 : 0}
      />
    );
  }

  // Unknown base shader falls back to the same Stone shader so objects remain
  // visible even if a material definition references a future shader.
  return (
    <meshStandardMaterial
      color={color}
      transparent={opacity < 1}
      opacity={opacity}
      side={DoubleSide}
      metalness={pbr.metalness}
      roughness={pbr.roughness}
      map={stone?.albedo}
      normalMap={stone?.normal}
      normalScale={NORMAL_SCALE}
      aoMap={stone?.ao}
      aoMapIntensity={0.8}
      bumpMap={stone?.height}
      bumpScale={proceduralDetail ? 0.005 : 0}
      roughnessMap={stone?.roughness}
      emissive={hovered ? '#3b82f6' : '#000000'}
      emissiveIntensity={hovered ? 0.35 : 0}
    />
  );
}
