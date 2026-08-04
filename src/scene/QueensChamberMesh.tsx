import { useMemo } from 'react';
import { useSceneObjectClick } from './useSceneObjectClick';
import type { Vector3 } from '@/schemas/location';
import type { VisualizationRule } from '@/schemas/hypothesis';
import type { SceneNodeWithWorld } from './sceneGraph';
import { buildQueensChamberSegments, type QueensChamberSegment } from './queensChamberSegments';
import { getPbrForMaterial } from '@/materials/masterMaterials';

const pbr = getPbrForMaterial('MAT_TuraLimestone');

export interface QueensChamberBlock {
  id: string;
  name: string;
  position: Vector3;
  rotation?: Vector3;
  size: Vector3;
  objectId?: string;
  evidenceIds?: string[];
  sourceIds?: string[];
  layer: string;
  color: string;
  opacity?: number;
  overlay?: string;
}

export interface QueensChamberMeshProps {
  node: SceneNodeWithWorld;
  block: QueensChamberBlock;
  rule?: VisualizationRule;
}

function segmentColor(baseColor: string, kind: QueensChamberSegment['kind']): string {
  switch (kind) {
    case 'shell':
      return baseColor;
    case 'gable':
      return '#a08070';
    case 'shaft-marker':
      return '#3a3a3a';
    case 'dixon-vent':
      return '#2a1a15';
    default:
      return baseColor;
  }
}

function segmentOpacity(baseOpacity: number, kind: QueensChamberSegment['kind']): number {
  switch (kind) {
    case 'shell':
      return baseOpacity * 0.35;
    case 'gable':
      return baseOpacity * 0.8;
    case 'shaft-marker':
      return baseOpacity * 0.95;
    case 'dixon-vent':
      return baseOpacity * 0.95;
    default:
      return baseOpacity;
  }
}

export function QueensChamberMesh({ node, block, rule }: QueensChamberMeshProps): JSX.Element {
  const { hovered, handleClick, handlePointerOver, handlePointerOut } = useSceneObjectClick(node);

  const { position } = node.worldTransform;
  const color = rule?.color ?? block.color;
  const opacity = rule?.opacity ?? block.opacity ?? 1;

  const segments = useMemo(
    () => buildQueensChamberSegments(block.size.x, block.size.y, block.size.z),
    [block.size],
  );
  const rotation = block.rotation ?? { x: 0, y: 0, z: 0 };

  return (
    <group
      position={[position.x, position.y, position.z]}
      rotation={[rotation.x, rotation.y, rotation.z]}
      onClick={handleClick}
      onPointerOver={handlePointerOver}
      onPointerOut={handlePointerOut}
    >
      {segments.map((seg, idx) => (
        <mesh
          key={`${seg.kind}-${idx}`}
          position={seg.position}
          rotation={seg.rotation ?? [0, 0, 0]}
        >
          <boxGeometry args={seg.size} />
          <meshStandardMaterial
            color={segmentColor(color, seg.kind)}
            transparent={segmentOpacity(opacity, seg.kind) < 1}
            opacity={segmentOpacity(opacity, seg.kind)}
            metalness={pbr.metalness}
            roughness={pbr.roughness}
            emissive={hovered ? '#3b82f6' : '#000000'}
            emissiveIntensity={hovered ? 0.35 : 0}
          />
        </mesh>
      ))}
    </group>
  );
}
