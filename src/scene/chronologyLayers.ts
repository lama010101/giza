import type { Evidence } from '@/schemas/evidence';
import { getEvidenceByObject } from '@/evidence/repository';

/**
 * Chronology layers per GIZA-03 §2.3 (M09-T17).
 *
 * 5 chronology layers with confidence:
 *   1. Old Kingdom (confidence 55)
 *   2. Middle Kingdom (confidence 50)
 *   3. Late Period (confidence 90)
 *   4. Roman (confidence 95)
 *   5. Modern (confidence 100)
 *
 * Geometry is continuous across layers — only occupation layers and
 * movable objects change. Each layer is toggleable.
 */

export type ChronologyPeriod =
  | 'old-kingdom'
  | 'middle-kingdom'
  | 'late-period'
  | 'roman'
  | 'modern';

export interface ChronologyLayer {
  id: ChronologyPeriod;
  label: string;
  confidence: number;
  dateRange: { start: number; end: number }; // BCE/BCE
  description: string;
}

export const CHRONOLOGY_LAYERS: ChronologyLayer[] = [
  {
    id: 'old-kingdom',
    label: 'Old Kingdom',
    confidence: 55,
    dateRange: { start: -2686, end: -2181 },
    description:
      'Original construction period of the Osiris Shaft. High uncertainty for specific features from this era.',
  },
  {
    id: 'middle-kingdom',
    label: 'Middle Kingdom',
    confidence: 50,
    dateRange: { start: -2055, end: -1650 },
    description:
      'Possible reuse and modification. Lower confidence due to limited direct evidence.',
  },
  {
    id: 'late-period',
    label: 'Late Period',
    confidence: 90,
    dateRange: { start: -664, end: -332 },
    description:
      'Major period of Osiris worship at Giza. High confidence for religious function and most architectural features.',
  },
  {
    id: 'roman',
    label: 'Roman Period',
    confidence: 95,
    dateRange: { start: -30, end: 395 },
    description: 'Continued use and documentation. High confidence from Roman-era records.',
  },
  {
    id: 'modern',
    label: 'Modern',
    confidence: 100,
    dateRange: { start: 1900, end: 2026 },
    description:
      'Modern excavation, survey, and conservation. Full confidence — directly observed and measured.',
  },
];

/**
 * Timeline phases exposed by the M08-T10 slider.
 * These are the four broad historical phases used to filter knowledge
 * and scene objects; the Middle Kingdom layer is collapsed into Old
 * Kingdom for the UI because the current evidence set does not use it.
 */
export const TIMELINE_PHASE_ORDER: readonly ChronologyPeriod[] = [
  'old-kingdom',
  'late-period',
  'roman',
  'modern',
];

export const TIMELINE_PHASES = CHRONOLOGY_LAYERS.filter((layer) =>
  TIMELINE_PHASE_ORDER.includes(layer.id),
);

/**
 * Object classification per GIZA-03 §2.5.
 * Only occupation layers and movable objects change across chronology;
 * the base geometry is continuous.
 */
export type ObjectClass =
  | 'Original Architecture'
  | 'Modern Installations'
  | 'Environmental'
  | 'Archaeological Finds'
  | 'Interpretive Objects';

/**
 * Maps an object to which chronology layers it appears in.
 * Original architecture appears in all layers.
 * Movable objects (sarcophagi, finds) may only appear in specific layers.
 */
export const OBJECT_CHRONOLOGY: Record<string, ChronologyPeriod[]> = {
  // Architecture — present in all periods
  'OBJ-0001': ['old-kingdom', 'middle-kingdom', 'late-period', 'roman', 'modern'],
  'OBJ-0002': ['old-kingdom', 'middle-kingdom', 'late-period', 'roman', 'modern'],
  'OBJ-0003': ['old-kingdom', 'middle-kingdom', 'late-period', 'roman', 'modern'],
  'OBJ-0004': ['old-kingdom', 'middle-kingdom', 'late-period', 'roman', 'modern'],
  'OBJ-0005': ['old-kingdom', 'middle-kingdom', 'late-period', 'roman', 'modern'],
  'OBJ-0006': ['old-kingdom', 'middle-kingdom', 'late-period', 'roman', 'modern'],
  'OBJ-0007': ['old-kingdom', 'middle-kingdom', 'late-period', 'roman', 'modern'],
  'OBJ-0009': ['old-kingdom', 'middle-kingdom', 'late-period', 'roman', 'modern'],
  'OBJ-0013': ['late-period', 'roman', 'modern'],
  'OBJ-0014': ['late-period', 'roman', 'modern'],
  'OBJ-0015': ['late-period', 'roman', 'modern'],
  // Sarcophagi — archaeological finds, present from Late Period onward
  'OBJ-0008': ['late-period', 'roman', 'modern'],
  'OBJ-0010': ['late-period', 'roman', 'modern'],
  'OBJ-0011': ['late-period', 'roman', 'modern'],
  // Modern installations
  'OBJ-0016': ['modern'],
  'OBJ-0017': ['modern'],
};

