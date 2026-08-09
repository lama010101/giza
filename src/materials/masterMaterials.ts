export interface MicroDetailConfig {
  /** Edge erosion intensity (0-1). Darkens and roughens block edges. */
  erosion: number;
  /** Mineral streak intensity (0-1). Adds subtle colored streaks. */
  mineralStreaks: number;
  /** Micro-crack density/intensity (0-1). Darkens thin fracture lines. */
  microCracks: number;
  /** Dust/deposit accumulation intensity (0-1). Lightens recessed areas. */
  dust: number;
  /** Evidence IDs supporting the procedural detail parameters. */
  evidenceRefs: string[];
}

export interface MasterMaterial {
  id: string;
  name: string;
  baseShader: string;
  maps: {
    albedo?: string;
    normal?: string;
    roughness?: string;
    ambientOcclusion?: string;
  };
  properties: {
    metallic: number;
    roughnessBase: number;
    subsurface: number;
  };
  evidenceRefs: string[];
  /** Optional procedural micro-detail parameters for stone shaders (M09-T15). */
  microDetail?: MicroDetailConfig;
}

/**
 * Core master material library (M06A, Phase 1a reduced).
 * Kept at exactly 5 entries; benchmark and M06A tests rely on this count.
 */
export const MASTER_MATERIALS: MasterMaterial[] = [
  {
    id: 'MAT_TuraLimestone',
    name: 'Tura Limestone (casing)',
    baseShader: 'Stone',
    maps: {
      albedo: 'MAT_TuraLimestone_albedo.ktx2',
      normal: 'MAT_TuraLimestone_normal.ktx2',
      roughness: 'MAT_TuraLimestone_roughness.ktx2',
      ambientOcclusion: 'MAT_TuraLimestone_ao.ktx2',
    },
    properties: {
      metallic: 0.0,
      roughnessBase: 0.55,
      subsurface: 0.0,
    },
    evidenceRefs: ['EV-000020'],
    microDetail: {
      erosion: 0.25,
      mineralStreaks: 0.15,
      microCracks: 0.1,
      dust: 0.05,
      evidenceRefs: ['EV-000020'],
    },
  },
  {
    id: 'MAT_LocalLimestone',
    name: 'Local Limestone (core)',
    baseShader: 'Stone',
    maps: {
      albedo: 'MAT_LocalLimestone_albedo.ktx2',
      normal: 'MAT_LocalLimestone_normal.ktx2',
      roughness: 'MAT_LocalLimestone_roughness.ktx2',
    },
    properties: {
      metallic: 0.0,
      roughnessBase: 0.75,
      subsurface: 0.0,
    },
    evidenceRefs: ['EV-000020'],
    microDetail: {
      erosion: 0.35,
      mineralStreaks: 0.25,
      microCracks: 0.15,
      dust: 0.1,
      evidenceRefs: ['EV-000020'],
    },
  },
  {
    id: 'MAT_AswanGranite',
    name: 'Aswan Red Granite',
    baseShader: 'Stone',
    maps: {
      albedo: 'MAT_AswanGranite_albedo.ktx2',
      normal: 'MAT_AswanGranite_normal.ktx2',
      roughness: 'MAT_AswanGranite_roughness.ktx2',
      ambientOcclusion: 'MAT_AswanGranite_ao.ktx2',
    },
    properties: {
      metallic: 0.0,
      roughnessBase: 0.65,
      subsurface: 0.0,
    },
    evidenceRefs: ['EV-000012'],
    microDetail: {
      erosion: 0.15,
      mineralStreaks: 0.1,
      microCracks: 0.05,
      dust: 0.02,
      evidenceRefs: ['EV-000012'],
    },
  },
  {
    id: 'MAT_Basalt',
    name: 'Basalt',
    baseShader: 'Stone',
    maps: {
      albedo: 'MAT_Basalt_albedo.ktx2',
      normal: 'MAT_Basalt_normal.ktx2',
      roughness: 'MAT_Basalt_roughness.ktx2',
    },
    properties: {
      metallic: 0.0,
      roughnessBase: 0.5,
      subsurface: 0.0,
    },
    evidenceRefs: ['EV-000008'],
    microDetail: {
      erosion: 0.1,
      mineralStreaks: 0.05,
      microCracks: 0.05,
      dust: 0.02,
      evidenceRefs: ['EV-000008'],
    },
  },
  {
    id: 'MAT_Water',
    name: 'Water',
    baseShader: 'Water',
    maps: {
      albedo: 'MAT_Water_albedo.ktx2',
      normal: 'MAT_Water_normal.ktx2',
      roughness: 'MAT_Water_roughness.ktx2',
    },
    properties: {
      metallic: 0.0,
      roughnessBase: 0.1,
      subsurface: 0.0,
    },
    evidenceRefs: ['EV-000011'],
  },
];

