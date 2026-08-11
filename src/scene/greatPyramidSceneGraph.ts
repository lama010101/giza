import { SceneGraph, IDENTITY_TRANSFORM, type SceneNode } from './sceneGraph';
import { greatPyramidBlockout, type BlockoutNode } from '@db/blockouts/great-pyramid';
import { generateGreatPyramidLOD1, type BlockoutNodeLOD1 } from '@db/geometry/gp-lod1';
import type { LODLevel } from '@/loaders/validators';
import { MONUMENT_ORIGINS } from './coordinateSystem';

type UnifiedNode = BlockoutNode | BlockoutNodeLOD1;

export function buildGreatPyramidSceneGraph(lod: LODLevel = 'LOD0'): SceneGraph {
  const graph = new SceneGraph();

  graph.setRootOrigin({ ...MONUMENT_ORIGINS['great-pyramid'] });

  const root = graph.addNode({
    id: 'gp-root',
    name: 'Great Pyramid',
    parentId: null,
    localTransform: IDENTITY_TRANSFORM,
    metadata: { layer: 'root' },
    visible: true,
  });

  void root;

  const layerGroups: Record<string, string> = {
    exterior: 'gp-exterior',
    passages: 'gp-passages',
    subterranean: 'gp-subterranean',
    gallery: 'gp-gallery',
    'kings-complex': 'gp-kings-complex',
    'queens-complex': 'gp-queens-complex',
    relieving: 'gp-relieving',
    shafts: 'gp-shafts',
  };

  const layerParents: Record<string, SceneNode | undefined> = {};

  for (const [layer, parentId] of Object.entries(layerGroups)) {
    const node = graph.addNode({
      id: parentId,
      name: layer.charAt(0).toUpperCase() + layer.slice(1),
      parentId: 'gp-root',
      localTransform: IDENTITY_TRANSFORM,
      metadata: { layer },
      visible: true,
    });
    layerParents[layer] = node;
  }

  const nodes: UnifiedNode[] =
    lod === 'LOD1' ? generateGreatPyramidLOD1() : greatPyramidBlockout.nodes;

  for (const blockoutNode of nodes) {
    const parentId = layerParents[blockoutNode.layer]?.id ?? 'gp-root';

    graph.addNode({
      id: blockoutNode.id,
      name: blockoutNode.name,
      parentId,
      localTransform: {
        position: { ...blockoutNode.position },
        rotation: { ...(blockoutNode.rotation ?? { x: 0, y: 0, z: 0 }) },
        scale: { x: 1, y: 1, z: 1 },
      },
      metadata: {
        objectId: blockoutNode.objectId,
        evidenceIds: blockoutNode.evidenceIds,
        sourceIds: blockoutNode.sourceIds,
        layer: blockoutNode.layer,
      },
      visible: true,
    });
  }

  return graph;
}
