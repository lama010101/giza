import { useMemo } from 'react';
import type { ThreeEvent } from '@react-three/fiber';
import { useAppStore } from '@/store/app';
import type { Vector3 } from '@/schemas/location';
import type { VisualizationRule } from '@/schemas/hypothesis';
import type { SceneNodeWithWorld } from './sceneGraph';
import { getPbrForMaterial } from '@/materials/masterMaterials';

const pbr = getPbrForMaterial('MAT_Bedrock');

export interface SubterraneanChamberBlock {
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

export interface SubterraneanChamberMeshProps {
  node: SceneNodeWithWorld;
  block: SubterraneanChamberBlock;
  rule?: VisualizationRule;
}

interface SubterraneanSegment {
  key: string;
  position: [number, number, number];
  size: [number, number, number];
  kind: 'chamber' | 'niche' | 'blind';
}

// Inferred/placeholder dimensions for undocumented recesses.
// These reuse the Subterranean Chamber evidence (EV-100006) as the parent feature
// and are rendered distinctly to show they are inferred, not surveyed.
const NICHE_WIDTH_RATIO = 0.3;
const NICHE_HEIGHT_RATIO = 0.55;
const NICHE_DEPTH_RATIO = 0.22;
const BLIND_WIDTH_RATIO = 0.18;
const BLIND_HEIGHT_RATIO = 0.45;
const BLIND_DEPTH_RATIO = 0.28;
const WALL_OFFSET = 0.02;

function buildSubterraneanSegments(size: Vector3): SubterraneanSegment[] {
  const { x: width, y: height, z: depth } = size;
  const halfWidth = width / 2;
  const halfHeight = height / 2;
  const halfDepth = depth / 2;

  const segments: SubterraneanSegment[] = [];

  // Outer chamber shell
  segments.push({
    key: 'chamber-shell',
    position: [0, 0, 0],
    size: [width, height, depth],
    kind: 'chamber',
  });

  // Southern niche (in the +Z wall)
  const nicheWidth = width * NICHE_WIDTH_RATIO;
  const nicheHeight = height * NICHE_HEIGHT_RATIO;
  const nicheDepth = depth * NICHE_DEPTH_RATIO;
  segments.push({
    key: 'southern-niche',
    position: [0, -halfHeight + nicheHeight / 2 + 0.1, halfDepth - nicheDepth / 2 - WALL_OFFSET],
    size: [nicheWidth, nicheHeight, nicheDepth],
    kind: 'niche',
  });

  // Western blind passage (in the -X wall)
  const blindWidth = width * BLIND_WIDTH_RATIO;
  const blindHeight = height * BLIND_HEIGHT_RATIO;
  const blindDepth = depth * BLIND_DEPTH_RATIO;
  segments.push({
    key: 'blind-west',
    position: [-halfWidth + blindDepth / 2 + WALL_OFFSET, -halfHeight + blindHeight / 2 + 0.1, 0],
    size: [blindDepth, blindHeight, blindWidth],
    kind: 'blind',
  });

  // Northern blind passage (in the -Z wall)
  segments.push({
    key: 'blind-north',
    position: [0, -halfHeight + blindHeight / 2 + 0.1, -halfDepth + blindDepth / 2 + WALL_OFFSET],
    size: [blindWidth, blindHeight, blindDepth],
    kind: 'blind',
  });

  // Eastern blind passage (in the +X wall)
  segments.push({
    key: 'blind-east',
    position: [halfWidth - blindDepth / 2 - WALL_OFFSET, -halfHeight + blindHeight / 2 + 0.1, 0],
    size: [blindDepth, blindHeight, blindWidth],
    kind: 'blind',
  });

  return segments;
}

function segmentColor(baseColor: string, kind: SubterraneanSegment['kind']): string {
  if (kind === 'chamber') return baseColor;
  if (kind === 'niche') return '#5c4a3a';
  return '#4a3a2a';
}

export function SubterraneanChamberMesh({
  node,
  block,
  rule,
}: SubterraneanChamberMeshProps): JSX.Element {
  const setSelectedEvidenceId = useAppStore((s) => s.setSelectedEvidenceId);
  const setSidePanelTab = useAppStore((s) => s.setSidePanelTab);
  const setEvidencePanelOpen = useAppStore((s) => s.setEvidencePanelOpen);
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
      setSidePanelTab('evidence');
      setEvidencePanelOpen(true);
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

  const segments = useMemo(() => buildSubterraneanSegments(block.size), [block.size]);
  const rotation = block.rotation ?? { x: 0, y: 0, z: 0 };

  return (
    <group
      position={[position.x, position.y, position.z]}
      rotation={[rotation.x, rotation.y, rotation.z]}
      onClick={handleClick}
      onPointerOver={handlePointerOver}
      onPointerOut={handlePointerOut}
    >
      {segments.map((seg) => (
        <mesh key={seg.key} position={seg.position}>
          <boxGeometry args={seg.size} />
          <meshStandardMaterial
            color={segmentColor(color, seg.kind)}
            transparent={opacity < 1 || seg.kind !== 'chamber'}
            opacity={seg.kind === 'chamber' ? opacity * 0.4 : 0.85}
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
