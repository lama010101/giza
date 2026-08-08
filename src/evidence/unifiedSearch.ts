/**
 * Unified search per GIZA - 02 §23.14.
 *
 * Search across 6 result types:
 *   location, evidence, sources, theory refs, simulation, bookmarks
 *
 * Camera animates to selected result.
 */

import {
  getAllSources,
  getAllLocations,
  getAllObjects,
  searchEvidence,
  getLocationById,
} from './repository';
import { hypothesisEngine } from '@/theories/engineInstance';

export type SearchResultType =
  | 'evidence'
  | 'location'
  | 'source'
  | 'object'
  | 'theory'
  | 'simulation';

export interface SearchResult {
  id: string;
  type: SearchResultType;
  title: string;
  subtitle: string;
  position?: { x: number; y: number; z: number };
}

export interface SearchOptions {
  query: string;
  types?: SearchResultType[];
  limit?: number;
}

const DEFAULT_LIMIT = 50;

function getLocationPosition(
  locationId: string | undefined,
): { x: number; y: number; z: number } | undefined {
  if (!locationId) return undefined;
  const loc = getLocationById(locationId);
  return loc?.center;
}

export function unifiedSearch(options: SearchOptions): SearchResult[] {
  const { query, types, limit = DEFAULT_LIMIT } = options;
  if (!query.trim()) return [];

  const allTypes: SearchResultType[] = types ?? [
    'evidence',
    'location',
    'source',
    'object',
    'theory',
  ];

  const q = query.toLowerCase();
  const results: SearchResult[] = [];

  // Evidence search
  if (allTypes.includes('evidence')) {
    const evidence = searchEvidence(query);
    for (const ev of evidence) {
      results.push({
        id: ev.id,
        type: 'evidence',
        title: ev.title,
        subtitle: ev.category,
      });
    }
  }

  // Location search
  if (allTypes.includes('location')) {
    const locations = getAllLocations();
    for (const loc of locations) {
      if (loc.name.toLowerCase().includes(q) || loc.id.toLowerCase().includes(q)) {
        results.push({
          id: loc.id,
          type: 'location',
          title: loc.name,
          subtitle: 'Location',
          position: loc.center,
        });
      }
    }
  }

  // Source search
  if (allTypes.includes('source')) {
    const sources = getAllSources();
    for (const src of sources) {
      const authorStr = src.authors.map((a) => a.name).join(', ');
      const haystack = `${src.title} ${authorStr} ${src.id}`.toLowerCase();
      if (haystack.includes(q)) {
        results.push({
          id: src.id,
          type: 'source',
          title: src.title,
          subtitle: authorStr || src.type,
        });
      }
    }
  }

  // Object search
  if (allTypes.includes('object')) {
    const objects = getAllObjects();
    for (const obj of objects) {
      if (obj.name.toLowerCase().includes(q) || obj.id.toLowerCase().includes(q)) {
        results.push({
          id: obj.id,
          type: 'object',
          title: obj.name,
          subtitle: obj.type,
          position: getLocationPosition(obj.location),
        });
      }
    }
  }

  // Theory / hypothesis search
  if (allTypes.includes('theory')) {
    for (const id of hypothesisEngine.getPluginIds()) {
      const plugin = hypothesisEngine.getPlugin(id);
      if (!plugin) continue;
      const haystack = `${plugin.name} ${plugin.description} ${plugin.id}`.toLowerCase();
      if (haystack.includes(q)) {
        results.push({
          id: plugin.id,
          type: 'theory',
          title: plugin.name,
          subtitle: plugin.description,
        });
      }
    }
  }

  return results.slice(0, limit);
}

export function searchByType(query: string, type: SearchResultType): SearchResult[] {
  return unifiedSearch({ query, types: [type] });
}

export function searchAll(query: string): SearchResult[] {
  return unifiedSearch({ query });
}
