/**
 * Composable rendering pipeline per M04-T02.
 *
 * The rendering pipeline is a sequence of stages that transform the
 * scene graph into renderable output:
 *
 *   1. Scene graph traversal
 *   2. Visibility culling (frustum + occlusion)
 *   3. LOD selection
 *   4. Material assignment
 *   5. Sort by render state (minimize state changes)
 *   6. Draw call submission
 *
 * Each stage is a pure function that takes the previous stage's output
 * and returns the next stage's input. This allows stages to be
 * composed, reordered, or replaced without affecting others.
 */

import type { SceneNode, SceneGraph } from '@/scene/sceneGraph';

// ─── Pipeline types ───────────────────────────────────────────────────────

export interface RenderItem {
  node: SceneNode;
  distance: number;
  lod: 'LOD0' | 'LOD1' | 'LOD2' | 'LOD3';
  materialId: string;
  visible: boolean;
  sortKey: number;
}

export interface PipelineContext {
  cameraPosition: { x: number; y: number; z: number };
  cameraFrustum: FrustumPlane[];
  lodDistances: { LOD0: number; LOD1: number; LOD2: number; LOD3: number };
  maxDrawCalls: number;
}

export interface FrustumPlane {
  normal: { x: number; y: number; z: number };
  distance: number;
}

// ─── Pipeline stages ──────────────────────────────────────────────────────

/**
 * Stage 1: Traverses the scene graph and collects all renderable nodes.
 */
export function traverseSceneGraph(graph: SceneGraph): SceneNode[] {
  return graph.getAllNodes();
}

/**
 * Stage 2: Frustum culling — removes nodes outside the camera frustum.
 */
export function frustumCull(nodes: SceneNode[], ctx: PipelineContext): SceneNode[] {
  return nodes.filter((node) => {
    if (!node.metadata?.boundingBox) return true; // No bounding box = always visible

    const bb = node.metadata.boundingBox;
    // Check if bounding box intersects any frustum plane
    for (const plane of ctx.cameraFrustum) {
      const center = {
        x: (bb.min.x + bb.max.x) / 2,
        y: (bb.min.y + bb.max.y) / 2,
        z: (bb.min.z + bb.max.z) / 2,
      };
      const distance =
        plane.normal.x * center.x +
        plane.normal.y * center.y +
        plane.normal.z * center.z +
        plane.distance;

      if (distance < 0) return false; // Behind frustum plane
    }

    return true;
  });
}

/**
 * Stage 3: LOD selection — chooses LOD level based on distance.
 */
export function selectLOD(nodes: SceneNode[], ctx: PipelineContext): RenderItem[] {
  return nodes.map((node) => {
    const pos = node.localTransform.position;
    const dx = pos.x - ctx.cameraPosition.x;
    const dy = pos.y - ctx.cameraPosition.y;
    const dz = pos.z - ctx.cameraPosition.z;
    const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);

    let lod: RenderItem['lod'] = 'LOD0';
    if (distance > ctx.lodDistances.LOD3) lod = 'LOD3';
    else if (distance > ctx.lodDistances.LOD2) lod = 'LOD2';
    else if (distance > ctx.lodDistances.LOD1) lod = 'LOD1';

    return {
      node,
      distance,
      lod,
      materialId: ((node.metadata as Record<string, unknown>)?.materialId as string) ?? 'default',
      visible: true,
      sortKey: 0,
    };
  });
}

/**
 * Stage 4: Material assignment — ensures each render item has a material.
 */
export function assignMaterials(items: RenderItem[]): RenderItem[] {
  return items.map((item) => ({
    ...item,
    materialId: item.materialId || 'default',
  }));
}

/**
 * Stage 5: Sort by render state to minimize draw call state changes.
 * Sorts by: material → LOD → distance
 */
export function sortByRenderState(items: RenderItem[]): RenderItem[] {
  return [...items].sort((a, b) => {
    // Sort by material first
    if (a.materialId !== b.materialId) {
      return a.materialId.localeCompare(b.materialId);
    }
    // Then by LOD
    if (a.lod !== b.lod) {
      return a.lod.localeCompare(b.lod);
    }
    // Then by distance (near first)
    return a.distance - b.distance;
  });
}

/**
 * Stage 6: Draw call submission — limits draw calls to the budget.
 * Items beyond the budget are culled (furthest first).
 */
export function submitDrawCalls(items: RenderItem[], ctx: PipelineContext): RenderItem[] {
  // Sort by distance (far items first, so they get culled first)
  const sorted = [...items].sort((a, b) => b.distance - a.distance);

  // Mark culled items as invisible (items beyond the budget)
  const culledIds = new Set(sorted.slice(ctx.maxDrawCalls).map((i) => i.node.id));
  return items.map((item) => ({
    ...item,
    visible: !culledIds.has(item.node.id),
  }));
}

// ─── Full pipeline ────────────────────────────────────────────────────────

/**
 * Runs the full rendering pipeline.
 */
export function runRenderPipeline(graph: SceneGraph, ctx: PipelineContext): RenderItem[] {
  const traversed = traverseSceneGraph(graph);
  const culled = frustumCull(traversed, ctx);
  const withLOD = selectLOD(culled, ctx);
  const withMaterials = assignMaterials(withLOD);
  const sorted = sortByRenderState(withMaterials);
  const final = submitDrawCalls(sorted, ctx);
  return final;
}
