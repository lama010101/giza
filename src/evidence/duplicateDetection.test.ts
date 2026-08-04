import { describe, it, expect } from 'vitest';
import { findDuplicateSources, compareSources, clusterDuplicates } from './duplicateDetection';
import type { Source } from '@/schemas/source';

function makeSource(overrides: Partial<Source> = {}): Source {
  return {
    id: 'SRC-0001',
    type: 'Journal',
    title: 'The Osiris Shaft: A Reassessment',
    authors: [{ name: 'Jane Doe', orcid: '0000-0000-0000-0000' }],
    year: 2020,
    publication: 'Journal of Egyptian Archaeology',
    doi: '10.1234/example',
    url: 'https://example.com',
    reliability: 90,
    license: 'CC-BY',
    ...overrides,
  } as unknown as Source;
}

describe('Duplicate Detection (M03-T06)', () => {
  describe('compareSources', () => {
    it('detects DOI match', () => {
      const a = makeSource({ id: 'SRC-0001', doi: '10.1234/test' });
      const b = makeSource({ id: 'SRC-0002', doi: '10.1234/test' });
      const match = compareSources(a, b);
      expect(match).not.toBeNull();
      expect(match?.matchType).toBe('doi');
      expect(match?.similarity).toBe(1.0);
    });

    it('detects ISBN match', () => {
      const a = makeSource({ id: 'SRC-0001', isbn: '9783161484100', doi: undefined });
      const b = makeSource({ id: 'SRC-0002', isbn: '9783161484100', doi: undefined });
      const match = compareSources(a, b);
      expect(match).not.toBeNull();
      expect(match?.matchType).toBe('isbn');
    });

    it('detects title similarity match', () => {
      const a = makeSource({ id: 'SRC-0001', title: 'The Osiris Shaft', doi: undefined });
      const b = makeSource({ id: 'SRC-0002', title: 'The Osiris Shaft', doi: undefined });
      const match = compareSources(a, b);
      expect(match).not.toBeNull();
      expect(match?.matchType).toBe('title');
    });

    it('detects near-matching titles', () => {
      const a = makeSource({ id: 'SRC-0001', title: 'The Great Pyramid of Giza', doi: undefined });
      const b = makeSource({ id: 'SRC-0002', title: 'The Great Pyramid of Giza!', doi: undefined });
      const match = compareSources(a, b);
      expect(match).not.toBeNull();
      expect(match?.matchType).toBe('title');
    });

    it('detects author-year match', () => {
      const a = makeSource({
        id: 'SRC-0001',
        title: 'Osiris Shaft Study',
        doi: undefined,
        year: 2020,
      });
      const b = makeSource({
        id: 'SRC-0002',
        title: 'Osiris Shaft Research',
        doi: undefined,
        year: 2020,
      });
      const match = compareSources(a, b);
      expect(match).not.toBeNull();
      expect(match?.matchType).toBe('author-year');
    });

    it('returns null for non-duplicates', () => {
      const a = makeSource({
        id: 'SRC-0001',
        title: 'Completely Different Topic',
        doi: '10.1/a',
        authors: [{ name: 'John Smith' }],
        year: 2019,
      });
      const b = makeSource({
        id: 'SRC-0002',
        title: 'Another Unrelated Paper',
        doi: '10.2/b',
        authors: [{ name: 'Alice Jones' }],
        year: 2021,
      });
      const match = compareSources(a, b);
      expect(match).toBeNull();
    });
  });

  describe('findDuplicateSources', () => {
    it('finds all duplicate pairs in a list', () => {
      const sources = [
        makeSource({ id: 'SRC-0001', doi: '10.1/test', title: 'Paper A' }),
        makeSource({ id: 'SRC-0002', doi: '10.1/test', title: 'Paper A Reprint' }),
        makeSource({ id: 'SRC-0003', doi: '10.2/other', title: 'Completely Different Paper' }),
      ];
      const matches = findDuplicateSources(sources);
      expect(matches).toHaveLength(1);
      expect(matches[0].source1.id).toBe('SRC-0001');
      expect(matches[0].source2.id).toBe('SRC-0002');
    });

    it('returns empty for no duplicates', () => {
      const sources = [
        makeSource({
          id: 'SRC-0001',
          doi: '10.1/a',
          title: 'The Great Pyramid Construction Methods',
          authors: [{ name: 'John Smith' }],
          year: 2019,
        }),
        makeSource({
          id: 'SRC-0002',
          doi: '10.2/b',
          title: 'Osiris Shaft Hydrology Analysis',
          authors: [{ name: 'Alice Jones' }],
          year: 2021,
        }),
      ];
      const matches = findDuplicateSources(sources);
      expect(matches).toHaveLength(0);
    });
  });

  describe('clusterDuplicates', () => {
    it('groups duplicates into clusters', () => {
      const sources = [
        makeSource({ id: 'SRC-0001', doi: '10.1/test', title: 'Paper A' }),
        makeSource({ id: 'SRC-0002', doi: '10.1/test', title: 'Paper A Reprint' }),
        makeSource({ id: 'SRC-0003', doi: '10.1/test', title: 'Paper A Reissue' }),
      ];
      const matches = findDuplicateSources(sources);
      const clusters = clusterDuplicates(matches);
      expect(clusters).toHaveLength(1);
      expect(clusters[0].length).toBe(3);
    });

    it('separates non-overlapping duplicates', () => {
      const sources = [
        makeSource({
          id: 'SRC-0001',
          doi: '10.1/a',
          title: 'The Great Pyramid Construction',
          authors: [{ name: 'John Smith' }],
        }),
        makeSource({
          id: 'SRC-0002',
          doi: '10.1/a',
          title: 'The Great Pyramid Construction Methods',
          authors: [{ name: 'John Smith' }],
        }),
        makeSource({
          id: 'SRC-0003',
          doi: '10.2/b',
          title: 'Osiris Shaft Hydrology',
          authors: [{ name: 'Alice Jones' }],
        }),
        makeSource({
          id: 'SRC-0004',
          doi: '10.2/b',
          title: 'Osiris Shaft Hydrology Analysis',
          authors: [{ name: 'Alice Jones' }],
        }),
      ];
      const matches = findDuplicateSources(sources);
      const clusters = clusterDuplicates(matches);
      expect(clusters).toHaveLength(2);
    });
  });
});
