import { describe, it, expect } from 'vitest';
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
