import { describe, it, expect } from 'vitest';
import {
  getEvidenceById,
  getEvidenceByObject,
  getEvidenceByLocation,
  getEvidenceBySource,
  getObjectConfidence,
  searchEvidence,
  getEvidencePanelData,
  getEvidenceByFilters,
} from './repository';

describe('EvidenceRepository', () => {
  it('finds evidence by object', () => {
    const evidence = getEvidenceByObject('OBJ-0001');
    expect(evidence.length).toBeGreaterThanOrEqual(1);
    expect(evidence.some((e) => e.id === 'EV-000001')).toBe(true);
  });

  it('finds evidence by location', () => {
    const evidence = getEvidenceByLocation('LOC-004');
    expect(evidence.length).toBeGreaterThanOrEqual(2);
  });

  it('finds evidence by source', () => {
    const evidence = getEvidenceBySource('SRC-0001');
    expect(evidence.length).toBeGreaterThan(0);
  });

  it('searches evidence by title', () => {
    const results = searchEvidence('sarcophagus');
    expect(results.some((e) => e.id === 'EV-000008')).toBe(true);
  });

  it('filters evidence by class and category', () => {
    const results = getEvidenceByFilters({ primaryClass: 'E2', category: 'Measurement' });
    expect(results.length).toBeGreaterThan(0);
    expect(results.every((e) => e.primaryClass === 'E2' && e.category === 'Measurement')).toBe(
      true,
    );
  });

  it('returns evidence panel data with sources and objects', () => {
    const panel = getEvidencePanelData('EV-000001');
    expect(panel).toBeDefined();
    expect(panel?.sources.length).toBeGreaterThan(0);
    expect(panel?.objects.length).toBeGreaterThan(0);
  });

  it('computes object confidence', () => {
    const confidence = getObjectConfidence('OBJ-0001');
    expect(confidence).toBeGreaterThanOrEqual(0);
    expect(confidence).toBeLessThanOrEqual(100);
  });

  it('returns undefined for unknown IDs', () => {
    expect(getEvidenceById('EV-999999')).toBeUndefined();
  });
});
