import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { greatPyramidBlockout } from '../database/blockouts/great-pyramid';

const __filename = fileURLToPath(import.meta.url);
const outPath = join(
  dirname(__filename),
  '..',
  'src',
  'materials',
  'greatPyramidAssetDefinitions.ts',
);

const objectMap = new Map<
  string,
  {
    name: string;
    layer: string;
    materialId: string;
    evidenceIds: string[];
    sourceIds: string[];
  }
>();

for (const node of greatPyramidBlockout.nodes) {
  if (!node.objectId) continue;
  const existing = objectMap.get(node.objectId);
  if (!existing) {
    objectMap.set(node.objectId, {
      name: node.name,
      layer: node.layer,
      materialId: node.materialId ?? 'MAT_LocalLimestone',
      evidenceIds: [...(node.evidenceIds ?? [])],
      sourceIds: [...(node.sourceIds ?? [])],
    });
  } else {
    existing.evidenceIds = Array.from(
      new Set([...existing.evidenceIds, ...(node.evidenceIds ?? [])]),
    );
    existing.sourceIds = Array.from(new Set([...existing.sourceIds, ...(node.sourceIds ?? [])]));
  }
}

function objectClassForLayer(layer: string) {
  switch (layer) {
    case 'exterior':
    case 'kings-complex':
    case 'queens-complex':
    case 'gallery':
    case 'subterranean':
      return 'Hero';
    default:
      return 'Standard';
  }
}

function locationForLayer(layer: string) {
  switch (layer) {
    case 'exterior':
      return 'Exterior';
    case 'passages':
      return 'Passages';
    case 'kings-complex':
      return 'KingsComplex';
    case 'queens-complex':
      return 'QueensComplex';
    case 'gallery':
      return 'GrandGallery';
    case 'subterranean':
      return 'Subterranean';
    case 'relieving':
      return 'RelievingChambers';
    default:
      return 'Other';
  }
}

const lines: string[] = [];
lines.push("import type { AssetDefinition } from './assetDefinitions';");
lines.push('');
lines.push('/** Auto-generated from database/blockouts/great-pyramid.ts */');
lines.push('export const GREAT_PYRAMID_ASSETS: AssetDefinition[] = [');

for (const [objectId, data] of objectMap.entries()) {
  const id = `GP-${objectId}-LOD0`;
  const filePath = `assets/export/glB/objects/${id}.glb`;
  lines.push('  {');
  lines.push(`    id: '${id}',`);
  lines.push(`    name: '${data.name.replace(/'/g, "\\'")}',`);
  lines.push("    monument: 'GP',");
  lines.push(`    location: '${locationForLayer(data.layer)}',`);
  lines.push(`    objectClass: '${objectClassForLayer(data.layer)}',`);
  lines.push(`    materialId: '${data.materialId}',`);
  lines.push(`    evidenceIds: [${data.evidenceIds.map((e) => `'${e}'`).join(', ')}],`);
  lines.push(`    sourceIds: [${data.sourceIds.map((s) => `'${s}'`).join(', ')}],`);
  lines.push('    confidence: 95,');
  lines.push("    lods: ['LOD0', 'LOD1'],");
  lines.push(`    filePath: '${filePath}',`);
  lines.push('  },');
}

lines.push('];');
lines.push('');
lines.push('export function getGreatPyramidAssets(): AssetDefinition[] {');
lines.push('  return [...GREAT_PYRAMID_ASSETS];');
lines.push('}');
lines.push('');

writeFileSync(outPath, lines.join('\n'), 'utf-8');
// eslint-disable-next-line no-console
console.log(`Generated ${outPath} with ${objectMap.size} GP assets`);
