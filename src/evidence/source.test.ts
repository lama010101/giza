import { describe, it, expect, beforeEach } from 'vitest';
import { SourceStore, type CreateSourceInput } from './SourceStore';
import { formatAPA, formatAPACitation } from './apa';
import type { Source } from '@/schemas/source';

function makeSource(overrides: Partial<Source> = {}): Source {
  return {
    id: 'SRC-0001',
    authors: [{ name: 'Zahi Hawass' }],
    title: 'The Discovery of the Osiris Shaft at Giza',
    type: 'Archaeological Report',
    reliability: 95,
    year: 2007,
    ...overrides,
  } as Source;
}

describe('SourceStore CRUD', () => {
  let store: SourceStore;

  beforeEach(() => {
    store = new SourceStore([]);
  });

  it('creates a source with auto-generated ID', () => {
    const input: CreateSourceInput = {
      authors: [{ name: 'Jane Doe' }],
      title: 'A New Survey',
      type: 'Survey',
      reliability: 80,
      year: 2020,
    };

    const src = store.create(input);

    expect(src.id).toMatch(/^SRC-\d{4}$/);
    expect(src.title).toBe('A New Survey');
    expect(src.authors[0].name).toBe('Jane Doe');
  });

  it('updates source fields', () => {
    const src = store.create({
      authors: [{ name: 'Jane Doe' }],
      title: 'Original Title',
      type: 'Book',
    });

    const updated = store.update(src.id, { title: 'Updated Title', year: 2021 });

    expect(updated?.title).toBe('Updated Title');
    expect(updated?.year).toBe(2021);
  });

  it('deletes a source', () => {
    const src = store.create({
      authors: [{ name: 'Jane Doe' }],
      title: 'To Delete',
      type: 'Book',
    });

    expect(store.delete(src.id)).toBe(true);
    expect(store.getById(src.id)).toBeUndefined();
  });

  it('returns false when deleting unknown ID', () => {
    expect(store.delete('SRC-9999')).toBe(false);
  });

  it('returns undefined when updating unknown ID', () => {
    expect(store.update('SRC-9999', { title: 'Nope' })).toBeUndefined();
  });

  it('searches sources by title', () => {
    store.create({ authors: [{ name: 'A' }], title: 'Pyramid Studies', type: 'Book' });
    store.create({ authors: [{ name: 'B' }], title: 'Osiris Shaft', type: 'Survey' });

    const results = store.search('pyramid');
    expect(results.length).toBe(1);
    expect(results[0].title).toBe('Pyramid Studies');
  });

  it('searches sources by author name', () => {
    store.create({ authors: [{ name: 'Zahi Hawass' }], title: 'Book A', type: 'Book' });
    store.create({ authors: [{ name: 'Someone Else' }], title: 'Book B', type: 'Book' });

    const results = store.search('hawass');
    expect(results.length).toBe(1);
    expect(results[0].authors[0].name).toBe('Zahi Hawass');
  });
});

describe('APA Citation Formatter', () => {
  it('formats a single-author source', () => {
    const src = makeSource();
    const citation = formatAPA(src);

    expect(citation).toContain('Hawass, Z.');
    expect(citation).toContain('(2007)');
    expect(citation).toContain('The Discovery of the Osiris Shaft at Giza');
    expect(citation.endsWith('.')).toBe(true);
  });

  it('formats a two-author source with &', () => {
    const src = makeSource({
      authors: [{ name: 'John Smith' }, { name: 'Jane Doe' }],
    });
    const citation = formatAPA(src);

    expect(citation).toContain('Smith, J.');
    expect(citation).toContain('Doe, J.');
    expect(citation).toContain('&');
  });

  it('formats a three-author source with commas and &', () => {
    const src = makeSource({
      authors: [{ name: 'Alpha Beta' }, { name: 'Gamma Delta' }, { name: 'Epsilon Zeta' }],
    });
    const citation = formatAPA(src);

    expect(citation).toContain('Beta, A.');
    expect(citation).toContain('Delta, G.');
    expect(citation).toContain('Zeta, E.');
    expect(citation).toContain('& Zeta, E.');
  });

  it('uses (n.d.) when year is missing', () => {
    const src = makeSource({ year: undefined });
    const citation = formatAPA(src);

    expect(citation).toContain('(n.d.)');
  });

  it('includes DOI link when present', () => {
    const src = makeSource({ doi: '10.1234/test' });
    const citation = formatAPA(src);

    expect(citation).toContain('https://doi.org/10.1234/test');
  });

  it('includes URL when no DOI', () => {
    const src = makeSource({
      doi: undefined,
      url: 'https://example.com/paper',
    });
    const citation = formatAPA(src);

    expect(citation).toContain('https://example.com/paper');
  });

  it('formats in-text citation with author and year', () => {
    const src = makeSource();
    const citation = formatAPACitation(src);

    expect(citation).toBe('(Hawass, Z., 2007)');
  });

  it('formats in-text citation with n.d. when no year', () => {
    const src = makeSource({ year: undefined });
    const citation = formatAPACitation(src);

    expect(citation).toContain('n.d.');
  });

  it('italicizes journal publication name', () => {
    const src = makeSource({
      type: 'Journal',
      publication: 'Journal of Egyptian Archaeology',
    });
    const citation = formatAPA(src);

    expect(citation).toContain('*Journal of Egyptian Archaeology*');
  });
});
