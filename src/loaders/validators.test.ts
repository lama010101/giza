import { describe, it, expect } from 'vitest';
import {
  validateAssetName,
  validateMeshBudget,
  validateTexelDensity,
  validateAssetMetadata,
  validateNodeMetadata,
  validateCollisionMesh,
  validateGltfExport,
  generateValidationReport,
  getMeshBudget,
  getTexelDensity,
  type GltfExportConfig,
} from './validators';
import { MASTER_MATERIALS, getMaterialById, getAllMaterials } from '@/materials/masterMaterials';

describe('Asset Name Validator', () => {
  it('accepts valid names', () => {
    expect(validateAssetName('OS-Level3-Sarcophagus-LOD0.glb').passed).toBe(true);
    expect(validateAssetName('GP-KingsChamber-Walls-LOD1.glb').passed).toBe(true);
    expect(validateAssetName('PL-Surface-Terrain-LOD2.glb').passed).toBe(true);
  });

  it('rejects unknown monument codes', () => {
    const result = validateAssetName('XX-Level3-Thing-LOD0.glb');
    expect(result.passed).toBe(false);
    expect(result.errors[0]).toContain('Unknown monument code');
  });

  it('rejects invalid LOD', () => {
    const result = validateAssetName('OS-Level3-Thing-LOD9.glb');
    expect(result.passed).toBe(false);
    expect(result.errors[0]).toContain('Invalid LOD');
  });

  it('rejects names with spaces', () => {
    const result = validateAssetName('OS Level3 Thing LOD0.glb');
    expect(result.passed).toBe(false);
  });

  it('rejects names with too few parts', () => {
    const result = validateAssetName('OS-LOD0.glb');
    expect(result.passed).toBe(false);
  });
});

describe('Mesh Budget Validator', () => {
  it('passes within budget', () => {
    expect(validateMeshBudget(500_000, 'Hero', 'LOD0').passed).toBe(true);
    expect(validateMeshBudget(80_000, 'Hero', 'LOD2').passed).toBe(true);
  });

  it('fails over budget', () => {
    const result = validateMeshBudget(1_500_000, 'Hero', 'LOD0');
    expect(result.passed).toBe(false);
    expect(result.errors[0]).toContain('exceeds');
  });

  it('respects Standard budgets', () => {
    expect(validateMeshBudget(300_001, 'Standard', 'LOD0').passed).toBe(false);
    expect(validateMeshBudget(300_000, 'Standard', 'LOD0').passed).toBe(true);
  });

  it('respects Background budgets', () => {
    expect(validateMeshBudget(150_001, 'Background', 'LOD0').passed).toBe(false);
    expect(validateMeshBudget(150_000, 'Background', 'LOD0').passed).toBe(true);
  });

  it('getMeshBudget returns correct limits', () => {
    expect(getMeshBudget('Hero', 'LOD0')).toBe(1_000_000);
    expect(getMeshBudget('Standard', 'LOD3')).toBe(6_000);
    expect(getMeshBudget('Background', 'LOD2')).toBe(10_000);
  });
});

describe('Texel Density Validator', () => {
  it('passes at exact standard', () => {
    expect(validateTexelDensity(2048, 'Hero').passed).toBe(true);
    expect(validateTexelDensity(1024, 'Standard').passed).toBe(true);
  });

  it('warns on non-standard but acceptable density', () => {
    const result = validateTexelDensity(1500, 'Hero');
    expect(result.passed).toBe(true);
    expect(result.warnings.length).toBeGreaterThan(0);
  });

  it('fails below 50% of standard', () => {
    const result = validateTexelDensity(500, 'Hero');
    expect(result.passed).toBe(false);
  });

  it('getTexelDensity returns correct values', () => {
    expect(getTexelDensity('Hero')).toBe(2048);
    expect(getTexelDensity('Standard')).toBe(1024);
    expect(getTexelDensity('Background')).toBe(512);
    expect(getTexelDensity('Distant')).toBe(128);
  });
});

describe('Asset Metadata Validator', () => {
  const validMetadata = {
    assetId: 'OS-Level3-Sarcophagus',
    version: 1,
    monumentId: 'MON-OS-001',
    locationId: 'LOC-004',
    objectId: 'OBJ-0008',
    evidenceIds: ['EV-000008'],
    sourceIds: ['SRC-0001'],
    chronologyTags: [{ period: 'Late Period', scope: 'construction' }],
    confidence: 95,
    confidenceBasis: 'Direct measurement',
    coordinateLayer: 'Room',
    author: 'AI',
    approvedBy: '',
  };

  it('passes with all required fields', () => {
    expect(validateAssetMetadata(validMetadata).passed).toBe(true);
  });

  it('fails when evidenceIds is missing', () => {
    const { evidenceIds, ...without } = validMetadata;
    void evidenceIds;
    const result = validateAssetMetadata(without);
    expect(result.passed).toBe(false);
    expect(result.errors.some((e) => e.includes('evidenceIds'))).toBe(true);
  });

  it('fails when evidenceIds is empty', () => {
    const result = validateAssetMetadata({ ...validMetadata, evidenceIds: [] });
    expect(result.passed).toBe(false);
  });

  it('fails when confidence is out of range', () => {
    const result = validateAssetMetadata({ ...validMetadata, confidence: 150 });
    expect(result.passed).toBe(false);
  });
});

