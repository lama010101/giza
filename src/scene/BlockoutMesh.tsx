/**
 * Reusable blockout mesh with pointer-event hit tolerance for thin geometry.
 *
 * Renders the visual box/cone and, when the smallest block dimension is below
 * the interaction threshold, an invisible larger hit volume that captures
 * pointer events. This lets users hover and click very thin shafts (≈0.2 m)
 * without requiring pixel-perfect cursor placement.
 */

import { DoubleSide } from 'three';
import type { VisualizationRule } from '@/schemas/hypothesis';
import type { Vector3 } from '@/schemas/location';
import type { SceneNodeWithWorld } from './sceneGraph';
import { useSceneObjectClick } from './useSceneObjectClick';

const MIN_HIT_SIZE = 0.8;

interface BlockoutLike {
  color: string;
  opacity?: number;
  size: Vector3;
  rotation?: Vector3;
  layer: string;
}

interface BlockoutMeshProps {
  node: SceneNodeWithWorld;
  block: BlockoutLike;
  rule?: VisualizationRule;
  pbr: { metalness: number; roughness: number };
  isPyramid?: boolean;
}

export function BlockoutMesh({
  node,
  block,
  rule,
  pbr,
  isPyramid = false,
}: BlockoutMeshProps): JSX.Element {
  const { hovered, handleClick, handlePointerOver, handlePointerOut } = useSceneObjectClick(node);

  const { position } = node.worldTransform;
  const color = rule?.color ?? block.color;
  const opacity = rule?.opacity ?? block.opacity ?? 1;

  const rotationX = block.rotation?.x ?? 0;
  const rotationY = (block.rotation?.y ?? 0) + (isPyramid ? Math.PI / 4 : 0);
  const rotationZ = block.rotation?.z ?? 0;

  const minSize = Math.min(block.size.x, block.size.y, block.size.z);
  const needsHitMesh = minSize < MIN_HIT_SIZE && !isPyramid;

  const hitSize = {
    x: Math.max(block.size.x, MIN_HIT_SIZE),
    y: Math.max(block.size.y, MIN_HIT_SIZE),
    z: Math.max(block.size.z, MIN_HIT_SIZE),
  };

  const baseSide = Math.max(block.size.x, block.size.z);

  const eventHandlers = {
    onClick: handleClick,
    onPointerOver: handlePointerOver,
    onPointerOut: handlePointerOut,
  };

  const visualMesh = isPyramid ? (
    <mesh
      position={[position.x, position.y, position.z]}
      rotation={[rotationX, rotationY, rotationZ]}
      {...(needsHitMesh ? {} : eventHandlers)}
    >
      <coneGeometry args={[baseSide / Math.sqrt(2), block.size.y, 4]} />
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
    </mesh>
  ) : (
    <mesh
      position={[position.x, position.y, position.z]}
      rotation={[rotationX, rotationY, rotationZ]}
      {...(needsHitMesh ? {} : eventHandlers)}
    >
      <boxGeometry args={[block.size.x, block.size.y, block.size.z]} />
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
    </mesh>
  );

  if (!needsHitMesh) return visualMesh;

  return (
    <>
      {visualMesh}
      <mesh
        position={[position.x, position.y, position.z]}
        rotation={[rotationX, rotationY, rotationZ]}
        visible={false}
        {...eventHandlers}
      >
        <boxGeometry args={[hitSize.x, hitSize.y, hitSize.z]} />
        <meshBasicMaterial visible={false} />
      </mesh>
    </>
  );
}
