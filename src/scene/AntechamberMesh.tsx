import { useMemo } from 'react';
import { useSceneObjectClick } from './useSceneObjectClick';
import type { Vector3 } from '@/schemas/location';
import type { VisualizationRule } from '@/schemas/hypothesis';
import type { SceneNodeWithWorld } from './sceneGraph';
import { getPbrForMaterial } from '@/materials/masterMaterials';

const pbr = getPbrForMaterial('MAT_AswanGranite');

export interface AntechamberBlock {
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

export interface AntechamberMeshProps {
  node: SceneNodeWithWorld;
  block: AntechamberBlock;
  rule?: VisualizationRule;
}

interface AntechamberSegment {
  key: string;
  position: [number, number, number];
  size: [number, number, number];
  kind: 'chamber' | 'wainscot' | 'slot';
}

const WAINSCOT_THICKNESS = 0.05;
const WAINSCOT_HEIGHT_RATIO = 0.5;
const SLOT_WIDTH = 0.1;
const SLOT_DEPTH = 0.1;

function buildAntechamberSegments(size: Vector3): AntechamberSegment[] {
  const { x: width, y: height, z: depth } = size;
  const halfWidth = width / 2;
  const halfHeight = height / 2;
  const halfDepth = depth / 2;
  const wainscotHeight = height * WAINSCOT_HEIGHT_RATIO;
  const wainscotY = -halfHeight + wainscotHeight / 2;

  const segments: AntechamberSegment[] = [];

  // Outer chamber shell
  segments.push({
    key: 'chamber-shell',
    position: [0, 0, 0],
    size: [width, height, depth],
    kind: 'chamber',
  });

  // Half-height wainscots on all four walls
  // North / south walls (Z faces)
  segments.push({
    key: 'wainscot-north',
    position: [0, wainscotY, -halfDepth + WAINSCOT_THICKNESS / 2],
    size: [width, wainscotHeight, WAINSCOT_THICKNESS],
    kind: 'wainscot',
  });
  segments.push({
    key: 'wainscot-south',
    position: [0, wainscotY, halfDepth - WAINSCOT_THICKNESS / 2],
    size: [width, wainscotHeight, WAINSCOT_THICKNESS],
    kind: 'wainscot',
  });

  // East / west walls (X faces)
  segments.push({
    key: 'wainscot-west',
    position: [-halfWidth + WAINSCOT_THICKNESS / 2, wainscotY, 0],
    size: [WAINSCOT_THICKNESS, wainscotHeight, depth],
    kind: 'wainscot',
  });
  segments.push({
    key: 'wainscot-east',
    position: [halfWidth - WAINSCOT_THICKNESS / 2, wainscotY, 0],
    size: [WAINSCOT_THICKNESS, wainscotHeight, depth],
    kind: 'wainscot',
  });

  // Portcullis slots in the side (east/west) walls
  // Two slots per wall, running from wainscot top to ceiling
  const slotHeight = halfHeight + wainscotY; // distance from wainscot top to ceiling
  const slotY = wainscotY + (slotHeight / 2 + wainscotHeight / 2); // center above wainscot
  const slotInset = WAINSCOT_THICKNESS + SLOT_DEPTH / 2;
  const slotZPositions = [-depth / 4, depth / 4];

  for (const z of slotZPositions) {
    segments.push({
      key: `slot-west-${z < 0 ? 'north' : 'south'}`,
      position: [-halfWidth + slotInset, slotY, z],
      size: [SLOT_DEPTH, slotHeight, SLOT_WIDTH],
      kind: 'slot',
    });
    segments.push({
      key: `slot-east-${z < 0 ? 'north' : 'south'}`,
      position: [halfWidth - slotInset, slotY, z],
      size: [SLOT_DEPTH, slotHeight, SLOT_WIDTH],
      kind: 'slot',
    });
  }

  return segments;
}

function segmentColor(baseColor: string, kind: AntechamberSegment['kind']): string {
  if (kind === 'chamber') return baseColor;
  if (kind === 'wainscot') return baseColor;
  // Slightly darker recess for slots
  return '#6a5a4a';
}

export function AntechamberMesh({ node, block, rule }: AntechamberMeshProps): JSX.Element {
  const { hovered, handleClick, handlePointerOver, handlePointerOut } = useSceneObjectClick(node);

  const { position } = node.worldTransform;
  const color = rule?.color ?? block.color;
  const opacity = rule?.opacity ?? block.opacity ?? 1;

  const segments = useMemo(() => buildAntechamberSegments(block.size), [block.size]);
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
            transparent={opacity < 1}
            opacity={seg.kind === 'chamber' ? opacity * 0.4 : opacity}
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
