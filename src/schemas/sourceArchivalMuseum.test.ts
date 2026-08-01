import { describe, it, expect } from 'vitest';
import {
  SourceSchema,
  hasArchivalInfo,
  getWaybackUrl,
  markAsArchived,
  hasMuseumAccession,
  formatAccessionNumber,
  createMuseumSource,
  type Source,
} from '@/schemas/source';

function makeSource(overrides: Partial<Source> = {}): Source {
  return {
    id: 'SRC-0001',
    authors: [{ name: 'Test Author' }],
    title: 'Test Source',
    type: 'Archaeological Report',
    ...overrides,
  } as Source;
}

describe('Archival fields (M03-T08)', () => {
  it('accepts archivalUrl and archiveDate in schema', () => {
    const source = SourceSchema.parse({
      id: 'SRC-0001',
      title: 'Test',
      type: 'Book',
      archivalUrl: 'https://web.archive.org/web/2024/https://example.com',
      archiveDate: '2024-01-15',
      archivedBy: 'Wayback Machine',
    });
    expect(source.archivalUrl).toContain('web.archive.org');
    expect(source.archiveDate).toBe('2024-01-15');
  });

  it('hasArchivalInfo returns true when archivalUrl is set', () => {
    const source = makeSource({ archivalUrl: 'https://archive.org/test' });
    expect(hasArchivalInfo(source)).toBe(true);
  });

  it('hasArchivalInfo returns false when no archival fields', () => {
    const source = makeSource();
    expect(hasArchivalInfo(source)).toBe(false);
  });

  it('getWaybackUrl constructs a valid Wayback URL', () => {
    const url = getWaybackUrl('https://example.com/page', '20240115');
    expect(url).toBe('https://web.archive.org/web/20240115/https://example.com/page');
  });

  it('getWaybackUrl works without timestamp', () => {
    const url = getWaybackUrl('https://example.com/page');
    expect(url).toBe('https://web.archive.org/web//https://example.com/page');
  });

  it('markAsArchived adds archival metadata', () => {
    const source = makeSource();
    const archived = markAsArchived(source, 'https://archive.org/test', 'Bot');
    expect(archived.archivalUrl).toBe('https://archive.org/test');
    expect(archived.archivedBy).toBe('Bot');
    expect(archived.archiveDate).toBeDefined();
  });
});

describe('Museum accession fields (M03-T09)', () => {
  it('accepts museumAccession and collection in schema', () => {
    const source = SourceSchema.parse({
      id: 'SRC-0002',
      title: 'Granite Block Fragment',
      type: 'Museum',
      museumAccession: '1923.456',
      collection: 'Egyptian Antiquities',
      collectionId: 'COL-001',
      provenance: 'Giza Plateau',
      acquisitionDate: '1923-06-15',
    });
    expect(source.museumAccession).toBe('1923.456');
    expect(source.collection).toBe('Egyptian Antiquities');
  });

  it('hasMuseumAccession returns true when museumAccession is set', () => {
    const source = makeSource({ museumAccession: '1923.456' });
    expect(hasMuseumAccession(source)).toBe(true);
  });

  it('hasMuseumAccession returns true when collection is set', () => {
    const source = makeSource({ collection: 'Egyptian' });
    expect(hasMuseumAccession(source)).toBe(true);
  });

  it('hasMuseumAccession returns false when no museum fields', () => {
    const source = makeSource();
    expect(hasMuseumAccession(source)).toBe(false);
  });

  it('formatAccessionNumber normalizes separators', () => {
    expect(formatAccessionNumber('1923 456')).toBe('1923.456');
    expect(formatAccessionNumber('  1923.456  ')).toBe('1923.456');
  });

  it('createMuseumSource creates a valid museum source', () => {
    const source = createMuseumSource('SRC-0003', 'Stela Fragment', '1923 456', 'Egyptian');
    expect(source.type).toBe('Museum');
    expect(source.museumAccession).toBe('1923.456');
    expect(source.collection).toBe('Egyptian');
  });
});
