import type { Hypothesis } from '@/schemas/hypothesis';
import type { Simulation } from '@/schemas/simulation';
import type { HypothesisPlugin } from '../types';

const hypothesis: Hypothesis = {
  id: 'THEORY-OSIRIS-001',
  name: 'Hydraulic Functionality Hypothesis (Osiris Shaft)',
  description:
    "Chamber I was designed to hold water as an integral part of the monument's ritual function. The central island, perimeter trench, and conduit are interpreted as an engineered hydraulic system rather than incidental flooding.",
  authors: [{ name: 'GIZA Research Team' }],
  historicalBackground:
    'The permanent flooding of Chamber I has been observed since excavation. Rather than treating it as a modern groundwater intrusion, this hypothesis treats the water and island as an intentional Late Period architectural feature.',
  scientificAssumptions: [
    'The water in Chamber I was held intentionally, at least seasonally.',
    'The central emplacement was designed as an island within a water-filled trench.',
    'The Northern Conduit may have controlled or drained the water level.',
  ],
  predictions: [
    {
      id: 'PRED-OSIRIS-001-01',
      hypothesisId: 'THEORY-OSIRIS-001',
      description:
        'A stable water level can be maintained in Chamber I with the observed perimeter channel geometry.',
      predictedObservation:
        'Hydraulic simulation of the chamber with the measured floor and channel dimensions produces a stable water surface that reaches the island ledge.',
      evidenceRefs: ['EV-000006', 'EV-000007', 'EV-000011'],
      status: 'untested',
    },
  ],
  affectedStructures: ['OBJ-0006', 'OBJ-0007', 'OBJ-0009'],
  supports: ['EV-000006', 'EV-000007', 'EV-000011'],
  contradicts: [],
  requiredEvidence: ['EV-000007', 'EV-000011'],
  simulations: ['SIM-001'],
  visualizationRules: [
    {
      target: 'OBJ-0006',
      overlay: 'water',
      conditions: {},
      color: '#0a4a6b',
      opacity: 0.7,
      label: 'Chamber I water level',
    },
    {
      target: 'OBJ-0009',
      overlay: 'flow',
      conditions: {},
      color: '#3b82f6',
      opacity: 0.5,
      label: 'Northern conduit flow',
    },
  ],
  confidence: 0,
  confidenceByObject: {},
  references: ['SRC-0001'],
  bibliography: [],
  status: 'published',
  tags: ['hydraulic', 'water', 'osiris-shaft'],
};

const simulations: Simulation[] = [
  {
    id: 'SIM-001',
    name: 'Chamber I water level',
    type: 'Hydraulic',
    inputs: ['chamber_floor_mesh', 'water_level', 'channel_width'],
    outputs: ['stable_water_surface', 'outflow_rate'],
    parameters: {
      waterLevel: 0.5,
      inflowRate: 0.0,
      outflowRate: 0.0,
      channelWidth: 1.35,
    },
    enabled: true,
  },
];

export const osirisHydraulicPlugin: HypothesisPlugin = {
  id: 'THEORY-OSIRIS-001',
  name: 'Hydraulic Functionality Hypothesis',
  description: 'Chamber I as an engineered water feature.',
  version: '0.1.0',
  getHypothesis: () => hypothesis,
  getSimulations: () => simulations,
  getVisualizationRules: (objectId) =>
    hypothesis.visualizationRules.filter((rule) => rule.target === objectId),
};
