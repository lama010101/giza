import { useMemo } from 'react';
import { useSceneObjectClick } from './useSceneObjectClick';
import type { Vector3 } from '@/schemas/location';
import type { VisualizationRule } from '@/schemas/hypothesis';
import type { SceneNodeWithWorld } from './sceneGraph';
import { GP_EXTERNAL } from '@db/measurements/great-pyramid-measurements';
import { degToRad } from '@db/geometry/gp-geometry-utils';
import { getPbrForMaterial } from '@/materials/masterMaterials';

export interface ExteriorDetailBlock {
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

export interface GreatPyramidExteriorMeshProps {
  node: SceneNodeWithWorld;
  block: ExteriorDetailBlock;
  rule?: VisualizationRule;
}

interface ExteriorSegment {
  key: string;
  position: [number, number, number];
  rotation?: [number, number, number];
  size?: [number, number, number];
  geometry: 'box' | 'cone';
  coneArgs?: [number, number, number];
  color: string;
  opacity: number;
  materialId?: string;
}

const CASING_Y = 5;
const CASING_HEIGHT = 10;
const CASING_THICKNESS = 1;
const WALL_OFFSET = 30;
const WALL_HEIGHT = 2;
const WALL_THICKNESS = 1;
const SOCKET_SIZE = 2.5;

function buildExteriorSegments(): ExteriorSegment[] {
  const baseMean = GP_EXTERNAL.baseMean;
  const baseHalf = baseMean / 2;
  const angle = GP_EXTERNAL.casingAngleDeg;
  const inset = CASING_Y / Math.tan(degToRad(angle));
  const casingColor = '#e8e0d0';
  const socketColor = '#6a5a4a';
  const wallColor = '#8a7a55';
  const debrisColor = '#c2b090';
  const pyramidionColor = '#e8e0d0';

  const segments: ExteriorSegment[] = [];

  // Surviving casing on south/east/west lower courses
  segments.push({
    key: 'casing-south',
    position: [0, CASING_Y, -(-baseHalf + inset)],
    rotation: [-degToRad(angle), 0, 0],
    size: [baseMean, CASING_HEIGHT, CASING_THICKNESS],
    geometry: 'box',
    color: casingColor,
    opacity: 0.7,
    materialId: 'MAT_TuraLimestone',
  });
  segments.push({
    key: 'casing-east',
    position: [baseHalf - inset, CASING_Y, 0],
    rotation: [0, 0, degToRad(angle)],
    size: [CASING_THICKNESS, CASING_HEIGHT, baseMean],
    geometry: 'box',
    color: casingColor,
    opacity: 0.7,
    materialId: 'MAT_TuraLimestone',
  });
  segments.push({
    key: 'casing-west',
    position: [-(baseHalf - inset), CASING_Y, 0],
    rotation: [0, 0, -degToRad(angle)],
    size: [CASING_THICKNESS, CASING_HEIGHT, baseMean],
    geometry: 'box',
    color: casingColor,
    opacity: 0.7,
    materialId: 'MAT_TuraLimestone',
  });

  // Casing fragment debris field around the base
  segments.push({
    key: 'casing-debris',
    position: [0, 0.5, 0],
    size: [baseMean + 20, 1, baseMean + 20],
    geometry: 'box',
    color: debrisColor,
    opacity: 0.08,
    materialId: 'MAT_TuraLimestone',
  });

  // Corner foundation sockets at the four base corners
  const socketInset = baseHalf * 0.95;
  for (const [xSign, zSign] of [
    [1, 1],
    [1, -1],
    [-1, 1],
    [-1, -1],
  ] as const) {
    segments.push({
      key: `corner-socket-${xSign > 0 ? 'e' : 'w'}${zSign > 0 ? 's' : 'n'}`,
      position: [xSign * socketInset, -1.5, zSign * socketInset],
      size: [SOCKET_SIZE, SOCKET_SIZE, SOCKET_SIZE],
      geometry: 'box',
      color: socketColor,
      opacity: 0.9,
      materialId: 'MAT_LocalLimestone',
    });
  }

  // Pyramid enclosure wall traces (square ring around the pyramid)
  const wallLength = baseMean + 2 * WALL_OFFSET + 2;
  const wallOut = baseHalf + WALL_OFFSET;
  segments.push({
    key: 'enclosure-wall-north',
    position: [0, WALL_HEIGHT / 2, -wallOut],
    size: [wallLength, WALL_HEIGHT, WALL_THICKNESS],
    geometry: 'box',
    color: wallColor,
    opacity: 0.35,
    materialId: 'MAT_LocalLimestone',
  });
  segments.push({
    key: 'enclosure-wall-south',
    position: [0, WALL_HEIGHT / 2, wallOut],
    size: [wallLength, WALL_HEIGHT, WALL_THICKNESS],
    geometry: 'box',
    color: wallColor,
    opacity: 0.35,
    materialId: 'MAT_LocalLimestone',
  });
  segments.push({
    key: 'enclosure-wall-east',
    position: [wallOut, WALL_HEIGHT / 2, 0],
    size: [WALL_THICKNESS, WALL_HEIGHT, wallLength],
    geometry: 'box',
    color: wallColor,
    opacity: 0.35,
    materialId: 'MAT_LocalLimestone',
  });
  segments.push({
    key: 'enclosure-wall-west',
    position: [-wallOut, WALL_HEIGHT / 2, 0],
    size: [WALL_THICKNESS, WALL_HEIGHT, wallLength],
    geometry: 'box',
    color: wallColor,
    opacity: 0.35,
    materialId: 'MAT_LocalLimestone',
  });

  // Pyramidion reconstruction (transparent inferred capstone)
  const pyramidionHeight = 2;
  segments.push({
    key: 'pyramidion',
    position: [0, GP_EXTERNAL.originalHeight - pyramidionHeight / 2, 0],
    geometry: 'cone',
    coneArgs: [1, pyramidionHeight, 4],
    color: pyramidionColor,
    opacity: 0.5,
    materialId: 'MAT_TuraLimestone',
  });

  return segments;
}

export function GreatPyramidExteriorMesh({
  node,
  block,
  rule,
}: GreatPyramidExteriorMeshProps): JSX.Element {
  const { hovered, handleClick, handlePointerOver, handlePointerOut } = useSceneObjectClick(node);

  const { position } = node.worldTransform;
  const baseOpacity = rule?.opacity ?? block.opacity ?? 1;

  const segments = useMemo(() => buildExteriorSegments(), []);
  const rotation = block.rotation ?? { x: 0, y: 0, z: 0 };

  return (
    <group
      position={[position.x, position.y, position.z]}
      rotation={[rotation.x, rotation.y, rotation.z]}
      onClick={handleClick}
      onPointerOver={handlePointerOver}
      onPointerOut={handlePointerOut}
    >
      {segments.map((seg) => {
        const opacity = Math.min(seg.opacity * baseOpacity, 1);
        const pbr = getPbrForMaterial(seg.materialId ?? 'MAT_LocalLimestone');
        const material = (
          <meshStandardMaterial
            color={rule?.color ?? seg.color}
            transparent={opacity < 1}
            opacity={opacity}
            metalness={pbr.metalness}
            roughness={pbr.roughness}
            emissive={hovered ? '#3b82f6' : '#000000'}
            emissiveIntensity={hovered ? 0.35 : 0}
          />
        );

        if (seg.geometry === 'cone') {
          return (
            <mesh key={seg.key} position={seg.position}>
              <coneGeometry args={seg.coneArgs} />
              {material}
            </mesh>
          );
        }

        return (
          <mesh key={seg.key} position={seg.position} rotation={seg.rotation ?? [0, 0, 0]}>
            <boxGeometry args={seg.size} />
            {material}
          </mesh>
        );
      })}
    </group>
  );
}
