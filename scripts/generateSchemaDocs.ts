import { zodToJsonSchema } from 'zod-to-json-schema';
import schemaToMarkdown from 'json-schema-to-markdown';
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { z } from 'zod';

// Import the entity registry from the source schemas.
import { ENTITY_SCHEMAS } from '../src/schemas/index';

const __dirname = dirname(fileURLToPath(import.meta.url));
const outDir = join(__dirname, '..', 'docs', 'schema');

function sanitizeFilename(name: string): string {
  return name.replace(/[^a-z0-9-]/gi, '-').toLowerCase();
}

function kindToTitle(kind: string): string {
  return kind
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (str) => str.toUpperCase())
    .trim();
}

async function main(): Promise<void> {
  await mkdir(outDir, { recursive: true });

  const header = [
    '# Schema Reference',
    '',
    'Auto-generated from Zod schemas in `src/schemas/`.',
    '',
  ].join('\n');
  const indexEntries: string[] = [header];

  const entries = Object.entries(ENTITY_SCHEMAS) as [string, z.ZodType][];
  for (const [kind, schema] of entries) {
    const jsonSchema = zodToJsonSchema(schema, { target: 'jsonSchema7' });
    jsonSchema.title = `${kindToTitle(kind)} Schema`;

    const markdown = schemaToMarkdown(jsonSchema, '');
    const filename = `${sanitizeFilename(kind)}.md`;
    const filePath = join(outDir, filename);

    await writeFile(filePath, `${markdown}\n`, 'utf-8');
    indexEntries.push(`- [${kindToTitle(kind)}](${filename})`);
  }

  await writeFile(join(outDir, 'index.md'), indexEntries.join('\n') + '\n', 'utf-8');
  // eslint-disable-next-line no-console
  console.log(`Generated ${entries.length} schema markdown files in ${outDir}`);
}

main().catch((error: Error) => {
  console.error('Schema docs generation failed:', error.message);
  process.exit(1);
});
