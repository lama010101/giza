import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useSimulationStore, CHAMBER_FLOOR } from '@/store/simulation';
import { osirisBlockout } from '@db/blockouts/osiris-shaft';

const chamberNode = osirisBlockout.nodes.find((n) => n.id === 'chamber-i');
const WATER_WIDTH = chamberNode?.size.x ?? 6.5;
const WATER_DEPTH = chamberNode?.size.z ?? 9.0;
const WATER_CENTER_X = chamberNode?.position.x ?? -1;
const WATER_CENTER_Z = chamberNode?.position.z ?? 4;

export function WaterPlane(): JSX.Element {
  const meshRef = useRef<THREE.Mesh>(null);
  const waterLevel = useSimulationStore((s) => s.waterLevel);
  const running = useSimulationStore((s) => s.running);
  const tick = useSimulationStore((s) => s.tick);
  const elapsedRef = useRef(0);

  useFrame((_, delta) => {
    if (running) {
      elapsedRef.current += delta;
      tick(delta);
    }
  });

  const waterY = CHAMBER_FLOOR + waterLevel;
  const waterHeight = Math.max(0.01, waterLevel);

  return (
    <mesh ref={meshRef} position={[WATER_CENTER_X, waterY + waterHeight / 2, WATER_CENTER_Z]}>
      <boxGeometry args={[WATER_WIDTH, waterHeight, WATER_DEPTH]} />
      <meshStandardMaterial
        color="#0a4a6b"
        transparent
        opacity={0.7}
        metalness={0.3}
        roughness={0.2}
        emissive="#062a44"
        emissiveIntensity={0.15}
      />
    </mesh>
  );
}
