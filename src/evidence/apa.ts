import type { Source } from '@/schemas/source';

function formatAuthorName(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0];

  const last = parts.pop()!;
  const initials = parts.map((p) => `${p[0]}.`).join(' ');
  return `${last}, ${initials}`;
}

function formatAuthorList(authors: { name: string }[]): string {
  if (authors.length === 0) return '';
  if (authors.length === 1) return formatAuthorName(authors[0].name);
  if (authors.length === 2) {
    return `${formatAuthorName(authors[0].name)} & ${formatAuthorName(authors[1].name)}`;
  }
  if (authors.length <= 20) {
    const formatted = authors.map((a) => formatAuthorName(a.name));
    const last = formatted.pop()!;
    return `${formatted.join(', ')}, & ${last}`;
  }
  const first19 = authors.slice(0, 19).map((a) => formatAuthorName(a.name));
  return `${first19.join(', ')}, … ${formatAuthorName(authors[authors.length - 1].name)}`;
}

function formatYear(year: number | undefined): string {
  return year ? `(${year})` : '(n.d.)';
}

function formatTitle(title: string, type: Source['type']): string {
  if (type === 'Book') {
    return title;
  }
  return title;
}

function formatPublication(source: Source): string {
  const parts: string[] = [];

  if (source.publication) {
    if (source.type === 'Journal' || source.type === 'Conference') {
      parts.push(`*${source.publication}*`);
    } else {
      parts.push(source.publication);
    }
  }

  if (source.doi) {
    parts.push(`https://doi.org/${source.doi}`);
  } else if (source.url) {
    parts.push(source.url);
  }

  return parts.join(', ');
}

export function formatAPA(source: Source): string {
  const authors = formatAuthorList(source.authors);
  const year = formatYear(source.year);
  const title = formatTitle(source.title, source.type);
  const publication = formatPublication(source);

  const segments = [authors, year, title, publication].filter(Boolean);

  return segments.join('. ') + '.';
}

export function formatAPACitation(source: Source): string {
  const authors = formatAuthorList(source.authors);
  const year = source.year ?? 'n.d.';

  if (authors) {
    return `(${authors}, ${year})`;
  }
  return `(${year})`;
}
