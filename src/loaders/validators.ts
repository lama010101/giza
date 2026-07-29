export const MONUMENT_CODES = ['GP', 'OS', 'KF', 'MK', 'PL'] as const;
export type MonumentCode = (typeof MONUMENT_CODES)[number];

export const LOD_LEVELS = ['LOD0', 'LOD1', 'LOD2', 'LOD3'] as const;
export type LODLevel = (typeof LOD_LEVELS)[number];

export const ASSET_CLASSES = ['Hero', 'Standard', 'Background', 'Distant'] as const;
export type AssetClass = (typeof ASSET_CLASSES)[number];

export interface ValidationResult {
  passed: boolean;
  errors: string[];
  warnings: string[];
}

function ok(): ValidationResult {
  return { passed: true, errors: [], warnings: [] };
}

function fail(...errors: string[]): ValidationResult {
  return { passed: false, errors, warnings: [] };
}

function warn(warnings: string[]): ValidationResult {
  return { passed: true, errors: [], warnings };
}

export function validateAssetName(filename: string): ValidationResult {
  const base = filename.replace(/\.glb$/i, '');

  const parts = base.split('-');
  if (parts.length < 4) {
    return fail(`Asset name "${filename}" must follow <monument>-<location>-<object>-<lod>.glb`);
  }

  const monument = parts[0];
  const lod = parts[parts.length - 1];

  if (!MONUMENT_CODES.includes(monument as MonumentCode)) {
    return fail(`Unknown monument code "${monument}". Valid codes: ${MONUMENT_CODES.join(', ')}`);
  }

  if (!LOD_LEVELS.includes(lod as LODLevel)) {
    return fail(`Invalid LOD "${lod}". Valid levels: ${LOD_LEVELS.join(', ')}`);
  }

  if (/\s/.test(filename)) {
    return fail('Asset names must not contain spaces');
  }

  return ok();
}

const MESH_BUDGETS: Record<AssetClass, Record<LODLevel, number>> = {
  Hero: { LOD0: 1_000_000, LOD1: 300_000, LOD2: 80_000, LOD3: 20_000 },
  Standard: { LOD0: 300_000, LOD1: 100_000, LOD2: 25_000, LOD3: 6_000 },
  Background: { LOD0: 150_000, LOD1: 40_000, LOD2: 10_000, LOD3: 2_000 },
  Distant: { LOD0: 50_000, LOD1: 15_000, LOD2: 5_000, LOD3: 1_000 },
};

export function getMeshBudget(assetClass: AssetClass, lod: LODLevel): number {
  return MESH_BUDGETS[assetClass][lod];
}

export function validateMeshBudget(
  triangleCount: number,
  assetClass: AssetClass,
  lod: LODLevel,
): ValidationResult {
  const limit = getMeshBudget(assetClass, lod);
  if (triangleCount > limit) {
    return fail(`Triangle count ${triangleCount} exceeds ${assetClass} ${lod} budget of ${limit}`);
  }
  return ok();
}

const TEXEL_DENSITIES: Record<AssetClass, number> = {
  Hero: 2048,
  Standard: 1024,
  Background: 512,
  Distant: 128,
};

export function getTexelDensity(assetClass: AssetClass): number {
  return TEXEL_DENSITIES[assetClass];
}

export function validateTexelDensity(
  actualPxPerMeter: number,
  assetClass: AssetClass,
): ValidationResult {
  const expected = getTexelDensity(assetClass);
  if (actualPxPerMeter < expected * 0.5) {
    return fail(
      `Texel density ${actualPxPerMeter}px/m is below ${assetClass} minimum of ${expected * 0.5}px/m`,
    );
  }
  if (actualPxPerMeter !== expected) {
    return warn([
      `Texel density ${actualPxPerMeter}px/m differs from ${assetClass} standard of ${expected}px/m`,
    ]);
  }
  return ok();
}

const ASSET_METADATA_FIELDS = [
  'assetId',
  'version',
  'monumentId',
  'locationId',
  'objectId',
  'evidenceIds',
  'sourceIds',
  'chronologyTags',
  'confidence',
  'confidenceBasis',
  'coordinateLayer',
  'author',
  'approvedBy',
] as const;

const NODE_METADATA_FIELDS = ['evidenceIds', 'confidence', 'interactive', 'layer'] as const;

