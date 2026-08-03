/* eslint-disable no-console */
// Regenerates docs/architecture/geometry-dump.json from the live TypeScript sources.
// Usage: npx tsx scripts/generate-geometry-dump.ts
//
// Imports the LOD0 blockout, the LOD1 generator, and the Osiris blockout,
// then serialises them to JSON. Floating-point values are rounded to 6 decimal
// places to eliminate IEEE 754 artifacts (e.g. 39.290000000000006 → 39.29).

import { greatPyramidBlockout } from '@db/blockouts/great-pyramid';
import { generateGreatPyramidLOD1 } from '@db/geometry/gp-lod1';
import { osirisBlockout } from '@db/blockouts/osiris-shaft';
import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

/** Round to 6 decimal places to clean IEEE 754 artifacts. */
function round6(n: number): number {
  return Math.round(n * 1e6) / 1e6;
}

/** Recursively round all numeric values in a plain object/array. */
function sanitize<T>(value: T): T {
  if (typeof value === 'number') return round6(value) as unknown as T;
  if (Array.isArray(value)) return value.map(sanitize) as unknown as T;
  if (value && typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value)) out[k] = sanitize(v);
    return out as unknown as T;
  }
  return value;
}

const dump = {
  greatPyramidLOD0: greatPyramidBlockout,
  greatPyramidLOD1: {
    id: 'great-pyramid-lod1',
    name: 'Great Pyramid LOD1',
    units: 'meters' as const,
    nodes: generateGreatPyramidLOD1(),
  },
  osiris: osirisBlockout,
};

const sanitized = sanitize(dump);

const outPath = resolve(import.meta.dirname, '..', 'docs', 'architecture', 'geometry-dump.json');
writeFileSync(outPath, JSON.stringify(sanitized, null, 2) + '\n', 'utf-8');
console.log(`Wrote ${outPath}`);
console.log(`  LOD0 nodes: ${dump.greatPyramidLOD0.nodes.length}`);
console.log(`  LOD1 nodes: ${dump.greatPyramidLOD1.nodes.length}`);
console.log(`  Osiris nodes: ${dump.osiris.nodes.length}`);
