import { describe, it, expect, beforeEach } from 'vitest';
import {
  PERFORMANCE_BUDGETS,
  PerformanceBudgetEnforcer,
  createBudgetEnforcer,
  getPerformanceBudget,
  ZERO_METRICS,
} from './performanceBudget';
import { QUALITY_SETTINGS } from './gpuDetection';

describe('Performance Budget (M04-T08)', () => {
  describe('PERFORMANCE_BUDGETS', () => {
    it('defines budgets for all 4 quality profiles', () => {
      expect(PERFORMANCE_BUDGETS.ultra).toBeDefined();
      expect(PERFORMANCE_BUDGETS.high).toBeDefined();
      expect(PERFORMANCE_BUDGETS.medium).toBeDefined();
      expect(PERFORMANCE_BUDGETS.low).toBeDefined();
    });

    it('reuses triangle limits from QUALITY_SETTINGS', () => {
      expect(PERFORMANCE_BUDGETS.ultra.maxTriangles).toBe(QUALITY_SETTINGS.ultra.maxTriangles);
      expect(PERFORMANCE_BUDGETS.low.maxTriangles).toBe(QUALITY_SETTINGS.low.maxTriangles);
    });

    it('reuses draw call limits from QUALITY_SETTINGS', () => {
      expect(PERFORMANCE_BUDGETS.high.maxDrawCalls).toBe(QUALITY_SETTINGS.high.maxDrawCalls);
      expect(PERFORMANCE_BUDGETS.medium.maxDrawCalls).toBe(QUALITY_SETTINGS.medium.maxDrawCalls);
    });

    it('decreasing budgets from ultra to low', () => {
      expect(PERFORMANCE_BUDGETS.ultra.maxTriangles).toBeGreaterThan(
        PERFORMANCE_BUDGETS.high.maxTriangles,
      );
      expect(PERFORMANCE_BUDGETS.high.maxTriangles).toBeGreaterThan(
        PERFORMANCE_BUDGETS.medium.maxTriangles,
      );
      expect(PERFORMANCE_BUDGETS.medium.maxTriangles).toBeGreaterThan(
        PERFORMANCE_BUDGETS.low.maxTriangles,
      );
    });

    it('has lower minFPS for low profile', () => {
      expect(PERFORMANCE_BUDGETS.low.minFPS).toBeLessThan(PERFORMANCE_BUDGETS.medium.minFPS);
      expect(PERFORMANCE_BUDGETS.medium.minFPS).toBeLessThan(PERFORMANCE_BUDGETS.high.minFPS);
    });
  });

  describe('PerformanceBudgetEnforcer', () => {
    let enforcer: PerformanceBudgetEnforcer;

    beforeEach(() => {
      enforcer = new PerformanceBudgetEnforcer('high');
    });

    it('initializes with zero metrics', () => {
      const metrics = enforcer.getMetrics();
      expect(metrics).toEqual(ZERO_METRICS);
    });

    it('updates metrics', () => {
      enforcer.updateMetrics({ triangleCount: 500_000, drawCalls: 200 });
      const metrics = enforcer.getMetrics();
      expect(metrics.triangleCount).toBe(500_000);
      expect(metrics.drawCalls).toBe(200);
    });

    it('detects over triangle budget', () => {
      const budget = enforcer.getBudget();
      enforcer.updateMetrics({ triangleCount: budget.maxTriangles + 1 });
      expect(enforcer.isOverTriangleBudget()).toBe(true);
    });

    it('detects within triangle budget', () => {
      const budget = enforcer.getBudget();
      enforcer.updateMetrics({ triangleCount: budget.maxTriangles - 1 });
      expect(enforcer.isOverTriangleBudget()).toBe(false);
    });

    it('detects over draw call budget', () => {
      const budget = enforcer.getBudget();
      enforcer.updateMetrics({ drawCalls: budget.maxDrawCalls + 1 });
      expect(enforcer.isOverDrawCallBudget()).toBe(true);
    });

    it('detects over texture memory budget', () => {
      const budget = enforcer.getBudget();
      enforcer.updateMetrics({ textureMemoryBytes: budget.maxTextureMemoryBytes + 1 });
      expect(enforcer.isOverTextureMemoryBudget()).toBe(true);
    });
  });

  describe('generateReport', () => {
    it('reports all metrics within budget', () => {
      const enforcer = new PerformanceBudgetEnforcer('high');
      enforcer.updateMetrics({
        triangleCount: 100_000,
        drawCalls: 100,
        textureMemoryBytes: 10_000_000,
        currentFPS: 60,
      });

      const report = enforcer.generateReport();
      expect(report.profile).toBe('high');
      expect(report.anyOverBudget).toBe(false);
      expect(report.metrics).toHaveLength(3);
      expect(report.metrics[0].name).toBe('triangles');
      expect(report.metrics[0].overBudget).toBe(false);
      expect(report.recommendedActions).toHaveLength(1);
      expect(report.recommendedActions[0].type).toBe('none');
    });

    it('reports over budget when triangles exceed limit', () => {
      const enforcer = new PerformanceBudgetEnforcer('low');
      const budget = enforcer.getBudget();
      enforcer.updateMetrics({
        triangleCount: budget.maxTriangles + 100_000,
        drawCalls: 50,
        textureMemoryBytes: 1000,
      });

      const report = enforcer.generateReport();
      expect(report.anyOverBudget).toBe(true);
      const triangleMetric = report.metrics.find((m) => m.name === 'triangles');
      expect(triangleMetric?.overBudget).toBe(true);
      expect(triangleMetric?.utilization).toBeGreaterThan(1);
    });

    it('calculates utilization correctly', () => {
      const enforcer = new PerformanceBudgetEnforcer('medium');
      const budget = enforcer.getBudget();
      enforcer.updateMetrics({ triangleCount: budget.maxTriangles / 2 });

      const report = enforcer.generateReport();
      const triangleMetric = report.metrics.find((m) => m.name === 'triangles');
      expect(triangleMetric?.utilization).toBeCloseTo(0.5, 5);
    });
  });

  describe('recommendActions — LOD reduction triggers', () => {
    it('triggers LOD reduction when FPS is below threshold', () => {
      const enforcer = new PerformanceBudgetEnforcer('high');
      // Push enough FPS samples below the threshold
      for (let i = 0; i < 15; i++) {
        enforcer.updateMetrics({ currentFPS: 30 });
      }

      const report = enforcer.generateReport();
      const lodAction = report.recommendedActions.find((a) => a.type === 'reduce-lod');
      expect(lodAction).toBeDefined();
      expect(lodAction?.targetLOD).toBeDefined();
    });

    it('triggers LOD reduction when triangle budget exceeded', () => {
      const enforcer = new PerformanceBudgetEnforcer('low');
      const budget = enforcer.getBudget();
      enforcer.updateMetrics({
        triangleCount: budget.maxTriangles * 2.5,
        currentFPS: 60,
      });

      const report = enforcer.generateReport();
      const lodAction = report.recommendedActions.find((a) => a.type === 'reduce-lod');
      expect(lodAction).toBeDefined();
      // 2.5x over budget → LOD3
      expect(lodAction?.targetLOD).toBe('LOD3');
    });

    it('selects LOD2 for 1.5–2x over triangle budget', () => {
      const enforcer = new PerformanceBudgetEnforcer('low');
      const budget = enforcer.getBudget();
      enforcer.updateMetrics({
        triangleCount: budget.maxTriangles * 1.7,
        currentFPS: 60,
      });

      const report = enforcer.generateReport();
      const lodAction = report.recommendedActions.find((a) => a.type === 'reduce-lod');
      expect(lodAction).toBeDefined();
      expect(lodAction?.targetLOD).toBe('LOD2');
    });

    it('selects LOD1 for 1–1.5x over triangle budget', () => {
      const enforcer = new PerformanceBudgetEnforcer('low');
      const budget = enforcer.getBudget();
      enforcer.updateMetrics({
        triangleCount: budget.maxTriangles * 1.2,
        currentFPS: 60,
      });

      const report = enforcer.generateReport();
      const lodAction = report.recommendedActions.find((a) => a.type === 'reduce-lod');
      expect(lodAction).toBeDefined();
      expect(lodAction?.targetLOD).toBe('LOD1');
    });

    it('triggers asset unloading when draw calls exceed budget', () => {
      const enforcer = new PerformanceBudgetEnforcer('low');
      const budget = enforcer.getBudget();
      enforcer.updateMetrics({
        drawCalls: budget.maxDrawCalls + 50,
        currentFPS: 60,
      });

      const report = enforcer.generateReport();
      const unloadAction = report.recommendedActions.find((a) => a.type === 'unload-assets');
      expect(unloadAction).toBeDefined();
      expect(unloadAction?.unloadCount).toBeGreaterThan(0);
    });

    it('triggers texture memory reduction when over budget', () => {
      const enforcer = new PerformanceBudgetEnforcer('low');
      const budget = enforcer.getBudget();
      enforcer.updateMetrics({
        textureMemoryBytes: budget.maxTextureMemoryBytes + 1_000_000,
        currentFPS: 60,
      });

      const report = enforcer.generateReport();
      const texAction = report.recommendedActions.find((a) => a.type === 'reduce-texture-memory');
      expect(texAction).toBeDefined();
    });
  });

  describe('setProfile', () => {
    it('switches to a new budget', () => {
      const enforcer = new PerformanceBudgetEnforcer('low');
      expect(enforcer.getProfile()).toBe('low');

      enforcer.setProfile('ultra');
      expect(enforcer.getProfile()).toBe('ultra');
      expect(enforcer.getBudget().maxTriangles).toBe(PERFORMANCE_BUDGETS.ultra.maxTriangles);
    });
  });

  describe('getAverageFPS', () => {
    it('returns current FPS when no history', () => {
      const enforcer = new PerformanceBudgetEnforcer('high');
      enforcer.updateMetrics({ currentFPS: 45 });
      expect(enforcer.getAverageFPS()).toBe(45);
    });

    it('averages FPS over history window', () => {
      const enforcer = new PerformanceBudgetEnforcer('high');
      enforcer.updateMetrics({ currentFPS: 60 });
      enforcer.updateMetrics({ currentFPS: 30 });
      expect(enforcer.getAverageFPS()).toBe(45);
    });
  });

  describe('createBudgetEnforcer', () => {
    it('creates an enforcer for the given profile', () => {
      const enforcer = createBudgetEnforcer('medium');
      expect(enforcer.getProfile()).toBe('medium');
    });
  });

  describe('getPerformanceBudget', () => {
    it('returns a copy of the budget', () => {
      const budget = getPerformanceBudget('ultra');
      expect(budget.profile).toBe('ultra');
      expect(budget.maxTriangles).toBe(PERFORMANCE_BUDGETS.ultra.maxTriangles);
    });
  });
});
