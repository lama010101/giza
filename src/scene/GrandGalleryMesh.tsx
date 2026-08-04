import { useMemo } from 'react';
import type { ThreeEvent } from '@react-three/fiber';
import { useAppStore } from '@/store/app';
import type { Vector3 } from '@/schemas/location';
import type { VisualizationRule } from '@/schemas/hypothesis';
import type { SceneNodeWithWorld } from './sceneGraph';
import { GP_GRAND_GALLERY } from '@db/measurements/great-pyramid-measurements';
import { buildCorbelSegments, type CorbelSegment } from './grandGallerySegments';
import { getPbrForMaterial } from '@/materials/masterMaterials';

const pbr = getPbrForMaterial('MAT_TuraLimestone');

export interface GrandGalleryBlock {
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

export interface GrandGalleryMeshProps {
  node: SceneNodeWithWorld;
  block: GrandGalleryBlock;
  rule?: VisualizationRule;
}

export function GrandGalleryMesh({ node, block, rule }: GrandGalleryMeshProps): JSX.Element {
  const setSelectedEvidenceId = useAppStore((s) => s.setSelectedEvidenceId);
  const setHoveredNodeId = useAppStore((s) => s.setHoveredNodeId);
  const hovered = useAppStore((s) => s.hoveredNodeId === node.id);
  const measurementMode = useAppStore((s) => s.measurementMode);
  const addMeasurementPoint = useAppStore((s) => s.addMeasurementPoint);

  const { position } = node.worldTransform;
  const color = rule?.color ?? block.color;
  const opacity = rule?.opacity ?? block.opacity ?? 1;

  const handleClick = (event: ThreeEvent<MouseEvent>): void => {
    event.stopPropagation();
    if (measurementMode) {
      addMeasurementPoint({ x: event.point.x, y: event.point.y, z: event.point.z });
      return;
    }
    const evidenceId = node.metadata.evidenceIds?.[0];
    if (evidenceId) {
      setSelectedEvidenceId(evidenceId);
    }
  };

  const handlePointerOver = (event: ThreeEvent<PointerEvent>): void => {
    event.stopPropagation();
    setHoveredNodeId(node.id);
    document.body.style.cursor = 'pointer';
  };

  const handlePointerOut = (): void => {
    setHoveredNodeId(null);
    document.body.style.cursor = 'auto';
  };

  function segmentColor(baseColor: string, kind: CorbelSegment['kind']): string {
    if (kind === 'notch' || kind === 'floor-slot') return '#5a4a3a';
    return baseColor;
  }

  const segments = useMemo(() => buildCorbelSegments(GP_GRAND_GALLERY), []);

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
        <mesh key={`gg-${idx}`} position={seg.position}>
          <boxGeometry args={seg.size} />
          <meshStandardMaterial
            color={segmentColor(color, seg.kind)}
            transparent={opacity < 1}
            opacity={seg.kind === 'floor' || seg.kind === 'ceiling' ? opacity : opacity * 0.85}
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
