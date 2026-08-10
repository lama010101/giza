import type { VisibilityLayer } from '@/store/app';

interface HasVisibilityMapping {
  id: string;
  layer: string;
  overlay?: string;
}

/**
 * Maps a blockout node to one of the 8 canonical visibility layers.
 *
 * - `Theory` — hypothesis overlay geometry (e.g. water table, flow arrows).
 * - `Modern` — modern additions (fencing, paths, markers, excavation perimeter).
 * - `Geology` — natural/bedrock/desert surface context.
 * - `Water` — water surface meshes (driven by simulation).
 * - `Evidence` — evidence hotspots.
 * - `Annotations` — measurement markers and labels.
 * - `Geometry` — the architectural/structural elements.
 * - `Simulation` — future non-water simulation output (currently none visualised directly).
 */
export function getVisibilityLayer(block: HasVisibilityMapping): VisibilityLayer {
  if (block.overlay) return 'Theory';
  if (block.id.startsWith('surface-')) {
    if (block.id === 'surface-bedrock' || block.id === 'surface-desert') return 'Geology';
    return 'Modern';
  }
  if (block.layer === 'level-0') return 'Geology';
  if (block.id.includes('water')) return 'Water';
  return 'Geometry';
}

/**
 * Default visibility layer for nodes that do not yet carry explicit mapping
 * metadata. Used by monuments that have not been fully categorised yet.
 */
export const DEFAULT_VISIBILITY_LAYER: VisibilityLayer = 'Geometry';
