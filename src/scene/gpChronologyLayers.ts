/**
 * Great Pyramid chronology layers per M11-T17.
 *
 * 8 chronology layers with confidence for the Great Pyramid:
 *   1. Construction (Old Kingdom, reign of Khufu)
 *   2. Old Kingdom (post-construction)
 *   3. Middle Kingdom
 *   4. New Kingdom
 *   5. Late Period
 *   6. Ptolemaic Period
 *   7. Roman Period
 *   8. Modern
 *
 * Each layer is toggleable and has an associated confidence value.
 * Geometry is continuous across layers — only occupation layers and
 * movable objects change.
 */

export type GPChronologyPeriod =
  | 'gp-construction'
  | 'gp-old-kingdom'
  | 'gp-middle-kingdom'
  | 'gp-new-kingdom'
  | 'gp-late-period'
  | 'gp-ptolemaic'
  | 'gp-roman'
  | 'gp-modern';

export interface GPChronologyLayer {
  id: GPChronologyPeriod;
  label: string;
  confidence: number;
  dateRange: { start: number; end: number };
  description: string;
}

export const GP_CHRONOLOGY_LAYERS: GPChronologyLayer[] = [
  {
    id: 'gp-construction',
    label: 'Construction (Khufu)',
    confidence: 75,
    dateRange: { start: -2580, end: -2560 },
    description:
      'Active construction period of the Great Pyramid under Khufu. High confidence for core structure; moderate for internal mechanisms.',
  },
  {
    id: 'gp-old-kingdom',
    label: 'Old Kingdom (Post-Construction)',
    confidence: 60,
    dateRange: { start: -2560, end: -2181 },
    description:
      'Period after completion. Original function may have been active. Moderate confidence for operational state.',
  },
  {
    id: 'gp-middle-kingdom',
    label: 'Middle Kingdom',
    confidence: 50,
    dateRange: { start: -2055, end: -1650 },
    description:
      'Possible reuse and modification. Lower confidence due to limited direct evidence from this period.',
  },
  {
    id: 'gp-new-kingdom',
    label: 'New Kingdom',
    confidence: 70,
    dateRange: { start: -1550, end: -1069 },
    description:
      'Restoration and religious significance. Good confidence from New Kingdom records and inscriptions.',
  },
  {
    id: 'gp-late-period',
    label: 'Late Period',
    confidence: 85,
    dateRange: { start: -664, end: -332 },
    description:
      'Major period of religious activity at Giza. High confidence for cultural context and access state.',
  },
  {
    id: 'gp-ptolemaic',
    label: 'Ptolemaic Period',
    confidence: 80,
    dateRange: { start: -332, end: -30 },
    description:
      'Continued religious significance under Ptolemaic rule. Good confidence from historical records.',
  },
  {
    id: 'gp-roman',
    label: 'Roman Period',
    confidence: 90,
    dateRange: { start: -30, end: 395 },
    description:
      'Documented visitation and study. High confidence from Roman-era accounts (Strabo, Pliny).',
  },
  {
    id: 'gp-modern',
    label: 'Modern',
    confidence: 100,
    dateRange: { start: 1800, end: 2026 },
    description:
      'Modern excavation, survey, and scientific analysis. Full confidence — directly observed and measured.',
  },
];

/**
 * Maps GP objects to which chronology layers they appear in.
 * Original architecture appears in all layers.
 * Movable objects may only appear in specific layers.
 */
export const GP_OBJECT_CHRONOLOGY: Record<string, GPChronologyPeriod[]> = {
  'GP-KINGS-CHAMBER': GP_CHRONOLOGY_LAYERS.map((l) => l.id),
  'GP-QUEENS-CHAMBER': GP_CHRONOLOGY_LAYERS.map((l) => l.id),
  'GP-GRAND-GALLERY': GP_CHRONOLOGY_LAYERS.map((l) => l.id),
  'GP-SUBTERRANEAN': GP_CHRONOLOGY_LAYERS.map((l) => l.id),
  'GP-SARCOPHAGUS': ['gp-construction', 'gp-old-kingdom', 'gp-modern'],
  'GP-RELIEF-FRAGMENTS': ['gp-new-kingdom', 'gp-late-period', 'gp-modern'],
  'GP-MODERN-STAIRCASE': ['gp-modern'],
  'GP-VENTILATION-FANS': ['gp-modern'],
};

/**
 * Returns the chronology layers in which a given GP object appears.
 */
export function getGPObjectChronology(objectId: string): GPChronologyPeriod[] {
  return GP_OBJECT_CHRONOLOGY[objectId] ?? GP_CHRONOLOGY_LAYERS.map((l) => l.id);
}

/**
 * Returns the confidence for a given object in a specific chronology layer.
 */
export function getGPChronologyConfidence(objectId: string, period: GPChronologyPeriod): number {
  const layers = getGPObjectChronology(objectId);
  if (!layers.includes(period)) return 0;
  const layer = GP_CHRONOLOGY_LAYERS.find((l) => l.id === period);
  return layer?.confidence ?? 0;
}

/**
 * Filters GP object IDs to only those present in the given chronology layer.
 */
export function filterGPObjectsByChronology(
  objectIds: string[],
  period: GPChronologyPeriod,
): string[] {
  return objectIds.filter((id) => getGPObjectChronology(id).includes(period));
}

/**
 * Returns all GP chronology layer IDs in order.
 */
export function getGPChronologyLayerOrder(): GPChronologyPeriod[] {
  return GP_CHRONOLOGY_LAYERS.map((l) => l.id);
}
