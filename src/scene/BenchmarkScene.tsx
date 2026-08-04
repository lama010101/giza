import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { LayeredLighting } from './LayeredLighting';
import { WaterMesh } from './WaterMesh';
import { MaterialSampleRow } from './MaterialSampleBlock';
import { useLightingStore } from '@/store/lighting';
import { getShadowConfig, detectQualityProfile } from './shadowStrategy';
import { testId } from '@/utils/testId';

/**
 * Benchmark scene per GIZA - 04 §6.2 and M08.5.
 *
 * Exercises:
 *   - All 5 lighting layers (M08.5-T02)
 *   - 3 light modes (Documentary, Exploration, Scientific Inspection)
 *   - 5 master materials on labeled sample blocks (M08.5-T03)
 *   - Water rendering with SSR/Fresnel/refraction/ripples (M08.5-T04)
 *   - Shadow strategy (M08.5-T05)
 *
 * No archaeological claims are made — this is a pure rendering benchmark.
 */
export function BenchmarkScene(): JSX.Element {
  return (
    <Canvas camera={{ position: [8, 6, 8], fov: 60 }} shadows {...testId('benchmark-canvas')}>
      <BenchmarkSceneContent />
    </Canvas>
  );
}

function BenchmarkSceneContent(): JSX.Element {
  const background = useLightingStore((s) => s.background);
  const directionalEnabled = useLightingStore((s) => s.directionalEnabled);

  // Detect quality profile (desktop-high for benchmark)
  const profile = detectQualityProfile(2, false);
  const shadowConfig = getShadowConfig(profile);

  return (
    <>
      <color attach="background" args={[background]} />

      <LayeredLighting />

      {/* Shadow-casting directional light (separate from layered for shadow config) */}
      {directionalEnabled && (
        <directionalLight
          position={[10, 15, 8]}
          intensity={1.5}
          castShadow
          shadow-mapSize-width={shadowConfig.mapSize}
          shadow-mapSize-height={shadowConfig.mapSize}
          shadow-camera-near={shadowConfig.cameraNear}
          shadow-camera-far={shadowConfig.cameraFar}
          shadow-camera-left={shadowConfig.cameraLeft}
          shadow-camera-right={shadowConfig.cameraRight}
          shadow-camera-top={shadowConfig.cameraTop}
          shadow-camera-bottom={shadowConfig.cameraBottom}
          shadow-bias={shadowConfig.bias}
          shadow-normalBias={0.02}
          {...testId('shadow-light')}
        />
      )}

      <OrbitControls makeDefault />

      {/* Reference floor */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -1, 0]}
        receiveShadow
        {...testId('benchmark-floor')}
      >
        <planeGeometry args={[30, 30]} />
        <meshStandardMaterial color="#2a2a2a" metalness={0.1} roughness={0.8} />
      </mesh>

      {/* Test cube */}
      <mesh position={[0, 0.5, 0]} castShadow receiveShadow {...testId('benchmark-cube')}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="orange" metalness={0.1} roughness={0.4} />
      </mesh>

      {/* Test sphere */}
      <mesh position={[2, 0.7, -2]} castShadow receiveShadow {...testId('benchmark-sphere')}>
        <sphereGeometry args={[0.7, 32, 32]} />
        <meshStandardMaterial color="white" metalness={0.5} roughness={0.2} />
      </mesh>

      {/* 5 master material sample blocks (M08.5-T03) */}
      <MaterialSampleRow />

      {/* Water pool (M08.5-T04) */}
      <WaterMesh position={[0, -0.9, 2]} size={6} elevation={0} turbidity={0.5} />

      {/* Stairs (for physics testing — M08.5-T06) */}
      <group {...testId('benchmark-stairs')}>
        {[0, 1, 2, 3].map((step) => (
          <mesh key={step} position={[-4, -0.5 + step * 0.3, step * 0.8]} castShadow receiveShadow>
            <boxGeometry args={[2, 0.3, 0.8]} />
            <meshStandardMaterial color="#555555" metalness={0.0} roughness={0.7} />
          </mesh>
        ))}
      </group>

      {/* Shaft (for physics testing — M08.5-T06) */}
      <mesh position={[4, -2, 2]} {...testId('benchmark-shaft')} receiveShadow>
        <boxGeometry args={[2, 2, 2]} />
        <meshStandardMaterial color="#333333" metalness={0.0} roughness={0.9} side={1} />
      </mesh>
    </>
  );
}
