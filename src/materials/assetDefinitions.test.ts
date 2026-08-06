import { describe, it, expect } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  ALL_VARIANTS,
  getRubbleVariants,
  getLimestoneVariants,
  getGraniteVariants,
  getVariantsByBaseMaterial,
  getVariantById,
  getOsirisAssets,
  getAssetById,
  getAssetsByMonument,
  getAssetsByLocation,
  getAllAssets,
  validateAssetDefinition,
  validateAllAssets,
} from './assetDefinitions';

describe('Material Variants', () => {
  it('has exactly 5 rubble variants', () => {
    expect(getRubbleVariants()).toHaveLength(5);
  });

  it('has exactly 3 limestone variants', () => {
    expect(getLimestoneVariants()).toHaveLength(3);
  });

  it('has exactly 2 granite variants', () => {
    expect(getGraniteVariants()).toHaveLength(2);
  });

  it('has 10 total variants', () => {
    expect(ALL_VARIANTS).toHaveLength(10);
  });

  it('each variant references a valid base material', () => {
    const validMaterials = [
      'MAT_TuraLimestone',
      'MAT_LocalLimestone',
      'MAT_AswanGranite',
      'MAT_Basalt',
      'MAT_Water',
    ];
    for (const v of ALL_VARIANTS) {
      expect(validMaterials).toContain(v.baseMaterialId);
    }
  });

  it('each variant has unique ID', () => {
    const ids = ALL_VARIANTS.map((v) => v.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('getVariantById returns variant or undefined', () => {
    expect(getVariantById('VAR_Rubble_01')?.name).toContain('Loose Fragments');
    expect(getVariantById('VAR_Nonexistent')).toBeUndefined();
  });

  it('getVariantsByBaseMaterial filters correctly', () => {
    const limestoneVariants = getVariantsByBaseMaterial('MAT_LocalLimestone');
    expect(limestoneVariants.length).toBeGreaterThanOrEqual(5);
    expect(limestoneVariants.every((v) => v.baseMaterialId === 'MAT_LocalLimestone')).toBe(true);
  });
});

describe('Osiris Asset Definitions', () => {
  it('has assets for all Osiris Shaft elements', () => {
    const assets = getOsirisAssets();
    expect(assets.length).toBeGreaterThanOrEqual(9);
  });

  it('each asset has evidence linkage', () => {
    for (const asset of getOsirisAssets()) {
      expect(asset.evidenceIds.length).toBeGreaterThan(0);
    }
  });

  it('each asset has source linkage', () => {
    for (const asset of getOsirisAssets()) {
      expect(asset.sourceIds.length).toBeGreaterThan(0);
      for (const sourceId of asset.sourceIds) {
        expect(sourceId).toMatch(/^SRC-\d{4}$/);
      }
    }
  });

  it('each asset has confidence in valid range', () => {
    for (const asset of getOsirisAssets()) {
      expect(asset.confidence).toBeGreaterThanOrEqual(0);
      expect(asset.confidence).toBeLessThanOrEqual(100);
    }
  });

  it('each asset has at least one LOD', () => {
    for (const asset of getOsirisAssets()) {
      expect(asset.lods.length).toBeGreaterThan(0);
    }
  });

  it('each asset references a valid material', () => {
    const validMaterials = [
      'MAT_TuraLimestone',
      'MAT_LocalLimestone',
      'MAT_AswanGranite',
      'MAT_Basalt',
      'MAT_Water',
    ];
    for (const asset of getOsirisAssets()) {
      expect(validMaterials).toContain(asset.materialId);
    }
  });

  it('sarcophagus uses Basalt material', () => {
    const sarcophagus = getAssetById('OS-Level3-Sarcophagus-LOD0');
    expect(sarcophagus?.materialId).toBe('MAT_Basalt');
  });

  it('getAssetsByMonument filters correctly', () => {
    const osAssets = getAssetsByMonument('OS');
    expect(osAssets.length).toBeGreaterThanOrEqual(9);
    expect(osAssets.every((a) => a.monument === 'OS')).toBe(true);
  });

  it('getAssetsByLocation filters correctly', () => {
    const level3 = getAssetsByLocation('Level3');
    expect(level3.length).toBeGreaterThanOrEqual(4);
    expect(level3.every((a) => a.location === 'Level3')).toBe(true);
  });

  it('Hero assets have LOD0 through LOD3', () => {
    const heroAssets = getOsirisAssets().filter((a) => a.objectClass === 'Hero');
    for (const asset of heroAssets) {
      expect(asset.lods).toContain('LOD0');
      expect(asset.lods).toContain('LOD3');
    }
  });
});

interface GlbJson {
  nodes?: { extras?: { giza?: Record<string, unknown> } }[];
}

function parseGLBJson(filePath: string): GlbJson {
  const data = readFileSync(filePath);
  const view = new DataView(data.buffer, data.byteOffset, 20);
  const magic = new TextDecoder().decode(data.subarray(0, 4));
  if (magic !== 'glTF') {
    throw new Error(`Not a GLB: ${filePath}`);
  }
  const chunkLength = view.getUint32(12, true);
  const jsonBytes = data.subarray(20, 20 + chunkLength);
  const jsonStr = new TextDecoder().decode(jsonBytes);
  return JSON.parse(jsonStr) as GlbJson;
}

describe('Asset GLB production files', () => {
  it('each Osiris asset has a generated .glb file with DoSD metadata', () => {
    for (const asset of getOsirisAssets()) {
      expect(asset.filePath).toBeDefined();
      const fullPath = resolve(process.cwd(), asset.filePath!);
      expect(existsSync(fullPath)).toBe(true);

      const gltf = parseGLBJson(fullPath);
      const first = gltf.nodes?.[0];
      const extras = first?.extras?.giza;
      expect(extras).toBeDefined();
      expect(extras?.assetId).toBe(asset.id);
      expect(extras?.evidenceIds).toEqual(asset.evidenceIds);
      expect(extras?.sourceIds).toEqual(asset.sourceIds);
      expect(extras?.confidence).toBe(asset.confidence);
      expect(extras?.materialId).toBe(asset.materialId);
    }
  });
});

describe('Asset Definition of Scientific Done (DoSD)', () => {
  it('validateAssetDefinition accepts a valid asset', () => {
    const asset = getAllAssets()[0];
    const result = validateAssetDefinition(asset);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('validateAssetDefinition rejects an asset missing evidence or sources', () => {
    const result = validateAssetDefinition({
      id: 'TEST-Invalid',
      name: 'Invalid Asset',
      monument: 'OS',
      location: 'Level3',
      objectClass: 'Standard',
      materialId: 'MAT_LocalLimestone',
      evidenceIds: [],
      sourceIds: [],
      confidence: 50,
      lods: ['LOD0'],
    });
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThanOrEqual(2);
  });

  it('validateAllAssets confirms every produced asset satisfies DoSD', () => {
    const { valid, errors } = validateAllAssets();
    expect(valid).toBe(true);
    expect(errors).toEqual([]);
  });
});
