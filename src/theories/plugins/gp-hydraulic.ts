import type { Hypothesis } from '@/schemas/hypothesis';
import type { Simulation } from '@/schemas/simulation';
import type { HypothesisPlugin } from '../types';

const hypothesis: Hypothesis = {
  id: 'THEORY-GP-001',
  name: 'Hydraulic Hypothesis (Great Pyramid)',
  description:
    'The internal passages and chambers of the Great Pyramid were designed as a hydraulic system. The Descending Passage and Subterranean Chamber functioned as a drain/cistern, the Well Shaft as a pressure relief conduit, and the Grand Gallery as a pressure cascade. Water was managed to enable specific construction or ritual functions.',
  authors: [{ name: 'GIZA Research Team' }],
  historicalBackground:
    'The hydraulic interpretation proposes that the pyramid internal architecture managed water under pressure during construction or ritual use. The Subterranean Chamber pit may have served as a cistern, the Well Shaft as a surge shaft, and the Grand Gallery as a pressure-regulating cascade.',
  scientificAssumptions: [
    'The Subterranean Chamber pit functioned as a cistern or settling basin.',
    'The Well Shaft served as a pressure relief or surge conduit.',
    'The Grand Gallery corbelling created a pressure cascade structure.',
    'Water was available from the plateau watershed or aquifer.',
  ],
  predictions: [
    {
      id: 'PRED-GP-001-01',
      hypothesisId: 'THEORY-GP-001',
      description:
        'The Subterranean Chamber pit dimensions are consistent with a cistern of useful capacity.',
      predictedObservation:
        'The pit volume (~33.55 m below pavement) is sufficient to hold water managed from the Descending Passage inflow.',
      evidenceRefs: ['EV-100006', 'EV-100007'],
      status: 'untested',
    },
    {
      id: 'PRED-GP-001-02',
      hypothesisId: 'THEORY-GP-001',
      description:
        'The Well Shaft geometry is consistent with a pressure relief conduit connecting the Descending Passage to the Grand Gallery.',
      predictedObservation:
        'The Well Shaft diameter (~0.78 m) and path (~55 m) allow water flow between levels under gravity.',
      evidenceRefs: ['EV-100025', 'EV-100026'],
      status: 'untested',
    },
    {
      id: 'PRED-GP-001-03',
      hypothesisId: 'THEORY-GP-001',
      description: 'The Grand Gallery corbelled geometry is consistent with a pressure cascade.',
      predictedObservation:
        "The narrowing corbelled cross-section (2.09 m → 1.05 m) over 46.11 m at 26°02' creates a Venturi-like pressure gradient.",
      evidenceRefs: ['EV-100009'],
      status: 'untested',
    },
  ],
  affectedStructures: ['OBJ-0106', 'OBJ-0107', 'OBJ-0109', 'OBJ-0125', 'OBJ-0126'],
  supports: ['EV-100006', 'EV-100007', 'EV-100025', 'EV-100026'],
  contradicts: [],
  requiredEvidence: ['EV-100006', 'EV-100025'],
  simulations: ['SIM-101'],
  visualizationRules: [
    {
      target: 'OBJ-0106',
      overlay: 'water',
      conditions: {},
      color: '#0a4a6b',
      opacity: 0.7,
      label: 'Subterranean Chamber cistern',
    },
    {
      target: 'OBJ-0125',
      overlay: 'flow',
      conditions: {},
      color: '#3b82f6',
      opacity: 0.5,
      label: 'Well Shaft pressure relief',
    },
    {
      target: 'OBJ-0109',
      overlay: 'flow',
      conditions: {},
      color: '#2563eb',
      opacity: 0.4,
      label: 'Grand Gallery pressure cascade',
    },
  ],
  confidence: 0,
  confidenceByObject: {},
  references: ['SRC-0101'],
  bibliography: [],
  status: 'published',
  tags: ['hydraulic', 'water', 'great-pyramid', 'cistern'],
};

const simulations: Simulation[] = [
  {
    id: 'SIM-101',
    name: 'Subterranean Chamber hydraulic model',
    type: 'Hydraulic',
    inputs: ['descending_passage_mesh', 'subterranean_chamber_mesh', 'pit_geometry'],
    outputs: ['water_level', 'flow_rate', 'pressure_distribution'],
    parameters: {
      waterLevel: 30.0,
      inflowRate: 0.001,
      outflowRate: 0.0,
      pitDepth: 33.55,
    },
    enabled: true,
  },
];

export const gpHydraulicPlugin: HypothesisPlugin = {
  id: 'THEORY-GP-001',
  name: 'Hydraulic Hypothesis (Great Pyramid)',
  description: 'Internal passages as a hydraulic water management system.',
  version: '0.1.0',
  getHypothesis: () => hypothesis,
  getSimulations: () => simulations,
  getVisualizationRules: (objectId) =>
    hypothesis.visualizationRules.filter((rule) => rule.target === objectId),
};
