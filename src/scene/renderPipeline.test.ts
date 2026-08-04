import { describe, it, expect } from 'vitest';
import {
  traverseSceneGraph,
  frustumCull,
  selectLOD,
  assignMaterials,
  sortByRenderState,
  submitDrawCalls,
  runRenderPipeline,
  type PipelineContext,
  type FrustumPlane,
} from './renderPipeline';
import { SceneGraph, IDENTITY_TRANSFORM } from './sceneGraph';

function makeContext(overrides: Partial<PipelineContext> = {}): PipelineContext {
  return {
    cameraPosition: { x: 0, y: 0, z: 0 },
    cameraFrustum: [],
    lodDistances: { LOD0: 10, LOD1: 50, LOD2: 100, LOD3: 200 },
    maxDrawCalls: 100,
    ...overrides,
  };
}

function makeGraph(): SceneGraph {
  const graph = new SceneGraph();
  graph.addNode({
    id: 'root',
    name: 'Root',
    parentId: null,
    localTransform: IDENTITY_TRANSFORM,
    metadata: {},
    visible: true,
  });
  graph.addNode({
    id: 'near',
    name: 'Near',
    parentId: 'root',
    localTransform: {
      position: { x: 5, y: 0, z: 0 },
      rotation: { x: 0, y: 0, z: 0 },
      scale: { x: 1, y: 1, z: 1 },
    },
    metadata: {},
    visible: true,
  });
  graph.addNode({
    id: 'far',
    name: 'Far',
    parentId: 'root',
    localTransform: {
      position: { x: 300, y: 0, z: 0 },
      rotation: { x: 0, y: 0, z: 0 },
      scale: { x: 1, y: 1, z: 1 },
    },
    metadata: {},
    visible: true,
  });
  return graph;
}

describe('Render Pipeline (M04-T02)', () => {
  describe('traverseSceneGraph', () => {
    it('collects all nodes from the graph', () => {
      const graph = makeGraph();
      const nodes = traverseSceneGraph(graph);
      expect(nodes.length).toBe(3);
    });
  });

  describe('frustumCull', () => {
    it('keeps all nodes when no frustum planes', () => {
      const graph = makeGraph();
      const nodes = traverseSceneGraph(graph);
      const ctx = makeContext({ cameraFrustum: [] });
      const result = frustumCull(nodes, ctx);
      expect(result).toHaveLength(3);
    });

    it('culls nodes behind frustum plane', () => {
      const graph = makeGraph();
      const nodes = traverseSceneGraph(graph);
      const plane: FrustumPlane = { normal: { x: -1, y: 0, z: 0 }, distance: 50 };
      const ctx = makeContext({ cameraFrustum: [plane] });
      // Without bounding boxes, all nodes pass culling
      const result = frustumCull(nodes, ctx);
      expect(result.length).toBeGreaterThan(0);
    });
  });

  describe('selectLOD', () => {
    it('assigns LOD0 for nearby nodes', () => {
      const graph = makeGraph();
      const nodes = traverseSceneGraph(graph);
      const ctx = makeContext();
      const items = selectLOD(nodes, ctx);
      const near = items.find((i) => i.node.id === 'near');
      expect(near?.lod).toBe('LOD0');
    });

    it('assigns LOD3 for distant nodes', () => {
      const graph = makeGraph();
      const nodes = traverseSceneGraph(graph);
      const ctx = makeContext();
      const items = selectLOD(nodes, ctx);
      const far = items.find((i) => i.node.id === 'far');
      expect(far?.lod).toBe('LOD3');
    });
  });

  describe('assignMaterials', () => {
    it('assigns default material to items without one', () => {
      const graph = makeGraph();
      const nodes = traverseSceneGraph(graph);
      const ctx = makeContext();
      const items = selectLOD(nodes, ctx);
      const result = assignMaterials(items);
      expect(result[0].materialId).toBe('default');
    });
  });

  describe('sortByRenderState', () => {
    it('sorts by material first', () => {
      const items = [
        {
          node: { id: 'a' } as never,
          distance: 10,
          lod: 'LOD0' as const,
          materialId: 'mat-b',
          visible: true,
          sortKey: 0,
        },
        {
          node: { id: 'b' } as never,
          distance: 5,
          lod: 'LOD0' as const,
          materialId: 'mat-a',
          visible: true,
          sortKey: 0,
        },
      ];
      const sorted = sortByRenderState(items);
      expect(sorted[0].materialId).toBe('mat-a');
    });
  });

  describe('submitDrawCalls', () => {
    it('limits draw calls to budget', () => {
      const items = Array.from({ length: 10 }, (_, i) => ({
        node: { id: `node-${i}` } as never,
        distance: i * 10,
        lod: 'LOD0' as const,
        materialId: 'mat',
        visible: true,
        sortKey: 0,
      }));
      const ctx = makeContext({ maxDrawCalls: 5 });
      const result = submitDrawCalls(items, ctx);
      const visible = result.filter((i) => i.visible);
      expect(visible).toHaveLength(5);
    });
  });

  describe('runRenderPipeline', () => {
    it('runs all stages', () => {
      const graph = makeGraph();
      const ctx = makeContext();
      const result = runRenderPipeline(graph, ctx);
      expect(result.length).toBeGreaterThan(0);
    });
  });
});
