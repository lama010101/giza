import { describe, it, expect } from 'vitest';
import { IDENTITY_TRANSFORM, SceneGraph } from './sceneGraph';

describe('SceneGraph', () => {
  it('adds a root node and computes its world transform with origin', () => {
    const graph = new SceneGraph();
    graph.setRootOrigin({ x: 10, y: 0, z: 0 });
    graph.addNode({
      id: 'root',
      name: 'Osiris Shaft',
      parentId: null,
      localTransform: IDENTITY_TRANSFORM,
      metadata: { layer: 'monument' },
      visible: true,
    });

    const withWorld = graph.getNodeWithWorldTransform('root');
    expect(withWorld?.worldTransform.position.x).toBe(10);
  });

  it('combines parent and child transforms', () => {
    const graph = new SceneGraph();
    graph.addNode({
      id: 'level1',
      name: 'Level 1',
      parentId: null,
      localTransform: {
        position: { x: 0, y: -10, z: 0 },
        rotation: { x: 0, y: 0, z: 0 },
        scale: { x: 1, y: 1, z: 1 },
      },
      metadata: { layer: 'room' },
      visible: true,
    });
    graph.addNode({
      id: 'chamber-a',
      name: 'Chamber A',
      parentId: 'level1',
      localTransform: {
        position: { x: 5, y: 0, z: 0 },
        rotation: { x: 0, y: 0, z: 0 },
        scale: { x: 1, y: 1, z: 1 },
      },
      metadata: { layer: 'room' },
      visible: true,
    });

    const withWorld = graph.getNodeWithWorldTransform('chamber-a');
    expect(withWorld?.worldTransform.position.x).toBe(5);
    expect(withWorld?.worldTransform.position.y).toBe(-10);
  });

  it('finds nodes by object id', () => {
    const graph = new SceneGraph();
    graph.addNode({
      id: 'obj-node',
      name: 'Shaft A',
      parentId: null,
      localTransform: IDENTITY_TRANSFORM,
      metadata: { objectId: 'OBJ-0001' },
      visible: true,
    });

    const found = graph.findByObjectId('OBJ-0001');
    expect(found.length).toBe(1);
    expect(found[0]?.id).toBe('obj-node');
  });

  it('toggles layer visibility', () => {
    const graph = new SceneGraph();
    graph.addNode({
      id: 'surface',
      name: 'Surface',
      parentId: null,
      localTransform: IDENTITY_TRANSFORM,
      metadata: { layer: 'surface' },
      visible: true,
    });

    graph.setLayerVisible('surface', false);
    expect(graph.getNode('surface')?.visible).toBe(false);
    expect(graph.getAllVisibleNodes().length).toBe(0);
  });
});