/**
 * Returns the chronology layers in which a given object appears.
 */
export function getObjectChronology(objectId: string): ChronologyPeriod[] {
  return (
    OBJECT_CHRONOLOGY[objectId] ?? [
      'old-kingdom',
      'middle-kingdom',
      'late-period',
      'roman',
      'modern',
    ]
  );
}

/**
 * Returns the confidence for a specific (object, chronology) pair.
 */
export function getChronologyConfidence(objectId: string, period: ChronologyPeriod): number {
  const layers = getObjectChronology(objectId);
  if (!layers.includes(period)) return 0;
  const layer = CHRONOLOGY_LAYERS.find((l) => l.id === period);
  return layer?.confidence ?? 0;
}

/**
 * Filters object IDs to only those present in the given chronology layer.
 */
export function filterObjectsByChronology(objectIds: string[], period: ChronologyPeriod): string[] {
  return objectIds.filter((id) => getObjectChronology(id).includes(period));
}

// ─── Timeline helpers (M08-T10) ─────────────────────────────────────────────

const PERIOD_TO_EARLIEST_PHASE: Record<string, ChronologyPeriod> = {
  'old kingdom': 'old-kingdom',
  eocene: 'old-kingdom',
  geological: 'old-kingdom',
  'middle kingdom': 'late-period',
  'new kingdom': 'late-period',
  'late period': 'late-period',
  roman: 'roman',
  'roman period': 'roman',
  medieval: 'modern',
  modern: 'modern',
  multiple: 'old-kingdom',
};

function normalizePeriodLabel(label: string): string {
  return label.trim().toLowerCase().replace(/\s+/g, ' ');
}

function expandTimelinePhases(phase: ChronologyPeriod): ChronologyPeriod[] {
  const index = TIMELINE_PHASE_ORDER.indexOf(phase);
  if (index === -1) return [phase];
  return TIMELINE_PHASE_ORDER.slice(index);
}

/**
 * Maps a free-form period label (e.g. from an evidence chronology tag) to
 * the set of timeline phases in which that subject would have been present.
 * Unknown labels are treated as present in all phases so they are never lost.
 */
export function getTimelinePhasesForPeriod(period: string): ChronologyPeriod[] {
  const normalized = normalizePeriodLabel(period);
  const earliest = PERIOD_TO_EARLIEST_PHASE[normalized];
  if (earliest) return expandTimelinePhases(earliest);
  return [...TIMELINE_PHASE_ORDER];
}

/**
 * Returns the timeline phases relevant to a piece of evidence, based on
 * its chronology tags. The result is the union of each tag's phase range.
 */
export function getEvidenceTimelinePhases(evidence: Evidence): ChronologyPeriod[] {
  const phases = new Set<ChronologyPeriod>();
  for (const tag of evidence.chronologyTags) {
    for (const phase of getTimelinePhasesForPeriod(tag.period)) {
      phases.add(phase);
    }
  }
  if (phases.size === 0) return [...TIMELINE_PHASE_ORDER];
  return [...phases];
}

/**
 * Returns the timeline phases for which an object should be visible. This
 * first checks the explicit OBJECT_CHRONOLOGY map, then falls back to the
 * chronology tags of the evidence linked to the object.
 */
export function getObjectTimelinePhases(objectId: string): ChronologyPeriod[] {
  const explicit = OBJECT_CHRONOLOGY[objectId];
  if (explicit) return explicit;

  const evidence = getEvidenceByObject(objectId);
  const phases = new Set<ChronologyPeriod>();
  for (const ev of evidence) {
    for (const phase of getEvidenceTimelinePhases(ev)) {
      phases.add(phase);
    }
  }
  if (phases.size === 0) return [...TIMELINE_PHASE_ORDER];
  return [...phases];
}
