import { useEffect, useMemo, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { osirisBlockout } from '@db/blockouts/osiris-shaft';
import { getDefaultHypothesisContext, hypothesisEngine } from '@/theories/engineInstance';
import { useAppStore, type SceneLayer } from '@/store/app';
import { useLightingStore } from '@/store/lighting';
import { useSimulationStore } from '@/store/simulation';
import type { VisualizationRule } from '@/schemas/hypothesis';
import type { Vector3 } from '@/schemas/location';
import { getPbrForMaterial } from '@/materials/masterMaterials';
import { resolveAssetUrlForNode } from '@/materials/assetDefinitions';
import { buildOsirisSceneGraph } from './osirisSceneGraph';
import type { SceneNodeWithWorld } from './sceneGraph';
import { CameraRig } from './CameraRig';
import { ScreenshotTaker } from './ScreenshotTaker';
import { WaterPlane } from './WaterPlane';
import { WaterMesh } from './WaterMesh';
import { Level0Surface } from './Level0Surface';
import { BlockoutMesh } from './BlockoutMesh';
import { GLTFAssetMesh } from './GLTFAssetMesh';
import { EvidenceHotspots } from './EvidenceHotspots';
import { generateOsirisHotspots } from './osirisHotspots';
import { getVisibilityLayer } from './visibilityLayers';

const LAYER_PBR: Record<string, { metalness: number; roughness: number }> = {
  'level-0': { metalness: 0.0, roughness: 0.95 },
  shafts: { metalness: 0.05, roughness: 0.9 },
  'level-1': { metalness: 0.1, roughness: 0.8 },
  'level-2': { metalness: 0.1, roughness: 0.8 },
  'level-3': { metalness: 0.15, roughness: 0.75 },
  monument: { metalness: 0.1, roughness: 0.85 },
};

const CHAMBER_LIGHT_NODES = osirisBlockout.nodes.filter((n) => n.layer.startsWith('level-'));

function getPbr(block: (typeof osirisBlockout.nodes)[number]): {
  metalness: number;
  roughness: number;
} {
  if (block.materialId) {
    return getPbrForMaterial(block.materialId);
  }
  return LAYER_PBR[block.layer] ?? { metalness: 0.1, roughness: 0.85 };
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
  const hiddenLayers = useAppStore((s) => s.hiddenLayers);
  const hiddenVisibilityLayers = useAppStore((s) => s.hiddenVisibilityLayers);
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

  const [hypothesisTick, setHypothesisTick] = useState(0);
  useEffect(() => {
    hypothesisEngine.setActive(activeHypothesisIds);
    setHypothesisTick((t) => t + 1);
  }, [activeHypothesisIds]);
  // hypothesisTick is incremented after the engine active set is synced; it is
  // intentionally unused so the overlay geometry re-runs against the latest rules.
  void hypothesisTick;

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
    .filter((node) => {
      const block = blocks.get(node.id)!;
      return (
        !hiddenLayers.includes(block.layer as never) &&
        !hiddenVisibilityLayers.includes(getVisibilityLayer(block))
      );
    })
    .map((node) => {
      const block = blocks.get(node.id)!;
      const rule = block.overlay
        ? activeRules.find((r) => r.overlay === block.overlay)
        : activeRules.find((r) => r.target === node.metadata.objectId);
      return { node, block, rule };
    })
    .filter(({ block, rule }) => !block.overlay || rule !== undefined);

  type OsirisBlock = (typeof osirisBlockout.nodes)[number];

  const assetNodes = useMemo(() => {
    const map = new Map<
      string,
      { node: SceneNodeWithWorld; block: OsirisBlock; rule?: VisualizationRule; url: string }
    >();
    const seen = new Set<string>();
    for (const { node, block, rule } of visibleNodes) {
      const objectId = block.objectId ?? node.metadata.objectId;
      if (!objectId || seen.has(objectId)) continue;
      const url = resolveAssetUrlForNode({ name: node.name, objectId });
      if (!url) continue;
      seen.add(objectId);
      map.set(objectId, { node, block, rule, url });
    }
    return map;
  }, [visibleNodes]);

  const assetObjectIds = useMemo(() => new Set(assetNodes.keys()), [assetNodes]);

  return (
    <Canvas camera={{ position: [16, -6, 22], fov: 55 }}>
      <CameraRig />
      <ScreenshotTaker />
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
      <Level0Surface hiddenVisibilityLayers={hiddenVisibilityLayers} />
      {visibleNodes.map(({ node, block, rule }) => {
        const objectId = block.objectId ?? node.metadata.objectId;
        if (objectId && assetObjectIds.has(objectId)) {
          const asset = assetNodes.get(objectId);
          if (asset && asset.node.id === node.id) {
            return (
              <GLTFAssetMesh
                key={`asset-${objectId}`}
                node={asset.node}
                block={asset.block}
                rule={asset.rule}
                pbr={getPbr(asset.block)}
                url={asset.url}
              />
            );
          }
          return null;
        }
        return (
          <BlockoutMesh key={node.id} node={node} block={block} rule={rule} pbr={getPbr(block)} />
        );
      })}
      {hydraulicActive && !hiddenVisibilityLayers.includes('Water') && <WaterPlane />}
      {hydraulicActive && !hiddenVisibilityLayers.includes('Water') && (
        <WaterMesh
          position={[-1.4, -30.4, -7.0]}
          size={6.5}
          elevation={waterLevel}
          turbidity={0.3}
          color="#0a4a6b"
        />
      )}
      {!hiddenVisibilityLayers.includes('Annotations') && measurementStart && (
        <MeasurementMarker point={measurementStart} />
      )}
      {!hiddenVisibilityLayers.includes('Annotations') && measurementEnd && (
        <MeasurementMarker point={measurementEnd} />
      )}
      <EvidenceHotspots
        hotspots={osirisHotspots}
        visible={!hiddenVisibilityLayers.includes('Evidence')}
      />
    </Canvas>
  );
}
