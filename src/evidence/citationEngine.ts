import type { Source } from '@/schemas/source';

/**
 * Bibliography generation engine per GIZA - 09 §12.
 *
 * Supports 11 citation styles:
 *   APA, Chicago, Harvard, IEEE, MLA, Turabian,
 *   SAA, Chicago NB, Chicago AD, BibTeX, RIS
 *
 * BibTeX keys are derived from the SRC ID.
 */

export type CitationStyle =
  | 'APA'
  | 'Chicago'
  | 'Harvard'
  | 'IEEE'
  | 'MLA'
  | 'Turabian'
  | 'SAA'
  | 'ChicagoNB'
  | 'ChicagoAD'
  | 'BibTeX'
  | 'RIS';

export const ALL_CITATION_STYLES: CitationStyle[] = [
  'APA',
  'Chicago',
  'Harvard',
  'IEEE',
  'MLA',
  'Turabian',
  'SAA',
  'ChicagoNB',
  'ChicagoAD',
  'BibTeX',
  'RIS',
];

// --- Shared helpers -------------------------------------------------------

function firstInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0];
  const last = parts.pop()!;
  const initials = parts.map((p) => `${p[0]}.`).join(' ');
  return `${last}, ${initials}`;
}

function formatAuthorListAPA(authors: { name: string }[]): string {
  if (authors.length === 0) return '';
  if (authors.length === 1) return firstInitials(authors[0].name);
  if (authors.length === 2) {
    return `${firstInitials(authors[0].name)} & ${firstInitials(authors[1].name)}`;
  }
  if (authors.length <= 20) {
    const formatted = authors.map((a) => firstInitials(a.name));
    const last = formatted.pop()!;
    return `${formatted.join(', ')}, & ${last}`;
  }
  const first19 = authors.slice(0, 19).map((a) => firstInitials(a.name));
  return `${first19.join(', ')}, … ${firstInitials(authors[authors.length - 1].name)}`;
}

// --- Style formatters -----------------------------------------------------

function toAPA(source: Source): string {
  const authors = formatAuthorListAPA(source.authors);
  const year = source.year ? `(${source.year})` : '(n.d.)';
  const pub = source.publication ?? '';
  const doi = source.doi ? `https://doi.org/${source.doi}` : (source.url ?? '');
  const segments = [authors, year, source.title, pub, doi].filter(Boolean);
  return segments.join('. ') + '.';
}

function toChicago(source: Source): string {
  // Chicago Author-Date
  const authors = formatAuthorListAPA(source.authors);
  const year = source.year ? String(source.year) : 'n.d.';
  const pub = source.publication ?? '';
  const segments = [authors, year, source.title, pub].filter(Boolean);
  return segments.join('. ') + '.';
}

function toHarvard(source: Source): string {
  const authors = formatAuthorListAPA(source.authors);
  const year = source.year ? String(source.year) : 'n.d.';
  const pub = source.publication ?? '';
  const segments = [authors, year, source.title, pub].filter(Boolean);
  return segments.join('. ') + '.';
}

function toIEEE(source: Source): string {
  // IEEE: A. Author, Title, Publication, Year.
  const authors = source.authors.map((a) => {
    const parts = a.name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0];
    const last = parts.pop()!;
    const initials = parts.map((p) => `${p[0]}.`).join(' ');
    return `${initials} ${last}`;
  });
  const authorStr = authors.join(', ');
  const year = source.year ? String(source.year) : 'n.d.';
  const pub = source.publication ?? '';
  const segments = [authorStr, `"${source.title}"`, pub, year].filter(Boolean);
  return segments.join(', ') + '.';
}

