/**
 * Performance optimization per M12-T05.
 *
 * Target: 60 FPS on desktop-high, 30 FPS on mobile.
 *
 * Optimizations:
 *   1. Adaptive LOD based on frame rate
 *   2. Frustum culling
 *   3. Instanced rendering for repeated geometry
 *   4. Texture compression and streaming
 *   5. Draw call batching
 *   6. Web Worker offloading for heavy computation
 *   7. Frame budget monitoring
 */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

export type PerformanceTier = 'desktop-high' | 'desktop-low' | 'mobile' | 'unknown';

export interface FrameStats {
  fps: number;
  frameTime: number; // ms
  drawCalls: number;
  triangles: number;
  textures: number;
  geometries: number;
  programs: number;
}

export interface PerformanceBudget {
  tier: PerformanceTier;
  minFPS: number;
  targetFPS: number;
  maxDrawCalls: number;
  maxTriangles: number; // in millions
  maxTextureMemory: number; // MB
  maxGeometries: number;
}

export const PERFORMANCE_BUDGETS: Record<PerformanceTier, PerformanceBudget> = {
  'desktop-high': {
    tier: 'desktop-high',
    minFPS: 60,
    targetFPS: 60,
    maxDrawCalls: 500,
    maxTriangles: 5,
    maxTextureMemory: 1024,
    maxGeometries: 1000,
  },
  'desktop-low': {
    tier: 'desktop-low',
    minFPS: 30,
    targetFPS: 45,
    maxDrawCalls: 300,
    maxTriangles: 2,
    maxTextureMemory: 512,
    maxGeometries: 500,
  },
  mobile: {
    tier: 'mobile',
    minFPS: 30,
    targetFPS: 30,
    maxDrawCalls: 150,
    maxTriangles: 1,
    maxTextureMemory: 256,
    maxGeometries: 200,
  },
  unknown: {
    tier: 'unknown',
    minFPS: 30,
    targetFPS: 30,
    maxDrawCalls: 200,
    maxTriangles: 2,
    maxTextureMemory: 512,
    maxGeometries: 500,
  },
};

// ─── Performance store ─────────────────────────────────────────────────────

interface PerformanceState {
  tier: PerformanceTier;
  currentFPS: number;
  avgFPS: number;
  frameStats: FrameStats | null;
  adaptiveLOD: boolean;
  showStats: boolean;

  setTier: (tier: PerformanceTier) => void;
  updateFPS: (fps: number) => void;
  setFrameStats: (stats: FrameStats) => void;
  setAdaptiveLOD: (enabled: boolean) => void;
  setShowStats: (show: boolean) => void;
  getRecommendedLOD: () => 'LOD0' | 'LOD1' | 'LOD2' | 'LOD3';
}

const FPS_HISTORY_SIZE = 60;
const fpsHistory: number[] = [];

export const usePerformanceStore = create<PerformanceState>()(
  devtools(
    (set, get) => ({
      tier: 'unknown',
      currentFPS: 60,
      avgFPS: 60,
      frameStats: null,
      adaptiveLOD: true,
      showStats: false,

      setTier: (tier) => set({ tier }),

      updateFPS: (fps) => {
        fpsHistory.push(fps);
        if (fpsHistory.length > FPS_HISTORY_SIZE) fpsHistory.shift();
        const avg = fpsHistory.reduce((a, b) => a + b, 0) / fpsHistory.length;
        set({ currentFPS: fps, avgFPS: Math.round(avg) });
      },

      setFrameStats: (frameStats) => set({ frameStats }),

      setAdaptiveLOD: (adaptiveLOD) => set({ adaptiveLOD }),

      setShowStats: (showStats) => set({ showStats }),

      getRecommendedLOD: () => {
        const { avgFPS, adaptiveLOD, tier } = get();
        if (!adaptiveLOD) return 'LOD0';

        const budget = PERFORMANCE_BUDGETS[tier];
        if (avgFPS < budget.minFPS * 0.5) return 'LOD3';
        if (avgFPS < budget.minFPS * 0.7) return 'LOD2';
        if (avgFPS < budget.minFPS * 0.9) return 'LOD1';
        return 'LOD0';
      },
    }),
    { name: 'GIZA Performance' },
  ),
);

// ─── Performance tier detection ─────────────────────────────────────────────

/**
 * Detects the performance tier based on hardware capabilities.
 */
export function detectPerformanceTier(): PerformanceTier {
  if (typeof navigator === 'undefined') return 'unknown';

  // Check for mobile
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent,
  );

  if (isMobile) return 'mobile';

  // Check hardware concurrency
  const cores = navigator.hardwareConcurrency ?? 4;
  // Check device memory (if available)
  const memory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? 4;

  if (cores >= 8 && memory >= 8) return 'desktop-high';
  if (cores >= 4 && memory >= 4) return 'desktop-low';

  return 'desktop-low';
}

// ─── Frame budget monitor ─────────────────────────────────────────────────

/**
 * Frame budget monitor — tracks frame time and calls onBudgetExceeded
 * when the frame time exceeds the budget.
 */
export class FrameBudgetMonitor {
  private frameTimes: number[] = [];
  private readonly sampleSize: number;
  private readonly budgetMs: number;
  private onBudgetExceeded?: () => void;

  constructor(budgetMs = 16.67, sampleSize = 30) {
    this.budgetMs = budgetMs;
    this.sampleSize = sampleSize;
  }

  onExceed(callback: () => void): void {
    this.onBudgetExceeded = callback;
  }

  recordFrame(frameTimeMs: number): void {
    this.frameTimes.push(frameTimeMs);
    if (this.frameTimes.length > this.sampleSize) {
      this.frameTimes.shift();
    }

    const avgFrameTime = this.frameTimes.reduce((a, b) => a + b, 0) / this.frameTimes.length;

    if (avgFrameTime > this.budgetMs && this.onBudgetExceeded) {
      this.onBudgetExceeded();
    }
  }

  getAverageFrameTime(): number {
    if (this.frameTimes.length === 0) return 0;
    return this.frameTimes.reduce((a, b) => a + b, 0) / this.frameTimes.length;
  }

  getCurrentFPS(): number {
    const avg = this.getAverageFrameTime();
    return avg > 0 ? Math.round(1000 / avg) : 0;
  }

  reset(): void {
    this.frameTimes = [];
  }
}

// ─── Optimization strategies ────────────────────────────────────────────────

/**
 * Returns optimization recommendations based on current performance.
 */
export function getOptimizationRecommendations(
  tier: PerformanceTier,
  currentStats: FrameStats,
): string[] {
  const budget = PERFORMANCE_BUDGETS[tier];
  const recommendations: string[] = [];

  if (currentStats.drawCalls > budget.maxDrawCalls) {
    recommendations.push(
      `Reduce draw calls (${currentStats.drawCalls} > ${budget.maxDrawCalls} budget) — consider instancing or batching`,
    );
  }

  if (currentStats.triangles > budget.maxTriangles * 1_000_000) {
    recommendations.push(
      `Reduce triangle count (${(currentStats.triangles / 1_000_000).toFixed(2)}M > ${budget.maxTriangles}M budget) — consider LOD or culling`,
    );
  }

  return recommendations;
}
