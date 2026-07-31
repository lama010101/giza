import { describe, it, expect } from 'vitest';
import {
  DEFAULT_RELIABILITY_TABLE,
  getDefaultReliability,
  getReliabilityRationale,
  getReliabilityEntry,
  getAllReliabilityDefaults,
} from './sourceReliability';

describe('Source Reliability (M03-T05)', () => {
  describe('DEFAULT_RELIABILITY_TABLE', () => {
    it('has entries for all major source types', () => {
      const types = DEFAULT_RELIABILITY_TABLE.map((r) => r.sourceType);
      expect(types).toContain('Peer-Reviewed Journal Article');
      expect(types).toContain('Archaeological Report');
      expect(types).toContain('Book');
      expect(types).toContain('Website');
      expect(types).toContain('Survey');
    });

    it('every entry has a reliability score 0-100', () => {
      for (const entry of DEFAULT_RELIABILITY_TABLE) {
        expect(entry.defaultReliability).toBeGreaterThanOrEqual(0);
        expect(entry.defaultReliability).toBeLessThanOrEqual(100);
      }
    });

    it('every entry has a rationale', () => {
      for (const entry of DEFAULT_RELIABILITY_TABLE) {
        expect(entry.rationale.length).toBeGreaterThan(0);
      }
    });

    it('peer-reviewed journals have highest reliability', () => {
      const journal = getDefaultReliability('Peer-Reviewed Journal Article');
      const website = getDefaultReliability('Website');
      expect(journal).toBeGreaterThan(website);
    });
  });

  describe('getDefaultReliability', () => {
    it('returns the default for known types', () => {
      expect(getDefaultReliability('Peer-Reviewed Journal Article')).toBe(90);
      expect(getDefaultReliability('Website')).toBe(40);
    });

    it('returns 50 for unknown types', () => {
      expect(getDefaultReliability('Unknown Type')).toBe(50);
    });
  });

  describe('getReliabilityRationale', () => {
    it('returns rationale for known types', () => {
      const rationale = getReliabilityRationale('Peer-Reviewed Journal Article');
      expect(rationale.toLowerCase()).toContain('peer');
    });

    it('returns neutral message for unknown types', () => {
      const rationale = getReliabilityRationale('Unknown');
      expect(rationale).toContain('Unknown');
    });
  });

  describe('getReliabilityEntry', () => {
    it('returns the full entry for known types', () => {
      const entry = getReliabilityEntry('Book');
      expect(entry).toBeDefined();
      expect(entry?.sourceType).toBe('Book');
      expect(entry?.defaultReliability).toBe(75);
    });

    it('returns undefined for unknown types', () => {
      expect(getReliabilityEntry('Unknown')).toBeUndefined();
    });
  });

  describe('getAllReliabilityDefaults', () => {
    it('returns all entries', () => {
      const all = getAllReliabilityDefaults();
      expect(all.length).toBeGreaterThan(10);
    });
  });
});
