import type { Hypothesis } from '@/schemas/hypothesis';
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
  affectedStructures: ['OBJ-0006', 'OBJ-0007', 'OBJ-0008'],
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
  ],
  confidence: 0,
  confidenceByObject: {},
  references: ['SRC-0001'],
  bibliography: [],
  status: 'published',
  tags: ['mainstream', 'funerary', 'osiris-shaft'],
};

export const osirisMainstreamPlugin: HypothesisPlugin = {
  id: 'THEORY-OSIRIS-002',
  name: 'Mainstream Funerary Hypothesis',
  description: 'The Osiris Shaft as a Late Period tomb with modern flooding.',
  version: '0.1.0',
  getHypothesis: () => hypothesis,
  getVisualizationRules: (objectId) =>
    hypothesis.visualizationRules.filter((rule) => rule.target === objectId),
};
