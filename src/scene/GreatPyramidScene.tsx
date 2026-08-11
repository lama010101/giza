import { useCallback, useEffect, useLayoutEffect, useMemo, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { AdditiveBlending, DoubleSide } from 'three';
import { greatPyramidBlockout, type BlockoutNode } from '@db/blockouts/great-pyramid';
import { generateGreatPyramidLOD1, type BlockoutNodeLOD1 } from '@db/geometry/gp-lod1';
import { getDefaultHypothesisContext, hypothesisEngine } from '@/theories/engineInstance';
import type { HypothesisGeometryNode } from '@/theories/types';
import { useAppStore } from '@/store/app';
import { useLightingStore } from '@/store/lighting';
import type { VisualizationRule } from '@/schemas/hypothesis';
import type { Vector3 } from '@/schemas/location';
import { buildGreatPyramidSceneGraph } from './greatPyramidSceneGraph';
import type { SceneGraph, SceneNodeWithWorld } from './sceneGraph';
import { sceneStreamer } from './sceneStreaming';
import { CameraRig } from './CameraRig';
import { ScreenshotTaker } from './ScreenshotTaker';
import { getVisibilityLayer } from './visibilityLayers';
import { GrandGalleryMesh } from './GrandGalleryMesh';
import { AntechamberMesh } from './AntechamberMesh';
import { SubterraneanChamberMesh } from './SubterraneanChamberMesh';
import { GreatPyramidExteriorMesh } from './GreatPyramidExteriorMesh';
import { KingsChamberMesh } from './KingsChamberMesh';
import { QueensChamberMesh } from './QueensChamberMesh';
import { BlockoutMesh } from './BlockoutMesh';
import { GLTFAssetMesh } from './GLTFAssetMesh';
import { getPbrForMaterial, DEFAULT_PBR } from '@/materials/masterMaterials';
import { resolveAssetForNode } from '@/materials/assetDefinitions';
import type { AssetDefinition } from '@/materials/assetDefinitions';
import { GreatPyramidLighting } from './GreatPyramidLighting';
import { Compass } from './Compass';
import { HypothesisMesh } from './HypothesisMesh';
import { MONUMENT_ORIGINS } from './coordinateSystem';
import { getObjectTimelinePhases } from './chronologyLayers';

type UnifiedBlock = BlockoutNode | BlockoutNodeLOD1;

const GP_LAYER_MATERIAL: Record<string, string> = {
  exterior: 'MAT_LocalLimestone',
  passages: 'MAT_TuraLimestone',
  subterranean: 'MAT_Bedrock',
  gallery: 'MAT_TuraLimestone',
  'kings-complex': 'MAT_AswanGranite',
  'queens-complex': 'MAT_TuraLimestone',
  relieving: 'MAT_AswanGranite',
  shafts: 'MAT_TuraLimestone',
};

const ASSET_EXCLUDED_IDS = new Set([
  'pyramid-exterior',
  'grand-gallery',
  'antechamber',
  'subterranean-chamber',
  'exterior-detail',
  'kings-chamber',
  'queens-chamber',
]);

function getPbr(block: UnifiedBlock): { metalness: number; roughness: number } {
  const materialId = block.materialId ?? GP_LAYER_MATERIAL[block.layer];
  return materialId ? getPbrForMaterial(materialId) : DEFAULT_PBR;
}

function MeasurementMarker({ point }: { point: Vector3 }): JSX.Element {
  return (
    <mesh position={[point.x, point.y, point.z]}>
      <sphereGeometry args={[0.12, 16, 16]} />
      <meshStandardMaterial color="#ef4444" emissive="#ef4444" emissiveIntensity={0.6} />
    </mesh>
  );
}

interface StreamingControllerProps {
  graph: SceneGraph;
  onLoadedChange: () => void;
}

const STREAMING_LOAD_DISTANCE = 100;
const STREAMING_UNLOAD_DISTANCE = 120;
const STREAMING_MAX_LOADED = 100;

function StreamingController({ graph, onLoadedChange }: StreamingControllerProps): JSX.Element {
  const { camera } = useThree();

  useLayoutEffect(() => {
    sceneStreamer.reset();
    sceneStreamer.setConfig({
      loadDistance: STREAMING_LOAD_DISTANCE,
      unloadDistance: STREAMING_UNLOAD_DISTANCE,
      maxLoadedNodes: STREAMING_MAX_LOADED,
      pinByDefault: false,
    });

    // The exterior shell and entrances are always resident so the user can
    // approach and enter the monument from the initial camera position.
    for (const node of graph.getAllNodes()) {
      if (node.metadata.layer === 'exterior') {
        sceneStreamer.pin(node.id);
      }
    }

    const { toLoad, toUnload } = sceneStreamer.update(graph, camera.position);
    sceneStreamer.applyVisibility(graph);
    if (toLoad.length > 0 || toUnload.length > 0) {
      onLoadedChange();
    }
  }, [graph, camera, onLoadedChange]);

  useFrame(() => {
    const { toLoad, toUnload } = sceneStreamer.update(graph, camera.position);
    sceneStreamer.applyVisibility(graph);
    if (toLoad.length > 0 || toUnload.length > 0) {
      onLoadedChange();
    }
  });

  return <></>;
}

function findBlockByObjectId(
  blocks: Map<string, UnifiedBlock>,
  objectId: string,
): UnifiedBlock | undefined {
  for (const block of blocks.values()) {
    if (block.objectId === objectId) return block;
  }
  return undefined;
}

function WaterOverlay({
  rule,
  block,
}: {
  rule: VisualizationRule;
  block: UnifiedBlock;
}): JSX.Element {
  const { position, size } = block;
  const waterY = position.y - size.y * 0.25;
  return (
    <mesh position={[position.x, waterY, position.z]} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[size.x * 0.9, size.z * 0.9]} />
      <meshStandardMaterial
        color={rule.color ?? '#4488ff'}
        transparent
        opacity={rule.opacity ?? 0.3}
        side={DoubleSide}
        blending={AdditiveBlending}
        depthWrite={false}
      />
    </mesh>
  );
}

