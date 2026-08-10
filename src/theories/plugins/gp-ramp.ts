import type { Hypothesis } from '@/schemas/hypothesis';
import type { HypothesisPlugin } from '../types';

const hypothesis: Hypothesis = {
  id: 'THEORY-GP-004',
  name: 'Internal Ramp Construction Hypothesis (Great Pyramid)',
  description:
    'The Great Pyramid was built using a system of internal ramps and straight-on external ramps to raise limestone blocks into place. The precisely surveyed base dimensions, casing angle, and entrance geometry are consistent with a staged ramp-build program rather than lever-only or spiral-ramp-only schemes.',
  authors: [{ name: 'GIZA Research Team' }],
  historicalBackground:
    'Construction-ramp models include straight external ramps, zig-zag internal ramps, and combined internal/external systems. The casing slope (seked 5½ palms), base regularity, and entrance position above the base are often cited as constraints on ramp geometry and required turning bays.',
  scientificAssumptions: [
    'Blocks were hauled up one or more ramps rather than lifted primarily by levers.',
    'A straight external ramp reached the lower courses; internal ramps or turning bays handled higher courses.',
    'The casing angle and base size constrain the maximum feasible ramp slope and length.',
    'Tool marks and block-laying patterns reflect directional hauling, not axial levering.',
    'No single ramp geometry is assumed; multiple compatible ramp configurations are possible.',
  ],
  predictions: [
    {
      id: 'PRED-GP-004-01',
      hypothesisId: 'THEORY-GP-004',
      description:
        'The surveyed base regularity and casing slope are consistent with a ramp build constrained by a maximum practical ramp grade.',
      predictedObservation:
        'Base side variation (~3.5 cm) and casing angle 51°50′40″ are within the tolerances expected for ramp alignment and sequential casing placement.',
      evidenceRefs: ['EV-100001', 'EV-100002'],
      status: 'confirmed',
    },
    {
      id: 'PRED-GP-004-02',
      hypothesisId: 'THEORY-GP-004',
      description:
        'The original entrance position is compatible with an external ramp approaching from the north.',
      predictedObservation:
        'The entrance is offset 7.29 m east of the north-south axis and 16.97 m above the base, leaving clearance for a ramp apron and turning area on the north face.',
      evidenceRefs: ['EV-100003'],
      status: 'confirmed',
    },
    {
      id: 'PRED-GP-004-03',
      hypothesisId: 'THEORY-GP-004',
      description:
        'The Descending Passage was cut before the superstructure was completed, so its slope and cross-section reflect construction access rather than post-completion modification.',
      predictedObservation:
        'The Descending Passage slope of 26°31′23″ and cross-section 1.19 × 1.05 m are consistent with a construction access way that predates the closing of the surrounding masonry.',
      evidenceRefs: ['EV-100005'],
      status: 'confirmed',
    },
  ],
  affectedStructures: ['OBJ-0101', 'OBJ-0102', 'OBJ-0103', 'OBJ-0105'],
  supports: ['EV-100001', 'EV-100002', 'EV-100003', 'EV-100005'],
  contradicts: [],
  requiredEvidence: ['EV-100001', 'EV-100002'],
  simulations: [],
  visualizationRules: [
    {
      target: 'OBJ-0101',
      overlay: 'annotation',
      conditions: {},
      color: '#94a3b8',
      opacity: 0.25,
      label: 'Regular base — ramp alignment constraint',
    },
    {
      target: 'OBJ-0102',
      overlay: 'highlight',
      conditions: {},
      color: '#fbbf24',
      opacity: 0.3,
      label: 'Casing slope — ramp grade constraint',
    },
    {
      target: 'OBJ-0103',
      overlay: 'annotation',
      conditions: {},
      color: '#60a5fa',
      opacity: 0.35,
      label: 'Original entrance — ramp approach clearance',
    },
    {
      target: 'OBJ-0105',
      overlay: 'annotation',
      conditions: {},
      color: '#a78bfa',
      opacity: 0.25,
      label: 'Descending Passage — construction access way',
    },
  ],
  confidence: 0,
  confidenceByObject: {},
  references: ['SRC-0101', 'SRC-0102'],
  bibliography: [],
  status: 'published',
  tags: ['ramp', 'construction', 'great-pyramid', 'khufu', 'old-kingdom'],
};

export const gpRampPlugin: HypothesisPlugin = {
  id: 'THEORY-GP-004',
  name: 'Internal Ramp Construction Hypothesis (Great Pyramid)',
  description: 'Great Pyramid built with internal and external construction ramps.',
  version: '0.1.0',
  getHypothesis: () => hypothesis,
  getVisualizationRules: (objectId) =>
    hypothesis.visualizationRules.filter((rule) => rule.target === objectId),
};
