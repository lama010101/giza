import { describe, it, expect } from 'vitest';
import {
  PERFORMANCE_BUDGETS,
  captureSample,
  validateAgainstBudget,
  sampleToMarkdownRow,
  generateReport,
} from './performanceBaseline';

describe('Performance Baseline (M08.5-T07)', () => {
  describe('PERFORMANCE_BUDGETS', () => {
    it('defines budgets for all 4 profiles', () => {
      expect(PERFORMANCE_BUDGETS['desktop-high']).toBeDefined();
      expect(PERFORMANCE_BUDGETS['desktop-standard']).toBeDefined();
      expect(PERFORMANCE_BUDGETS['mobile-high']).toBeDefined();
      expect(PERFORMANCE_BUDGETS['mobile-standard']).toBeDefined();
    });

    it('desktop-high requires 60 FPS', () => {
      expect(PERFORMANCE_BUDGETS['desktop-high'].minFPS).toBe(60);
    });

    it('mobile budgets are more conservative', () => {
      expect(PERFORMANCE_BUDGETS['mobile-standard'].maxDrawCalls).toBeLessThan(
        PERFORMANCE_BUDGETS['desktop-standard'].maxDrawCalls,
      );
      expect(PERFORMANCE_BUDGETS['mobile-standard'].maxTriangles).toBeLessThan(
        PERFORMANCE_BUDGETS['desktop-standard'].maxTriangles,
      );
    });
  });

  describe('captureSample', () => {
    it('captures a performance sample', () => {
      const sample = captureSample(
        { drawCalls: 500, triangles: 100000, geometries: 50, textures: 20, programs: 10 },
        60,
        16.7,
      );
      expect(sample.fps).toBe(60);
      expect(sample.frameTime).toBe(16.7);
      expect(sample.drawCalls).toBe(500);
      expect(sample.triangles).toBe(100000);
      expect(sample.timestamp).toBeGreaterThan(0);
    });
  });

  describe('validateAgainstBudget', () => {
    it('passes when all metrics are within budget', () => {
      const sample = captureSample(
        { drawCalls: 500, triangles: 100000, geometries: 50, textures: 20, programs: 10 },
        60,
        16.7,
      );
      const result = validateAgainstBudget(sample, PERFORMANCE_BUDGETS['desktop-high']);
      expect(result.passed).toBe(true);
      expect(result.violations).toHaveLength(0);
    });

    it('fails when FPS is below minimum', () => {
      const sample = captureSample(
        { drawCalls: 500, triangles: 100000, geometries: 50, textures: 20, programs: 10 },
        30,
        33.3,
      );
      const result = validateAgainstBudget(sample, PERFORMANCE_BUDGETS['desktop-high']);
      expect(result.passed).toBe(false);
      expect(result.violations.some((v) => v.includes('FPS'))).toBe(true);
    });

    it('fails when draw calls exceed budget', () => {
      const sample = captureSample(
        { drawCalls: 3000, triangles: 100000, geometries: 50, textures: 20, programs: 10 },
        60,
        16.7,
      );
      const result = validateAgainstBudget(sample, PERFORMANCE_BUDGETS['desktop-high']);
      expect(result.passed).toBe(false);
      expect(result.violations.some((v) => v.includes('Draw calls'))).toBe(true);
    });
  });

  describe('sampleToMarkdownRow', () => {
    it('formats a sample as a markdown table row', () => {
      const sample = captureSample(
        { drawCalls: 500, triangles: 100000, geometries: 50, textures: 20, programs: 10 },
        60,
        16.7,
      );
      const row = sampleToMarkdownRow(sample);
      expect(row).toContain('|');
      expect(row).toContain('60.0');
      expect(row).toContain('500');
    });
  });

  describe('generateReport', () => {
    it('generates a markdown report with summary and verdict', () => {
      const samples = [
        captureSample(
          { drawCalls: 500, triangles: 100000, geometries: 50, textures: 20, programs: 10 },
          60,
          16.7,
        ),
        captureSample(
          { drawCalls: 550, triangles: 110000, geometries: 52, textures: 21, programs: 10 },
          58,
          17.2,
        ),
      ];
      const report = generateReport(samples, 'desktop-high', PERFORMANCE_BUDGETS['desktop-high']);
      expect(report).toContain('# Benchmark Performance Report');
      expect(report).toContain('desktop-high');
      expect(report).toContain('Summary');
      expect(report).toContain('Verdict');
      expect(report).toContain('Raw Samples');
    });

    it('report shows pass when within budget', () => {
      const samples = [
        captureSample(
          { drawCalls: 500, triangles: 100000, geometries: 50, textures: 20, programs: 10 },
          60,
          16.7,
        ),
      ];
      const report = generateReport(samples, 'desktop-high', PERFORMANCE_BUDGETS['desktop-high']);
      expect(report).toContain('✅');
    });

    it('report shows fail when outside budget', () => {
      const samples = [
        captureSample(
          { drawCalls: 500, triangles: 100000, geometries: 50, textures: 20, programs: 10 },
          20,
          50,
        ),
      ];
      const report = generateReport(samples, 'desktop-high', PERFORMANCE_BUDGETS['desktop-high']);
      expect(report).toContain('❌');
    });
  });
});
