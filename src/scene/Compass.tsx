import { Html } from '@react-three/drei';
import type { Vector3 } from '@/schemas/location';

interface CompassProps {
  /** Scene origin where the compass is anchored. Defaults to world origin. */
  origin?: Vector3;
  /** Total arrow length, in meters. */
  arrowLength?: number;
  /** Shaft radius, in meters. */
  arrowRadius?: number;
}

/**
 * A 3D North compass gnomon.
 *
 * Renders an arrow at `origin` pointing along -Z (North) with an "N" label.
 * Uses depthTest=false so the indicator remains visible even when the camera
 * is inside or behind nearby geometry.
 */
export function Compass({
  origin = { x: 0, y: 0, z: 0 },
  arrowLength = 12,
  arrowRadius = 0.22,
}: CompassProps): JSX.Element {
  const baseY = 0.5; // float just above the ground plane to avoid z-fighting
  const coneHeight = arrowLength * 0.2;
  const tipZ = -arrowLength;
  const coneBaseZ = tipZ + coneHeight / 2;

  return (
    <group position={[origin.x, origin.y + baseY, origin.z]}>
      <mesh position={[0, 0, -arrowLength / 2]} rotation={[-Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[arrowRadius, arrowRadius, arrowLength, 16]} />
        <meshBasicMaterial color="#ef4444" depthTest={false} depthWrite={false} />
      </mesh>
      <mesh position={[0, 0, coneBaseZ]} rotation={[-Math.PI / 2, 0, 0]}>
        <coneGeometry args={[arrowRadius * 1.9, coneHeight, 16]} />
        <meshBasicMaterial color="#ef4444" depthTest={false} depthWrite={false} />
      </mesh>
      <Html position={[0, 0, tipZ - coneHeight - 0.8]} center occlude={false} pointerEvents="none">
        <div
          className="compass-label"
          style={{
            color: '#ef4444',
            fontWeight: 'bold',
            fontSize: '1.25rem',
            textShadow: '0 0 4px #000',
            pointerEvents: 'none',
            userSelect: 'none',
          }}
        >
          N
        </div>
      </Html>
    </group>
  );
}
