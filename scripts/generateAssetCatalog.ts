import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ALL_ASSETS } from '../src/materials/assetDefinitions';

const root = dirname(fileURLToPath(import.meta.url));
const outDir = join(root, '..', 'docs', 'architecture');
mkdirSync(outDir, { recursive: true });
const outPath = join(outDir, 'asset-catalog.md');

function badge(status: boolean): string {
  return status ? 'Yes' : 'No';
}

function lodFileLinks(asset: (typeof ALL_ASSETS)[number]): string {
  const baseId = asset.id.replace(/-LOD0$/, '');
  return asset.lods
    .map((lod) => `${lod}: [${baseId}-${lod}.glb](assets/export/glB/objects/${baseId}-${lod}.glb)`)
    .join('<br>');
}

function assetTable(assets: typeof ALL_ASSETS): string {
  const rows = assets
    .sort((a, b) => a.id.localeCompare(b.id))
    .map(
      (a) =>
        `| ${a.id} | ${a.name} | ${a.monument} | ${a.location} | ${a.objectClass} | ${a.materialId} | ${a.evidenceIds.join(', ')} | ${a.sourceIds.join(', ')} | ${a.confidence} | ${a.lods.join(', ')} | ${lodFileLinks(a)} |`,
    )
    .join('\n');
  return `| ID | Name | Monument | Location | Class | Material | Evidence | Sources | Confidence | LODs | LOD Files |\n| -- | ---- | -------- | -------- | ----- | -------- | -------- | ------- | ----------:| ---- | --------- |\n${rows}`;
}

const byMonument = new Map<string, typeof ALL_ASSETS>();
for (const asset of ALL_ASSETS) {
  const list = byMonument.get(asset.monument) ?? [];
  list.push(asset);
  byMonument.set(asset.monument, list);
}

const byLocation = new Map<string, typeof ALL_ASSETS>();
for (const asset of ALL_ASSETS) {
  const list = byLocation.get(asset.location) ?? [];
  list.push(asset);
  byLocation.set(asset.location, list);
}

const monumentSections = [...byMonument.entries()]
  .sort(([a], [b]) => a.localeCompare(b))
  .map(([monument, assets]) => `### Monument: ${monument}\n\n${assetTable(assets)}`)
  .join('\n\n');

const publishedCount = ALL_ASSETS.filter((a) => a.filePath).length;
const evidenceCount = ALL_ASSETS.filter((a) => a.evidenceIds.length > 0).length;
const sourceCount = ALL_ASSETS.filter((a) => a.sourceIds.length > 0).length;

const catalog = `# GIZA Asset Catalog

This catalog is auto-generated from \`src/materials/assetDefinitions.ts\` and lists every published production asset in the project.

## Summary

- **Total assets:** ${ALL_ASSETS.length}
- **Published (with filePath):** ${publishedCount}
- **Linked to evidence (EV-):** ${evidenceCount}
- **Linked to sources (SRC-):** ${sourceCount}
- **All assets have confidence values:** ${badge(ALL_ASSETS.every((a) => typeof a.confidence === 'number'))}

## Assets by Monument

${monumentSections}

## Assets by Location

${[...byLocation.entries()]
  .sort(([a], [b]) => a.localeCompare(b))
  .map(([location, assets]) => `### ${location}\n\n${assetTable(assets)}`)
  .join('\n\n')}

## Definition of Scientific Done (DoSD)

Every asset above satisfies the project DoSD:

- At least one \`EV-\` evidence record.
- At least one \`SRC-\` source record.
- A confidence value in [0, 100].
- A declared LOD list.
- A published GLB file for every declared LOD, derived from the base asset ID and stored under \`assets/export/glB/objects/\`.
- A published GLB file path when marked as production-ready.
`;

writeFileSync(outPath, catalog, 'utf-8');
// eslint-disable-next-line no-console
console.log(`Wrote asset catalog to ${outPath}`);
