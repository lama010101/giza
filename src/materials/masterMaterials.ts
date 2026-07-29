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
}

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
    evidenceRefs: [],
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
    evidenceRefs: [],
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
    evidenceRefs: [],
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
    evidenceRefs: [],
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

export function getMaterialById(id: string): MasterMaterial | undefined {
  return MASTER_MATERIALS.find((m) => m.id === id);
}

export function getAllMaterials(): MasterMaterial[] {
  return [...MASTER_MATERIALS];
}
