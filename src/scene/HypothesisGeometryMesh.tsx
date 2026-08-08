import { DoubleSide } from 'three';
import type { HypothesisGeometryNode } from '@/theories/types';

export interface HypothesisGeometryMeshProps {
  node: HypothesisGeometryNode;
}

export function HypothesisGeometryMesh({ node }: HypothesisGeometryMeshProps): JSX.Element {
  const pos = node.position;
  const rot = node.rotation ?? { x: 0, y: 0, z: 0 };
  const size = node.size;
  const transparent = node.opacity < 1;

  return (
    <mesh position={[pos.x, pos.y, pos.z]} rotation={[rot.x, rot.y, rot.z]}>
      <boxGeometry args={[size.x, size.y, size.z]} />
      <meshStandardMaterial
        color={node.color}
        transparent={transparent}
        opacity={node.opacity}
        side={DoubleSide}
        depthWrite={!transparent}
        metalness={0.1}
        roughness={0.85}
        emissive={node.color}
        emissiveIntensity={0.1}
      />
    </mesh>
  );
}
