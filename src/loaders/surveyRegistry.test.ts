import { describe, it, expect } from 'vitest';
import {
  getSurveySources,
  getSurveySourceById,
  getCoverageMap,
  getCoverageByMonument,
  getCoverageGaps,
  getManualReconstructions,
  getManualReconstructionsByMonument,
  getGeometryConfidence,
} from './surveyRegistry';

describe('Survey Source Registry', () => {
  it('returns survey sources', () => {
    const sources = getSurveySources();
    expect(sources.length).toBeGreaterThanOrEqual(2);
  });

  it('includes Hawass 2007 as published CAD', () => {
    const hawass = getSurveySources().find((s) => s.name.includes('Hawass'));
    expect(hawass).toBeDefined();
    expect(hawass?.type).toBe('published_cad');
    expect(hawass?.reliability).toBe(95);
  });

  it('finds survey source by ID', () => {
    const source = getSurveySourceById('SURV-001');
    expect(source).toBeDefined();
    expect(source?.name).toContain('Hawass');
  });

  it('returns undefined for unknown ID', () => {
    expect(getSurveySourceById('SURV-999')).toBeUndefined();
  });
});

describe('Coverage Map', () => {
  it('returns all coverage entries', () => {
    const map = getCoverageMap();
    expect(map.length).toBeGreaterThanOrEqual(10);
  });

  it('filters by monument', () => {
    const entries = getCoverageByMonument('MON-OS-001');
    expect(entries.length).toBeGreaterThanOrEqual(10);
    expect(entries.every((e) => e.monumentId === 'MON-OS-001')).toBe(true);
  });

  it('identifies coverage gaps', () => {
    const gaps = getCoverageGaps('MON-OS-001');
    expect(gaps.length).toBeGreaterThanOrEqual(1);
    expect(gaps.some((g) => g.status === 'unknown')).toBe(true);
    expect(gaps.some((g) => g.status === 'inferred')).toBe(true);
  });

  it('measured regions have high confidence', () => {
    const measured = getCoverageMap().filter((c) => c.status === 'measured');
    expect(measured.every((c) => c.confidence >= 90)).toBe(true);
  });

  it('unknown regions have zero confidence', () => {
    const unknown = getCoverageMap().filter((c) => c.status === 'unknown');
    expect(unknown.every((c) => c.confidence === 0)).toBe(true);
  });
});

describe('Manual Reconstruction', () => {
  it('returns manual reconstruction records', () => {
    const records = getManualReconstructions();
    expect(records.length).toBeGreaterThanOrEqual(1);
  });

  it('filters by monument', () => {
    const records = getManualReconstructionsByMonument('MON-OS-001');
    expect(records.length).toBeGreaterThanOrEqual(1);
    expect(records.every((r) => r.monumentId === 'MON-OS-001')).toBe(true);
  });

  it('manual reconstructions use evidence class E7 or E8', () => {
    for (const rec of getManualReconstructions()) {
      expect(['E7', 'E8']).toContain(rec.evidenceClass);
    }
  });

  it('manual reconstructions have confidence <= 50', () => {
    for (const rec of getManualReconstructions()) {
      expect(rec.confidence).toBeLessThanOrEqual(50);
    }
  });

  it('manual reconstructions have documented assumptions', () => {
    for (const rec of getManualReconstructions()) {
      expect(rec.assumptions.length).toBeGreaterThan(0);
    }
  });
});

describe('Geometry Confidence by Survey Type', () => {
  it('laser scan has highest confidence', () => {
    expect(getGeometryConfidence('laser_scan')).toBe(99);
  });

  it('photogrammetry has high confidence', () => {
    expect(getGeometryConfidence('photogrammetry')).toBe(90);
  });

  it('published CAD has medium-high confidence', () => {
    expect(getGeometryConfidence('published_cad')).toBe(85);
  });

  it('manual reconstruction has capped confidence', () => {
    expect(getGeometryConfidence('manual_reconstruction')).toBe(50);
  });
});
