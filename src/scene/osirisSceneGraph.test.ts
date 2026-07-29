import { describe, it, expect } from 'vitest';
import { osirisBlockout } from '@db/blockouts/osiris-shaft';
import { loadAndValidateSeed } from '@/loaders/seed';
import { buildOsirisSceneGraph, OSIRIS_SCENE_ROOT_ID } from './osirisSceneGraph';

describe('buildOsirisSceneGraph', () => {
  it('creates a node for every blockout element plus the root', () => {
    const graph = buildOsirisSceneGraph();
    expect(graph.getAllNodes().length).toBe(osirisBlockout.nodes.length + 1);
    expect(graph.getNode(OSIRIS_SCENE_ROOT_ID)).toBeDefined();
  });

  it('attaches resolvable object and evidence metadata to object nodes', () => {
    const graph = buildOsirisSceneGraph();
    const seed = loadAndValidateSeed();

    for (const block of osirisBlockout.nodes) {
      if (!block.objectId) continue;
      const node = graph.getNode(block.id);
      expect(node?.metadata.objectId, block.id).toBe(block.objectId);
      expect(
        seed.objects.some((o) => o.id === block.objectId),
        block.objectId,
      ).toBe(true);
      expect(node?.metadata.evidenceIds?.length, block.id).toBeGreaterThan(0);
      for (const evidenceId of node?.metadata.evidenceIds ?? []) {
        expect(
          seed.evidence.some((e) => e.id === evidenceId),
          evidenceId,
        ).toBe(true);
      }
    }
  });

  it('places the central island at its measured depth', () => {
    const graph = buildOsirisSceneGraph();
    const island = graph.getNodeWithWorldTransform('central-island');
    expect(island?.worldTransform.position.y).toBeCloseTo(-29.775);
  });
});
