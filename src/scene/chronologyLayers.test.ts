import { describe, it, expect } from 'vitest';
import {
  CHRONOLOGY_LAYERS,
  getObjectChronology,
  getChronologyConfidence,
  filterObjectsByChronology,
  TIMELINE_PHASES,
  TIMELINE_PHASE_ORDER,
  getTimelinePhasesForPeriod,
  getEvidenceTimelinePhases,
  getObjectTimelinePhases,
  type ChronologyPeriod,
} from './chronologyLayers';

describe('Chronology Layers (M09-T17, GIZA-03 §2.3)', () => {
  describe('CHRONOLOGY_LAYERS', () => {
    it('defines 5 chronology layers', () => {
      expect(CHRONOLOGY_LAYERS).toHaveLength(5);
    });

    it('exposes 4 timeline phases in chronological order', () => {
      expect(TIMELINE_PHASES).toHaveLength(4);
      expect(TIMELINE_PHASE_ORDER).toEqual(['old-kingdom', 'late-period', 'roman', 'modern']);
    });

    it('layers have correct IDs', () => {
      const ids = CHRONOLOGY_LAYERS.map((l) => l.id);
      expect(ids).toContain('old-kingdom');
      expect(ids).toContain('middle-kingdom');
      expect(ids).toContain('late-period');
      expect(ids).toContain('roman');
      expect(ids).toContain('modern');
    });

    it('Old Kingdom has confidence 55', () => {
      const ok = CHRONOLOGY_LAYERS.find((l) => l.id === 'old-kingdom');
      expect(ok!.confidence).toBe(55);
    });

    it('Middle Kingdom has confidence 50', () => {
      const mk = CHRONOLOGY_LAYERS.find((l) => l.id === 'middle-kingdom');
      expect(mk!.confidence).toBe(50);
    });

    it('Late Period has confidence 90', () => {
      const lp = CHRONOLOGY_LAYERS.find((l) => l.id === 'late-period');
      expect(lp!.confidence).toBe(90);
    });

    it('Roman has confidence 95', () => {
      const r = CHRONOLOGY_LAYERS.find((l) => l.id === 'roman');
      expect(r!.confidence).toBe(95);
    });

    it('Modern has confidence 100', () => {
      const m = CHRONOLOGY_LAYERS.find((l) => l.id === 'modern');
      expect(m!.confidence).toBe(100);
    });

    it('each layer has a date range and description', () => {
      for (const layer of CHRONOLOGY_LAYERS) {
        expect(layer.dateRange.start).toBeLessThan(layer.dateRange.end);
        expect(layer.description.length).toBeGreaterThan(0);
      }
    });
  });

  describe('getObjectChronology', () => {
    it('architecture objects appear in all periods', () => {
      const periods = getObjectChronology('OBJ-0001');
      expect(periods).toHaveLength(5);
    });

    it('sarcophagi appear from Late Period onward', () => {
      const periods = getObjectChronology('OBJ-0008');
      expect(periods).toContain('late-period');
      expect(periods).toContain('roman');
      expect(periods).toContain('modern');
      expect(periods).not.toContain('old-kingdom');
    });

    it('modern installations only appear in modern', () => {
      const periods = getObjectChronology('OBJ-0016');
      expect(periods).toEqual(['modern']);
    });

    it('unknown objects default to all periods', () => {
      const periods = getObjectChronology('OBJ-9999');
      expect(periods).toHaveLength(5);
    });
  });

  describe('getChronologyConfidence', () => {
    it('returns layer confidence when object is present', () => {
      expect(getChronologyConfidence('OBJ-0001', 'old-kingdom')).toBe(55);
      expect(getChronologyConfidence('OBJ-0001', 'modern')).toBe(100);
    });

    it('returns 0 when object is not in that period', () => {
      expect(getChronologyConfidence('OBJ-0008', 'old-kingdom')).toBe(0);
    });
  });

  describe('filterObjectsByChronology', () => {
    it('filters to only objects present in the period', () => {
      const allObjects = ['OBJ-0001', 'OBJ-0008', 'OBJ-0016'];
      const oldKingdom = filterObjectsByChronology(allObjects, 'old-kingdom');
      expect(oldKingdom).toContain('OBJ-0001');
      expect(oldKingdom).not.toContain('OBJ-0008');
      expect(oldKingdom).not.toContain('OBJ-0016');
    });

    it('modern period includes all objects', () => {
      const allObjects = ['OBJ-0001', 'OBJ-0008', 'OBJ-0016'];
      const modern = filterObjectsByChronology(allObjects, 'modern');
      expect(modern).toHaveLength(3);
    });
  });

  describe('getTimelinePhasesForPeriod', () => {
    it('expands Old Kingdom to all phases (earliest)', () => {
      expect(getTimelinePhasesForPeriod('Old Kingdom')).toEqual(TIMELINE_PHASE_ORDER);
    });

    it('maps Late Period to late-period and later', () => {
      expect(getTimelinePhasesForPeriod('Late Period')).toEqual(['late-period', 'roman', 'modern']);
    });

    it('maps Roman to roman and modern', () => {
      expect(getTimelinePhasesForPeriod('Roman')).toEqual(['roman', 'modern']);
    });

    it('maps Modern to modern only', () => {
      expect(getTimelinePhasesForPeriod('Modern')).toEqual(['modern']);
    });

    it('falls back to all phases for unknown labels', () => {
      expect(getTimelinePhasesForPeriod('Uncharted Era')).toEqual(TIMELINE_PHASE_ORDER);
    });
  });

  describe('getEvidenceTimelinePhases', () => {
    it('returns all phases when evidence has no chronology tags', () => {
      const ev = { chronologyTags: [] } as unknown as Parameters<
        typeof getEvidenceTimelinePhases
      >[0];
      expect(getEvidenceTimelinePhases(ev)).toEqual(TIMELINE_PHASE_ORDER);
    });

    it('unions phases across multiple chronology tags', () => {
      const ev = {
        chronologyTags: [{ period: 'Old Kingdom', scope: 'construction' }],
      } as unknown as Parameters<typeof getEvidenceTimelinePhases>[0];
      expect(getEvidenceTimelinePhases(ev)).toEqual(TIMELINE_PHASE_ORDER);
    });
  });

  describe('getObjectTimelinePhases', () => {
    it('uses explicit OBJECT_CHRONOLOGY when available', () => {
      expect(getObjectTimelinePhases('OBJ-0016')).toEqual(['modern']);
    });

    it('falls back to evidence chronology for unmapped objects', () => {
      const phases = getObjectTimelinePhases('OBJ-0104'); // Al-Mamun tunnel, Medieval
      expect(phases).toContain('modern');
      expect(phases).not.toContain('old-kingdom');
    });

    it('defaults unknown objects without evidence to all phases', () => {
      expect(getObjectTimelinePhases('OBJ-9999')).toEqual(TIMELINE_PHASE_ORDER);
    });
  });

  describe('geometry continuity', () => {
    it('architecture objects are present in all 5 layers (geometry continuity)', () => {
      const periods: ChronologyPeriod[] = [
        'old-kingdom',
        'middle-kingdom',
        'late-period',
        'roman',
        'modern',
      ];
      for (const archId of ['OBJ-0001', 'OBJ-0006', 'OBJ-0007']) {
        for (const period of periods) {
          expect(getObjectChronology(archId)).toContain(period);
        }
      }
    });
  });
});
