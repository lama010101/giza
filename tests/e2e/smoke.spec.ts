import { test, expect } from '@playwright/test';

test('smoke: page loads', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/GIZA/);
});

test('smoke: canvas mounts', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('canvas')).toBeVisible();
});

test('smoke: debug overlay can be enabled and toggled', async ({ page }) => {
  await page.goto('/');

  const result = await page.evaluate(() => {
    type DebugResult =
      | { available: true; lines: string[]; activeDisplays: string[] }
      | { available: false };

    return ((): DebugResult => {
      const overlay = (
        window as unknown as { __GIZA_DEBUG__: typeof import('@/scene/debugOverlay').debugOverlay }
      ).__GIZA_DEBUG__;
      if (!overlay) return { available: false };

      overlay._resetForTesting();
      overlay.setEnabled(true);
      overlay.enableAll();
      overlay.updateStats({
        fps: 60,
        frameTime: 16.67,
        drawCalls: 100,
        triangles: 50000,
        geometries: 12,
        textures: 4,
        programs: 3,
        jsHeapUsed: 50 * 1048576,
        jsHeapTotal: 100 * 1048576,
        sceneNodes: 120,
        visibleNodes: 115,
        lodDistribution: { lod0: 80, lod1: 35 },
        evidenceCoverage: 87.5,
      });

      return {
        available: true,
        lines: overlay.renderOverlay(),
        activeDisplays: overlay.getActiveDisplays(),
      };
    })();
  });

  if (!result.available) {
    throw new Error('Debug overlay is not exposed on window.__GIZA_DEBUG__');
  }

  expect(result.lines.length).toBeGreaterThan(0);
  expect(result.activeDisplays.length).toBe(11);
  expect(result.lines.some((line: string) => line.includes('FPS'))).toBe(true);
  expect(result.lines.some((line: string) => line.includes('Draw Calls'))).toBe(true);
});
