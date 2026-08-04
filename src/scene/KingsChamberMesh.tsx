import { useMemo } from 'react';
import { useSceneObjectClick } from './useSceneObjectClick';
import type { Vector3 } from '@/schemas/location';
import type { VisualizationRule } from '@/schemas/hypothesis';
import type { SceneNodeWithWorld } from './sceneGraph';
import { buildKingsChamberSegments, type KingsChamberSegment } from './kingsChamberSegments';
import { getPbrForMaterial } from '@/materials/masterMaterials';

const pbr = getPbrForMaterial('MAT_AswanGranite');

export interface KingsChamberBlock {
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

export interface KingsChamberMeshProps {
  node: SceneNodeWithWorld;
  block: KingsChamberBlock;
  rule?: VisualizationRule;
}

function segmentColor(baseColor: string, kind: KingsChamberSegment['kind']): string {
  switch (kind) {
    case 'shell':
      return baseColor;
    case 'slab':
      return '#6a4a45';
    case 'wall':
      return '#8a5a50';
    case 'joint':
      return '#4a3a35';
    case 'fracture':
      return '#2a1a15';
    case 'shaft-marker':
      return '#3a3a3a';
    default:
      return baseColor;
  }
}

function segmentOpacity(baseOpacity: number, kind: KingsChamberSegment['kind']): number {
  switch (kind) {
    case 'shell':
      return baseOpacity * 0.35;
    case 'slab':
      return baseOpacity * 0.75;
    case 'wall':
      return baseOpacity * 0.65;
    case 'joint':
      return baseOpacity * 0.95;
    case 'fracture':
      return baseOpacity * 0.85;
    case 'shaft-marker':
      return baseOpacity * 0.95;
    default:
      return baseOpacity;
  }
}

export function KingsChamberMesh({ node, block, rule }: KingsChamberMeshProps): JSX.Element {
  const { hovered, handleClick, handlePointerOver, handlePointerOut } = useSceneObjectClick(node);

  const { position } = node.worldTransform;
  const color = rule?.color ?? block.color;
  const opacity = rule?.opacity ?? block.opacity ?? 1;

  const segments = useMemo(
    () => buildKingsChamberSegments(block.size.x, block.size.y, block.size.z),
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
