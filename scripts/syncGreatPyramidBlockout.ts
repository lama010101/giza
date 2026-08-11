/**
 * Regenerate `database/blockouts/great-pyramid.ts` from the measurement-derived
 * LOD1 geometry so the LOD0 blockout stays synchronised with the constants and
 * derivation logic in `database/geometry/gp-lod1.ts`.
 *
 * Run with: npx tsx scripts/syncGreatPyramidBlockout.ts
 */

/* eslint-disable no-console */

import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { greatPyramidBlockout } from '../database/blockouts/great-pyramid';
import { generateGreatPyramidLOD1 } from '../database/geometry/gp-lod1';

const __filename = fileURLToPath(import.meta.url);
const outPath = join(dirname(__filename), '..', 'database', 'blockouts', 'great-pyramid.ts');

const metadataById = new Map(greatPyramidBlockout.nodes.map((n) => [n.id, n]));

const nodes = generateGreatPyramidLOD1().map((lod1) => {
  const meta = metadataById.get(lod1.id);
  const node: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(lod1)) {
    if (key === 'lod' || key === 'derivation') continue;
    node[key] = value;
  }
  if (meta?.materialId) {
    node.materialId = meta.materialId;
  }
  if (meta?.overlay) {
    node.overlay = meta.overlay;
  }
  return node;
});

const fileContent = `import type { Vector3 } from '@/schemas/location';

export interface BlockoutNode {
  id: string;
  name: string;
  position: Vector3;
  rotation?: Vector3;
  size: Vector3;
  objectId?: string;
  evidenceIds?: string[];
  sourceIds?: string[];
  layer: string;
  color: string;
  opacity?: number;
  overlay?: string;
  materialId?: string;
}

export interface Blockout {
  id: string;
  name: string;
  units: 'meters';
  nodes: BlockoutNode[];
}

export const greatPyramidBlockout: Blockout = {
  id: 'great-pyramid-blockout',
  name: 'Great Pyramid of Giza',
  units: 'meters',
  nodes: ${JSON.stringify(nodes, null, 2)},
};
`;

writeFileSync(outPath, fileContent);
console.log(`Wrote ${outPath}`);
