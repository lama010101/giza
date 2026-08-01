/**
 * End-to-end integration test for the asset pipeline per M06A-T14 and M06.5-T09.
 *
 * Tests the full flow: raw asset → validation → optimization → packaging →
 * publishing → asset API registration → retrieval.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  runPipeline,
  runBatchPipeline,
  recordHistory,
  clearPublishingHistory,
  type AssetInput,
} from '@/loaders/publishingPipeline';
import {
  registerAsset,
  getAsset,
  listAssets,
  getAssetStats,
  clearAssetStore,
  type AssetRecord,
} from '@/loaders/assetApi';
import { parseGLTF, type GLTFDocument } from '@/loaders/gltfLoader';

function makeValidAsset(id = 'e2e-001'): AssetInput {
  return {
    assetId: id,
    version: 1,
    monumentId: 'great-pyramid',
    locationId: 'LOC-001',
    objectId: 'kings-chamber',
    format: 'glTF',
    filePath: `/assets/${id}.glb`,
    assetClass: 'Hero',
    lodLevel: 'LOD0',
    triangleCount: 50000,
    textureFormat: 'KTX2',
    hasNormals: true,
    hasUVs: true,
    license: 'CC-BY-4.0',
    evidenceIds: ['EV-001'],
    sourceIds: ['SRC-001'],
    metadata: {
      assetId: id,
      version: 1,
      monumentId: 'great-pyramid',
      locationId: 'LOC-001',
      objectId: 'kings-chamber',
      evidenceIds: ['EV-001'],
      sourceIds: ['SRC-001'],
      chronologyTags: ['old-kingdom'],
      confidence: 85,
      confidenceBasis: 'survey',
      coordinateLayer: 'monument',
      author: 'E2E Test',
      approvedBy: 'Reviewer',
    },
  } as unknown as AssetInput;
}

function makeGLTFWithExtras(): GLTFDocument {
  return {
    asset: { version: '2.0', generator: 'e2e-test' },
    scenes: [{ nodes: [0] }],
    scene: 0,
    nodes: [
      {
        name: 'KingsChamber',
        mesh: 0,
        extras: {
          giza: {
            evidenceIds: ['EV-001'],
            confidence: 85,
            interactive: true,
            layer: 'kings-complex',
          },
        },
      },
    ],
    meshes: [{ name: 'ChamberMesh', primitives: [{ attributes: { POSITION: 0 } }] }],
  };
}

describe('Asset Pipeline E2E Integration (M06A-T14, M06.5-T09)', () => {
  beforeEach(() => {
    clearPublishingHistory();
    clearAssetStore();
  });

  describe('Full pipeline flow', () => {
    it('runs the full publishing pipeline for a valid asset', () => {
      const asset = makeValidAsset('e2e-full-001');
      const result = runPipeline(asset);

      expect(result.success).toBe(true);
      expect(result.stages).toHaveLength(4);
      expect(result.stages.map((s) => s.stage)).toEqual([
        'Validate',
        'Optimize',
        'Package',
        'Publish',
      ]);
    });

    it('records pipeline result in history', () => {
      const asset = makeValidAsset('e2e-hist-001');
      const result = runPipeline(asset);
      recordHistory(result);

      expect(result.success).toBe(true);
    });

    it('runs batch pipeline for multiple assets', () => {
      const assets = [makeValidAsset('e2e-batch-001'), makeValidAsset('e2e-batch-002')];
      const batch = runBatchPipeline(assets);

      expect(batch.results).toHaveLength(2);
      expect(batch.successCount).toBe(2);
      expect(batch.failureCount).toBe(0);
    });
  });

  describe('glTF loader integration', () => {
    it('parses glTF with GIZA extras and validates metadata', () => {
      const gltf = makeGLTFWithExtras();
      const result = parseGLTF(gltf, 'gltf');

      expect(result.nodeCount).toBe(1);
      expect(result.nodes[0].giza).not.toBeNull();
      expect(result.nodes[0].giza?.evidenceIds).toEqual(['EV-001']);

      // Node metadata validation (not asset-level validation)
      expect(result.nodes[0].validation.passed).toBe(true);
    });
  });

  describe('Asset API integration', () => {
    it('registers and retrieves an asset via the API', () => {
      const record: AssetRecord = {
        assetId: 'e2e-api-001',
        version: 1,
        monumentId: 'great-pyramid',
        objectId: 'kings-chamber',
        status: 'published',
        publishedAt: new Date().toISOString(),
        format: 'GLB',
        lodLevels: 3,
        evidenceIds: ['EV-001'],
        confidence: 85,
        author: 'E2E Test',
      };
      registerAsset(record);

      const detail = getAsset('e2e-api-001');
      expect(detail).not.toBeNull();
      expect(detail!.asset.monumentId).toBe('great-pyramid');
      expect(detail!.downloadUrl).toContain('e2e-api-001');
    });

    it('lists assets with filtering', () => {
      registerAsset({
        assetId: 'e2e-list-001',
        version: 1,
        monumentId: 'great-pyramid',
        status: 'published',
        format: 'GLB',
        evidenceIds: [],
        confidence: 80,
        author: 'Test',
      });
      registerAsset({
        assetId: 'e2e-list-002',
        version: 1,
        monumentId: 'osiris-shaft',
        status: 'published',
        format: 'glTF',
        evidenceIds: [],
        confidence: 90,
        author: 'Test',
      });

      const gpAssets = listAssets({ monumentId: 'great-pyramid' });
      expect(gpAssets.assets).toHaveLength(1);
      expect(gpAssets.assets[0].assetId).toBe('e2e-list-001');
    });

    it('gets asset statistics', () => {
      registerAsset({
        assetId: 'e2e-stats-001',
        version: 1,
        monumentId: 'great-pyramid',
        status: 'published',
        format: 'GLB',
        evidenceIds: [],
        confidence: 80,
        author: 'Test',
      });
      registerAsset({
        assetId: 'e2e-stats-002',
        version: 1,
        monumentId: 'great-pyramid',
        status: 'failed',
        format: 'GLB',
        evidenceIds: [],
        confidence: 50,
        author: 'Test',
      });

      const stats = getAssetStats();
      expect(stats.total).toBe(2);
      expect(stats.published).toBe(1);
      expect(stats.failed).toBe(1);
      expect(stats.byMonument['great-pyramid']).toBe(2);
    });
  });

  describe('Cross-pipeline integration', () => {
    it('runs pipeline then registers result in asset API', () => {
      const asset = makeValidAsset('e2e-cross-001');
      const result = runPipeline(asset);

      expect(result.success).toBe(true);

      // Register in asset API
      const record: AssetRecord = {
        assetId: asset.assetId,
        version: 1,
        monumentId: 'great-pyramid',
        objectId: 'kings-chamber',
        status: 'published',
        publishedAt: result.completedAt,
        format: 'GLB',
        lodLevels: (result.manifest as { lodCount?: number } | undefined)?.lodCount,
        evidenceIds: ['EV-001'],
        confidence: 85,
        author: 'E2E Test',
        approvedBy: 'Reviewer',
      };
      registerAsset(record);

      // Retrieve via API
      const detail = getAsset(asset.assetId);
      expect(detail).not.toBeNull();
      expect(detail!.asset.status).toBe('published');
    });
  });
});
