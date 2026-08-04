/**
 * Material sample blocks for the benchmark scene (M08.5-T03).
 *
 * Renders labeled sample blocks with each of the 5 master materials
 * applied, so visual quality can be verified.
 */

import { Text } from '@react-three/drei';
import { MASTER_MATERIALS } from '@/materials/masterMaterials';
import { testId } from '@/utils/testId';

export interface MaterialSampleBlockProps {
  position: [number, number, number];
  materialId: string;
  label?: string;
}

/**
 * Renders a single sample block with the given master material applied.
 * Uses meshStandardMaterial with properties derived from the master
 * material definition (metalness, roughness).
 */
export function MaterialSampleBlock({
  position,
  materialId,
  label,
}: MaterialSampleBlockProps): JSX.Element {
  const material = MASTER_MATERIALS.find((m) => m.id === materialId);
  const name = label ?? material?.name ?? materialId;
  const roughness = material?.properties.roughnessBase ?? 0.5;
  const metalness = material?.properties.metallic ?? 0;

  // Approximate color from material name (real impl would load KTX2 textures)
  const colorMap: Record<string, string> = {
    MAT_TuraLimestone: '#e8e0d0',
    MAT_LocalLimestone: '#b8a880',
    MAT_AswanGranite: '#8a4030',
    MAT_Basalt: '#2a2a2a',
    MAT_Water: '#0a4a6b',
  };
  const color = colorMap[materialId] ?? '#888888';

  return (
    <group position={position} {...testId(`material-block-${materialId}`)}>
      <mesh castShadow receiveShadow>
        <boxGeometry args={[1.5, 1.5, 1.5]} />
        <meshStandardMaterial color={color} metalness={metalness} roughness={roughness} />
      </mesh>
      <Text position={[0, 1.5, 0]} fontSize={0.3} color="#e0e0e0" anchorX="center" anchorY="middle">
        {name}
      </Text>
    </group>
  );
}

/**
 * Renders a row of all 5 master material sample blocks.
 */
export function MaterialSampleRow(): JSX.Element {
  const materials = MASTER_MATERIALS;
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