function GeometryOverlay({
  rule,
  block,
}: {
  rule: VisualizationRule;
  block: UnifiedBlock;
}): JSX.Element {
  const { position, size, rotation } = block;
  const rx = rotation?.x ?? 0;
  const ry = rotation?.y ?? 0;
  const rz = rotation?.z ?? 0;
  return (
    <mesh
      position={[position.x, position.y, position.z]}
      rotation={[rx, ry, rz]}
      scale={[1.01, 1.01, 1.01]}
    >
      <boxGeometry args={[size.x, size.y, size.z]} />
      <meshStandardMaterial
        color={rule.color ?? '#ffffff'}
        transparent
        opacity={rule.opacity ?? 0.3}
        side={DoubleSide}
        blending={AdditiveBlending}
        depthWrite={false}
      />
    </mesh>
  );
}

interface HypothesisOverlaysProps {
  rules: VisualizationRule[];
  blocks: Map<string, UnifiedBlock>;
}

function HypothesisOverlays({ rules, blocks }: HypothesisOverlaysProps): JSX.Element {
  return (
    <>
      {rules.map((rule, index) => {
        const block = findBlockByObjectId(blocks, rule.target);
        if (!block) return null;
        const key = `${rule.target}-${rule.overlay}-${index}`;
        if (rule.overlay === 'water' || rule.overlay === 'water-level') {
          return <WaterOverlay key={key} rule={rule} block={block} />;
        }
        return <GeometryOverlay key={key} rule={rule} block={block} />;
      })}
    </>
  );
}

