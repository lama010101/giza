export type SurveySourceType =
  | 'laser_scan'
  | 'photogrammetry'
  | 'published_cad'
  | 'manual_reconstruction';

export type CoverageStatus = 'measured' | 'inferred' | 'unknown';

export interface SurveySource {
  id: string;
  type: SurveySourceType;
  name: string;
  date: string;
  operator: string;
  equipment: string;
  license: string;
  reliability: number;
  sourceId?: string;
}

export interface CoverageEntry {
  monumentId: string;
  region: string;
  status: CoverageStatus;
  surveySourceId: string | null;
  confidence: number;
  notes: string;
}

export interface ManualReconstructionRecord {
  id: string;
  elementName: string;
  monumentId: string;
  assumptions: string[];
  evidenceClass: 'E7' | 'E8';
  confidence: number;
  evidenceIds: string[];
  sourceIds: string[];
}

const SURVEY_REGISTRY: SurveySource[] = [
  {
    id: 'SURV-001',
    type: 'published_cad',
    name: 'Hawass 2007 — Osiris Shaft Plans',
    date: '2007',
    operator: 'Zahi Hawass',
    equipment: 'Published archaeological drawings',
    license: 'Academic',
    reliability: 95,
    sourceId: 'SRC-0001',
  },
  {
    id: 'SURV-002',
    type: 'manual_reconstruction',
    name: 'Manual reconstruction — Northern Conduit',
    date: '2026',
    operator: 'GIZA Team',
    equipment: 'Manual estimation from partial exploration',
    license: 'Internal',
    reliability: 70,
  },
];

const COVERAGE_MAP: CoverageEntry[] = [
  {
    monumentId: 'MON-OS-001',
    region: 'Shaft A',
    status: 'measured',
    surveySourceId: 'SURV-001',
    confidence: 98,
    notes: 'Direct survey in Hawass 2007',
  },
  {
    monumentId: 'MON-OS-001',
    region: 'Chamber A',
    status: 'measured',
    surveySourceId: 'SURV-001',
    confidence: 97,
    notes: 'Direct survey in Hawass 2007',
  },
  {
    monumentId: 'MON-OS-001',
    region: 'Shaft B',
    status: 'measured',
    surveySourceId: 'SURV-001',
    confidence: 98,
    notes: 'Direct survey in Hawass 2007',
  },
  {
    monumentId: 'MON-OS-001',
    region: 'Chamber B',
    status: 'measured',
    surveySourceId: 'SURV-001',
    confidence: 97,
    notes: 'Direct survey in Hawass 2007',
  },
  {
    monumentId: 'MON-OS-001',
    region: 'Shaft C',
    status: 'measured',
    surveySourceId: 'SURV-001',
    confidence: 98,
    notes: 'Direct survey in Hawass 2007',
  },
  {
    monumentId: 'MON-OS-001',
    region: 'Chamber I',
    status: 'measured',
    surveySourceId: 'SURV-001',
    confidence: 97,
    notes: 'Direct survey in Hawass 2007',
  },
  {
    monumentId: 'MON-OS-001',
    region: 'Central Island',
    status: 'measured',
    surveySourceId: 'SURV-001',
    confidence: 96,
    notes: 'Surveyed in Hawass 2007; rounded summary dimensions',
  },
  {
    monumentId: 'MON-OS-001',
    region: 'Basalt Sarcophagus',
    status: 'measured',
    surveySourceId: 'SURV-001',
    confidence: 95,
    notes: 'Whiting thesis; Hawass confirms approximate exterior length',
  },
  {
    monumentId: 'MON-OS-001',
    region: 'Northern Conduit',
    status: 'inferred',
    surveySourceId: 'SURV-002',
    confidence: 83,
    notes:
      'Partial exploration; termination choked. Manual reconstruction for unmeasured sections.',
  },
  {
    monumentId: 'MON-OS-001',
    region: 'Beyond Northern Conduit',
    status: 'unknown',
    surveySourceId: null,
    confidence: 0,
    notes: 'No survey data available. Blocked by obstruction.',
  },
];

const MANUAL_RECONSTRUCTIONS: ManualReconstructionRecord[] = [
  {
    id: 'RECON-001',
    elementName: 'Northern Conduit (beyond accessible extent)',
    monumentId: 'MON-OS-001',
    assumptions: [
      'Conduit continues approximately horizontally beyond obstruction',
      'Cross-section remains approximately 0.5–0.6 m × 0.5–0.7 m',
      'Total length estimated at 6–7 m based on partial exploration',
    ],
    evidenceClass: 'E7',
    confidence: 40,
    evidenceIds: ['EV-000009'],
    sourceIds: ['SRC-0001'],
  },
];

export function getSurveySources(): SurveySource[] {
  return [...SURVEY_REGISTRY];
}

export function getSurveySourceById(id: string): SurveySource | undefined {
  return SURVEY_REGISTRY.find((s) => s.id === id);
}

export function getCoverageMap(): CoverageEntry[] {
  return [...COVERAGE_MAP];
}

export function getCoverageByMonument(monumentId: string): CoverageEntry[] {
  return COVERAGE_MAP.filter((c) => c.monumentId === monumentId);
}

export function getCoverageGaps(monumentId: string): CoverageEntry[] {
  return COVERAGE_MAP.filter(
    (c) => c.monumentId === monumentId && (c.status === 'inferred' || c.status === 'unknown'),
  );
}

export function getManualReconstructions(): ManualReconstructionRecord[] {
  return [...MANUAL_RECONSTRUCTIONS];
}

export function getManualReconstructionsByMonument(
  monumentId: string,
): ManualReconstructionRecord[] {
  return MANUAL_RECONSTRUCTIONS.filter((r) => r.monumentId === monumentId);
}

export function getGeometryConfidence(surveyType: SurveySourceType): number {
  const confidenceByType: Record<SurveySourceType, number> = {
    laser_scan: 99,
    photogrammetry: 90,
    published_cad: 85,
    manual_reconstruction: 50,
  };
  return confidenceByType[surveyType];
}
