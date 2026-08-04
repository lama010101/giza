import { describe, it, expect } from 'vitest';
import { buildOsirisSceneGraph, OSIRIS_SCENE_ROOT_ID } from './osirisSceneGraph';
import { boundingBoxFromSize } from './sceneGraph';

describe('Osiris Scene Graph (M09-T02: bounding box + survey ref)', () => {
  const graph = buildOsirisSceneGraph();

  it('creates a root node', () => {
    const root = graph.getNode(OSIRIS_SCENE_ROOT_ID);
    expect(root).toBeDefined();
    expect(root!.name).toBe('Osiris Shaft');
  });

  it('all nodes have bounding boxes', () => {
    const nodes = graph.getAllNodes().filter((n) => n.id !== OSIRIS_SCENE_ROOT_ID);
    for (const node of nodes) {
      expect(node.metadata.boundingBox).toBeDefined();
      expect(node.metadata.boundingBox!.min).toBeDefined();
      expect(node.metadata.boundingBox!.max).toBeDefined();
    }
  });

  it('bounding boxes are valid (min < max)', () => {
    const nodes = graph.getAllNodes().filter((n) => n.metadata.boundingBox);
    for (const node of nodes) {
      const bb = node.metadata.boundingBox!;
      expect(bb.min.x).toBeLessThanOrEqual(bb.max.x);
      expect(bb.min.y).toBeLessThanOrEqual(bb.max.y);
      expect(bb.min.z).toBeLessThanOrEqual(bb.max.z);
    }
  });

  it('all nodes have survey references', () => {
    const nodes = graph.getAllNodes().filter((n) => n.id !== OSIRIS_SCENE_ROOT_ID);
    for (const node of nodes) {
      expect(node.metadata.surveyReference).toBeDefined();
      expect(node.metadata.surveyReference!.id).toBeDefined();
      expect(node.metadata.surveyReference!.method).toBeDefined();
      expect(node.metadata.surveyReference!.date).toBeDefined();
      expect(node.metadata.surveyReference!.surveyor).toBeDefined();
      expect(node.metadata.surveyReference!.coordinateSystem).toBeDefined();
    }
  });

  it('root node has survey reference', () => {
    const root = graph.getNode(OSIRIS_SCENE_ROOT_ID);
    expect(root!.metadata.surveyReference).toBeDefined();
  });

  it('boundingBoxFromSize computes correct bounds', () => {
    const bb = boundingBoxFromSize({ x: 0, y: 0, z: 0 }, { x: 2, y: 4, z: 6 });
    expect(bb.min).toEqual({ x: -1, y: -2, z: -3 });
    expect(bb.max).toEqual({ x: 1, y: 2, z: 3 });
  });

  it('confidence values are set per GIZA-03 §2.7', () => {
    const shaftA = graph.getNode('shaft-a');
    expect(shaftA!.metadata.confidence).toBe(98); // entrance shaft

    const chamberI = graph.getNode('chamber-i');
    expect(chamberI!.metadata.confidence).toBe(96); // main chambers

    const conduit = graph.getNode('northern-conduit');
    expect(conduit!.metadata.confidence).toBe(85); // conduit

    const water = graph.getNode('chamber-i-water');
    expect(water!.metadata.confidence).toBe(50); // variable
  });

  it('attaches resolvable object and evidence metadata to object nodes', () => {
    const chamberA = graph.getNode('chamber-a');
    expect(chamberA).toBeDefined();
    expect(chamberA!.metadata.objectId).toBe('OBJ-0002');
    expect(chamberA!.metadata.evidenceIds).toEqual(['EV-000002']);
    expect(chamberA!.metadata.sourceIds).toEqual(['SRC-0001']);
  });
});
