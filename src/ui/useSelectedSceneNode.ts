import { useMemo } from 'react';
import { useAppStore } from '@/store/app';
import { buildOsirisSceneGraph } from '@/scene/osirisSceneGraph';
import { buildGreatPyramidSceneGraph } from '@/scene/greatPyramidSceneGraph';
import { osirisBlockout } from '@db/blockouts/osiris-shaft';
import { greatPyramidBlockout } from '@db/blockouts/great-pyramid';
import type { SceneNodeWithWorld } from '@/scene/sceneGraph';
import type { BlockoutNode } from '@db/blockouts/great-pyramid';

export interface SelectedSceneNode {
  node: SceneNodeWithWorld;
  block: BlockoutNode | undefined;
  objectId: string | undefined;
}

/**
 * Returns the scene node that is currently selected or hovered, paired with its
 * source blockout data (size, color, etc.) when available.
 */
export function useSelectedSceneNode(): SelectedSceneNode | undefined {
  const activeMonument = useAppStore((s) => s.activeMonument);
  const lod = useAppStore((s) => s.lod);
  const selectedObjectId = useAppStore((s) => s.selectedObjectId);
  const hoveredNodeId = useAppStore((s) => s.hoveredNodeId);

  const graph = useMemo(
    () =>
      activeMonument === 'great-pyramid'
        ? buildGreatPyramidSceneGraph(lod)
        : buildOsirisSceneGraph(),
    [activeMonument, lod],
  );

  const blockoutMap = useMemo(
    () =>
      new Map(
        (activeMonument === 'great-pyramid'
          ? greatPyramidBlockout.nodes
          : osirisBlockout.nodes
        ).map((n) => [n.id, n]),
      ),
    [activeMonument],
  );

  return useMemo(() => {
    if (selectedObjectId) {
      const matches = graph.findByObjectId(selectedObjectId);
      if (matches.length > 0) {
        const node = matches[0];
        return { node, block: blockoutMap.get(node.id), objectId: node.metadata.objectId };
      }
    }
    if (hoveredNodeId) {
      const node = graph.getNodeWithWorldTransform(hoveredNodeId);
      if (node) {
        return { node, block: blockoutMap.get(node.id), objectId: node.metadata.objectId };
      }
    }
    return undefined;
  }, [graph, blockoutMap, selectedObjectId, hoveredNodeId]);
}