export function GreatPyramidScene(): JSX.Element {
  const lod = useAppStore((s) => s.lod);
  const [streamTick, setStreamTick] = useState(0);
  const handleStreamUpdate = useCallback(() => setStreamTick((t) => t + 1), []);
  // streamTick is a render trigger for the streaming controller; the value itself is unused.
  void streamTick;
  const [hypothesisTick, setHypothesisTick] = useState(0);
  const graph = useMemo(() => buildGreatPyramidSceneGraph(lod), [lod]);
  const blocks = useMemo<Map<string, UnifiedBlock>>(() => {
    const source: UnifiedBlock[] =
      lod === 'LOD1' ? generateGreatPyramidLOD1() : greatPyramidBlockout.nodes;
    return new Map(source.map((n) => [n.id, n]));
  }, [lod]);
  const activeHypothesisIds = useAppStore((s) => s.activeHypothesisIds);
  const hiddenLayers = useAppStore((s) => s.hiddenLayers);
  const hiddenVisibilityLayers = useAppStore((s) => s.hiddenVisibilityLayers);
  const measurementStart = useAppStore((s) => s.measurementStart);
  const measurementEnd = useAppStore((s) => s.measurementEnd);
  const measurementThird = useAppStore((s) => s.measurementThird);
  const chronologyPeriod = useAppStore((s) => s.chronologyPeriod);

  const background = useLightingStore((s) => s.background);

  // Keep the hypothesis engine's active set in sync with the UI store so
  // overlay geometry is computed correctly on first render.
  useEffect(() => {
    hypothesisEngine.setActive(activeHypothesisIds);
    setHypothesisTick((t) => t + 1);
  }, [activeHypothesisIds]);

  /* eslint-disable react-hooks/exhaustive-deps */
  // hypothesisTick is incremented by the effect above after syncing the engine;
  // it is intentionally included so the memo re-runs once the active set is applied.
  const hypothesisGeometryNodes: HypothesisGeometryNode[] = useMemo(() => {
    if (activeHypothesisIds.length === 0) return [];
    const context = getDefaultHypothesisContext();
    return hypothesisEngine.getGeometryNodes(context);
  }, [activeHypothesisIds, hypothesisTick]);
  /* eslint-enable react-hooks/exhaustive-deps */

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

  const activeHighlightRules = activeRules.filter((r) => r.overlay === 'highlight');
  const activeOverlayRules = activeRules.filter(
    (r) =>
      r.overlay !== 'highlight' && r.overlay !== 'label' && r.overlay !== 'interpretive-object',
  );

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
      const visibilityRule = block.overlay
        ? activeRules.find((r) => r.overlay === block.overlay)
        : activeRules.find((r) => r.target === node.metadata.objectId);
      const materialRule = activeHighlightRules.find((r) => r.target === node.metadata.objectId);
      return { node, block, rule: materialRule, visibilityRule };
    })
    .filter(({ block, visibilityRule }) => !block.overlay || visibilityRule !== undefined)
    .filter(({ node }) => {
      const objectId = node.metadata.objectId;
      if (!objectId || chronologyPeriod === null) return true;
      return getObjectTimelinePhases(objectId).includes(chronologyPeriod);
    });

  const assetNodes = useMemo(() => {
    const map = new Map<
      string,
      {
        node: SceneNodeWithWorld;
        block: UnifiedBlock;
        rule?: VisualizationRule;
        asset: AssetDefinition;
      }
    >();
    const seen = new Set<string>();
    for (const { node, block, rule } of visibleNodes) {
      if (ASSET_EXCLUDED_IDS.has(node.id)) continue;
      const objectId = block.objectId ?? node.metadata.objectId;
      if (!objectId || seen.has(objectId)) continue;
      const asset = resolveAssetForNode({ name: node.name, objectId });
      if (!asset?.filePath) continue;
      seen.add(objectId);
      map.set(objectId, { node, block, rule, asset });
    }
    return map;
  }, [visibleNodes]);

  const assetObjectIds = useMemo(() => new Set(assetNodes.keys()), [assetNodes]);

  return (
    <Canvas camera={{ position: [40, 80, 80], fov: 55 }} gl={{ preserveDrawingBuffer: true }}>
      <CameraRig />
      <ScreenshotTaker />
      <StreamingController graph={graph} onLoadedChange={handleStreamUpdate} />
      <color attach="background" args={[background]} />
      <GreatPyramidLighting />
      {visibleNodes.map(({ node, block, rule }) => {
        if (node.id === 'grand-gallery') {
          return <GrandGalleryMesh key={node.id} node={node} block={block} rule={rule} />;
        }
        if (node.id === 'antechamber') {
          return <AntechamberMesh key={node.id} node={node} block={block} rule={rule} />;
        }
        if (node.id === 'subterranean-chamber') {
          return <SubterraneanChamberMesh key={node.id} node={node} block={block} rule={rule} />;
        }
        if (node.id === 'exterior-detail') {
          return <GreatPyramidExteriorMesh key={node.id} node={node} block={block} rule={rule} />;
        }
        if (node.id === 'kings-chamber') {
          return <KingsChamberMesh key={node.id} node={node} block={block} rule={rule} />;
        }
        if (node.id === 'queens-chamber') {
          return <QueensChamberMesh key={node.id} node={node} block={block} rule={rule} />;
        }
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
                assetId={asset.asset.id}
              />
            );
          }
          return null;
        }
        const isPyramid = node.id === 'pyramid-exterior';
        return (
          <BlockoutMesh
            key={node.id}
            node={node}
            block={block}
            rule={rule}
            pbr={getPbr(block)}
            isPyramid={isPyramid}
          />
        );
      })}
      {!hiddenVisibilityLayers.includes('Theory') &&
        hypothesisGeometryNodes.map((hnode) => <HypothesisMesh key={hnode.id} node={hnode} />)}
      {!hiddenVisibilityLayers.includes('Theory') && (
        <HypothesisOverlays rules={activeOverlayRules} blocks={blocks} />
      )}
      {!hiddenVisibilityLayers.includes('Annotations') && measurementStart && (
        <MeasurementMarker point={measurementStart} />
      )}
      {!hiddenVisibilityLayers.includes('Annotations') && measurementEnd && (
        <MeasurementMarker point={measurementEnd} />
      )}
      {!hiddenVisibilityLayers.includes('Annotations') && measurementThird && (
        <MeasurementMarker point={measurementThird} />
      )}
      <Compass origin={MONUMENT_ORIGINS['great-pyramid']} />
    </Canvas>
  );
}
