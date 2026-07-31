/**
 * Evidence import/export workflows per M02-T12 and M02-T13.
 *
 * Export formats: JSON, CSV, BibTeX, RIS, GraphML
 * Import formats: JSON, CSV, BibTeX, RIS
 *
 * All imports validate against EvidenceSchema before insertion.
 */

import type { Evidence } from '@/schemas/evidence';
import type { Source } from '@/schemas/source';
import { EvidenceSchema } from '@/schemas/evidence';

// ─── Export ───────────────────────────────────────────────────────────────

/**
 * Exports evidence records as JSON.
 */
export function exportToJSON(evidence: Evidence[]): string {
  return JSON.stringify(evidence, null, 2);
}

/**
 * Exports evidence records as CSV.
 */
export function exportToCSV(evidence: Evidence[]): string {
  const headers = [
    'id',
    'title',
    'description',
    'category',
    'primaryClass',
    'confidence',
    'status',
    'version',
    'created',
    'updated',
    'sourceIds',
    'objectIds',
    'locationId',
    'tags',
  ];

  const rows = evidence.map((e) => [
    e.id,
    escapeCSV(e.title),
    escapeCSV(e.description),
    e.category,
    e.primaryClass,
    String(e.confidence),
    e.status,
    String(e.version),
    e.created,
    e.updated,
    e.sourceIds.join(';'),
    e.objectIds.join(';'),
    e.locationId ?? '',
    e.tags.join(';'),
  ]);

  return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
}

/**
 * Exports sources as BibTeX.
 */
export function exportToBibTeX(sources: Source[]): string {
  return sources.map((s) => sourceToBibTeX(s)).join('\n\n');
}

function sourceToBibTeX(source: Source): string {
  const type = bibTeXType(source.type);
  const key = generateBibTeXKey(source);
  const fields: string[] = [];

  fields.push(`  title = {${source.title}}`);

  if (source.authors.length > 0) {
    fields.push(`  author = {${source.authors.map((a) => a.name).join(' and ')}}`);
  }

  if (source.year) {
    fields.push(`  year = {${source.year}}`);
  }

  if (source.publication) {
    fields.push(`  journal = {${source.publication}}`);
  }

  if (source.doi) {
    fields.push(`  doi = {${source.doi}}`);
  }

  if (source.url) {
    fields.push(`  url = {${source.url}}`);
  }

  return `@${type}{${key},\n${fields.join(',\n')}\n}`;
}

function bibTeXType(sourceType: string): string {
  const map: Record<string, string> = {
    'Journal Article': 'article',
    Book: 'book',
    'Book Chapter': 'incollection',
    'Conference Paper': 'inproceedings',
    'Archaeological Report': 'techreport',
    Survey: 'techreport',
    Thesis: 'phdthesis',
    Website: 'misc',
  };
  return map[sourceType] ?? 'misc';
}

function generateBibTeXKey(source: Source): string {
  const firstAuthor = source.authors[0];
  const lastName = firstAuthor ? (firstAuthor.name.split(' ').pop() ?? 'unknown') : 'unknown';
  const year = source.year ?? '0000';
  const firstWord = source.title.split(' ')[0]?.toLowerCase() ?? 'untitled';
  return `${lastName}${year}${firstWord}`;
}

/**
 * Exports sources as RIS format.
 */
export function exportToRIS(sources: Source[]): string {
  return sources.map((s) => sourceToRIS(s)).join('\n');
}

function sourceToRIS(source: Source): string {
  const lines: string[] = [];
  const risType = risTypeMap(source.type);

  lines.push(`TY  - ${risType}`);

  for (const author of source.authors) {
    lines.push(`AU  - ${author.name}`);
  }

  lines.push(`TI  - ${source.title}`);

  if (source.year) {
    lines.push(`PY  - ${source.year}`);
  }

  if (source.publication) {
    lines.push(`JO  - ${source.publication}`);
  }

  if (source.doi) {
    lines.push(`DO  - ${source.doi}`);
  }

  if (source.url) {
    lines.push(`UR  - ${source.url}`);
  }

  lines.push('ER  - ');
  return lines.join('\n');
}

function risTypeMap(sourceType: string): string {
  const map: Record<string, string> = {
    'Journal Article': 'JOUR',
    Book: 'BOOK',
    'Book Chapter': 'CHAP',
    'Conference Paper': 'CONF',
    'Archaeological Report': 'RPRT',
    Survey: 'RPRT',
    Thesis: 'THES',
    Website: 'ELEC',
  };
  return map[sourceType] ?? 'GEN';
}

