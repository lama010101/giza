import { describe, it, expect, beforeEach } from 'vitest';
import {
  listAssets,
  getAsset,
  validateAssetEndpoint,
  registerAsset,
  deleteAsset,
  getMonumentAssets,
  getObjectAssets,
  getAssetStats,
  clearAssetStore,
  type AssetRecord,
} from './assetApi';

function makeAsset(overrides: Partial<AssetRecord> = {}): AssetRecord {
  return {
    assetId: 'asset-001',
    version: 1,
    monumentId: 'great-pyramid',
    objectId: 'kings-chamber',
    status: 'published',
    publishedAt: '2026-08-01T00:00:00Z',
    fileSize: 1024 * 1024,
    format: 'GLB',
    lodLevels: 3,
    evidenceIds: ['EV-001'],
    confidence: 85,
    author: 'Test',
    approvedBy: 'Reviewer',
    ...overrides,
  };
}

describe('Asset API (M06A-T12)', () => {
  beforeEach(() => {
    clearAssetStore();
  });

  describe('registerAsset', () => {
    it('registers an asset in the store', () => {
      const asset = makeAsset();
      registerAsset(asset);
      const result = listAssets();
      expect(result.assets).toHaveLength(1);
      expect(result.assets[0].assetId).toBe('asset-001');
    });
  });

  describe('listAssets', () => {
    it('returns empty list when no assets', () => {
      const result = listAssets();
      expect(result.assets).toHaveLength(0);
      expect(result.total).toBe(0);
    });

    it('filters by monumentId', () => {
      registerAsset(makeAsset({ assetId: 'a1', monumentId: 'great-pyramid' }));
      registerAsset(makeAsset({ assetId: 'a2', monumentId: 'osiris-shaft' }));
      const result = listAssets({ monumentId: 'great-pyramid' });
      expect(result.assets).toHaveLength(1);
      expect(result.assets[0].assetId).toBe('a1');
    });

    it('filters by status', () => {
      registerAsset(makeAsset({ assetId: 'a1', status: 'published' }));
      registerAsset(makeAsset({ assetId: 'a2', status: 'failed' }));
      const result = listAssets({ status: 'published' });
      expect(result.assets).toHaveLength(1);
    });

    it('filters by minConfidence', () => {
      registerAsset(makeAsset({ assetId: 'a1', confidence: 50 }));
      registerAsset(makeAsset({ assetId: 'a2', confidence: 90 }));
      const result = listAssets({ minConfidence: 80 });
      expect(result.assets).toHaveLength(1);
      expect(result.assets[0].assetId).toBe('a2');
    });

    it('paginates results', () => {
      for (let i = 0; i < 25; i++) {
        registerAsset(
          makeAsset({ assetId: `a${i}`, publishedAt: `2026-08-0${(i % 9) + 1}T00:00:00Z` }),
        );
      }
      const page1 = listAssets({ page: 1, pageSize: 10 });
      expect(page1.assets).toHaveLength(10);
      expect(page1.total).toBe(25);
      expect(page1.page).toBe(1);
    });
  });

  describe('getAsset', () => {
    it('returns asset detail by ID', () => {
      registerAsset(makeAsset());
      const detail = getAsset('asset-001');
      expect(detail).not.toBeNull();
      expect(detail!.asset.assetId).toBe('asset-001');
      expect(detail!.downloadUrl).toContain('asset-001');
    });

    it('returns null for unknown asset', () => {
      expect(getAsset('unknown')).toBeNull();
    });
  });

  describe('deleteAsset', () => {
    it('deletes an asset', () => {
      registerAsset(makeAsset());
      expect(deleteAsset('asset-001')).toBe(true);
      expect(getAsset('asset-001')).toBeNull();
    });

    it('returns false for unknown asset', () => {
      expect(deleteAsset('unknown')).toBe(false);
    });
  });

  describe('getMonumentAssets', () => {
    it('returns assets for a monument', () => {
      registerAsset(makeAsset({ assetId: 'a1', monumentId: 'great-pyramid' }));
      registerAsset(makeAsset({ assetId: 'a2', monumentId: 'osiris-shaft' }));
      const assets = getMonumentAssets('great-pyramid');
      expect(assets).toHaveLength(1);
    });
  });

  describe('getObjectAssets', () => {
    it('returns assets for an object', () => {
      registerAsset(makeAsset({ assetId: 'a1', objectId: 'kings-chamber' }));
      registerAsset(makeAsset({ assetId: 'a2', objectId: 'queens-chamber' }));
      const assets = getObjectAssets('kings-chamber');
      expect(assets).toHaveLength(1);
    });
  });

  describe('getAssetStats', () => {
    it('returns statistics', () => {
      registerAsset(makeAsset({ assetId: 'a1', monumentId: 'gp', format: 'GLB', confidence: 80 }));
      registerAsset(makeAsset({ assetId: 'a2', monumentId: 'os', format: 'glTF', confidence: 90 }));
      const stats = getAssetStats();
      expect(stats.total).toBe(2);
      expect(stats.byFormat.GLB).toBe(1);
      expect(stats.byFormat.glTF).toBe(1);
      expect(stats.byMonument.gp).toBe(1);
      expect(stats.averageConfidence).toBe(85);
    });
  });

  describe('validateAssetEndpoint', () => {
    it('validates an asset and returns errors array', () => {
      const result = validateAssetEndpoint({
        assetId: 'test-001',
        format: 'glTF',
        filePath: '/assets/test.glb',
        assetClass: 'Hero',
        evidenceIds: ['EV-001'],
        metadata: {
          assetId: 'test-001',
          version: 1,
          monumentId: 'great-pyramid',
          evidenceIds: ['EV-001'],
          confidence: 80,
          author: 'Test',
        },
      } as never);
      expect(result).toBeDefined();
      expect(result.errors).toBeDefined();
      expect(Array.isArray(result.errors)).toBe(true);
    });
  });
});
