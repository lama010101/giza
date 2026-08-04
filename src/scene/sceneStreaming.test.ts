import { describe, it, expect, beforeEach } from 'vitest';
import { sceneStreamer } from './sceneStreaming';
import { SceneGraph, IDENTITY_TRANSFORM } from './sceneGraph';

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
      position: { x: 10, y: 0, z: 0 },
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
      position: { x: 500, y: 0, z: 0 },
      rotation: { x: 0, y: 0, z: 0 },
      scale: { x: 1, y: 1, z: 1 },
    },
    metadata: {},
    visible: true,
  });
  return graph;
}

describe('Scene Streaming (M05-T04)', () => {
  beforeEach(() => {
    sceneStreamer._resetForTesting();
  });

  describe('pin/unpin', () => {
    it('pins a node', () => {
      sceneStreamer.pin('near');
      expect(sceneStreamer.isPinned('near')).toBe(true);
    });

    it('unpins a node', () => {
      sceneStreamer.pin('near');
      sceneStreamer.unpin('near');
      expect(sceneStreamer.isPinned('near')).toBe(false);
    });
  });

  describe('update', () => {
    it('loads near nodes', () => {
      const graph = makeGraph();
      const { toLoad } = sceneStreamer.update(graph, { x: 0, y: 0, z: 0 });
      expect(toLoad).toContain('near');
    });

    it('does not load far nodes', () => {
      const graph = makeGraph();
      const { toLoad } = sceneStreamer.update(graph, { x: 0, y: 0, z: 0 });
      expect(toLoad).not.toContain('far');
    });

    it('unloads nodes that move far away', () => {
      const graph = makeGraph();
      // First load near
      sceneStreamer.update(graph, { x: 0, y: 0, z: 0 });
      expect(sceneStreamer.getLoadedCount()).toBeGreaterThan(0);

      // Move camera far away
      const { toUnload } = sceneStreamer.update(graph, { x: 1000, y: 0, z: 0 });
      expect(toUnload.length).toBeGreaterThan(0);
    });

    it('keeps pinned nodes loaded', () => {
      const graph = makeGraph();
      sceneStreamer.pin('far');
      const { toLoad } = sceneStreamer.update(graph, { x: 0, y: 0, z: 0 });
      expect(toLoad).toContain('far');
    });
  });

  describe('forceLoad/forceUnload', () => {
    it('force-loads a node', () => {
      sceneStreamer.forceLoad('test');
      expect(sceneStreamer.getLoadedCount()).toBe(1);
    });

    it('does not unload pinned nodes', () => {
      sceneStreamer.forceLoad('test');
      sceneStreamer.pin('test');
      sceneStreamer.forceUnload('test');
      expect(sceneStreamer.getLoadedCount()).toBe(1);
    });
  });

  describe('setConfig', () => {
    it('updates configuration', () => {
      sceneStreamer.setConfig({ loadDistance: 50 });
      expect(sceneStreamer.getConfig().loadDistance).toBe(50);
    });
  });
});
