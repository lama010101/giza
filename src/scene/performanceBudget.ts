/**
 * Runtime performance budget enforcer per M04-T08.
 *
 * Tracks runtime metrics (triangle count, draw calls, texture memory, FPS)
 * and enforces per-quality-profile budgets. When a budget is exceeded,
 * the enforcer triggers LOD reduction or asset unloading to bring
 * runtime cost back within budget.
 *
 * Quality profiles and base limits are reused from {@link gpuDetection.ts}.
 * FPS monitoring integrates with {@link framePacing.ts}.
 */

import { QUALITY_SETTINGS, type QualityProfile } from './gpuDetection';
import { framePacer } from './framePacing';
import type { LODLevel } from '@/loaders/validators';

// ─── Budget definitions ───────────────────────────────────────────────────

/**
 * Runtime performance budget for a single quality profile.
 * Extends the static quality settings with runtime-specific limits.
 */
export interface PerformanceBudget {
  profile: QualityProfile;
  maxTriangles: number;
  maxDrawCalls: number;
  /** Maximum texture memory in bytes */
  maxTextureMemoryBytes: number;
  /** Minimum acceptable FPS before triggering reduction */
  minFPS: number;
  /** Target FPS for this profile */
  targetFPS: number;
}

/**
 * Per-profile performance budgets.
 * Triangle and draw call limits are derived from {@link QUALITY_SETTINGS};
 * texture memory and FPS thresholds are profile-specific.
 */
export const PERFORMANCE_BUDGETS: Record<QualityProfile, PerformanceBudget> = {
  ultra: {
    profile: 'ultra',
    maxTriangles: QUALITY_SETTINGS.ultra.maxTriangles,
    maxDrawCalls: QUALITY_SETTINGS.ultra.maxDrawCalls,
    maxTextureMemoryBytes: 1_073_741_824, // 1 GB
    minFPS: 55,
    targetFPS: 60,
  },
  high: {
    profile: 'high',
    maxTriangles: QUALITY_SETTINGS.high.maxTriangles,
    maxDrawCalls: QUALITY_SETTINGS.high.maxDrawCalls,
    maxTextureMemoryBytes: 536_870_912, // 512 MB
    minFPS: 50,
    targetFPS: 60,
  },
  medium: {
    profile: 'medium',
    maxTriangles: QUALITY_SETTINGS.medium.maxTriangles,
    maxDrawCalls: QUALITY_SETTINGS.medium.maxDrawCalls,
    maxTextureMemoryBytes: 268_435_456, // 256 MB
    minFPS: 40,
    targetFPS: 60,
  },
  low: {
    profile: 'low',
    maxTriangles: QUALITY_SETTINGS.low.maxTriangles,
    maxDrawCalls: QUALITY_SETTINGS.low.maxDrawCalls,
    maxTextureMemoryBytes: 134_217_728, // 128 MB
    minFPS: 30,
    targetFPS: 30,
  },
};

// ─── Runtime metrics ──────────────────────────────────────────────────────

export interface RuntimeMetrics {
  triangleCount: number;
  drawCalls: number;
  textureMemoryBytes: number;
  currentFPS: number;
  /** Number of frames dropped in the last measurement window */
  droppedFrames: number;
}

export const ZERO_METRICS: RuntimeMetrics = {
  triangleCount: 0,
  drawCalls: 0,
  textureMemoryBytes: 0,
  currentFPS: 0,
  droppedFrames: 0,
};

// ─── Budget report ────────────────────────────────────────────────────────

export interface MetricReport {
  name: string;
  current: number;
  budget: number;
  /** Fraction of budget used (0–1+); >1 means over budget */
  utilization: number;
  overBudget: boolean;
}

export interface BudgetReport {
  profile: QualityProfile;
  metrics: MetricReport[];
  fps: { current: number; target: number; min: number; belowThreshold: boolean };
  anyOverBudget: boolean;
  recommendedActions: BudgetAction[];
}

// ─── Budget actions ───────────────────────────────────────────────────────

