import { describe, it, expect } from 'vitest';
import { unifiedSearch, searchByType, searchAll } from './unifiedSearch';

describe('Unified Search (M08-T06)', () => {
  it('returns results for a matching query', () => {
    const results = unifiedSearch({ query: 'pyramid' });
    expect(results.length).toBeGreaterThan(0);
  });

  it('returns empty for empty query', () => {
    expect(unifiedSearch({ query: '' })).toEqual([]);
  });

  it('returns empty for whitespace-only query', () => {
    expect(unifiedSearch({ query: '   ' })).toEqual([]);
  });

  it('filters by evidence type', () => {
    const results = unifiedSearch({ query: 'base', types: ['evidence'] });
    expect(results.length).toBeGreaterThan(0);
    expect(results.every((r) => r.type === 'evidence')).toBe(true);
  });

  it('filters by location type', () => {
    const results = unifiedSearch({ query: 'chamber', types: ['location'] });
    expect(results.every((r) => r.type === 'location')).toBe(true);
  });

  it('filters by source type', () => {
    const results = unifiedSearch({ query: 'Petrie', types: ['source'] });
    expect(results.every((r) => r.type === 'source')).toBe(true);
  });

  it('filters by object type', () => {
    const results = unifiedSearch({ query: 'Chamber', types: ['object'] });
    expect(results.every((r) => r.type === 'object')).toBe(true);
  });

  it('respects limit option', () => {
    const results = unifiedSearch({ query: 'a', limit: 5 });
    expect(results.length).toBeLessThanOrEqual(5);
  });

  it('searchByType returns only specified type', () => {
    const results = searchByType('pyramid', 'evidence');
    expect(results.every((r) => r.type === 'evidence')).toBe(true);
  });

  it('searchAll searches all types', () => {
    const results = searchAll('chamber');
    expect(results.length).toBeGreaterThan(0);
  });

  it('each result has id, type, title, and subtitle', () => {
    const results = unifiedSearch({ query: 'pyramid', limit: 3 });
    for (const r of results) {
      expect(r.id).toBeTruthy();
      expect(r.type).toBeTruthy();
      expect(r.title).toBeTruthy();
      expect(r.subtitle).toBeDefined();
    }
  });
});
