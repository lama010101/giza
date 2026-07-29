import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';

export function BenchmarkScene(): JSX.Element {
  return (
    <Canvas camera={{ position: [5, 5, 5], fov: 60 }}>
      <OrbitControls makeDefault />
      <color attach="background" args={['#0f0f0f']} />
      <fog attach="fog" args={['#0f0f0f', 10, 50]} />
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 10, 5]} intensity={1} />

      {/* Reference floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1, 0]}>
        <planeGeometry args={[20, 20]} />
        <meshStandardMaterial color="#2a2a2a" metalness={0.2} roughness={0.8} />
      </mesh>

      {/* Test cube */}
      <mesh position={[0, 0.5, 0]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="orange" metalness={0.1} roughness={0.4} />
      </mesh>

      {/* Test sphere */}
      <mesh position={[2, 0.7, -2]}>
        <sphereGeometry args={[0.7, 32, 32]} />
        <meshStandardMaterial color="white" metalness={0.5} roughness={0.2} />
      </mesh>

      {/* Water plane placeholder */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.9, 0]}>
        <planeGeometry args={[8, 8]} />
        <meshStandardMaterial
          color="#0a4a6b"
          metalness={0.1}
          roughness={0.1}
          transparent
          opacity={0.6}
        />
      </mesh>
    </Canvas>
  );
}