/**
 * Great Pyramid-specific extension materials (M11-T23).
 * These are kept separate from the core M06A library so Phase 1a tests remain valid.
 */
export const GREAT_PYRAMID_MATERIALS: MasterMaterial[] = [
  {
    id: 'MAT_Mortar',
    name: 'Mortar',
    baseShader: 'Stone',
    maps: {
      albedo: 'MAT_Mortar_albedo.ktx2',
      normal: 'MAT_Mortar_normal.ktx2',
      roughness: 'MAT_Mortar_roughness.ktx2',
    },
    properties: {
      metallic: 0.0,
      roughnessBase: 0.95,
      subsurface: 0.0,
    },
    evidenceRefs: [],
  },
  {
    id: 'MAT_GypsumPlaster',
    name: 'Gypsum Plaster',
    baseShader: 'Stone',
    maps: {
      albedo: 'MAT_GypsumPlaster_albedo.ktx2',
      normal: 'MAT_GypsumPlaster_normal.ktx2',
      roughness: 'MAT_GypsumPlaster_roughness.ktx2',
    },
    properties: {
      metallic: 0.0,
      roughnessBase: 0.7,
      subsurface: 0.0,
    },
    evidenceRefs: [],
  },
  {
    id: 'MAT_Bedrock',
    name: 'Bedrock',
    baseShader: 'Stone',
    maps: {
      albedo: 'MAT_Bedrock_albedo.ktx2',
      normal: 'MAT_Bedrock_normal.ktx2',
      roughness: 'MAT_Bedrock_roughness.ktx2',
    },
    properties: {
      metallic: 0.0,
      roughnessBase: 0.95,
      subsurface: 0.0,
    },
    evidenceRefs: [],
  },
  {
    id: 'MAT_WoodModern',
    name: 'Wood (Modern)',
    baseShader: 'Wood',
    maps: {
      albedo: 'MAT_WoodModern_albedo.ktx2',
      normal: 'MAT_WoodModern_normal.ktx2',
      roughness: 'MAT_WoodModern_roughness.ktx2',
    },
    properties: {
      metallic: 0.0,
      roughnessBase: 0.6,
      subsurface: 0.0,
    },
    evidenceRefs: [],
  },
  {
    id: 'MAT_SteelModern',
    name: 'Steel (Modern)',
    baseShader: 'Metal',
    maps: {
      albedo: 'MAT_SteelModern_albedo.ktx2',
      normal: 'MAT_SteelModern_normal.ktx2',
      roughness: 'MAT_SteelModern_roughness.ktx2',
    },
    properties: {
      metallic: 0.8,
      roughnessBase: 0.35,
      subsurface: 0.0,
    },
    evidenceRefs: [],
  },
];

const ALL_MATERIALS: MasterMaterial[] = [...MASTER_MATERIALS, ...GREAT_PYRAMID_MATERIALS];

export function getMaterialById(id: string): MasterMaterial | undefined {
  return ALL_MATERIALS.find((m) => m.id === id);
}

export function getAllMaterials(): MasterMaterial[] {
  return [...MASTER_MATERIALS];
}

export const DEFAULT_PBR = { metalness: 0.1, roughness: 0.85 };

export function getPbrForMaterial(id: string): { metalness: number; roughness: number } {
  const material = getMaterialById(id);
  return material
    ? {
        metalness: material.properties.metallic,
        roughness: material.properties.roughnessBase,
      }
    : DEFAULT_PBR;
}

export function getMicroDetailForMaterial(id: string): MicroDetailConfig | undefined {
  const material = getMaterialById(id);
  return material?.microDetail;
}
