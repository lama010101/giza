import type { Hypothesis } from '@/schemas/hypothesis';
import type { Vector3 } from '@/schemas/location';
import type { HypothesisGeometryNode } from '@/theories/types';
import type { HypothesisPlugin } from '../types';

const hypothesis: Hypothesis = {
  id: 'THEORY-OSIRIS-002',
  name: 'Mainstream Funerary Hypothesis (Osiris Shaft)',
  description:
    'The Osiris Shaft is a Late Period funerary complex built in the tradition of the Osiris-Sokar cult. The water is modern groundwater infiltration, not an original feature.',
  authors: [{ name: 'GIZA Research Team' }],
  historicalBackground:
    'Hawass identified the shaft as a Late Period tomb associated with the Osiris-Sokar cult. The basalt sarcophagus and amulets date to the 26th Dynasty.',
  scientificAssumptions: [
    'The water is modern groundwater, not an original design element.',
    'The central island served as a base for the sarcophagus.',
    'The Northern Conduit is an unfinished or later intrusion.',
  ],
  predictions: [
    {
      id: 'PRED-OSIRIS-002-01',
      hypothesisId: 'THEORY-OSIRIS-002',
      description:
        'The sarcophagus and artifacts are consistent with Late Period funerary practice.',
      predictedObservation:
        'The assemblage of amulets, scarabs, and pottery in Chamber I matches 26th Dynasty burial traditions.',
      evidenceRefs: ['EV-000008'],
      status: 'confirmed',
    },
  ],
  affectedStructures: ['OBJ-0006', 'OBJ-0007', 'OBJ-0008', 'OBJ-0009'],
  confidenceByObject: {
    'OBJ-0006': 55,
    'OBJ-0007': 50,
    'OBJ-0008': 90,
    'OBJ-0009': 45,
  },
  supports: ['EV-000006', 'EV-000008'],
  contradicts: ['EV-000011'],
  requiredEvidence: ['EV-000008'],
  simulations: [],
  visualizationRules: [
    {
      target: 'OBJ-0008',
      overlay: 'highlight',
      conditions: {},
      color: '#f59e0b',
      opacity: 0.4,
      label: 'Sarcophagus and burial assemblage',
    },
    {
      target: 'OBJ-0009',
      overlay: 'dead-end',
      conditions: {},
      color: '#9ca3af',
      opacity: 0.4,
      label: 'Unfinished or later intrusion (dead end)',
    },
  ],
  confidence: 0,
  references: ['SRC-0001'],
  bibliography: [],
  status: 'published',
  tags: ['mainstream', 'funerary', 'osiris-shaft'],
};

const deadEndPosition: Vector3 = { x: -9.3, y: -30.3, z: -16.1 };

const geometryNodes: HypothesisGeometryNode[] = [
  {
    id: 'osiris-mainstream-northern-conduit-dead-end',
    name: 'Northern Conduit Dead End',
    hypothesisId: 'THEORY-OSIRIS-002',
    position: deadEndPosition,
    rotation: { x: 0, y: (-3 * Math.PI) / 4, z: 0 },
    size: { x: 0.65, y: 0.75, z: 1.2 },
    color: '#9ca3af',
    opacity: 0.4,
    evidenceIds: ['EV-000009'],
    visibilityRules: [{ defaultVisible: true }],
  },
];

export const osirisMainstreamPlugin: HypothesisPlugin = {
  id: 'THEORY-OSIRIS-002',
  name: 'Mainstream Funerary Hypothesis',
  description: 'The Osiris Shaft as a Late Period tomb with modern flooding.',
  version: '0.1.0',
  getHypothesis: () => hypothesis,
  getVisualizationRules: (objectId) =>
    hypothesis.visualizationRules.filter((rule) => rule.target === objectId),
  getGeometryNodes: () => geometryNodes,
};
