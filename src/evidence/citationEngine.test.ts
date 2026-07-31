import { describe, it, expect } from 'vitest';
import {
  formatCitation,
  formatBibliography,
  bibtexKey,
  ALL_CITATION_STYLES,
} from './citationEngine';
import type { Source } from '@/schemas/source';
import { SourceSchema } from '@/schemas/source';

const validSource: Source = SourceSchema.parse({
  id: 'SRC-0001',
  authors: [{ name: 'Jane Doe' }, { name: 'John Smith' }],
  title: 'The Pyramids of Giza',
  publication: 'Journal of Egyptian Archaeology',
  year: 2020,
  type: 'Journal',
  reliability: 90,
  doi: '10.1234/test',
});

const singleAuthor: Source = SourceSchema.parse({
  id: 'SRC-0002',
  authors: [{ name: 'Zahi Hawass' }],
  title: 'The Discovery of the Osiris Shaft',
  publication: 'Archaeology Today',
  year: 2007,
  type: 'Book',
  reliability: 95,
});

describe('Citation Engine', () => {
  it('supports all 11 citation styles', () => {
    expect(ALL_CITATION_STYLES).toHaveLength(11);
    expect(ALL_CITATION_STYLES).toContain('APA');
    expect(ALL_CITATION_STYLES).toContain('Chicago');
    expect(ALL_CITATION_STYLES).toContain('Harvard');
    expect(ALL_CITATION_STYLES).toContain('IEEE');
    expect(ALL_CITATION_STYLES).toContain('MLA');
    expect(ALL_CITATION_STYLES).toContain('Turabian');
    expect(ALL_CITATION_STYLES).toContain('SAA');
    expect(ALL_CITATION_STYLES).toContain('ChicagoNB');
    expect(ALL_CITATION_STYLES).toContain('ChicagoAD');
    expect(ALL_CITATION_STYLES).toContain('BibTeX');
    expect(ALL_CITATION_STYLES).toContain('RIS');
  });

  it('formats APA correctly', () => {
    const result = formatCitation(validSource, 'APA');
    expect(result).toContain('Doe, J.');
    expect(result).toContain('(2020)');
    expect(result).toContain('The Pyramids of Giza');
    expect(result).toContain('https://doi.org/10.1234/test');
  });

  it('formats Chicago correctly', () => {
    const result = formatCitation(validSource, 'Chicago');
    expect(result).toContain('Doe, J.');
    expect(result).toContain('2020');
    expect(result).toContain('The Pyramids of Giza');
  });

  it('formats Harvard correctly', () => {
    const result = formatCitation(validSource, 'Harvard');
    expect(result).toContain('Doe, J.');
    expect(result).toContain('2020');
  });

  it('formats IEEE correctly', () => {
    const result = formatCitation(validSource, 'IEEE');
    expect(result).toContain('J. Doe');
    expect(result).toContain('2020');
  });

  it('formats MLA correctly', () => {
    const result = formatCitation(singleAuthor, 'MLA');
    expect(result).toContain('Hawass, Zahi');
    expect(result).toContain('2007');
  });

  it('formats Turabian correctly', () => {
    const result = formatCitation(validSource, 'Turabian');
    expect(result).toContain('Doe, J.');
    expect(result).toContain('2020');
  });

  it('formats SAA correctly', () => {
    const result = formatCitation(validSource, 'SAA');
    expect(result).toContain('Doe, J.');
    expect(result).toContain('2020');
  });

  it('formats ChicagoNB correctly', () => {
    const result = formatCitation(validSource, 'ChicagoNB');
    expect(result).toContain('Doe, J.');
    expect(result).toContain('2020');
  });

  it('formats ChicagoAD correctly', () => {
    const result = formatCitation(validSource, 'ChicagoAD');
    expect(result).toContain('Doe, J.');
    expect(result).toContain('2020');
  });

  it('formats BibTeX correctly', () => {
    const result = formatCitation(validSource, 'BibTeX');
    expect(result).toContain('@article{src0001');
    expect(result).toContain('title = {The Pyramids of Giza}');
    expect(result).toContain('author = {Jane Doe and John Smith}');
    expect(result).toContain('year = {2020}');
    expect(result).toContain('doi = {10.1234/test}');
  });

  it('formats RIS correctly', () => {
    const result = formatCitation(validSource, 'RIS');
    expect(result).toContain('TY  - GEN');
    expect(result).toContain('TI  - The Pyramids of Giza');
    expect(result).toContain('AU  - Jane Doe');
    expect(result).toContain('PY  - 2020');
    expect(result).toContain('DO  - 10.1234/test');
    expect(result).toContain('ER  - ');
  });

  it('generates BibTeX key from SRC ID', () => {
    expect(bibtexKey(validSource)).toBe('src0001');
  });

  it('formats a bibliography with multiple sources', () => {
    const result = formatBibliography([validSource, singleAuthor], 'APA');
    expect(result).toContain('The Pyramids of Giza');
    expect(result).toContain('The Discovery of the Osiris Shaft');
  });

  it('throws on unknown citation style', () => {
    expect(() => formatCitation(validSource, 'Unknown' as never)).toThrow(/Unknown citation style/);
  });

  it('handles sources without DOI or URL', () => {
    const noDoi = SourceSchema.parse({
      id: 'SRC-0003',
      authors: [{ name: 'Test Author' }],
      title: 'Test Title',
      type: 'Book',
      reliability: 80,
    });
    const apa = formatCitation(noDoi, 'APA');
    expect(apa).toContain('Test Title');
    expect(apa).not.toContain('doi.org');
  });
});
