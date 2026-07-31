import { describe, it, expect, beforeEach } from 'vitest';
import {
  usePerformanceStore,
  PERFORMANCE_BUDGETS,
  detectPerformanceTier,
  FrameBudgetMonitor,
  getOptimizationRecommendations,
  type PerformanceTier,
  type FrameStats,
} from './performanceOptimization';

describe('Performance Optimization (M12-T05)', () => {
  beforeEach(() => {
    usePerformanceStore.getState().setTier('unknown');
    usePerformanceStore.getState().setAdaptiveLOD(true);
  });

  describe('PERFORMANCE_BUDGETS', () => {
    it('defines budgets for all tiers', () => {
      const tiers: PerformanceTier[] = ['desktop-high', 'desktop-low', 'mobile', 'unknown'];
      for (const tier of tiers) {
        expect(PERFORMANCE_BUDGETS[tier]).toBeDefined();
        expect(PERFORMANCE_BUDGETS[tier].minFPS).toBeGreaterThan(0);
        expect(PERFORMANCE_BUDGETS[tier].maxDrawCalls).toBeGreaterThan(0);
      }
    });

    it('desktop-high targets 60 FPS', () => {
      expect(PERFORMANCE_BUDGETS['desktop-high'].targetFPS).toBe(60);
    });

    it('mobile targets 30 FPS', () => {
      expect(PERFORMANCE_BUDGETS.mobile.targetFPS).toBe(30);
    });

    it('mobile has stricter budgets than desktop', () => {
      expect(PERFORMANCE_BUDGETS.mobile.maxDrawCalls).toBeLessThan(
        PERFORMANCE_BUDGETS['desktop-high'].maxDrawCalls,
      );
      expect(PERFORMANCE_BUDGETS.mobile.maxTriangles).toBeLessThan(
        PERFORMANCE_BUDGETS['desktop-high'].maxTriangles,
      );
    });
  });

  describe('detectPerformanceTier', () => {
    it('returns a valid tier', () => {
      const tier = detectPerformanceTier();
      expect(['desktop-high', 'desktop-low', 'mobile', 'unknown']).toContain(tier);
    });
  });

  describe('usePerformanceStore', () => {
    it('starts with unknown tier', () => {
      expect(usePerformanceStore.getState().tier).toBe('unknown');
    });

    it('setTier updates the tier', () => {
      usePerformanceStore.getState().setTier('desktop-high');
      expect(usePerformanceStore.getState().tier).toBe('desktop-high');
    });

    it('updateFPS tracks current and average FPS', () => {
      usePerformanceStore.getState().updateFPS(60);
      expect(usePerformanceStore.getState().currentFPS).toBe(60);
      expect(usePerformanceStore.getState().avgFPS).toBe(60);
    });

    it('setFrameStats stores frame statistics', () => {
      const stats: FrameStats = {
        fps: 60,
        frameTime: 16.67,
        drawCalls: 100,
        triangles: 50000,
        textures: 20,
        geometries: 50,
        programs: 10,
      };
      usePerformanceStore.getState().setFrameStats(stats);
      expect(usePerformanceStore.getState().frameStats).toEqual(stats);
    });

    it('setAdaptiveLOD toggles adaptive LOD', () => {
      usePerformanceStore.getState().setAdaptiveLOD(false);
      expect(usePerformanceStore.getState().adaptiveLOD).toBe(false);
    });

    it('setShowStats toggles stats display', () => {
      usePerformanceStore.getState().setShowStats(true);
      expect(usePerformanceStore.getState().showStats).toBe(true);
    });
  });

  describe('getRecommendedLOD', () => {
    it('returns LOD0 when FPS is high', () => {
      usePerformanceStore.getState().setTier('desktop-high');
      usePerformanceStore.getState().updateFPS(60);
      expect(usePerformanceStore.getState().getRecommendedLOD()).toBe('LOD0');
    });

    it('returns LOD3 when FPS is very low', () => {
      // Reset FPS history by updating many times with low FPS
      usePerformanceStore.getState().setTier('desktop-high');
      for (let i = 0; i < 60; i++) {
        usePerformanceStore.getState().updateFPS(20);
      }
      expect(usePerformanceStore.getState().getRecommendedLOD()).toBe('LOD3');
    });

    it('returns LOD0 when adaptiveLOD is disabled', () => {
      usePerformanceStore.getState().setAdaptiveLOD(false);
      usePerformanceStore.getState().updateFPS(10);
      expect(usePerformanceStore.getState().getRecommendedLOD()).toBe('LOD0');
    });
  });

  describe('FrameBudgetMonitor', () => {
    it('tracks frame times', () => {
      const monitor = new FrameBudgetMonitor(16.67);
      monitor.recordFrame(16);
      monitor.recordFrame(17);
      expect(monitor.getAverageFrameTime()).toBeCloseTo(16.5, 1);
    });

    it('calculates current FPS from frame time', () => {
      const monitor = new FrameBudgetMonitor();
      monitor.recordFrame(16.67);
      expect(monitor.getCurrentFPS()).toBeCloseTo(60, 0);
    });

    it('calls onExceed when budget exceeded', () => {
      let exceeded = false;
      const monitor = new FrameBudgetMonitor(16.67, 5);
      monitor.onExceed(() => {
        exceeded = true;
      });
      // Record frames above budget
      for (let i = 0; i < 6; i++) {
        monitor.recordFrame(30);
      }
      expect(exceeded).toBe(true);
    });

    it('reset clears frame history', () => {
      const monitor = new FrameBudgetMonitor();
      monitor.recordFrame(16);
      monitor.reset();
      expect(monitor.getAverageFrameTime()).toBe(0);
    });
  });

  describe('getOptimizationRecommendations', () => {
    it('recommends reducing draw calls when over budget', () => {
      const stats: FrameStats = {
        fps: 30,
        frameTime: 33,
        drawCalls: 600,
        triangles: 100000,
        textures: 10,
        geometries: 50,
        programs: 5,
      };
      const recs = getOptimizationRecommendations('desktop-high', stats);
      expect(recs.some((r) => r.includes('draw calls'))).toBe(true);
    });

    it('recommends reducing triangles when over budget', () => {
      const stats: FrameStats = {
        fps: 30,
        frameTime: 33,
        drawCalls: 100,
        triangles: 10_000_000,
        textures: 10,
        geometries: 50,
        programs: 5,
      };
      const recs = getOptimizationRecommendations('desktop-high', stats);
      expect(recs.some((r) => r.includes('triangle'))).toBe(true);
    });

    it('returns no recommendations when within budget', () => {
      const stats: FrameStats = {
        fps: 60,
        frameTime: 16,
        drawCalls: 100,
        triangles: 50000,
        textures: 10,
        geometries: 50,
        programs: 5,
      };
      const recs = getOptimizationRecommendations('desktop-high', stats);
      expect(recs).toHaveLength(0);
    });
  });
});
