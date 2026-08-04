/**
 * Duplicate source detection per M03-T06.
 *
 * Detects duplicate sources using:
 *   1. Exact DOI match
 *   2. Exact ISBN match
 *   3. Normalized title similarity (Levenshtein distance)
 *   4. Author + year combination match
 */

import type { Source } from '@/schemas/source';
import { normalizeDOI, normalizeISBN } from './identifiers';

export interface DuplicateMatch {
  source1: Source;
  source2: Source;
  matchType: 'doi' | 'isbn' | 'title' | 'author-year';
  similarity: number; // 0-1
}

/**
 * Finds all duplicate source pairs in a list of sources.
 */
export function findDuplicateSources(sources: Source[]): DuplicateMatch[] {
  const matches: DuplicateMatch[] = [];

  for (let i = 0; i < sources.length; i++) {
    for (let j = i + 1; j < sources.length; j++) {
      const match = compareSources(sources[i], sources[j]);
      if (match) {
        matches.push(match);
      }
    }
  }

  return matches;
}

/**
 * Compares two sources for duplication.
 * Returns a DuplicateMatch if they appear to be duplicates, null otherwise.
 */
export function compareSources(a: Source, b: Source): DuplicateMatch | null {
  // 1. DOI match (highest confidence)
  if (a.doi && b.doi) {
    try {
      if (normalizeDOI(a.doi) === normalizeDOI(b.doi)) {
        return {
          source1: a,
          source2: b,
          matchType: 'doi',
          similarity: 1.0,
        };
      }
    } catch {
      // Invalid DOI — skip
    }
  }

  // 2. ISBN match
  if (a.isbn && b.isbn) {
    try {
      if (normalizeISBN(a.isbn) === normalizeISBN(b.isbn)) {
        return {
          source1: a,
          source2: b,
          matchType: 'isbn',
          similarity: 1.0,
        };
      }
    } catch {
      // Invalid ISBN — skip
    }
  }

  // 3. Title similarity
  const titleSimilarity = levenshteinSimilarity(normalizeTitle(a.title), normalizeTitle(b.title));
  if (titleSimilarity > 0.85) {
    return {
      source1: a,
      source2: b,
      matchType: 'title',
      similarity: titleSimilarity,
    };
  }

  // 4. Author + year combination
  if (a.year && b.year && a.year === b.year) {
    const authorSimilarity = compareAuthors(a, b);
    if (authorSimilarity > 0.8 && titleSimilarity > 0.5) {
      return {
        source1: a,
        source2: b,
        matchType: 'author-year',
        similarity: (authorSimilarity + titleSimilarity) / 2,
      };
    }
  }

  return null;
}

/**
 * Normalizes a title for comparison (lowercase, remove punctuation).
 */
function normalizeTitle(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^\w\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Compares author lists between two sources.
 */
function compareAuthors(a: Source, b: Source): number {
  if (a.authors.length === 0 && b.authors.length === 0) return 1.0;
  if (a.authors.length === 0 || b.authors.length === 0) return 0.0;

  const aNames = new Set(a.authors.map((au) => normalizeAuthorName(au.name)));
  const bNames = new Set(b.authors.map((au) => normalizeAuthorName(au.name)));

  const intersection = [...aNames].filter((n) => bNames.has(n)).length;
  const union = new Set([...aNames, ...bNames]).size;

  return intersection / union;
}

function normalizeAuthorName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^\w\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Computes Levenshtein distance between two strings.
 */
function levenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = [];

  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b[i - 1] === a[j - 1]) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1,
        );
      }
    }
  }

  return matrix[b.length][a.length];
}

/**
 * Returns a similarity score (0-1) based on Levenshtein distance.
 */
function levenshteinSimilarity(a: string, b: string): number {
  const maxLen = Math.max(a.length, b.length);
  if (maxLen === 0) return 1.0;
  const distance = levenshteinDistance(a, b);
  return 1 - distance / maxLen;
}

/**
 * Groups duplicate matches into clusters of duplicates.
 */
export function clusterDuplicates(matches: DuplicateMatch[]): Source[][] {
  const clusters = new Map<string, Set<string>>();

  for (const match of matches) {
    const id1 = match.source1.id;
    const id2 = match.source2.id;

    // Find existing cluster containing either source
    let clusterId: string | null = null;
    for (const [cid, members] of clusters) {
      if (members.has(id1) || members.has(id2)) {
        clusterId = cid;
        break;
      }
    }

    if (clusterId) {
      clusters.get(clusterId)!.add(id1);
      clusters.get(clusterId)!.add(id2);
    } else {
      const newId = `${id1}-${id2}`;
      clusters.set(newId, new Set([id1, id2]));
    }
  }

  // Convert clusters to arrays of Source objects
  const sourceMap = new Map<string, Source>();
  for (const match of matches) {
    sourceMap.set(match.source1.id, match.source1);
    sourceMap.set(match.source2.id, match.source2);
  }

  return [...clusters.values()].map((ids) =>
    [...ids].map((id) => sourceMap.get(id)!).filter(Boolean),
  );
}
