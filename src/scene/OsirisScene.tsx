import { useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import type { ThreeEvent } from '@react-three/fiber';
import { osirisBlockout } from '@db/blockouts/osiris-shaft';
import type { BlockoutNode } from '@db/blockouts/osiris-shaft';
import { getDefaultHypothesisContext, hypothesisEngine } from '@/theories/engineInstance';
import { useAppStore } from '@/store/app';
import { useLightingStore } from '@/store/lighting';
import type { VisualizationRule } from '@/schemas/hypothesis';
import type { Vector3 } from '@/schemas/location';
import { buildOsirisSceneGraph } from './osirisSceneGraph';
import { CameraRig } from './CameraRig';
import { WaterPlane } from './WaterPlane';
import type { SceneNodeWithWorld } from './sceneGraph';

interface BlockoutMeshProps {
  node: SceneNodeWithWorld;
  block: BlockoutNode;
  rule?: VisualizationRule;
}

function BlockoutMesh({ node, block, rule }: BlockoutMeshProps): JSX.Element {
  const setSelectedEvidenceId = useAppStore((s) => s.setSelectedEvidenceId);
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
        metalness={0.1}
        roughness={0.85}
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

export function OsirisScene(): JSX.Element {
  const graph = useMemo(() => buildOsirisSceneGraph(), []);
  const blocks = useMemo(() => new Map(osirisBlockout.nodes.map((n) => [n.id, n])), []);
  const activeHypothesisIds = useAppStore((s) => s.activeHypothesisIds);
  const measurementStart = useAppStore((s) => s.measurementStart);
  const measurementEnd = useAppStore((s) => s.measurementEnd);

  const ambientIntensity = useLightingStore((s) => s.ambientIntensity);
  const directionalIntensity = useLightingStore((s) => s.directionalIntensity);
  const directionalAzimuth = useLightingStore((s) => s.directionalAzimuth);
  const directionalElevation = useLightingStore((s) => s.directionalElevation);
  const background = useLightingStore((s) => s.background);

  const hydraulicActive = activeHypothesisIds.includes('THEORY-OSIRIS-001');

  const activeRules: VisualizationRule[] = [];
  if (activeHypothesisIds.length > 0) {
    const context = getDefaultHypothesisContext();
    const seen = new Set<string>();
    for (const node of osirisBlockout.nodes) {
      if (!node.objectId || seen.has(node.objectId)) continue;
      seen.add(node.objectId);
      activeRules.push(...hypothesisEngine.getVisualizationRules(node.objectId, context));
    }
  }

  const visibleNodes = graph
    .getAllVisibleNodes()
    .filter((node) => blocks.has(node.id))
    .map((node) => {
      const block = blocks.get(node.id)!;
      const rule = block.overlay
        ? activeRules.find((r) => r.overlay === block.overlay)
        : activeRules.find((r) => r.target === node.metadata.objectId);
      return { node, block, rule };
    })
    .filter(({ block, rule }) => !block.overlay || rule !== undefined);

  return (
    <Canvas camera={{ position: [16, -6, 22], fov: 55 }}>
      <CameraRig />
      <color attach="background" args={[background]} />
      <ambientLight intensity={ambientIntensity} />
      <directionalLight
        position={[
          Math.cos((directionalAzimuth * Math.PI) / 180) *
            Math.cos((directionalElevation * Math.PI) / 180) *
            25,
          Math.sin((directionalElevation * Math.PI) / 180) * 25,
          Math.sin((directionalAzimuth * Math.PI) / 180) *
            Math.cos((directionalElevation * Math.PI) / 180) *
            25,
        ]}
        intensity={directionalIntensity}
      />
      {visibleNodes.map(({ node, block, rule }) => (
        <BlockoutMesh key={node.id} node={node} block={block} rule={rule} />
      ))}
      {hydraulicActive && <WaterPlane />}
      {measurementStart && <MeasurementMarker point={measurementStart} />}
      {measurementEnd && <MeasurementMarker point={measurementEnd} />}
    </Canvas>
  );
}
