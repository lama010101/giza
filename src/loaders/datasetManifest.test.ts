import { describe, it, expect } from 'vitest';
import {
  generateDatasetManifest,
  exportDatasetManifest,
  type DatasetManifest,
} from './datasetManifest';

describe('Dataset Manifest', () => {
  it('generates a manifest with correct counts', () => {
    const manifest = generateDatasetManifest();
    expect(manifest.counts.evidence).toBeGreaterThanOrEqual(100);
    expect(manifest.counts.sources).toBeGreaterThanOrEqual(40);
    expect(manifest.counts.objects).toBeGreaterThan(0);
    expect(manifest.counts.locations).toBeGreaterThan(0);
  });

  it('includes ID ranges', () => {
    const manifest = generateDatasetManifest();
    expect(manifest.idRanges.evidence.min).toMatch(/^EV-\d{6}$/);
    expect(manifest.idRanges.evidence.max).toMatch(/^EV-\d{6}$/);
    expect(manifest.idRanges.sources.min).toMatch(/^SRC-\d{4}$/);
    expect(manifest.idRanges.sources.max).toMatch(/^SRC-\d{4}$/);
  });

  it('includes evidence by status breakdown', () => {
    const manifest = generateDatasetManifest();
    expect(manifest.evidenceByStatus.Published).toBeGreaterThan(0);
  });

  it('includes evidence by category breakdown', () => {
    const manifest = generateDatasetManifest();
    expect(Object.keys(manifest.evidenceByCategory).length).toBeGreaterThan(0);
  });

  it('includes source types breakdown', () => {
    const manifest = generateDatasetManifest();
    expect(Object.keys(manifest.sourceTypes).length).toBeGreaterThan(0);
  });

  it('includes confidence distribution', () => {
    const manifest = generateDatasetManifest();
    const total =
      manifest.confidenceDistribution.high +
      manifest.confidenceDistribution.medium +
      manifest.confidenceDistribution.low;
    expect(total).toBe(manifest.counts.evidence);
  });

  it('includes app version', () => {
    const manifest = generateDatasetManifest();
    expect(manifest.appVersion).toBeTruthy();
  });

  it('includes monuments list', () => {
    const manifest = generateDatasetManifest();
    expect(manifest.monuments.length).toBeGreaterThan(0);
  });

  it('exports manifest as valid JSON', () => {
    const json = exportDatasetManifest();
    const parsed = JSON.parse(json) as DatasetManifest;
    expect(parsed.counts.evidence).toBeGreaterThanOrEqual(100);
  });
});