export type BudgetActionType = 'reduce-lod' | 'unload-assets' | 'reduce-texture-memory' | 'none';

export interface BudgetAction {
  type: BudgetActionType;
  reason: string;
  /** Target LOD level to reduce to (for reduce-lod actions) */
  targetLOD?: LODLevel;
  /** Number of assets to unload (for unload-assets actions) */
  unloadCount?: number;
}

// ─── Budget enforcer ──────────────────────────────────────────────────────

/**
 * Runtime performance budget enforcer.
 *
 * Tracks metrics and produces budget reports and corrective actions
 * when budgets are exceeded.
 */
export class PerformanceBudgetEnforcer {
  private budget: PerformanceBudget;
  private metrics: RuntimeMetrics = { ...ZERO_METRICS };
  private fpsHistory: number[] = [];
  private readonly fpsHistoryMax = 60;

  constructor(profile: QualityProfile) {
    this.budget = PERFORMANCE_BUDGETS[profile];
  }

  /**
   * Sets the quality profile, updating the active budget.
   */
  setProfile(profile: QualityProfile): void {
    this.budget = PERFORMANCE_BUDGETS[profile];
  }

  getProfile(): QualityProfile {
    return this.budget.profile;
  }

  getBudget(): PerformanceBudget {
    return { ...this.budget };
  }

  /**
   * Updates runtime metrics. Called once per frame or measurement window.
   */
  updateMetrics(metrics: Partial<RuntimeMetrics>): void {
    this.metrics = { ...this.metrics, ...metrics };

    if (metrics.currentFPS !== undefined) {
      this.fpsHistory.push(metrics.currentFPS);
      if (this.fpsHistory.length > this.fpsHistoryMax) {
        this.fpsHistory.shift();
      }
    }
  }

  getMetrics(): RuntimeMetrics {
    return { ...this.metrics };
  }

  /**
   * Returns the average FPS over the recent history window.
   */
  getAverageFPS(): number {
    if (this.fpsHistory.length === 0) return this.metrics.currentFPS;
    const sum = this.fpsHistory.reduce((a, b) => a + b, 0);
    return sum / this.fpsHistory.length;
  }

  /**
   * Returns true if the triangle count exceeds the budget.
   */
  isOverTriangleBudget(): boolean {
    return this.metrics.triangleCount > this.budget.maxTriangles;
  }

  /**
   * Returns true if the draw call count exceeds the budget.
   */
  isOverDrawCallBudget(): boolean {
    return this.metrics.drawCalls > this.budget.maxDrawCalls;
  }

  /**
   * Returns true if texture memory exceeds the budget.
   */
  isOverTextureMemoryBudget(): boolean {
    return this.metrics.textureMemoryBytes > this.budget.maxTextureMemoryBytes;
  }

  /**
   * Returns true if FPS is below the minimum threshold.
   */
  isFPSBelowThreshold(): boolean {
    return this.getAverageFPS() < this.budget.minFPS && this.fpsHistory.length >= 10;
  }

  /**
   * Generates a full budget report comparing current metrics to the budget.
   */
  generateReport(): BudgetReport {
    const triangleUtil = this.metrics.triangleCount / this.budget.maxTriangles;
    const drawCallUtil = this.metrics.drawCalls / this.budget.maxDrawCalls;
    const textureUtil = this.metrics.textureMemoryBytes / this.budget.maxTextureMemoryBytes;

    const metricReports: MetricReport[] = [
      {
        name: 'triangles',
        current: this.metrics.triangleCount,
        budget: this.budget.maxTriangles,
        utilization: triangleUtil,
        overBudget: triangleUtil > 1,
      },
      {
        name: 'drawCalls',
        current: this.metrics.drawCalls,
        budget: this.budget.maxDrawCalls,
        utilization: drawCallUtil,
        overBudget: drawCallUtil > 1,
      },
      {
        name: 'textureMemory',
        current: this.metrics.textureMemoryBytes,
        budget: this.budget.maxTextureMemoryBytes,
        utilization: textureUtil,
        overBudget: textureUtil > 1,
      },
    ];

    const avgFPS = this.getAverageFPS();
    const fpsBelow = this.isFPSBelowThreshold();
    const anyOver = metricReports.some((m) => m.overBudget) || fpsBelow;

    return {
      profile: this.budget.profile,
      metrics: metricReports,
      fps: {
        current: avgFPS,
        target: this.budget.targetFPS,
        min: this.budget.minFPS,
        belowThreshold: fpsBelow,
      },
      anyOverBudget: anyOver,
      recommendedActions: this.recommendActions(metricReports, fpsBelow),
    };
  }