function toMLA(source: Source): string {
  // MLA: Last, First. Title. Publication, Year.
  if (source.authors.length === 0) {
    const year = source.year ? String(source.year) : 'n.d.';
    return `${source.title}. ${source.publication ?? ''}, ${year}.`;
  }
  const a = source.authors[0];
  const parts = a.name.trim().split(/\s+/);
  const last = parts.pop()!;
  const first = parts.join(' ');
  const authorStr = first ? `${last}, ${first}` : last;
  const year = source.year ? String(source.year) : 'n.d.';
  const segments = [authorStr, source.title, source.publication, year].filter(Boolean);
  return segments.join('. ') + '.';
}

function toTurabian(source: Source): string {
  // Turabian = Chicago Notes-Bibliography style
  const authors = formatAuthorListAPA(source.authors);
  const year = source.year ? String(source.year) : 'n.d.';
  const pub = source.publication ?? '';
  const segments = [authors, source.title, pub, year].filter(Boolean);
  return segments.join('. ') + '.';
}

function toSAA(source: Source): string {
  // Society for American Archaeology
  const authors = formatAuthorListAPA(source.authors);
  const year = source.year ? String(source.year) : 'n.d.';
  const pub = source.publication ?? '';
  const segments = [authors, year, source.title, pub].filter(Boolean);
  return segments.join('. ') + '.';
}

function toChicagoNB(source: Source): string {
  // Chicago Notes-Bibliography
  const authors = formatAuthorListAPA(source.authors);
  const pub = source.publication ?? '';
  const year = source.year ? String(source.year) : 'n.d.';
  const segments = [authors, source.title, pub, year].filter(Boolean);
  return segments.join('. ') + '.';
}

function toChicagoAD(source: Source): string {
  // Chicago Author-Date (same as Chicago)
  return toChicago(source);
}

function toBibTeX(source: Source): string {
  const key = source.id.replace(/-/g, '').toLowerCase();
  const authors = source.authors.map((a) => a.name).join(' and ');
  const year = source.year ?? '';
  const pub = source.publication ?? '';
  const doi = source.doi ?? '';
  const url = source.url ?? '';

  const fields: string[] = [
    `  title = {${source.title}}`,
    authors ? `  author = {${authors}}` : '',
    year ? `  year = {${year}}` : '',
    pub ? `  journal = {${pub}}` : '',
    doi ? `  doi = {${doi}}` : '',
    url ? `  url = {${url}}` : '',
  ].filter(Boolean);

  return `@article{${key},\n${fields.join(',\n')}\n}`;
}

function toRIS(source: Source): string {
  const authors = source.authors.map((a) => `AU  - ${a.name}`).join('\n');
  const year = source.year ? `PY  - ${source.year}` : '';
  const pub = source.publication ? `JO  - ${source.publication}` : '';
  const doi = source.doi ? `DO  - ${source.doi}` : '';
  const url = source.url ? `UR  - ${source.url}` : '';

  const lines = [
    'TY  - GEN',
    `TI  - ${source.title}`,
    authors,
    year,
    pub,
    doi,
    url,
    'ER  - ',
  ].filter(Boolean);

  return lines.join('\n');
}

// --- Public API -----------------------------------------------------------

export function formatCitation(source: Source, style: CitationStyle): string {
  switch (style) {
    case 'APA':
      return toAPA(source);
    case 'Chicago':
      return toChicago(source);
    case 'Harvard':
      return toHarvard(source);
    case 'IEEE':
      return toIEEE(source);
    case 'MLA':
      return toMLA(source);
    case 'Turabian':
      return toTurabian(source);
    case 'SAA':
      return toSAA(source);
    case 'ChicagoNB':
      return toChicagoNB(source);
    case 'ChicagoAD':
      return toChicagoAD(source);
    case 'BibTeX':
      return toBibTeX(source);
    case 'RIS':
      return toRIS(source);
    default: {
      const exhaustive: never = style;
      throw new Error(`Unknown citation style: ${exhaustive as string}`);
    }
  }
}

export function formatBibliography(sources: Source[], style: CitationStyle): string {
  return sources.map((s) => formatCitation(s, style)).join('\n\n');
}

export function bibtexKey(source: Source): string {
  return source.id.replace(/-/g, '').toLowerCase();
}