export function validateAssetMetadata(extras: Record<string, unknown>): ValidationResult {
  const errors: string[] = [];

  for (const field of ASSET_METADATA_FIELDS) {
    if (!(field in extras)) {
      errors.push(`Missing required asset metadata field: ${field}`);
    }
  }

  if (
    'evidenceIds' in extras &&
    (!Array.isArray(extras.evidenceIds) || extras.evidenceIds.length === 0)
  ) {
    errors.push('evidenceIds must be a non-empty array');
  }

  if ('confidence' in extras) {
    const c = extras.confidence;
    if (typeof c !== 'number' || c < 0 || c > 100) {
      errors.push('confidence must be a number between 0 and 100');
    }
  }

  return errors.length > 0 ? fail(...errors) : ok();
}

export function validateNodeMetadata(extras: Record<string, unknown>): ValidationResult {
  const errors: string[] = [];

  for (const field of NODE_METADATA_FIELDS) {
    if (!(field in extras)) {
      errors.push(`Missing required node metadata field: ${field}`);
    }
  }

  if ('confidence' in extras) {
    const c = extras.confidence;
    if (typeof c !== 'number' || c < 0 || c > 100) {
      errors.push('confidence must be a number between 0 and 100');
    }
  }

  return errors.length > 0 ? fail(...errors) : ok();
}

export function validateCollisionMesh(nodeName: string, isRendered: boolean): ValidationResult {
  if (!nodeName.endsWith('_COL')) {
    return fail(`Collision mesh name "${nodeName}" must end with _COL`);
  }

  if (isRendered) {
    return fail(`Collision mesh "${nodeName}" must not be rendered`);
  }

  return ok();
}

export interface GltfExportConfig {
  upAxis: 'Y';
  forwardAxis: '-Z';
  hasNormals: boolean;
  hasTangents: boolean;
  hasUVs: boolean;
  materialModel: 'pbrMetallicRoughness';
  textureFormat: 'KTX2';
  hasCameras: boolean;
  hasLights: boolean;
  nodeHierarchy: string[];
}

export function validateGltfExport(config: GltfExportConfig): ValidationResult {
  const errors: string[] = [];

  if (config.upAxis !== 'Y') errors.push('Up axis must be Y');
  if (config.forwardAxis !== '-Z') errors.push('Forward axis must be -Z');
  if (!config.hasNormals) errors.push('Normals are required');
  if (!config.hasUVs) errors.push('UVs are required');
  if (config.materialModel !== 'pbrMetallicRoughness')
    errors.push('Material model must be pbrMetallicRoughness');
  if (config.textureFormat !== 'KTX2') errors.push('Textures must be KTX2');
  if (config.hasCameras) errors.push('Cameras must not be included');
  if (config.hasLights) errors.push('Lights must not be included');

  const expectedHierarchy = ['PlateauRoot', 'MonumentRoot', 'LocationRoot', 'ObjectRoot'];
  for (let i = 0; i < expectedHierarchy.length; i++) {
    if (config.nodeHierarchy[i] !== expectedHierarchy[i]) {
      errors.push(
        `Node hierarchy position ${i} must be ${expectedHierarchy[i]}, got ${config.nodeHierarchy[i] ?? 'missing'}`,
      );
    }
  }

  return errors.length > 0 ? fail(...errors) : ok();
}

export interface ValidationReport {
  assetId: string;
  version: number;
  date: string;
  checks: { name: string; passed: boolean; value?: number; limit?: number }[];
  warnings: string[];
  errors: string[];
  approved: boolean;
}

export function generateValidationReport(
  assetId: string,
  version: number,
  checks: {
    name: string;
    passed: boolean;
    value?: number;
    limit?: number;
    warnings?: string[];
    errors?: string[];
  }[],
): ValidationReport {
  const warnings: string[] = [];
  const errors: string[] = [];

  for (const check of checks) {
    if (!check.passed && check.errors) {
      errors.push(...check.errors);
    }
    if (check.warnings) {
      warnings.push(...check.warnings);
    }
  }

  return {
    assetId,
    version,
    date: new Date().toISOString(),
    checks: checks.map(({ name, passed, value, limit }) => ({ name, passed, value, limit })),
    warnings,
    errors,
    approved: errors.length === 0,
  };
}
