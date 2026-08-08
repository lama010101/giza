import { describe, it, expect } from 'vitest';
import { searchAll, searchByType, unifiedSearch } from './unifiedSearch';
import { hypothesisEngine } from '@/theories/engineInstance';

describe('unifiedSearch', () => {
  it('returns empty array for empty query', () => {
    expect(searchAll('')).toEqual([]);
  });

  it('searches evidence by title', () => {
    const results = searchAll('shaft');
    const evidence = results.filter((r) => r.type === 'evidence');
    expect(evidence.length).toBeGreaterThan(0);
    expect(evidence[0].title.toLowerCase()).toContain('shaft');
  });

  it('searches locations by name', () => {
    const results = searchAll('giza');
    const locations = results.filter((r) => r.type === 'location');
    expect(locations.length).toBeGreaterThan(0);
  });

  it('searches sources by title', () => {
    const results = searchAll('petrie');
    const sources = results.filter((r) => r.type === 'source');
    expect(sources.length).toBeGreaterThan(0);
  });

  it('searches objects by name', () => {
    const results = searchByType('sarcophagus', 'object');
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].type).toBe('object');
  });

  it('searches theories by name/description', () => {
    const results = searchByType('hydraulic', 'theory');
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].type).toBe('theory');
    expect(results.some((r) => hypothesisEngine.getPluginIds().includes(r.id))).toBe(true);
  });

  it('respects the limit', () => {
    const results = unifiedSearch({ query: 'a', limit: 3 });
    expect(results.length).toBeLessThanOrEqual(3);
  });

  it('filters by requested types', () => {
    const results = unifiedSearch({ query: 'shaft', types: ['object'] });
    expect(results.every((r) => r.type === 'object')).toBe(true);
  });

  it('searches locations by id', () => {
    const results = searchByType('LOC-', 'location');
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].type).toBe('location');
  });
});
