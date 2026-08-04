import { describe, it, expect } from 'vitest';
import {
  validateSurveyDeviation,
  summarizeByConfidence,
  TOLERANCE_BY_CONFIDENCE,
  type SurveyPoint,
} from './surveyDeviation';

function makeSurveyPoints(): SurveyPoint[] {
  return [
    { id: 'P001', position: { x: 0, y: 0, z: 0 }, confidence: 90, source: 'scan-2024' },
    { id: 'P002', position: { x: 10, y: 0, z: 0 }, confidence: 85, source: 'scan-2024' },
    { id: 'P003', position: { x: 0, y: 10, z: 0 }, confidence: 60, source: 'survey-2023' },
    { id: 'P004', position: { x: 0, y: 0, z: 10 }, confidence: 30, source: 'estimate' },
  ];
}

describe('Survey Deviation (M06A-T09)', () => {
  describe('TOLERANCE_BY_CONFIDENCE', () => {
    it('has tighter tolerance for high confidence', () => {
      expect(TOLERANCE_BY_CONFIDENCE.high).toBeLessThan(TOLERANCE_BY_CONFIDENCE.medium);
      expect(TOLERANCE_BY_CONFIDENCE.medium).toBeLessThan(TOLERANCE_BY_CONFIDENCE.low);
    });
  });

  describe('validateSurveyDeviation', () => {
    it('returns passing report when deviations are small', () => {
      const points = makeSurveyPoints();
      const reconstructed = new Map([
        ['P001', { x: 0.001, y: 0, z: 0 }],
        ['P002', { x: 10.001, y: 0, z: 0 }],
        ['P003', { x: 0, y: 10.01, z: 0 }],
        ['P004', { x: 0, y: 0, z: 10.05 }],
      ]);

      const report = validateSurveyDeviation(points, reconstructed);
      expect(report.totalPoints).toBe(4);
      expect(report.passed).toBe(true);
      expect(report.passRate).toBe(1);
    });

    it('detects large deviations', () => {
      const points = makeSurveyPoints();
      const reconstructed = new Map([
        ['P001', { x: 1, y: 0, z: 0 }],
        ['P002', { x: 10, y: 0, z: 0 }],
        ['P003', { x: 0, y: 10, z: 0 }],
        ['P004', { x: 0, y: 0, z: 10 }],
      ]);

      const report = validateSurveyDeviation(points, reconstructed);
      expect(report.maxDeviation).toBeGreaterThan(0.5);
      expect(report.results[0].withinTolerance).toBe(false);
    });

    it('computes mean and RMS deviation', () => {
      const points = [
        { id: 'P001', position: { x: 0, y: 0, z: 0 }, confidence: 90, source: 'test' },
      ];
      const reconstructed = new Map([['P001', { x: 0.001, y: 0, z: 0 }]]);
      const report = validateSurveyDeviation(points, reconstructed);
      expect(report.meanDeviation).toBeCloseTo(0.001, 5);
      expect(report.rmsDeviation).toBeCloseTo(0.001, 5);
    });

    it('supports custom tolerance', () => {
      const points = [
        { id: 'P001', position: { x: 0, y: 0, z: 0 }, confidence: 90, source: 'test' },
      ];
      const reconstructed = new Map([['P001', { x: 0.1, y: 0, z: 0 }]]);
      const report = validateSurveyDeviation(points, reconstructed, 0.5);
      expect(report.results[0].withinTolerance).toBe(true);
    });
  });

  describe('summarizeByConfidence', () => {
    it('groups results by confidence level', () => {
      const points = makeSurveyPoints();
      const reconstructed = new Map([
        ['P001', { x: 0, y: 0, z: 0 }],
        ['P002', { x: 10, y: 0, z: 0 }],
        ['P003', { x: 0, y: 10, z: 0 }],
        ['P004', { x: 0, y: 0, z: 10 }],
      ]);
      const report = validateSurveyDeviation(points, reconstructed);
      const summary = summarizeByConfidence(report);
      expect(summary.length).toBeGreaterThan(0);
    });
  });
});
