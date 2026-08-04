import { describe, it, expect } from 'vitest';
import {
  getPublishedCadDrawings,
  getPublishedCadDrawingById,
  getPublishedCadDrawingsBySource,
  getPublishedCadDrawingsByMonument,
  getCadDimensions,
} from './publishedCadLoader';

describe('Published CAD Loader', () => {
  it('returns all Great Pyramid CAD drawings', () => {
    const drawings = getPublishedCadDrawings();
    expect(drawings.length).toBeGreaterThanOrEqual(6);
    expect(drawings.every((d) => d.monumentId === 'MON-GP-001')).toBe(true);
  });

  it('finds a drawing by ID', () => {
    const drawing = getPublishedCadDrawingById('CAD-GP-001');
    expect(drawing).toBeDefined();
    expect(drawing?.author).toBe('W.M.F. Petrie');
    expect(drawing?.datum).toContain('Local Plateau Coordinates');
  });

  it('returns undefined for unknown drawing', () => {
    expect(getPublishedCadDrawingById('CAD-UNKNOWN')).toBeUndefined();
  });

  it('filters by source', () => {
    const petrie = getPublishedCadDrawingsBySource('SRC-0101');
    expect(petrie.length).toBe(1);
    expect(petrie[0].id).toBe('CAD-GP-001');
  });

  it('filters by monument', () => {
    const gp = getPublishedCadDrawingsByMonument('MON-GP-001');
    expect(gp.length).toBeGreaterThanOrEqual(6);
  });

  it('extracts dimensions from a drawing', () => {
    const dims = getCadDimensions('CAD-GP-002');
    expect(dims.length).toBeGreaterThanOrEqual(1);
    const base = dims.find((d) => d.name === 'Mean base length');
    expect(base).toBeDefined();
    expect(base?.value).toBeGreaterThan(200);
    expect(base?.unit).toBe('m');
  });

  it('returns empty dimensions for unknown drawing', () => {
    expect(getCadDimensions('CAD-UNKNOWN')).toEqual([]);
  });
});
