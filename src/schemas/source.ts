import { z } from 'zod';
import { SourceId } from './identifiers';
import { AuthorSchema } from './person';

export const SourceType = z.enum([
  'Book',
  'Journal',
  'Conference',
  'Survey',
  'Archaeological Report',
  'Museum',
  'Government',
  'Video',
  'Photograph',
  'Personal Communication',
]);

export type SourceType = z.infer<typeof SourceType>;

export const SourceSchema = z.object({
  id: SourceId,
  authors: z.array(AuthorSchema).default([]),
  title: z.string().min(1),
  publication: z.string().optional(),
  year: z.number().int().optional(),
  doi: z.string().optional(),
  isbn: z.string().optional(),
  url: z.string().url().optional(),
  license: z.string().optional(),
  type: SourceType,
  reliability: z.number().int().min(0).max(100).optional(),
  // Archival fields (M03-T08)
  archivalUrl: z.string().url().optional(),
  archiveDate: z.string().optional(),
  archivedBy: z.string().optional(),
  // Museum accession fields (M03-T09)
  museumAccession: z.string().optional(),
  collection: z.string().optional(),
  collectionId: z.string().optional(),
  provenance: z.string().optional(),
  acquisitionDate: z.string().optional(),
});

export type Source = z.infer<typeof SourceSchema>;

// ─── Archival helpers (M03-T08) ──────────────────────────────────────────────

/**
 * Checks whether a source has archival metadata.
 */
export function hasArchivalInfo(source: Source): boolean {
  return source.archivalUrl !== undefined || source.archiveDate !== undefined;
}

/**
 * Returns a web archive (Wayback Machine) URL for a source's original URL.
 */
export function getWaybackUrl(url: string, timestamp?: string): string {
  const ts = timestamp ?? '';
  return `https://web.archive.org/web/${ts}/${url}`;
}

/**
 * Marks a source as archived by adding archival metadata.
 */
export function markAsArchived(
  source: Source,
  archivalUrl: string,
  archivedBy: string,
  archiveDate?: string,
): Source {
  return {
    ...source,
    archivalUrl,
    archivedBy,
    archiveDate: archiveDate ?? new Date().toISOString(),
  };
}

// ─── Museum accession helpers (M03-T09) ──────────────────────────────────────

/**
 * Checks whether a source is a museum record with accession metadata.
 */
export function hasMuseumAccession(source: Source): boolean {
  return source.museumAccession !== undefined || source.collection !== undefined;
}

/**
 * Formats a museum accession number for display.
 * Accession numbers typically follow the format: YYYY.NNNN or YYYY.NNNN.NNNN
 */
export function formatAccessionNumber(accession: string): string {
  // Normalize whitespace and separators
  return accession.replace(/\s+/g, '.').replace(/^\.+|\.+$/g, '');
}

/**
 * Creates a museum source with accession metadata.
 */
export function createMuseumSource(
  id: string,
  title: string,
  museumAccession: string,
  collection: string,
  overrides: Partial<Source> = {},
): Source {
  return {
    id: id,
    authors: [],
    title,
    type: 'Museum',
    museumAccession: formatAccessionNumber(museumAccession),
    collection,
    ...overrides,
  };
}
