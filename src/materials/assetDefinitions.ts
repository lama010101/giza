import type { MasterMaterial } from '@/materials/masterMaterials';

export interface MaterialVariant {
  id: string;
  baseMaterialId: string;
  name: string;
  overrides: Partial<MasterMaterial['properties']>;
  colorTint?: string;
}

export interface AssetDefinition {
  id: string;
  name: string;
  monument: string;
  location: string;
  objectClass: 'Hero' | 'Standard' | 'Background';
  materialId: string;
  evidenceIds: string[];
  sourceIds: string[];
  confidence: number;
  lods: string[];
}

const RUBBLE_VARIANTS: MaterialVariant[] = [
  {
    id: 'VAR_Rubble_01',
    baseMaterialId: 'MAT_LocalLimestone',
    name: 'Rubble — Loose Fragments',
    overrides: { roughnessBase: 0.9 },
    colorTint: '#8a7a55',
  },
  {
    id: 'VAR_Rubble_02',
    baseMaterialId: 'MAT_LocalLimestone',
    name: 'Rubble — Compacted Debris',
    overrides: { roughnessBase: 0.85 },
    colorTint: '#7a6a45',
  },
  {
    id: 'VAR_Rubble_03',
    baseMaterialId: 'MAT_LocalLimestone',
    name: 'Rubble — Weathered Chips',
    overrides: { roughnessBase: 0.92 },
    colorTint: '#9a8a65',
  },
  {
    id: 'VAR_Rubble_04',
    baseMaterialId: 'MAT_LocalLimestone',
    name: 'Rubble — Mixed Dust',
    overrides: { roughnessBase: 0.95 },
    colorTint: '#a09870',
  },
  {
    id: 'VAR_Rubble_05',
    baseMaterialId: 'MAT_LocalLimestone',
    name: 'Rubble — Wet Debris',
    overrides: { roughnessBase: 0.7 },
    colorTint: '#6a5a35',
  },
];

const LIMESTONE_VARIANTS: MaterialVariant[] = [
  {
    id: 'VAR_Limestone_01',
    baseMaterialId: 'MAT_TuraLimestone',
    name: 'Limestone — Fine Casing',
    overrides: { roughnessBase: 0.45 },
  },
  {
    id: 'VAR_Limestone_02',
    baseMaterialId: 'MAT_LocalLimestone',
    name: 'Limestone — Rough Core Blocks',
    overrides: { roughnessBase: 0.8 },
  },
  {
    id: 'VAR_Limestone_03',
    baseMaterialId: 'MAT_LocalLimestone',
    name: 'Limestone — Weathered Surface',
    overrides: { roughnessBase: 0.88 },
    colorTint: '#b0a080',
  },
];

const GRANITE_VARIANTS: MaterialVariant[] = [
  {
    id: 'VAR_Granite_01',
    baseMaterialId: 'MAT_AswanGranite',
    name: 'Granite — Polished Surface',
    overrides: { roughnessBase: 0.3 },
  },
  {
    id: 'VAR_Granite_02',
    baseMaterialId: 'MAT_AswanGranite',
    name: 'Granite — Rough Hewn',
    overrides: { roughnessBase: 0.75 },
  },
];

export const ALL_VARIANTS: MaterialVariant[] = [
  ...RUBBLE_VARIANTS,
  ...LIMESTONE_VARIANTS,
  ...GRANITE_VARIANTS,
];

export function getVariantsByBaseMaterial(baseMaterialId: string): MaterialVariant[] {
  return ALL_VARIANTS.filter((v) => v.baseMaterialId === baseMaterialId);
}

export function getVariantById(id: string): MaterialVariant | undefined {
  return ALL_VARIANTS.find((v) => v.id === id);
}

export function getRubbleVariants(): MaterialVariant[] {
  return [...RUBBLE_VARIANTS];
}

export function getLimestoneVariants(): MaterialVariant[] {
  return [...LIMESTONE_VARIANTS];
}

export function getGraniteVariants(): MaterialVariant[] {
  return [...GRANITE_VARIANTS];
}

