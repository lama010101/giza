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
  {
    id: 'SURV-GP-001',
    type: 'published_cad',
    name: 'Petrie 1883 — Great Pyramid Plans and Sections',
    date: '1883',
    operator: 'W.M.F. Petrie',
    equipment: 'Published architectural drawings and direct measurement',
    license: 'Public domain',
    reliability: 85,
    sourceId: 'SRC-0101',
  },
  {
    id: 'SURV-GP-002',
    type: 'published_cad',
    name: 'Cole 1925 — Exact Size and Orientation of the Great Pyramid',
    date: '1925',
    operator: 'J.H. Cole',
    equipment: 'Survey of Egypt invar wires',
    license: 'Public domain',
    reliability: 95,
    sourceId: 'SRC-0102',
  },
  {
    id: 'SURV-GP-003',
    type: 'published_cad',
    name: 'Dash & Paulson 2015 — Base Reanalysis',
    date: '2015',
    operator: 'G. Dash, J. Paulson',
    equipment: 'Published reanalysis of base data',
    license: 'Academic',
    reliability: 90,
    sourceId: 'SRC-0103',
  },
  {
    id: 'SURV-GP-004',
    type: 'laser_scan',
    name: 'Gantenbrink 1993 — Upuaut Shaft Survey',
    date: '1993',
    operator: 'R. Gantenbrink',
    equipment: 'Upuaut robot laser/camera in shaft bores',
    license: 'Academic',
    reliability: 92,
    sourceId: 'SRC-0105',
  },
  {
    id: 'SURV-GP-005',
    type: 'photogrammetry',
    name: 'Lehner & Goodman — Giza Plateau Mapping Project',
    date: '2007',
    operator: 'M. Lehner, D. Goodman',
    equipment: 'Aerial photogrammetry and ground survey',
    license: 'Academic',
    reliability: 88,
    sourceId: 'SRC-0106',
  },
  {
    id: 'SURV-GP-006',
    type: 'published_cad',
    name: 'Hawass 2007 — Great Pyramid Interior Survey',
    date: '2007',
    operator: 'Zahi Hawass',
    equipment: 'Published interior plans and photography',
    license: 'Academic',
    reliability: 95,
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
  {
    monumentId: 'MON-GP-001',
    region: 'Base and Exterior',
    status: 'measured',
    surveySourceId: 'SURV-GP-002',
    confidence: 98,
    notes: 'Cole 1925 invar wire base survey and Dash 2015 reanalysis',
  },
  {
    monumentId: 'MON-GP-001',
    region: "King's Chamber",
    status: 'measured',
    surveySourceId: 'SURV-GP-001',
    confidence: 97,
    notes: 'Petrie 1883 direct measurement of chamber and sarcophagus',
  },
  {
    monumentId: 'MON-GP-001',
    region: "Queen's Chamber",
    status: 'measured',
    surveySourceId: 'SURV-GP-001',
    confidence: 96,
    notes: 'Petrie 1883 direct measurement of chamber and niche',
  },
  {
    monumentId: 'MON-GP-001',
    region: 'Grand Gallery',
    status: 'measured',
    surveySourceId: 'SURV-GP-001',
    confidence: 97,
    notes: 'Petrie 1883 measured floor, ceiling, and corbel courses',
  },
  {
    monumentId: 'MON-GP-001',
    region: 'Subterranean Chamber',
    status: 'measured',
    surveySourceId: 'SURV-GP-001',
    confidence: 95,
    notes: 'Petrie 1883 and Hawass 2007 interior surveys',
  },
  {
    monumentId: 'MON-GP-001',
    region: 'Ascending Passage',
    status: 'measured',
    surveySourceId: 'SURV-GP-001',
    confidence: 96,
    notes: 'Petrie 1883 measured slope, width, and height',
  },
  {
    monumentId: 'MON-GP-001',
    region: 'Descending Passage',
    status: 'measured',
    surveySourceId: 'SURV-GP-001',
    confidence: 96,
    notes: 'Petrie 1883 measured slope and entrance offset',
  },
  {
    monumentId: 'MON-GP-001',
    region: "King's Chamber Air Shafts",
    status: 'measured',
    surveySourceId: 'SURV-GP-004',
    confidence: 94,
    notes: 'Gantenbrink 1993 Upuaut robot laser/camera survey',
  },
  {
    monumentId: 'MON-GP-001',
    region: "Queen's Chamber Air Shafts",
    status: 'measured',
    surveySourceId: 'SURV-GP-004',
    confidence: 94,
    notes: 'Gantenbrink 1993 Upuaut robot laser/camera survey',
  },
  {
    monumentId: 'MON-GP-001',
    region: 'Well Shaft and Grotto',
    status: 'measured',
    surveySourceId: 'SURV-GP-001',
    confidence: 93,
    notes: 'Petrie 1883 surveyed well shaft and grotto irregularities',
  },
  {
    monumentId: 'MON-GP-001',
    region: 'Relieving Chambers',
    status: 'measured',
    surveySourceId: 'SURV-GP-001',
    confidence: 90,
    notes: 'Vyse 1837 and Petrie 1883 measured chamber heights and lintels',
  },
  {
    monumentId: 'MON-GP-001',
    region: 'Subterranean Pit and Lower Continuation',
    status: 'unknown',
    surveySourceId: null,
    confidence: 0,
    notes: 'No direct survey of pit bottom or any continuation below the chamber',
  },
  {
    monumentId: 'MON-GP-001',
    region: 'ScanPyramids Muon Void',
    status: 'inferred',
    surveySourceId: 'SURV-GP-005',
    confidence: 70,
    notes: 'ScanPyramids muon detection; morphology and connectivity inferred',
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
