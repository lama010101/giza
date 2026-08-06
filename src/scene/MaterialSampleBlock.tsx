/**
 * Material sample blocks for the benchmark scene (M08.5-T03).
 *
 * Renders labeled sample blocks with each of the master materials applied,
 * so visual quality can be verified. Stone materials use the procedural
 * limestone PBR shader via `BaseShaderMaterial`; other base shaders fall back
 * to a plain `meshStandardMaterial` until their dedicated shader is added.
 */

import type { Mesh } from 'three';
import { Text } from '@react-three/drei';
import { BaseShaderMaterial } from '@/materials/BaseShaderMaterial';
import { getAllMaterials, getMaterialById, getPbrForMaterial } from '@/materials/masterMaterials';
import { testId } from '@/utils/testId';

export interface MaterialSampleBlockProps {
  position: [number, number, number];
  materialId: string;
  label?: string;
}

function ensureUv2(mesh: Mesh): void {
  const geometry = mesh.geometry;
  if (!geometry.hasAttribute('uv2')) {
    geometry.setAttribute('uv2', geometry.attributes.uv);
  }
}

export function MaterialSampleBlock({
  position,
  materialId,
  label,
}: MaterialSampleBlockProps): JSX.Element {
  const material = getMaterialById(materialId);
  const name = label ?? material?.name ?? materialId;
  const pbr = getPbrForMaterial(materialId);
  const isStone = material?.baseShader === 'Stone';

  // Approximate color from material name; the Stone base shader multiplies
  // this tint with the procedural albedo map, while other shaders use it as
  // the solid surface color.
  const colorMap: Record<string, string> = {
    MAT_TuraLimestone: '#e8e0d0',
    MAT_LocalLimestone: '#b8a880',
    MAT_AswanGranite: '#8a4030',
    MAT_Basalt: '#2a2a2a',
    MAT_Water: '#0a4a6b',
    MAT_Mortar: '#9a8a7a',
    MAT_GypsumPlaster: '#d8d0c0',
    MAT_Bedrock: '#6a5a4a',
    MAT_WoodModern: '#8a6a4a',
    MAT_SteelModern: '#5a5a60',
  };
  const color = colorMap[materialId] ?? '#888888';

  return (
    <group position={position} {...testId(`material-block-${materialId}`)}>
      <mesh castShadow receiveShadow onUpdate={isStone ? ensureUv2 : undefined}>
        <boxGeometry args={[1.5, 1.5, 1.5]} />
        {isStone ? (
          <BaseShaderMaterial materialId={materialId} color={color} pbr={pbr} proceduralDetail />
        ) : (
          <meshStandardMaterial color={color} metalness={pbr.metalness} roughness={pbr.roughness} />
        )}
      </mesh>
      <Text position={[0, 1.5, 0]} fontSize={0.3} color="#e0e0e0" anchorX="center" anchorY="middle">
        {name}
      </Text>
    </group>
  );
}

/**
 * Renders a row of all master material sample blocks.
 */
export function MaterialSampleRow(): JSX.Element {
  const materials = getAllMaterials(); // Keep using the core library for the benchmark row
  const spacing = 2.5;

  return (
    <group {...testId('material-sample-row')}>
      {materials.map((mat, i) => (
        <MaterialSampleBlock
          key={mat.id}
          position={[(i - (materials.length - 1) / 2) * spacing, 0.75, -4]}
          materialId={mat.id}
        />
      ))}
    </group>
  );
}