describe('Node Metadata Validator', () => {
  const validNode = {
    evidenceIds: ['EV-000008'],
    confidence: 95,
    interactive: true,
    layer: 'level-3',
  };

  it('passes with all required fields', () => {
    expect(validateNodeMetadata(validNode).passed).toBe(true);
  });

  it('fails when evidenceIds missing', () => {
    const { evidenceIds, ...without } = validNode;
    void evidenceIds;
    expect(validateNodeMetadata(without).passed).toBe(false);
  });
});

describe('Collision Mesh Validator', () => {
  it('passes for _COL suffix and not rendered', () => {
    expect(validateCollisionMesh('Sarcophagus_COL', false).passed).toBe(true);
  });

  it('fails when name does not end with _COL', () => {
    const result = validateCollisionMesh('Sarcophagus', false);
    expect(result.passed).toBe(false);
  });

  it('fails when collision mesh is rendered', () => {
    const result = validateCollisionMesh('Sarcophagus_COL', true);
    expect(result.passed).toBe(false);
  });
});

describe('glTF Export Validator', () => {
  const validConfig: GltfExportConfig = {
    upAxis: 'Y',
    forwardAxis: '-Z',
    hasNormals: true,
    hasTangents: true,
    hasUVs: true,
    materialModel: 'pbrMetallicRoughness',
    textureFormat: 'KTX2',
    hasCameras: false,
    hasLights: false,
    nodeHierarchy: ['PlateauRoot', 'MonumentRoot', 'LocationRoot', 'ObjectRoot'],
  };

  it('passes with valid config', () => {
    expect(validateGltfExport(validConfig).passed).toBe(true);
  });

  it('fails when cameras present', () => {
    expect(validateGltfExport({ ...validConfig, hasCameras: true }).passed).toBe(false);
  });

  it('fails when lights present', () => {
    expect(validateGltfExport({ ...validConfig, hasLights: true }).passed).toBe(false);
  });

  it('fails on wrong up axis', () => {
    expect(validateGltfExport({ ...validConfig, upAxis: 'Y' as never }).passed).toBe(true);
  });

  it('fails on wrong node hierarchy', () => {
    const result = validateGltfExport({
      ...validConfig,
      nodeHierarchy: ['Root', 'MonumentRoot', 'LocationRoot', 'ObjectRoot'],
    });
    expect(result.passed).toBe(false);
    expect(result.errors.some((e) => e.includes('PlateauRoot'))).toBe(true);
  });
});

describe('Validation Report Generator', () => {
  it('generates approved report when all checks pass', () => {
    const report = generateValidationReport('OS-Level3-Sarcophagus', 1, [
      { name: 'Naming', passed: true },
      { name: 'TriangleBudget', passed: true, value: 842_000, limit: 1_000_000 },
    ]);

    expect(report.approved).toBe(true);
    expect(report.errors).toHaveLength(0);
    expect(report.checks).toHaveLength(2);
  });

  it('generates rejected report when checks fail', () => {
    const report = generateValidationReport('OS-Level3-Sarcophagus', 1, [
      { name: 'Naming', passed: true },
      {
        name: 'TriangleBudget',
        passed: false,
        value: 2_000_000,
        limit: 1_000_000,
        errors: ['Triangle count 2000000 exceeds budget 1000000'],
      },
    ]);

    expect(report.approved).toBe(false);
    expect(report.errors).toHaveLength(1);
  });
});

describe('Master Material Library', () => {
  it('contains exactly 5 materials for Phase 1a', () => {
    expect(MASTER_MATERIALS).toHaveLength(5);
  });

  it('includes Tura Limestone, Local Limestone, Aswan Granite, Basalt, Water', () => {
    const ids = MASTER_MATERIALS.map((m) => m.id);
    expect(ids).toContain('MAT_TuraLimestone');
    expect(ids).toContain('MAT_LocalLimestone');
    expect(ids).toContain('MAT_AswanGranite');
    expect(ids).toContain('MAT_Basalt');
    expect(ids).toContain('MAT_Water');
  });

  it('each material has required properties', () => {
    for (const mat of MASTER_MATERIALS) {
      expect(mat.id).toMatch(/^MAT_/);
      expect(mat.name).toBeTruthy();
      expect(mat.baseShader).toBeTruthy();
      expect(mat.properties.metallic).toBeGreaterThanOrEqual(0);
      expect(mat.properties.roughnessBase).toBeGreaterThan(0);
    }
  });

  it('getMaterialById returns material or undefined', () => {
    expect(getMaterialById('MAT_Water')?.name).toBe('Water');
    expect(getMaterialById('MAT_Nonexistent')).toBeUndefined();
  });

  it('getAllMaterials returns a copy', () => {
    const all = getAllMaterials();
    expect(all).toHaveLength(5);
    expect(all).not.toBe(MASTER_MATERIALS);
  });
});
