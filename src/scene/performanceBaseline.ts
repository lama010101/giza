/**
 * Performance baseline and measurement per GIZA - 04 §6.26, §6.27.
 *
 * Captures FPS, frame time, draw calls, and triangle count.
 * Stores baseline in docs/architecture/benchmark-baseline.md.
 */

export interface PerformanceSample {
  timestamp: number;
  fps: number;
  frameTime: number; // ms
  drawCalls: number;
  triangles: number;
  geometries: number;
  textures: number;
  programs: number;
}

export interface PerformanceBudget {
  minFPS: number;
  maxFrameTime: number; // ms
  maxDrawCalls: number;
  maxTriangles: number;
  maxTextureMemory: number; // MB
}

export const PERFORMANCE_BUDGETS: Record<string, PerformanceBudget> = {
  'desktop-high': {
    minFPS: 60,
    maxFrameTime: 16.7,
    maxDrawCalls: 2000,
    maxTriangles: 5_000_000,
    maxTextureMemory: 1024,
  },
  'desktop-standard': {
    minFPS: 45,
    maxFrameTime: 22.2,
    maxDrawCalls: 1500,
    maxTriangles: 3_000_000,
    maxTextureMemory: 512,
  },
  'mobile-high': {
    minFPS: 30,
    maxFrameTime: 33.3,
    maxDrawCalls: 500,
    maxTriangles: 1_000_000,
    maxTextureMemory: 256,
  },
  'mobile-standard': {
    minFPS: 30,
    maxFrameTime: 33.3,
    maxDrawCalls: 300,
    maxTriangles: 500_000,
    maxTextureMemory: 128,
  },
};

/**
 * Captures a performance sample from the R3F renderer stats.
 */
export function captureSample(
  rendererStats: {
    drawCalls: number;
    triangles: number;
    geometries: number;
    textures: number;
    programs: number;
  },
  fps: number,
  frameTime: number,
): PerformanceSample {
  return {
    timestamp: Date.now(),
    fps,
    frameTime,
    drawCalls: rendererStats.drawCalls,
    triangles: rendererStats.triangles,
    geometries: rendererStats.geometries,
    textures: rendererStats.textures,
    programs: rendererStats.programs,
  };
}

/**
 * Validates a performance sample against a budget.
 */
export function validateAgainstBudget(
  sample: PerformanceSample,
  budget: PerformanceBudget,
): { passed: boolean; violations: string[] } {
  const violations: string[] = [];

  if (sample.fps < budget.minFPS) {
    violations.push(`FPS ${sample.fps.toFixed(1)} below minimum ${budget.minFPS}`);
  }
  if (sample.frameTime > budget.maxFrameTime) {
    violations.push(
      `Frame time ${sample.frameTime.toFixed(1)}ms exceeds max ${budget.maxFrameTime}ms`,
    );
  }
  if (sample.drawCalls > budget.maxDrawCalls) {
    violations.push(`Draw calls ${sample.drawCalls} exceed max ${budget.maxDrawCalls}`);
  }
  if (sample.triangles > budget.maxTriangles) {
    violations.push(`Triangles ${sample.triangles} exceed max ${budget.maxTriangles}`);
  }

  return { passed: violations.length === 0, violations };
}

/**
 * Formats a performance sample as a markdown table row.
 */
export function sampleToMarkdownRow(sample: PerformanceSample): string {
  return `| ${new Date(sample.timestamp).toISOString()} | ${sample.fps.toFixed(1)} | ${sample.frameTime.toFixed(2)} | ${sample.drawCalls} | ${sample.triangles.toLocaleString()} | ${sample.geometries} | ${sample.textures} |`;
}

/**
 * Generates a performance report in markdown format.
 */
export function generateReport(
  samples: PerformanceSample[],
  profile: string,
  budget: PerformanceBudget,
): string {
  const avgFps = samples.reduce((sum, s) => sum + s.fps, 0) / samples.length;
  const avgFrameTime = samples.reduce((sum, s) => sum + s.frameTime, 0) / samples.length;
  const maxDrawCalls = Math.max(...samples.map((s) => s.drawCalls));
  const maxTriangles = Math.max(...samples.map((s) => s.triangles));
  const validation = validateAgainstBudget(
    {
      ...samples[0],
      fps: avgFps,
      frameTime: avgFrameTime,
      drawCalls: maxDrawCalls,
      triangles: maxTriangles,
    },
    budget,
  );

  return `# Benchmark Performance Report

**Profile:** ${profile}
**Date:** ${new Date().toISOString()}
**Samples:** ${samples.length}

## Summary

| Metric | Average | Budget | Status |
|--------|---------|--------|--------|
| FPS | ${avgFps.toFixed(1)} | ≥ ${budget.minFPS} | ${avgFps >= budget.minFPS ? '✅' : '❌'} |
| Frame Time | ${avgFrameTime.toFixed(2)}ms | ≤ ${budget.maxFrameTime}ms | ${avgFrameTime <= budget.maxFrameTime ? '✅' : '❌'} |
| Draw Calls | ${maxDrawCalls} | ≤ ${budget.maxDrawCalls} | ${maxDrawCalls <= budget.maxDrawCalls ? '✅' : '❌'} |
| Triangles | ${maxTriangles.toLocaleString()} | ≤ ${budget.maxTriangles.toLocaleString()} | ${maxTriangles <= budget.maxTriangles ? '✅' : '❌'} |

## Verdict

${validation.passed ? '✅ Within budget' : '❌ Budget violations: ' + validation.violations.join(', ')}

## Raw Samples

| Timestamp | FPS | Frame Time (ms) | Draw Calls | Triangles | Geometries | Textures |
|-----------|-----|-----------------|------------|-----------|------------|----------|
${samples.map(sampleToMarkdownRow).join('\n')}
`;
}
