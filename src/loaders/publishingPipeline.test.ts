import { describe, it, expect } from 'vitest';
import {
  validateAsset,
  optimizeAsset,
  packageAsset,
  publishAsset,
  runPipeline,
  runBatchPipeline,
  getPublishingHistory,
  clearPublishingHistory,
  recordHistory,
  type AssetInput,
} from './publishingPipeline';

const validAsset: AssetInput = {
  assetId: 'asset-001',
  version: 1,
  monumentId: 'great-pyramid',
  locationId: 'LOC-001',
  objectId: 'OBJ-0111',
  evidenceIds: ['EV-100011'],
  sourceIds: ['SRC-0101'],
  license: 'CC-BY-4.0',
  assetClass: 'Hero',
  lodLevel: 'LOD0',
  triangleCount: 50000,
  textureFormat: 'KTX2',
  hasNormals: true,
  hasUVs: true,
  metadata: {
    assetId: 'asset-001',
    version: 1,
    monumentId: 'great-pyramid',
    locationId: 'LOC-001',
    objectId: 'OBJ-0111',
    evidenceIds: ['EV-100011'],
    sourceIds: ['SRC-0101'],
    chronologyTags: ['old-kingdom'],
    confidence: 80,
    confidenceBasis: 'survey',
    coordinateLayer: 'monument',
    author: 'GIZA Team',
    approvedBy: 'Reviewer',
  },
};

describe('Publishing Pipeline (M06A-T11)', () => {
  describe('validateAsset', () => {
    it('passes a valid asset', () => {
      const result = validateAsset(validAsset);
      expect(result.status).toBe('completed');
      expect(result.errors).toHaveLength(0);
    });

    it('fails an asset with no evidence linkage', () => {
      const result = validateAsset({ ...validAsset, evidenceIds: [] });
      expect(result.status).toBe('failed');
      expect(result.errors.some((e) => e.includes('evidence'))).toBe(true);
    });

    it('fails an asset with no license', () => {
      const result = validateAsset({ ...validAsset, license: '' });
      expect(result.status).toBe('failed');
      expect(result.errors.some((e) => e.includes('License'))).toBe(true);
    });

    it('warns when texture format is not KTX2', () => {
      const result = validateAsset({ ...validAsset, textureFormat: 'PNG' });
      expect(result.warnings.some((w) => w.includes('KTX2'))).toBe(true);
    });
  });

  describe('optimizeAsset', () => {
    it('generates LOD levels', () => {
      const result = optimizeAsset(validAsset);
      expect(result.status).toBe('completed');
      const data = result.data as { lods: { level: string; triangleCount: number }[] };
      expect(data.lods.length).toBeGreaterThan(0);
    });

    it('reduces triangle count at lower LODs', () => {
      const result = optimizeAsset(validAsset);
      const data = result.data as { lods: { level: string; triangleCount: number }[] };
      const lod0 = data.lods.find((l) => l.level === 'LOD0');
      const lod3 = data.lods.find((l) => l.level === 'LOD3');
      expect(lod3!.triangleCount).toBeLessThan(lod0!.triangleCount);
    });
  });

  describe('packageAsset', () => {
    it('creates a manifest with checksums', () => {
      const result = packageAsset(validAsset);
      expect(result.status).toBe('completed');
      const manifest = result.data as {
        assetId: string;
        checksum: string;
        files: { path: string; checksum: string }[];
      };
      expect(manifest.assetId).toBe(validAsset.assetId);
      expect(manifest.checksum).toBeTruthy();
      expect(manifest.files.length).toBeGreaterThan(0);
    });
  });

  describe('publishAsset', () => {
    it('returns output directory and file list', () => {
      const pkg = packageAsset(validAsset);
      const manifest = pkg.data as {
        files: { path: string; size: number; checksum: string }[];
        assetId: string;
        version: number;
        checksum: string;
        metadata: Record<string, unknown>;
        evidenceRefs: string[];
        sourceRefs: string[];
        createdAt: string;
      };
      const result = publishAsset(validAsset, manifest);
      expect(result.status).toBe('completed');
      const data = result.data as { outputDirectory: string; filesWritten: string[] };
      expect(data.outputDirectory).toContain('assets/export');
      expect(data.filesWritten.length).toBeGreaterThan(0);
    });
  });

  describe('runPipeline', () => {
    it('runs all four stages for a valid asset', () => {
      const result = runPipeline(validAsset);
      expect(result.success).toBe(true);
      expect(result.stages).toHaveLength(4);
      expect(result.stages.map((s) => s.stage)).toEqual([
        'Validate',
        'Optimize',
        'Package',
        'Publish',
      ]);
    });

    it('stops on validation failure', () => {
      const result = runPipeline({ ...validAsset, evidenceIds: [] });
      expect(result.success).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('runBatchPipeline', () => {
    it('processes multiple assets', () => {
      const assets = [validAsset, { ...validAsset, assetId: 'asset-002', objectId: 'OBJ-0109' }];
      const batch = runBatchPipeline(assets);
      expect(batch.results).toHaveLength(2);
      expect(batch.successCount).toBe(2);
      expect(batch.failureCount).toBe(0);
    });
  });

  describe('getPublishingHistory', () => {
    it('tracks publishing history', () => {
      clearPublishingHistory();
      const result = runPipeline(validAsset);
      recordHistory(result);
      const history = getPublishingHistory();
      expect(history.length).toBeGreaterThan(0);
      expect(history.some((h) => h.assetId === validAsset.assetId)).toBe(true);
    });
  });
});
