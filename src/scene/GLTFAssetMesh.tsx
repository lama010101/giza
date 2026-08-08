import { useCallback, useEffect, useMemo, useState } from 'react';
import type { ThreeEvent } from '@react-three/fiber';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import type { GLTF } from 'three/examples/jsm/loaders/GLTFLoader.js';
import type { VisualizationRule } from '@/schemas/hypothesis';
import { useSceneObjectClick } from './useSceneObjectClick';
import type { SceneNodeWithWorld } from './sceneGraph';
import { BlockoutMesh, type BlockoutLike } from './BlockoutMesh';

interface GLTFAssetMeshProps {
  node: SceneNodeWithWorld;
  block: BlockoutLike;
  rule?: VisualizationRule;
  pbr: { metalness: number; roughness: number };
  isPyramid?: boolean;
  url: string;
}

function applyMaterialProps(
  material: THREE.Material | THREE.Material[],
  color: string,
  opacity: number,
  hovered: boolean,
  pbr: { metalness: number; roughness: number },
): void {
  const materials = Array.isArray(material) ? material : [material];
  for (const m of materials) {
    if (m instanceof THREE.MeshStandardMaterial) {
      m.color.set(color);
      m.roughness = pbr.roughness;
      m.metalness = pbr.metalness;
      m.transparent = opacity < 1;
      m.opacity = opacity;
      m.emissive.set(hovered ? '#3b82f6' : '#000000');
      m.emissiveIntensity = hovered ? 0.35 : 0;
    }
  }
}

export function GLTFAssetMesh({
  node,
  block,
  rule,
  pbr,
  isPyramid = false,
  url,
}: GLTFAssetMeshProps): JSX.Element {
  const { hovered, handleClick, handlePointerOver, handlePointerOut } = useSceneObjectClick(node);
  const [gltf, setGltf] = useState<GLTF | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    const isTest = typeof process !== 'undefined' && process.env.NODE_ENV === 'test';
    if (isTest || typeof window === 'undefined' || typeof document === 'undefined') {
      setError(true);
      return;
    }
    let active = true;
    const loader = new GLTFLoader();
    loader.load(
      url,
      (loaded) => {
        if (active) setGltf(loaded);
      },
      undefined,
      () => {
        if (active) setError(true);
      },
    );
    return () => {
      active = false;
    };
  }, [url]);

  const renderedScene = useMemo<THREE.Group | null>(() => {
    if (!gltf) return null;
    // Clone the scene so each instance is independent while sharing geometry.
    return gltf.scene.clone(true);
  }, [gltf]);

  const hitBox = useMemo(() => {
    if (!renderedScene) return null;
    const box = new THREE.Box3().setFromObject(renderedScene);
    if (box.isEmpty()) return null;
    const size = new THREE.Vector3();
    box.getSize(size);
    const center = new THREE.Vector3();
    box.getCenter(center);
    return {
      size: size.toArray() as [number, number, number],
      center: center.toArray() as [number, number, number],
    };
  }, [renderedScene]);

  const handleClickWithRealPoint = useCallback(
    (event: ThreeEvent<MouseEvent>) => {
      if (!renderedScene) {
        handleClick(event);
        return;
      }
      const intersections = new THREE.Raycaster(
        event.ray.origin,
        event.ray.direction,
      ).intersectObject(renderedScene, true);
      const first = intersections[0];
      if (first) {
        (event as unknown as { point: THREE.Vector3 }).point = first.point;
      }
      handleClick(event);
    },
    [handleClick, renderedScene],
  );

  useEffect(() => {
    if (!renderedScene) return;

    const color = rule?.color ?? block.color;
    const opacity = rule?.opacity ?? block.opacity ?? 1;

    renderedScene.traverse((object) => {
      if (object instanceof THREE.Mesh) {
        const mesh = object as THREE.Mesh;
        if (mesh.material) {
          applyMaterialProps(mesh.material, color, opacity, hovered, pbr);
        }
      }
    });
  }, [renderedScene, rule, hovered, pbr, block.color, block.opacity]);

  if (!renderedScene || error) {
    return <BlockoutMesh node={node} block={block} rule={rule} pbr={pbr} isPyramid={isPyramid} />;
  }

  return (
    <group>
      <primitive object={renderedScene} />
      {hitBox && (
        <mesh
          position={hitBox.center}
          onClick={handleClickWithRealPoint}
          onPointerOver={handlePointerOver}
          onPointerOut={handlePointerOut}
        >
          <boxGeometry args={hitBox.size} />
          <meshBasicMaterial transparent opacity={0} depthWrite={false} colorWrite={false} />
        </mesh>
      )}
    </group>
  );
}
