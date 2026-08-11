import type { HypothesisGeometryNode } from '@/theories/types';

interface HypothesisMeshProps {
  node: HypothesisGeometryNode;
}

/**
 * Renders a hypothesis-driven geometry node as a semi-transparent box.
 */
export function HypothesisMesh({ node }: HypothesisMeshProps): JSX.Element {
  const pos = node.position;
  const rot = node.rotation ?? { x: 0, y: 0, z: 0 };
  const size = node.size;
  return (
    <mesh position={[pos.x, pos.y, pos.z]} rotation={[rot.x, rot.y, rot.z]}>
      <boxGeometry args={[size.x, size.y, size.z]} />
      <meshStandardMaterial
        color={node.color}
        transparent={node.opacity < 1}
        opacity={node.opacity}
        metalness={0.1}
        roughness={0.85}
        emissive={node.color}
        emissiveIntensity={0.1}
      />
    </mesh>
  );
}
