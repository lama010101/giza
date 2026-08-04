# Benchmark Performance Baseline

**Generated:** 2026-07-31
**Scene:** `<BenchmarkScene>` (M08.5-T01)
**Profiles:** desktop-high, desktop-standard, mobile-high, mobile-standard

## Purpose

This document establishes the FPS baseline for the benchmark scene described in M08.5. The benchmark scene exercises all 5 lighting layers, 5 master materials, water rendering, shadow strategy, and physics primitives.

## Budgets (GIZA - 04 §6.27)

| Profile | Min FPS | Max Frame Time | Max Draw Calls | Max Triangles | Max Texture Memory |
|---------|---------|----------------|----------------|---------------|-------------------|
| desktop-high | 60 | 16.7ms | 2000 | 5,000,000 | 1024 MB |
| desktop-standard | 45 | 22.2ms | 1500 | 3,000,000 | 512 MB |
| mobile-high | 30 | 33.3ms | 500 | 1,000,000 | 256 MB |
| mobile-standard | 30 | 33.3ms | 300 | 500,000 | 128 MB |

## Benchmark Scene Contents

- **Lighting:** 5 layers (ambient, directional, local, bounce, volumetric) via `<LayeredLighting>`
- **Materials:** 5 master materials (Tura Limestone, Local Limestone, Aswan Granite, Basalt, Water) on labeled sample blocks
- **Water:** Custom shader with Fresnel, depth coloration, ripples, refraction, underwater attenuation
- **Shadows:** CSM (4 cascade, 2048 map) for desktop-high profile
- **Primitives:** Floor, cube, sphere, stairs (4 steps), shaft (hollow box)
- **Physics:** Rapier collision primitives (stairs, shaft walls)

## Baseline Measurements

> **Note:** Actual baseline measurements must be captured on target hardware. The values below are targets based on the performance budgets. Replace with real measurements after running on desktop and mobile devices.

### desktop-high (target)

| Metric | Target | Status |
|--------|--------|--------|
| FPS | ≥ 60 | Pending measurement |
| Frame Time | ≤ 16.7ms | Pending measurement |
| Draw Calls | ≤ 2000 | Pending measurement |
| Triangles | ≤ 5,000,000 | Pending measurement |

### desktop-standard (target)

| Metric | Target | Status |
|--------|--------|--------|
| FPS | ≥ 45 | Pending measurement |
| Frame Time | ≤ 22.2ms | Pending measurement |
| Draw Calls | ≤ 1500 | Pending measurement |
| Triangles | ≤ 3,000,000 | Pending measurement |

### mobile-high (target)

| Metric | Target | Status |
|--------|--------|--------|
| FPS | ≥ 30 | Pending measurement |
| Frame Time | ≤ 33.3ms | Pending measurement |
| Draw Calls | ≤ 500 | Pending measurement |
| Triangles | ≤ 1,000,000 | Pending measurement |

### mobile-standard (target)

| Metric | Target | Status |
|--------|--------|--------|
| FPS | ≥ 30 | Pending measurement |
| Frame Time | ≤ 33.3ms | Pending measurement |
| Draw Calls | ≤ 300 | Pending measurement |
| Triangles | ≤ 500,000 | Pending measurement |

## Regression Test

The benchmark regression test (M08.5-T08) runs on every PR affecting rendering. It:
1. Loads the benchmark scene
2. Asserts FPS ≥ budget for the active profile
3. Asserts no console errors
4. Asserts all material/water/light toggles work

## How to Capture Measurements

```typescript
import { captureSample, validateAgainstBudget, PERFORMANCE_BUDGETS } from '@/scene/performanceBaseline';

// In a render loop:
const sample = captureSample(rendererStats, fps, frameTime);
const result = validateAgainstBudget(sample, PERFORMANCE_BUDGETS['desktop-high']);
if (!result.passed) {
  console.warn('Performance budget violation:', result.violations);
}
```
