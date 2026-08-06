import { describe, it, expect } from 'vitest';
import {
  getAssetManifest,
  getAssetsByCategory,
  getAllManifestAssets,
  findManifestAsset,
  getAssetsByStatus,
  getManifestStats,
  getManifestTaskIds,
} from './assetManifest';

describe('Asset Manifest (M06B-T01 through T07)', () => {
  describe('getAssetManifest', () => {
    it('returns the full manifest', () => {
      const m = getAssetManifest();
      expect(m.version).toBe('1.1.0');
      expect(m.categories).toBeDefined();
    });
  });

  describe('getAssetsByCategory', () => {
    it('returns rubble assets', () => {
      const assets = getAssetsByCategory('rubble');
      expect(assets.length).toBeGreaterThanOrEqual(3);
      expect(assets[0].assetId).toMatch(/^RUBBLE_/);
    });

    it('returns bedrock assets', () => {
      const assets = getAssetsByCategory('bedrock');
      expect(assets.length).toBeGreaterThanOrEqual(3);
    });

    it('returns granite assets', () => {
      const assets = getAssetsByCategory('granite');
      expect(assets.length).toBeGreaterThanOrEqual(3);
    });

    it('returns stairs assets', () => {
      const assets = getAssetsByCategory('stairs');
      expect(assets.length).toBeGreaterThanOrEqual(4);
    });

    it('returns materials assets', () => {
      const assets = getAssetsByCategory('materials');
      expect(assets.length).toBeGreaterThanOrEqual(5);
    });

    it('returns export assets', () => {
      const assets = getAssetsByCategory('export');
      expect(assets.length).toBeGreaterThanOrEqual(5);
    });

    it('returns empty for unknown category', () => {
      expect(getAssetsByCategory('unknown' as never)).toEqual([]);
    });
  });

  describe('getAllManifestAssets', () => {
    it('returns all assets across categories', () => {
      const all = getAllManifestAssets();
      expect(all.length).toBeGreaterThanOrEqual(20);
    });
  });

  describe('findManifestAsset', () => {
    it('finds an asset by ID', () => {
      const asset = findManifestAsset('RUBBLE_001');
      expect(asset).toBeDefined();
      expect(asset!.name).toContain('limestone');
    });

    it('returns undefined for unknown ID', () => {
      expect(findManifestAsset('UNKNOWN')).toBeUndefined();
    });
  });

  describe('getAssetsByStatus', () => {
    it('returns published assets', () => {
      const published = getAssetsByStatus('published');
      expect(published.length).toBeGreaterThan(0);
    });

    it('returns no pending assets after generation', () => {
      const pending = getAssetsByStatus('pending');
      expect(pending.length).toBe(0);
    });
  });

  describe('getManifestStats', () => {
    it('returns statistics', () => {
      const stats = getManifestStats();
      expect(stats.total).toBeGreaterThanOrEqual(20);
      expect(stats.pending).toBe(0);
      expect(stats.published).toBeGreaterThan(0);
      expect(Object.keys(stats.byCategory).length).toBe(6);
    });
  });

  describe('getManifestTaskIds', () => {
    it('returns task IDs', () => {
      const ids = getManifestTaskIds();
      expect(ids).toContain('M06B-T01');
      expect(ids).toContain('M06B-T07');
      expect(ids.length).toBe(6);
    });
  });
});
