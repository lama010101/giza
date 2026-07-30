import { useMemo } from 'react';
import type { ThreeEvent } from '@react-three/fiber';
import { useAppStore } from '@/store/app';
import type { Vector3 } from '@/schemas/location';
import type { VisualizationRule } from '@/schemas/hypothesis';
import type { SceneNodeWithWorld } from './sceneGraph';
import { GP_GRAND_GALLERY } from '@db/measurements/great-pyramid-measurements';

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

interface CorbelSegment {
  position: [number, number, number];
  size: [number, number, number];
  kind: 'floor' | 'ramp' | 'corbel' | 'ceiling';
}

const SLAB_THICKNESS = 0.2;

export function buildCorbelSegments(gg: typeof GP_GRAND_GALLERY): CorbelSegment[] {
  const halfHeight = gg.height / 2;
  const courseHeight = (gg.height - gg.rampHeight) / gg.corbelCourses;
  const segments: CorbelSegment[] = [];

  segments.push({
    position: [0, -halfHeight, 0],
    size: [gg.floorWidth, SLAB_THICKNESS, gg.floorLength],
    kind: 'floor',
  });

  const rampY = -halfHeight + gg.rampHeight / 2;
  segments.push({
    position: [-(gg.centralFloorWidth / 2 + gg.rampWidth / 2), rampY, 0],
    size: [gg.rampWidth, gg.rampHeight, gg.floorLength],
    kind: 'ramp',
  });
  segments.push({
    position: [gg.centralFloorWidth / 2 + gg.rampWidth / 2, rampY, 0],
    size: [gg.rampWidth, gg.rampHeight, gg.floorLength],
    kind: 'ramp',
  });

  for (let i = 0; i < gg.corbelCourses; i++) {
    const innerHalfWidth = gg.floorWidth / 2 - (i + 1) * gg.corbelProjection;
    const yCenter = -halfHeight + gg.rampHeight + (i + 0.5) * courseHeight;
    const wallThickness = gg.corbelProjection;

    segments.push({
      position: [-(innerHalfWidth + wallThickness / 2), yCenter, 0],
      size: [wallThickness, courseHeight, gg.floorLength],
      kind: 'corbel',
    });
    segments.push({
      position: [innerHalfWidth + wallThickness / 2, yCenter, 0],
      size: [wallThickness, courseHeight, gg.floorLength],
      kind: 'corbel',
    });
  }

  segments.push({
    position: [0, halfHeight, 0],
    size: [gg.topWidth, SLAB_THICKNESS, gg.ceilingLength],
    kind: 'ceiling',
  });

  return segments;
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
            color={color}
            transparent={opacity < 1}
            opacity={opacity}
            metalness={0.15}
            roughness={0.8}
            emissive={hovered ? '#3b82f6' : '#000000'}
            emissiveIntensity={hovered ? 0.35 : 0}
          />
        </mesh>
      ))}
    </group>
  );
}
