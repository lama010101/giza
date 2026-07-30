import type { Hypothesis } from '@/schemas/hypothesis';
import type { HypothesisGeometryNode, HypothesisPlugin } from '../types';

const hypothesis: Hypothesis = {
  id: 'THEORY-GP-SCANPYRAMIDS',
  name: 'ScanPyramids Big Void',
  description:
    'A large void detected above the Grand Gallery via muon tomography (Morishima et al., 2017).',
  authors: [{ name: 'ScanPyramids Team' }],
  scientificAssumptions: [
    'Muon tomography can detect density variations within the pyramid structure.',
    'The detected void is a real architectural feature, not an artifact of measurement.',
  ],
  predictions: [],
  affectedStructures: ['OBJ-0130'],
  supports: ['EV-100030'],
  contradicts: [],
  requiredEvidence: [],
  simulations: [],
  visualizationRules: [
    {
      target: 'OBJ-0130',
      overlay: 'scanpyramids-void',
      color: '#ff6b35',
      opacity: 0.25,
      conditions: {},
    },
  ],
  confidence: 70,
  confidenceByObject: {},
  references: [],
  bibliography: [],
  status: 'published',
  tags: ['muon-tomography', 'void', 'scanpyramids'],
};

export const gpScanPyramidsPlugin: HypothesisPlugin = {
  id: 'THEORY-GP-SCANPYRAMIDS',
  name: 'ScanPyramids — Big Void Survey',
  description:
    'Muon tomography survey (ScanPyramids 2017) detecting a large void above the Grand Gallery.',
  version: '1.0.0',

  getHypothesis() {
    return hypothesis;
  },

  getGeometryNodes(): HypothesisGeometryNode[] {
    return [
      {
        id: 'gp-big-void',
        name: 'Big Void (ScanPyramids)',
        position: { x: 7.22, y: 60, z: 8 },
        size: { x: 30, y: 8, z: 15 },
        color: '#ff6b35',
        opacity: 0.2,
        hypothesisId: 'THEORY-GP-SCANPYRAMIDS',
        evidenceIds: ['EV-100030'],
        metadata: {
          detectionMethod: 'muon tomography',
          survey: 'ScanPyramids 2017',
        },
      },
    ];
  },
};
