import { useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
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
import { AntechamberMesh } from './AntechamberMesh';
import { SubterraneanChamberMesh } from './SubterraneanChamberMesh';
import { GreatPyramidExteriorMesh } from './GreatPyramidExteriorMesh';
import { KingsChamberMesh } from './KingsChamberMesh';
import { QueensChamberMesh } from './QueensChamberMesh';
import { BlockoutMesh } from './BlockoutMesh';
import { getPbrForMaterial, DEFAULT_PBR } from '@/materials/masterMaterials';
import { GreatPyramidLighting } from './GreatPyramidLighting';

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

  return (
    <Canvas camera={{ position: [40, 80, 80], fov: 55 }}>
      <CameraRig />
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
