/**
 * Level 0 — Surface component per GIZA-03 §2.8 (M09-T03).
 *
 * Renders the above-ground context for the Osiris Shaft:
 *   - Limestone bedrock
 *   - Desert surface with terrain undulations
 *   - Excavation perimeter
 *   - Entrance opening
 *   - Modern protective fencing
 *   - Visitor paths
 *   - Reference markers
 *
 * The purpose is to provide orientation before descent.
 * Modern vs ancient elements are visually distinct.
 */

import { useMemo } from 'react';
import * as THREE from 'three';

export interface Level0SurfaceProps {
  /** Radius of the visible surface area */
  radius?: number;
  /** Show modern fencing (optional per spec) */
  showFencing?: boolean;
}

/**
 * Generates terrain undulation vertices for a plane geometry.
 * Uses deterministic noise (not random) so the terrain is reproducible.
 */
function generateTerrainUndulations(geometry: THREE.PlaneGeometry, amplitude: number): void {
  const pos = geometry.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    // Deterministic pseudo-noise from sine functions
    const undulation =
      Math.sin(x * 0.3) * Math.cos(y * 0.3) * amplitude +
      Math.sin(x * 0.7 + 1.5) * Math.cos(y * 0.5 + 0.8) * amplitude * 0.3;
    pos.setZ(i, undulation);
  }
  pos.needsUpdate = true;
  geometry.computeVertexNormals();
}

export function Level0Surface({
  radius = 30,
  showFencing = true,
}: Level0SurfaceProps): JSX.Element {
  // Desert surface with terrain undulations
  const desertGeometry = useMemo(() => {
    const geo = new THREE.PlaneGeometry(radius * 2, radius * 2, 32, 32);
    generateTerrainUndulations(geo, 0.15);
    return geo;
  }, [radius]);

  // Bedrock geometry (flat, no undulations)
  const bedrockGeometry = useMemo(() => {
    return new THREE.PlaneGeometry(radius * 1.5, radius * 1.5);
  }, [radius]);

  return (
    <group data-testid="level-0-surface">
      {/* Limestone bedrock (flat slab below desert surface) */}
      <mesh
        geometry={bedrockGeometry}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -0.5, 0]}
        receiveShadow
        data-testid="surface-bedrock"
      >
        <meshStandardMaterial color="#c2b280" roughness={0.95} metalness={0.0} />
      </mesh>

      {/* Desert surface with terrain undulations */}
      <mesh
        geometry={desertGeometry}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0.05, 0]}
        receiveShadow
        data-testid="surface-desert"
      >
        <meshStandardMaterial color="#e8d8a8" roughness={0.98} metalness={0.0} />
      </mesh>

      {/* Excavation perimeter (darker ring around entrance) */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0.1, 0]}
        receiveShadow
        data-testid="surface-excavation-perimeter"
      >
        <ringGeometry args={[1.8, 3.0, 32]} />
        <meshStandardMaterial
          color="#a89868"
          roughness={0.9}
          metalness={0.0}
          transparent
          opacity={0.6}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Entrance opening (dark patch at shaft top) */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.12, 0]} data-testid="surface-entrance">
        <planeGeometry args={[2.6, 3.0]} />
        <meshStandardMaterial color="#2a2010" roughness={1.0} metalness={0.0} />
      </mesh>

      {/* Modern protective fencing (wire-frame look) */}
      {showFencing && (
        <group data-testid="surface-fencing">
          {/* Four fence segments around the entrance */}
          {[
            {
              pos: [0, 0.6, 4] as [number, number, number],
              size: [8, 1.2, 0.05] as [number, number, number],
            },
            {
              pos: [0, 0.6, -4] as [number, number, number],
              size: [8, 1.2, 0.05] as [number, number, number],
            },
            {
              pos: [4, 0.6, 0] as [number, number, number],
              size: [0.05, 1.2, 8] as [number, number, number],
            },
            {
              pos: [-4, 0.6, 0] as [number, number, number],
              size: [0.05, 1.2, 8] as [number, number, number],
            },
          ].map((fence, i) => (
            <mesh key={`fence-${i}`} position={fence.pos} data-testid={`fence-segment-${i}`}>
              <boxGeometry args={fence.size} />
              <meshStandardMaterial
                color="#888888"
                roughness={0.6}
                metalness={0.7}
                transparent
                opacity={0.3}
                wireframe
              />
            </mesh>
          ))}
        </group>
      )}

      {/* Visitor paths (lighter colored strips) */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0.08, 10]}
        receiveShadow
        data-testid="surface-visitor-path-n"
      >
        <planeGeometry args={[1.5, 12]} />
        <meshStandardMaterial color="#d4c498" roughness={0.95} metalness={0.0} />
      </mesh>
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[10, 0.08, 0]}
        receiveShadow
        data-testid="surface-visitor-path-e"
      >
        <planeGeometry args={[12, 1.5]} />
        <meshStandardMaterial color="#d4c498" roughness={0.95} metalness={0.0} />
      </mesh>

      {/* Reference markers (survey markers — bright orange for visibility) */}
      {[
        { pos: [5, 0.2, 5] as [number, number, number], id: 'marker-1' },
        { pos: [-5, 0.2, -5] as [number, number, number], id: 'marker-2' },
      ].map((marker) => (
        <mesh
          key={marker.id}
          position={marker.pos}
          castShadow
          data-testid={`surface-reference-${marker.id}`}
        >
          <boxGeometry args={[0.3, 0.4, 0.3]} />
          <meshStandardMaterial
            color="#ff6600"
            roughness={0.4}
            metalness={0.3}
            emissive="#ff3300"
            emissiveIntensity={0.1}
          />
        </mesh>
      ))}
    </group>
  );
}
