import { useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import type { ThreeEvent } from '@react-three/fiber';
import { greatPyramidBlockout, type BlockoutNode } from '@db/blockouts/great-pyramid';
import { generateGreatPyramidLOD1, type BlockoutNodeLOD1 } from '@db/geometry/gp-lod1';
import { getDefaultHypothesisContext, hypothesisEngine } from '@/theories/engineInstance';
import type { HypothesisGeometryNode } from '@/theories/types';
import { useAppStore } from '@/store/app';
import { useLightingStore } from '@/store/lighting';
import type { VisualizationRule } from '@/schemas/hypothesis';
import type { Vector3 } from '@/schemas/location';
import { buildGreatPyramidSceneGraph } from './greatPyramidSceneGraph';
import { CameraRig } from './CameraRig';
import { GrandGalleryMesh } from './GrandGalleryMesh';
import type { SceneNodeWithWorld } from './sceneGraph';

type UnifiedBlock = BlockoutNode | BlockoutNodeLOD1;

const LAYER_PBR: Record<string, { metalness: number; roughness: number }> = {
  exterior: { metalness: 0.05, roughness: 0.9 },
  passages: { metalness: 0.1, roughness: 0.85 },
  subterranean: { metalness: 0.1, roughness: 0.85 },
  gallery: { metalness: 0.15, roughness: 0.8 },
  'kings-complex': { metalness: 0.2, roughness: 0.7 },
  'queens-complex': { metalness: 0.15, roughness: 0.75 },
  relieving: { metalness: 0.15, roughness: 0.8 },
  shafts: { metalness: 0.05, roughness: 0.9 },
};

interface BlockoutMeshProps {
  node: SceneNodeWithWorld;
  block: UnifiedBlock;
  rule?: VisualizationRule;
}

function BlockoutMesh({ node, block, rule }: BlockoutMeshProps): JSX.Element {
  const setSelectedEvidenceId = useAppStore((s) => s.setSelectedEvidenceId);
  const setSidePanelTab = useAppStore((s) => s.setSidePanelTab);
  const setEvidencePanelOpen = useAppStore((s) => s.setEvidencePanelOpen);
  const setHoveredNodeId = useAppStore((s) => s.setHoveredNodeId);
  const hovered = useAppStore((s) => s.hoveredNodeId === node.id);
  const { position } = node.worldTransform;
  const color = rule?.color ?? block.color;
  const opacity = rule?.opacity ?? block.opacity ?? 1;

  const measurementMode = useAppStore((s) => s.measurementMode);
  const addMeasurementPoint = useAppStore((s) => s.addMeasurementPoint);

  const handleClick = (event: ThreeEvent<MouseEvent>): void => {
    event.stopPropagation();
    if (measurementMode) {
      addMeasurementPoint({ x: event.point.x, y: event.point.y, z: event.point.z });
      return;
    }
    const evidenceId = node.metadata.evidenceIds?.[0];
    if (evidenceId) {
      setSelectedEvidenceId(evidenceId);
      setSidePanelTab('evidence');
      setEvidencePanelOpen(true);
    }
  };

  const handlePointerOver = (event: ThreeEvent<PointerEvent>): void => {
    event.stopPropagation();
    setHoveredNodeId(node.id);
    document.body.style.cursor = 'pointer';
  };

  const handlePointerOut = (): void => {
    setHoveredNodeId(null);
    document.body.style.cursor = 'auto';
  };

  const pbr = LAYER_PBR[block.layer] ?? { metalness: 0.1, roughness: 0.85 };

  return (
    <mesh
      position={[position.x, position.y, position.z]}
      rotation={[block.rotation?.x ?? 0, block.rotation?.y ?? 0, block.rotation?.z ?? 0]}
      onClick={handleClick}
      onPointerOver={handlePointerOver}
      onPointerOut={handlePointerOut}
    >
      <boxGeometry args={[block.size.x, block.size.y, block.size.z]} />
      <meshStandardMaterial
        color={color}
        transparent={opacity < 1}
        opacity={opacity}
        metalness={pbr.metalness}
        roughness={pbr.roughness}
        emissive={hovered ? '#3b82f6' : '#000000'}
        emissiveIntensity={hovered ? 0.35 : 0}
      />
    </mesh>
  );
}

function MeasurementMarker({ point }: { point: Vector3 }): JSX.Element {
  return (
    <mesh position={[point.x, point.y, point.z]}>
      <sphereGeometry args={[0.12, 16, 16]} />
      <meshStandardMaterial color="#ef4444" emissive="#ef4444" emissiveIntensity={0.6} />
    </mesh>
  );
}

function HypothesisMesh({ node }: { node: HypothesisGeometryNode }): JSX.Element {
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

export function GreatPyramidScene(): JSX.Element {
  const lod = useAppStore((s) => s.lod);
  const graph = useMemo(() => buildGreatPyramidSceneGraph(lod), [lod]);
  const blocks = useMemo<Map<string, UnifiedBlock>>(() => {
    const source: UnifiedBlock[] =
      lod === 'LOD1' ? generateGreatPyramidLOD1() : greatPyramidBlockout.nodes;
    return new Map(source.map((n) => [n.id, n]));
  }, [lod]);
  const activeHypothesisIds = useAppStore((s) => s.activeHypothesisIds);
  const hiddenLayers = useAppStore((s) => s.hiddenLayers);
  const measurementStart = useAppStore((s) => s.measurementStart);
  const measurementEnd = useAppStore((s) => s.measurementEnd);

  const ambientIntensity = useLightingStore((s) => s.ambientIntensity);
  const directionalIntensity = useLightingStore((s) => s.directionalIntensity);
  const directionalAzimuth = useLightingStore((s) => s.directionalAzimuth);
  const directionalElevation = useLightingStore((s) => s.directionalElevation);
  const localIntensity = useLightingStore((s) => s.localIntensity);
  const background = useLightingStore((s) => s.background);

  const hydraulicActive = activeHypothesisIds.includes('THEORY-GP-001');

  const hypothesisGeometryNodes: HypothesisGeometryNode[] = useMemo(() => {
    if (activeHypothesisIds.length === 0) return [];
    const context = getDefaultHypothesisContext();
    return hypothesisEngine.getGeometryNodes(context);
  }, [activeHypothesisIds]);

  const activeRules: VisualizationRule[] = [];
  if (activeHypothesisIds.length > 0) {
    const context = getDefaultHypothesisContext();
    const seen = new Set<string>();
    for (const node of greatPyramidBlockout.nodes) {
      if (!node.objectId || seen.has(node.objectId)) continue;
      seen.add(node.objectId);
      activeRules.push(...hypothesisEngine.getVisualizationRules(node.objectId, context));
    }
  }

  const visibleNodes = graph
    .getAllVisibleNodes()
    .filter((node) => blocks.has(node.id))
    .filter((node) => {
      const block = blocks.get(node.id)!;
      return !hiddenLayers.includes(block.layer as never);
    })
    .map((node) => {
      const block = blocks.get(node.id)!;
      const rule = block.overlay
        ? activeRules.find((r) => r.overlay === block.overlay)
        : activeRules.find((r) => r.target === node.metadata.objectId);
      return { node, block, rule };
    })
    .filter(({ block, rule }) => !block.overlay || rule !== undefined);

  const chamberLightNodes = greatPyramidBlockout.nodes.filter((n) =>
    ['subterranean', 'gallery', 'kings-complex', 'queens-complex'].includes(n.layer),
  );

  return (
    <Canvas camera={{ position: [40, 80, 80], fov: 55 }}>
      <CameraRig />
      <color attach="background" args={[background]} />
      <ambientLight intensity={ambientIntensity} />
      <directionalLight
        position={[
          Math.cos((directionalAzimuth * Math.PI) / 180) *
            Math.cos((directionalElevation * Math.PI) / 180) *
            50,
          Math.sin((directionalElevation * Math.PI) / 180) * 50,
          Math.sin((directionalAzimuth * Math.PI) / 180) *
            Math.cos((directionalElevation * Math.PI) / 180) *
            50,
        ]}
        intensity={directionalIntensity}
      />
      {chamberLightNodes.map((node) => (
        <pointLight
          key={`light-${node.id}`}
          position={[node.position.x, node.position.y + node.size.y / 2 + 1, node.position.z]}
          intensity={localIntensity}
          distance={20}
          decay={1.5}
          color="#ffe4b5"
        />
      ))}
      {visibleNodes.map(({ node, block, rule }) => {
        if (node.id === 'grand-gallery') {
          return <GrandGalleryMesh key={node.id} node={node} block={block} rule={rule} />;
        }
        return <BlockoutMesh key={node.id} node={node} block={block} rule={rule} />;
      })}
      {hypothesisGeometryNodes.map((hnode) => (
        <HypothesisMesh key={hnode.id} node={hnode} />
      ))}
      {hydraulicActive && (
        <mesh position={[0, 0, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[200, 200]} />
          <meshStandardMaterial color="#4488ff" transparent opacity={0.3} />
        </mesh>
      )}
      {measurementStart && <MeasurementMarker point={measurementStart} />}
      {measurementEnd && <MeasurementMarker point={measurementEnd} />}
    </Canvas>
  );
}