  /**
   * Recommends corrective actions based on current metrics.
   */
  recommendActions(metricReports: MetricReport[], fpsBelow: boolean): BudgetAction[] {
    const actions: BudgetAction[] = [];

    const triangleReport = metricReports.find((m) => m.name === 'triangles');
    const drawCallReport = metricReports.find((m) => m.name === 'drawCalls');
    const textureReport = metricReports.find((m) => m.name === 'textureMemory');

    // FPS below threshold is the primary trigger for LOD reduction
    if (fpsBelow) {
      actions.push({
        type: 'reduce-lod',
        reason: `Average FPS ${this.getAverageFPS().toFixed(1)} below minimum ${this.budget.minFPS}`,
        targetLOD: this.selectLODReductionTarget(),
      });
    }

    // Triangle budget exceeded
    if (triangleReport?.overBudget) {
      actions.push({
        type: 'reduce-lod',
        reason: `Triangles ${this.metrics.triangleCount} exceed budget ${this.budget.maxTriangles}`,
        targetLOD: this.selectLODReductionTarget(),
      });
    }

    // Draw call budget exceeded — unload distant assets
    if (drawCallReport?.overBudget) {
      const overflow = this.metrics.drawCalls - this.budget.maxDrawCalls;
      actions.push({
        type: 'unload-assets',
        reason: `Draw calls ${this.metrics.drawCalls} exceed budget ${this.budget.maxDrawCalls}`,
        unloadCount: Math.ceil(overflow / 10),
      });
    }

    // Texture memory exceeded — reduce texture resolution
    if (textureReport?.overBudget) {
      actions.push({
        type: 'reduce-texture-memory',
        reason: `Texture memory ${this.metrics.textureMemoryBytes} bytes exceeds budget ${this.budget.maxTextureMemoryBytes}`,
      });
    }

    if (actions.length === 0) {
      actions.push({ type: 'none', reason: 'All metrics within budget' });
    }

    return actions;
  }

  /**
   * Selects the target LOD level for reduction based on current overage.
   * Progressively reduces: LOD0 → LOD1 → LOD2 → LOD3.
   */
  private selectLODReductionTarget(): LODLevel {
    const triangleUtil = this.metrics.triangleCount / this.budget.maxTriangles;
    if (triangleUtil > 2) return 'LOD3';
    if (triangleUtil > 1.5) return 'LOD2';
    return 'LOD1';
  }

  /**
   * Integrates with the frame pacer to check if quality should be reduced.
   * Returns true if the frame pacer recommends quality reduction.
   */
  shouldReduceQualityFromFramePacer(): boolean {
    return framePacer.shouldReduceQuality();
  }

  /**
   * Resets all metrics and FPS history. Intended for testing.
   */
  _resetForTesting(): void {
    this.metrics = { ...ZERO_METRICS };
    this.fpsHistory = [];
  }
}

// ─── Convenience functions ────────────────────────────────────────────────

/**
 * Creates a new performance budget enforcer for the given profile.
 */
export function createBudgetEnforcer(profile: QualityProfile): PerformanceBudgetEnforcer {
  return new PerformanceBudgetEnforcer(profile);
}

/**
 * Returns the performance budget for a quality profile.
 */
export function getPerformanceBudget(profile: QualityProfile): PerformanceBudget {
  return { ...PERFORMANCE_BUDGETS[profile] };
}
