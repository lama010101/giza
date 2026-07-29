import type { Hypothesis } from '@/schemas/hypothesis';
import type { HypothesisPlugin } from '../types';

const hypothesis: Hypothesis = {
  id: 'THEORY-GP-002',
  name: 'Mainstream Funerary Hypothesis (Great Pyramid)',
  description:
    "The Great Pyramid is a royal tomb built for Khufu (Fourth Dynasty, Old Kingdom). The internal architecture — Descending Passage, Subterranean Chamber, Ascending Passage, Grand Gallery, Antechamber, King's Chamber with sarcophagus, Queen's Chamber, and Relieving Chambers — follows established funerary pyramid design. The cartouches in Campbell's Chamber confirm attribution to Khufu.",
  authors: [{ name: 'GIZA Research Team' }],
  historicalBackground:
    "The mainstream consensus, supported by cartouches of Khufu/Khnum-Khuf found by Vyse in Campbell's Chamber (1837), attributes the Great Pyramid to Pharaoh Khufu (Cheops), son of Sneferu, Fourth Dynasty, ca. 2580–2560 BCE. The internal chambers are interpreted within the tradition of Old Kingdom royal funerary architecture.",
  scientificAssumptions: [
    'The pyramid was built as a royal tomb for Khufu in the Fourth Dynasty.',
    "The King's Chamber was the primary burial chamber; the sarcophagus held the royal burial.",
    'The Subterranean Chamber was an abandoned or secondary chamber, left unfinished.',
    "The Queen's Chamber was a serdab or secondary chamber, not used for burial.",
    'The shafts served ventilation, symbolic, or stellar-alignment purposes — not hydraulic.',
  ],
  predictions: [
    {
      id: 'PRED-GP-002-01',
      hypothesisId: 'THEORY-GP-002',
      description:
        "The cartouches in Campbell's Chamber are authentic Old Kingdom inscriptions naming Khufu.",
      predictedObservation:
        "The cartouche markings in Campbell's Chamber match known Khufu/Khnum-Khuf cartouche forms from the Fourth Dynasty.",
      evidenceRefs: ['EV-100017'],
      status: 'confirmed',
    },
    {
      id: 'PRED-GP-002-02',
      hypothesisId: 'THEORY-GP-002',
      description:
        "The King's Chamber sarcophagus is sized for a royal burial and matches Old Kingdom sarcophagi.",
      predictedObservation:
        'The granite sarcophagus (2.276 × 0.978 × 1.049 m exterior) is consistent with Old Kingdom royal sarcophagi.',
      evidenceRefs: ['EV-100012'],
      status: 'confirmed',
    },
    {
      id: 'PRED-GP-002-03',
      hypothesisId: 'THEORY-GP-002',
      description:
        'The Subterranean Chamber was left unfinished, consistent with an abandoned secondary plan.',
      predictedObservation:
        'The rough-hewn walls, irregular floor, and incomplete blind passages indicate the chamber was never finished.',
      evidenceRefs: ['EV-100006'],
      status: 'confirmed',
    },
  ],
  affectedStructures: ['OBJ-0106', 'OBJ-0111', 'OBJ-0112', 'OBJ-0117', 'OBJ-0118'],
  supports: ['EV-100006', 'EV-100011', 'EV-100012', 'EV-100017', 'EV-100018'],
  contradicts: [],
  requiredEvidence: ['EV-100012', 'EV-100017'],
  simulations: [],
  visualizationRules: [
    {
      target: 'OBJ-0112',
      overlay: 'highlight',
      conditions: {},
      color: '#f59e0b',
      opacity: 0.4,
      label: 'Royal sarcophagus (Khufu)',
    },
    {
      target: 'OBJ-0117',
      overlay: 'highlight',
      conditions: {},
      color: '#d97706',
      opacity: 0.3,
      label: 'Cartouches (Khufu/Khnum-Khuf)',
    },
    {
      target: 'OBJ-0106',
      overlay: 'annotation',
      conditions: {},
      color: '#9ca3af',
      opacity: 0.2,
      label: 'Abandoned unfinished chamber',
    },
  ],
  confidence: 0,
  confidenceByObject: {},
  references: ['SRC-0101', 'SRC-0104'],
  bibliography: [],
  status: 'published',
  tags: ['mainstream', 'funerary', 'great-pyramid', 'khufu', 'old-kingdom'],
};

export const gpMainstreamPlugin: HypothesisPlugin = {
  id: 'THEORY-GP-002',
  name: 'Mainstream Funerary Hypothesis (Great Pyramid)',
  description: 'Royal tomb built for Khufu, Fourth Dynasty.',
  version: '0.1.0',
  getHypothesis: () => hypothesis,
  getVisualizationRules: (objectId) =>
    hypothesis.visualizationRules.filter((rule) => rule.target === objectId),
};
