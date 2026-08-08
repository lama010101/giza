/**
 * Osiris Shaft evidence hotspots per M09-T21.
 *
 * Generates clickable hotspots for evidence records across all levels.
 * The spec requires ≥10 hotspots; the Osiris Shaft seed has 19 evidence
 * records (EV-000001 through EV-000019).
 *
 * Each hotspot links to the evidence DB and is clickable to open the
 * evidence panel.
 */

import { osirisBlockout } from '@db/blockouts/osiris-shaft';
import type { Hotspot } from '@/evidence/hotspot';

/**
 * Extended hotspot with Osiris-specific metadata (layer, label, pulse).
 * The base Hotspot schema is a subset of this.
 */
export interface OsirisHotspot extends Hotspot {
  label: string;
  layer: string;
  pulse: boolean;
}

/**
 * Generates evidence hotspots from the Osiris Shaft blockout nodes.
 * Each node with evidenceIds becomes a hotspot at its position.
 */
export function generateOsirisHotspots(): OsirisHotspot[] {
  const hotspots: OsirisHotspot[] = [];

  for (const node of osirisBlockout.nodes) {
    if (!node.evidenceIds || node.evidenceIds.length === 0) continue;

    // Primary hotspot for the first evidence record on each node
    hotspots.push({
      id: `hotspot-${node.id}`,
      evidenceIds: node.evidenceIds,
      position: {
        x: node.position.x,
        y: node.position.y + node.size.y / 2 + 0.3, // above the object
        z: node.position.z,
      },
      radius: 1.0,
      priority: 5,
      title: node.name,
      description: '',
      imageIds: [],
      publicationIds: [],
      confidence: node.confidence ?? 80,
      objectId: node.objectId,
      label: node.name,
      layer: node.layer,
      pulse: true,
    });
  }

  return hotspots;
}

/**
 * Returns the count of unique evidence IDs referenced by hotspots.
 */
export function getUniqueEvidenceCount(hotspots: OsirisHotspot[]): number {
  const ids = new Set<string>();
  for (const h of hotspots) {
    for (const eid of h.evidenceIds) {
      ids.add(eid);
    }
  }
  return ids.size;
}

/**
 * Filters hotspots by layer.
 */
export function filterHotspotsByLayer(hotspots: OsirisHotspot[], layer: string): OsirisHotspot[] {
  return hotspots.filter((h) => h.layer === layer);
}

/**
 * Returns hotspots grouped by level.
 */
export function groupHotspotsByLevel(hotspots: OsirisHotspot[]): Record<string, OsirisHotspot[]> {
  const groups: Record<string, OsirisHotspot[]> = {};
  for (const h of hotspots) {
    if (!groups[h.layer]) groups[h.layer] = [];
    groups[h.layer].push(h);
  }
  return groups;
}
