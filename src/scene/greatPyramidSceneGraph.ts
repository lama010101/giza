import { SceneGraph, IDENTITY_TRANSFORM, type SceneNode } from './sceneGraph';
import { greatPyramidBlockout } from '@db/blockouts/great-pyramid';

export function buildGreatPyramidSceneGraph(): SceneGraph {
  const graph = new SceneGraph();

  graph.setRootOrigin({ x: 0, y: 0, z: 0 });

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

  for (const blockoutNode of greatPyramidBlockout.nodes) {
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
