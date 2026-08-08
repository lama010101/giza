import { useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import { osirisBlockout } from '@db/blockouts/osiris-shaft';
import { getDefaultHypothesisContext, hypothesisEngine } from '@/theories/engineInstance';
import { filterVisibleNodes } from '@/theories/visibilityRules';
import { getPbrForMaterial } from '@/materials/masterMaterials';
import { useAppStore, type SceneLayer } from '@/store/app';
import { useLightingStore } from '@/store/lighting';
import { useSimulationStore } from '@/store/simulation';
import type { VisualizationRule } from '@/schemas/hypothesis';
import type { Vector3 } from '@/schemas/location';
import { buildOsirisSceneGraph } from './osirisSceneGraph';
import { CameraRig } from './CameraRig';
import { WaterPlane } from './WaterPlane';
import { WaterMesh } from './WaterMesh';
import { Level0Surface } from './Level0Surface';
import { BlockoutMesh } from './BlockoutMesh';
import { EvidenceHotspots } from './EvidenceHotspots';
import { HypothesisGeometryMesh } from './HypothesisGeometryMesh';
import { generateOsirisHotspots } from './osirisHotspots';

const CHAMBER_LIGHT_NODES = osirisBlockout.nodes.filter(
  (n) => n.layer.startsWith('level-') && n.layer !== 'level-0',
);

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
  const hiddenLayers = useAppStore((s) => s.hiddenLayers);
  const measurementStart = useAppStore((s) => s.measurementStart);
  const measurementEnd = useAppStore((s) => s.measurementEnd);

  const ambientIntensity = useLightingStore((s) => s.ambientIntensity);
  const directionalIntensity = useLightingStore((s) => s.directionalIntensity);
  const directionalAzimuth = useLightingStore((s) => s.directionalAzimuth);
  const directionalElevation = useLightingStore((s) => s.directionalElevation);
  const localIntensity = useLightingStore((s) => s.localIntensity);
  const background = useLightingStore((s) => s.background);

  const waterLevel = useSimulationStore((s) => s.waterLevel);

  const osirisHotspots = useMemo(
    () =>
      generateOsirisHotspots().filter(
        (h) => !hiddenLayers.includes(h.layer as unknown as SceneLayer),
      ),
    [hiddenLayers],
  );

  const hydraulicActive = activeHypothesisIds.includes('THEORY-OSIRIS-001');

  const { activeRules, geometryNodes } = useMemo(() => {
    const context = getDefaultHypothesisContext();
    const rules: VisualizationRule[] = [];
    if (activeHypothesisIds.length > 0) {
      const seen = new Set<string>();
      for (const node of osirisBlockout.nodes) {
        if (!node.objectId || seen.has(node.objectId)) continue;
        seen.add(node.objectId);
        rules.push(...hypothesisEngine.getVisualizationRules(node.objectId, context));
      }
    }
    const rawGeometry = hypothesisEngine.getGeometryNodes(context);
    const visibleGeometry = filterVisibleNodes(rawGeometry, { hypothesisActive: true });
    return { activeRules: rules, geometryNodes: visibleGeometry };
  }, [activeHypothesisIds]);

  const visibleNodes = graph
    .getAllVisibleNodes()
    .filter((node) => blocks.has(node.id))
    .filter((node) => {
      const block = blocks.get(node.id)!;
      return !hiddenLayers.includes(block.layer as never) && block.layer !== 'level-0';
    })
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
      {CHAMBER_LIGHT_NODES.map((node) => (
        <pointLight
          key={`light-${node.id}`}
          position={[node.position.x, node.position.y + node.size.y / 2 + 0.5, node.position.z]}
          intensity={localIntensity}
          distance={12}
          decay={1.5}
          color="#ffe4b5"
        />
      ))}
      {/* Level 0 — Surface context (M09-T03) */}
      <Level0Surface />
      {visibleNodes.map(({ node, block, rule }) => (
        <BlockoutMesh
          key={node.id}
          node={node}
          block={block}
          rule={rule}
          pbr={getPbrForMaterial(block.materialId ?? '')}
        />
      ))}
      {geometryNodes.map((node) => (
        <HypothesisGeometryMesh key={node.id} node={node} />
      ))}
      {hydraulicActive && <WaterPlane />}
      {hydraulicActive && (
        <WaterMesh
          position={[-1.4, -30.4, -7.0]}
          size={6.5}
          elevation={waterLevel}
          turbidity={0.3}
          color="#0a4a6b"
        />
      )}
      {measurementStart && <MeasurementMarker point={measurementStart} />}
      {measurementEnd && <MeasurementMarker point={measurementEnd} />}
      <EvidenceHotspots hotspots={osirisHotspots} />
    </Canvas>
  );
}