const OSIRIS_ASSETS: AssetDefinition[] = [
  {
    id: 'OS-Level1-ChamberA-LOD0',
    name: 'Chamber A',
    monument: 'OS',
    location: 'Level1',
    objectClass: 'Standard',
    materialId: 'MAT_LocalLimestone',
    evidenceIds: ['EV-000002'],
    sourceIds: ['SRC-0001'],
    confidence: 97,
    lods: ['LOD0', 'LOD1', 'LOD2'],
  },
  {
    id: 'OS-Level2-ChamberB-LOD0',
    name: 'Chamber B',
    monument: 'OS',
    location: 'Level2',
    objectClass: 'Standard',
    materialId: 'MAT_LocalLimestone',
    evidenceIds: ['EV-000004'],
    sourceIds: ['SRC-0001'],
    confidence: 97,
    lods: ['LOD0', 'LOD1', 'LOD2'],
  },
  {
    id: 'OS-Level3-ChamberI-LOD0',
    name: 'Chamber I',
    monument: 'OS',
    location: 'Level3',
    objectClass: 'Hero',
    materialId: 'MAT_LocalLimestone',
    evidenceIds: ['EV-000006', 'EV-000011'],
    sourceIds: ['SRC-0001'],
    confidence: 97,
    lods: ['LOD0', 'LOD1', 'LOD2', 'LOD3'],
  },
  {
    id: 'OS-Level3-CentralIsland-LOD0',
    name: 'Central Island',
    monument: 'OS',
    location: 'Level3',
    objectClass: 'Hero',
    materialId: 'MAT_LocalLimestone',
    evidenceIds: ['EV-000007'],
    sourceIds: ['SRC-0001'],
    confidence: 96,
    lods: ['LOD0', 'LOD1', 'LOD2', 'LOD3'],
  },
  {
    id: 'OS-Level3-Sarcophagus-LOD0',
    name: 'Basalt Sarcophagus',
    monument: 'OS',
    location: 'Level3',
    objectClass: 'Hero',
    materialId: 'MAT_Basalt',
    evidenceIds: ['EV-000008'],
    sourceIds: ['SRC-0001', 'SRC-0002'],
    confidence: 95,
    lods: ['LOD0', 'LOD1', 'LOD2', 'LOD3'],
  },
  {
    id: 'OS-Level3-NorthernConduit-LOD0',
    name: 'Northern Conduit',
    monument: 'OS',
    location: 'Level3',
    objectClass: 'Standard',
    materialId: 'MAT_LocalLimestone',
    evidenceIds: ['EV-000009'],
    sourceIds: ['SRC-0001'],
    confidence: 83,
    lods: ['LOD0', 'LOD1'],
  },
  {
    id: 'OS-Shafts-ShaftA-LOD0',
    name: 'Shaft A',
    monument: 'OS',
    location: 'Shafts',
    objectClass: 'Standard',
    materialId: 'MAT_LocalLimestone',
    evidenceIds: ['EV-000001', 'EV-000010'],
    sourceIds: ['SRC-0001'],
    confidence: 98,
    lods: ['LOD0', 'LOD1', 'LOD2'],
  },
  {
    id: 'OS-Shafts-ShaftB-LOD0',
    name: 'Shaft B',
    monument: 'OS',
    location: 'Shafts',
    objectClass: 'Standard',
    materialId: 'MAT_LocalLimestone',
    evidenceIds: ['EV-000003', 'EV-000010'],
    sourceIds: ['SRC-0001'],
    confidence: 98,
    lods: ['LOD0', 'LOD1', 'LOD2'],
  },
  {
    id: 'OS-Shafts-ShaftC-LOD0',
    name: 'Shaft C',
    monument: 'OS',
    location: 'Shafts',
    objectClass: 'Standard',
    materialId: 'MAT_LocalLimestone',
    evidenceIds: ['EV-000005', 'EV-000010'],
    sourceIds: ['SRC-0001'],
    confidence: 98,
    lods: ['LOD0', 'LOD1', 'LOD2'],
  },
  {
    id: 'OS-Level3-ChamberIWater-LOD0',
    name: 'Chamber I Water Surface',
    monument: 'OS',
    location: 'Level3',
    objectClass: 'Background',
    materialId: 'MAT_Water',
    evidenceIds: ['EV-000011'],
    sourceIds: ['SRC-0001'],
    confidence: 50,
    lods: ['LOD0'],
  },
  {
    id: 'OS-Surface-Bedrock-LOD0',
    name: 'Surface Bedrock',
    monument: 'OS',
    location: 'Surface',
    objectClass: 'Background',
    materialId: 'MAT_LocalLimestone',
    evidenceIds: ['EV-000020'],
    sourceIds: ['SRC-0001'],
    confidence: 100,
    lods: ['LOD0', 'LOD1'],
  },
  {
    id: 'OS-Surface-Entrance-LOD0',
    name: 'Surface Entrance Opening',
    monument: 'OS',
    location: 'Surface',
    objectClass: 'Standard',
    materialId: 'MAT_LocalLimestone',
    evidenceIds: ['EV-000022'],
    sourceIds: ['SRC-0001'],
    confidence: 95,
    lods: ['LOD0', 'LOD1'],
  },
];

export function getOsirisAssets(): AssetDefinition[] {
  return [...OSIRIS_ASSETS];
}

export function getAssetById(id: string): AssetDefinition | undefined {
  return OSIRIS_ASSETS.find((a) => a.id === id);
}

export function getAssetsByMonument(monument: string): AssetDefinition[] {
  return OSIRIS_ASSETS.filter((a) => a.monument === monument);
}

export function getAssetsByLocation(location: string): AssetDefinition[] {
  return OSIRIS_ASSETS.filter((a) => a.location === location);
}
