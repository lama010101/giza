import { osirisBlockout } from '@db/blockouts/osiris-shaft';
import { IDENTITY_TRANSFORM, SceneGraph } from './sceneGraph';

export const OSIRIS_SCENE_ROOT_ID = 'osiris-shaft-scene';

export function buildOsirisSceneGraph(): SceneGraph {
  const graph = new SceneGraph();

  graph.addNode({
    id: OSIRIS_SCENE_ROOT_ID,
    name: osirisBlockout.name,
    parentId: null,
    localTransform: IDENTITY_TRANSFORM,
    metadata: { layer: 'monument' },
    visible: true,
  });

  for (const node of osirisBlockout.nodes) {
    graph.addNode({
      id: node.id,
      name: node.name,
      parentId: OSIRIS_SCENE_ROOT_ID,
      localTransform: {
        position: node.position,
        rotation: node.rotation ?? { x: 0, y: 0, z: 0 },
        scale: { x: 1, y: 1, z: 1 },
      },
      metadata: {
        objectId: node.objectId,
        evidenceIds: node.evidenceIds,
        sourceIds: node.sourceIds,
        layer: node.layer,
      },
      visible: true,
    });
  }

  return graph;
}
