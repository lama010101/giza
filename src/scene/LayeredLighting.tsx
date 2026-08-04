import { useMemo } from 'react';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useLightingStore } from '@/store/lighting';
import { testId } from '@/utils/testId';

/**
 * 5-layer lighting system per GIZA - 04 §6.11.
 *
 * Renders: Ambient + Directional + Local + Bounce + Volumetric
 * Each layer can be enabled independently.
 *
 * Bounce is approximated as a hemisphere light from below.
 * Volumetric is approximated as fog density.
 */
export function LayeredLighting(): JSX.Element {
  const { scene } = useThree();

  const ambientEnabled = useLightingStore((s) => s.ambientEnabled);
  const directionalEnabled = useLightingStore((s) => s.directionalEnabled);
  const localEnabled = useLightingStore((s) => s.localEnabled);
  const bounceEnabled = useLightingStore((s) => s.bounceEnabled);
  const volumetricEnabled = useLightingStore((s) => s.volumetricEnabled);

  const ambientIntensity = useLightingStore((s) => s.ambientIntensity);
  const directionalIntensity = useLightingStore((s) => s.directionalIntensity);
  const directionalAzimuth = useLightingStore((s) => s.directionalAzimuth);
  const directionalElevation = useLightingStore((s) => s.directionalElevation);
  const localIntensity = useLightingStore((s) => s.localIntensity);
  const bounceIntensity = useLightingStore((s) => s.bounceIntensity);
  const volumetricIntensity = useLightingStore((s) => s.volumetricIntensity);
  const volumetricDensity = useLightingStore((s) => s.volumetricDensity);
  const background = useLightingStore((s) => s.background);

  // Compute directional light position from azimuth/elevation
  const directionalPosition = useMemo(() => {
    const azRad = (directionalAzimuth * Math.PI) / 180;
    const elRad = (directionalElevation * Math.PI) / 180;
    const r = 50;
    return new THREE.Vector3(
      r * Math.cos(elRad) * Math.cos(azRad),
      r * Math.sin(elRad),
      r * Math.cos(elRad) * Math.sin(azRad),
    );
  }, [directionalAzimuth, directionalElevation]);

  // Apply volumetric fog to scene
  useMemo(() => {
    if (volumetricEnabled && volumetricDensity > 0) {
      scene.fog = new THREE.FogExp2(background, volumetricDensity);
    } else {
      scene.fog = null;
    }
  }, [scene, volumetricEnabled, volumetricDensity, background]);

  return (
    <group {...testId('layered-lighting')}>
      {/* Layer 1: Ambient */}
      {ambientEnabled && <ambientLight intensity={ambientIntensity} {...testId('light-ambient')} />}

      {/* Layer 2: Directional (sun) */}
      {directionalEnabled && (
        <directionalLight
          position={[directionalPosition.x, directionalPosition.y, directionalPosition.z]}
          intensity={directionalIntensity}
          {...testId('light-directional')}
        />
      )}

      {/* Layer 3: Local (point light near origin) */}
      {localEnabled && (
        <pointLight
          position={[0, 10, 0]}
          intensity={localIntensity}
          distance={100}
          decay={2}
          {...testId('light-local')}
        />
      )}

      {/* Layer 4: Bounce (hemisphere light from below) */}
      {bounceEnabled && (
        <hemisphereLight
          args={[new THREE.Color(background), new THREE.Color('#3a2a1a'), bounceIntensity]}
          {...testId('light-bounce')}
        />
      )}

      {/* Layer 5: Volumetric (fog applied via scene.fog above) */}
      {volumetricEnabled && (
        <pointLight
          position={[0, 5, 0]}
          intensity={volumetricIntensity}
          distance={50}
          decay={1.5}
          color="#fff5e0"
          {...testId('light-volumetric')}
        />
      )}
    </group>
  );
}
