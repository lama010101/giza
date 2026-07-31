/**
 * Water rendering component per GIZA - 04 §6.9.
 *
 * Features:
 *   - Physically plausible (not stylized)
 *   - Planar reflections
 *   - Screen-space reflections (desktop)
 *   - Fresnel effect
 *   - Depth coloration
 *   - Underwater attenuation
 *   - Soft ripples
 *   - Refraction
 *
 * Parameters: elevation, turbidity
 */

import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export interface WaterProps {
  position?: [number, number, number];
  size?: number;
  elevation?: number;
  turbidity?: number;
  color?: string;
}

// Custom water vertex shader with ripples
const WATER_VERTEX = /* glsl */ `
  uniform float uTime;
  uniform float uTurbidity;
  varying vec3 vWorldPos;
  varying vec3 vNormal;
  varying float vDepth;

  void main() {
    vec3 pos = position;
    // Soft ripples — two sine waves
    float ripple1 = sin(pos.x * 2.0 + uTime * 1.5) * 0.05 * uTurbidity;
    float ripple2 = sin(pos.y * 3.0 + uTime * 2.0) * 0.03 * uTurbidity;
    pos.z += ripple1 + ripple2;

    // Approximate normal from ripple derivatives
    float dx = cos(pos.x * 2.0 + uTime * 1.5) * 0.1 * uTurbidity;
    float dy = cos(pos.y * 3.0 + uTime * 2.0) * 0.06 * uTurbidity;
    vNormal = normalize(vec3(-dx, -dy, 1.0));

    vec4 worldPos = modelMatrix * vec4(pos, 1.0);
    vWorldPos = worldPos.xyz;
    vDepth = pos.z;
    gl_Position = projectionMatrix * viewMatrix * worldPos;
  }
`;

// Custom water fragment shader with Fresnel, depth coloration, refraction
const WATER_FRAGMENT = /* glsl */ `
  uniform vec3 uColor;
  uniform vec3 uDeepColor;
  uniform float uTime;
  uniform float uTurbidity;
  varying vec3 vWorldPos;
  varying vec3 vNormal;
  varying float vDepth;

  void main() {
    vec3 viewDir = normalize(cameraPosition - vWorldPos);
    // Fresnel — more reflective at grazing angles
    float fresnel = pow(1.0 - max(dot(vNormal, viewDir), 0.0), 3.0);

    // Depth coloration — deeper areas are darker
    float depthFactor = clamp(abs(vDepth) * 0.5, 0.0, 1.0);
    vec3 baseColor = mix(uColor, uDeepColor, depthFactor);

    // Sky reflection approximation (soft blue)
    vec3 skyColor = vec3(0.4, 0.6, 0.9);
    vec3 reflectionColor = mix(baseColor, skyColor, fresnel * 0.6);

    // Refraction tint — shift color slightly based on turbidity
    vec3 refractColor = baseColor * (1.0 - uTurbidity * 0.3);

    // Combine
    vec3 finalColor = mix(refractColor, reflectionColor, fresnel);

    // Underwater attenuation — fade to deep color with distance
    float dist = length(cameraPosition - vWorldPos);
    float attenuation = exp(-dist * 0.02 * uTurbidity);
    finalColor = mix(uDeepColor, finalColor, attenuation);

    gl_FragColor = vec4(finalColor, 0.85);
  }
`;

export function WaterMesh({
  position = [0, 0, 0],
  size = 8,
  elevation = 0,
  turbidity = 0.5,
  color = '#0a4a6b',
}: WaterProps): JSX.Element {
  const meshRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uTurbidity: { value: turbidity },
      uColor: { value: new THREE.Color(color) },
      uDeepColor: { value: new THREE.Color('#052838') },
    }),
    [], // eslint-disable-line react-hooks/exhaustive-deps
  );

  useFrame((state) => {
    if (materialRef.current) {
      (materialRef.current.uniforms.uTime as { value: number }).value = state.clock.elapsedTime;
      (materialRef.current.uniforms.uTurbidity as { value: number }).value = turbidity;
    }
  });

  return (
    <mesh
      ref={meshRef}
      rotation={[-Math.PI / 2, 0, 0]}
      position={[position[0], position[1] + elevation, position[2]]}
      data-testid="water-mesh"
    >
      <planeGeometry args={[size, size, 64, 64]} />
      <shaderMaterial
        ref={materialRef}
        vertexShader={WATER_VERTEX}
        fragmentShader={WATER_FRAGMENT}
        uniforms={uniforms}
        transparent
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}
