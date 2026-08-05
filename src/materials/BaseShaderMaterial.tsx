import { DoubleSide } from 'three';
import { MASTER_MATERIALS } from './masterMaterials';

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
}

/**
 * Base shader material system.
 *
 * Maps `baseShader` strings from `masterMaterials.ts` to concrete Three.js
 * material components. Currently supports the `Stone` base shader via
 * `meshStandardMaterial`. Future base shaders (e.g. `Water`, `Metal`) can be
 * added here without touching scene components.
 */
export function BaseShaderMaterial({
  materialId,
  color,
  opacity = 1,
  pbr,
  hovered = false,
}: BaseShaderMaterialProps): JSX.Element {
  const master = materialId ? MASTER_MATERIALS.find((m) => m.id === materialId) : undefined;
  const baseShader = master?.baseShader ?? 'Stone';

  if (baseShader === 'Stone') {
    return (
      <meshStandardMaterial
        color={color}
        transparent={opacity < 1}
        opacity={opacity}
        side={DoubleSide}
        metalness={pbr.metalness}
        roughness={pbr.roughness}
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
      side={1}
      metalness={pbr.metalness}
      roughness={pbr.roughness}
      emissive={hovered ? '#3b82f6' : '#000000'}
      emissiveIntensity={hovered ? 0.35 : 0}
    />
  );
}