/**
 * Exports dependency graph as GraphML (XML format).
 */
export function exportToGraphML(
  evidence: Evidence[],
  edges: { from: string; to: string; relation: string }[],
): string {
  const nodes = evidence
    .map((e) => `    <node id="${e.id}"><data key="title">${escapeXML(e.title)}</data></node>`)
    .join('\n');

  const edgeElements = edges
    .map(
      (e, i) =>
        `    <edge id="e${i}" source="${e.from}" target="${e.to}"><data key="relation">${e.relation}</data></edge>`,
    )
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<graphml xmlns="http://graphml.graphdrawing.org/xmlns">
  <key id="title" for="node" attr.name="title" attr.type="string"/>
  <key id="relation" for="edge" attr.name="relation" attr.type="string"/>
  <graph edgedefault="directed">
${nodes}
${edgeElements}
  </graph>
</graphml>`;
}

// ─── Import ───────────────────────────────────────────────────────────────

export interface ImportResult {
  success: boolean;
  imported: Evidence[];
  errors: string[];
}

/**
 * Imports evidence records from JSON.
 */
export function importFromJSON(json: string): ImportResult {
  const errors: string[] = [];
  const imported: Evidence[] = [];

  try {
    const data: unknown = JSON.parse(json);
    const records: unknown[] = Array.isArray(data) ? data : [data];

    for (const record of records) {
      const parsed = EvidenceSchema.safeParse(record);
      if (parsed.success) {
        imported.push(parsed.data);
      } else {
        errors.push(
          `Failed to validate ${record.id ?? 'unknown'}: ${parsed.error.issues[0]?.message ?? 'validation error'}`,
        );
      }
    }
  } catch (e) {
    errors.push(`JSON parse error: ${(e as Error).message}`);
  }

  return { success: errors.length === 0, imported, errors };
}

/**
 * Imports evidence records from CSV.
 */
export function importFromCSV(csv: string): ImportResult {
  const errors: string[] = [];
  const imported: Evidence[] = [];

  try {
    const lines = csv.split('\n').filter((l) => l.trim().length > 0);
    if (lines.length < 2) {
      return {
        success: false,
        imported: [],
        errors: ['CSV must have a header row and at least one data row'],
      };
    }

    const headers = parseCSVLine(lines[0]);

    for (let i = 1; i < lines.length; i++) {
      const values = parseCSVLine(lines[i]);
      const record: Record<string, unknown> = {};

      for (let j = 0; j < headers.length; j++) {
        const key = headers[j];
        let value: unknown = values[j] ?? '';

        // Parse semicolon-separated arrays
        if (key === 'sourceIds' || key === 'objectIds' || key === 'tags') {
          value = (value as string).split(';').filter((v) => v.length > 0);
        }

        // Parse numbers
        if (key === 'confidence' || key === 'version') {
          value = Number(value);
        }

        record[key] = value;
      }

      const parsed = EvidenceSchema.safeParse(record);
      if (parsed.success) {
        imported.push(parsed.data);
      } else {
        errors.push(`Row ${i + 1}: ${parsed.error.issues[0]?.message ?? 'validation error'}`);
      }
    }
  } catch (e) {
    errors.push(`CSV parse error: ${(e as Error).message}`);
  }

  return { success: errors.length === 0, imported, errors };
}

// ─── Helpers ──────────────────────────────────────────────────────────────

function escapeCSV(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (inQuotes) {
      if (char === '"') {
        if (line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        current += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === ',') {
        result.push(current);
        current = '';
      } else {
        current += char;
      }
    }
  }
  result.push(current);
  return result;
}

function escapeXML(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Generates a CITATION.cff file content for the project.
 */
export function generateCitationCFF(sources: Source[]): string {
  const preferred = sources.find((s) => s.type === 'Archaeological Report') ?? sources[0];
  if (!preferred) return '';

  return `cff-version: 1.2.0
title: "GIZA — Archaeological Visualization"
type: software
authors:
  - name: "${preferred.authors[0]?.name ?? 'GIZA Team'}"
date-released: "${new Date().toISOString().split('T')[0]}"
preferred-citation:
  type: ${preferred.type.toLowerCase().replace(/\s+/g, '-')}
  title: "${preferred.title}"
  year: ${preferred.year ?? new Date().getFullYear()}
`;
}
