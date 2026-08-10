import { test, expect, devices } from '@playwright/test';

test.setTimeout(60000);

test.use({
  ...devices['Desktop Chrome'],
  viewport: { width: 1600, height: 1100 },
  launchOptions: { args: ['--start-maximized'] },
});

test('PR #17 final verification: ramp hypothesis, overlays, navigation, regressions', async ({
  page,
  context,
}) => {
  const errors: string[] = [];
  const warnings: string[] = [];

  page.on('pageerror', (err) => errors.push(err.message));
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(msg.text());
    if (msg.type() === 'warning') warnings.push(msg.text());
  });

  await context.grantPermissions(['clipboard-read', 'clipboard-write'], {
    origin: 'http://localhost:5173',
  });

  await page.goto('/');
  await expect(page.locator('canvas')).toBeVisible();

  const getSession = async () => {
    const raw = await page.evaluate(() => localStorage.getItem('giza-session'));
    return raw ? (JSON.parse(raw) as { state: Record<string, unknown> }).state : null;
  };

  const zoomAtCenter = async (clicks: number, delta: number) => {
    const canvasBox = await page.locator('canvas').boundingBox();
    if (!canvasBox) throw new Error('Canvas bounding box not found');
    const cx = canvasBox.x + canvasBox.width / 2;
    const cy = canvasBox.y + canvasBox.height / 2;
    await page.mouse.move(cx, cy);
    for (let i = 0; i < clicks; i++) {
      await page.mouse.wheel(0, delta);
    }
    await page.waitForTimeout(300);
  };

  await test.step('runtime LOD: zoom in and verify GLB assets are fetched', async () => {
    await zoomAtCenter(45, -10);

    const glbResources = await page.evaluate(() =>
      performance
        .getEntriesByType('resource')
        .filter((r) => r.name.endsWith('.glb'))
        .map((r) => r.name),
    );
    expect(glbResources.length, 'GLB assets should be fetched at runtime').toBeGreaterThan(0);
  });

  await test.step('layer toggles: Hide All / Show All updates hiddenLayers', async () => {
    const allBtn = page.locator('[data-testid="layer-panel"] .layer-all-btn');
    await allBtn.dispatchEvent('click');
    let session = await getSession();
    expect((session?.hiddenLayers as string[] | undefined)?.length).toBeGreaterThan(0);

    await allBtn.dispatchEvent('click');
    session = await getSession();
    expect((session?.hiddenLayers as string[] | undefined)?.length).toBe(0);
  });

  await test.step('measurement: distance, height, volume, angle, area', async () => {
    const canvasBox = await page.locator('canvas').boundingBox();
    if (!canvasBox) throw new Error('Canvas bounding box not found');
    const cx = canvasBox.x + canvasBox.width / 2;
    const cy = canvasBox.y + canvasBox.height / 2;

    const p1 = { x: cx, y: cy };
    const p2 = { x: cx + 30, y: cy - 30 };
    const p3 = { x: cx + 30, y: cy + 30 };
    const p4 = { x: cx - 30, y: cy - 30 };
    const p5 = { x: cx - 30, y: cy + 30 };

    const measurementSection = page.locator('.side-section:has-text("Measurement")');
    const hintLocator = measurementSection.locator('.side-hint');

    await measurementSection.getByRole('button', { name: 'Measure' }).dispatchEvent('click');
    await expect(measurementSection.locator('.measurement-type-group')).toBeVisible();

    const runMode = async (label: string, clicks: { x: number; y: number }[], pattern: RegExp) => {
      await measurementSection.getByRole('button', { name: label }).dispatchEvent('click');
      const resetBtn = measurementSection.getByRole('button', { name: 'Reset' });
      if ((await resetBtn.count()) > 0) await resetBtn.dispatchEvent('click');
      for (let i = 0; i < clicks.length - 1; i++) {
        await page.mouse.click(clicks[i].x, clicks[i].y);
        await expect(hintLocator).toHaveText(/Pick a (second|third) point/);
      }
      await page.mouse.click(clicks[clicks.length - 1].x, clicks[clicks.length - 1].y);
      await expect(hintLocator).toHaveText(pattern);
    };

    await runMode('Distance', [p1, p2], /\d+\.\d+\s*m$/);
    await runMode('Height', [p1, p3], /\d+\.\d+\s*m$/);
    await runMode('Volume', [p4, p5], /\d+\.\d+\s*m³/);
    await runMode('Angle', [p1, p2, p3], /\d+\.\d+°/);
    await runMode('Area', [p1, p2, p3], /\d+\.\d+\s*m²/);

    await page.screenshot({ path: '/tmp/ss3-measurement.png' });
  });

  await test.step('bookmark: save and share URL contains ?bm=', async () => {
    await page.getByLabel('Bookmark name').fill('Final Verification View');
    await page.getByLabel('Bookmark notes').fill('ramp-fix');
    await page.getByRole('button', { name: 'Save current view' }).dispatchEvent('click');
    await expect(page.locator('.bookmark-item')).toHaveCount(1);

    await page.getByRole('button', { name: /Share/ }).dispatchEvent('click');
    await page.waitForTimeout(500);
    const clipboardText = await page.evaluate(() => navigator.clipboard.readText());
    expect(clipboardText).toContain('?bm=');
    expect(clipboardText).toMatch(/^http:\/\/localhost:5173\/\?bm=/);
    await page.screenshot({ path: '/tmp/ss3-bookmark.png' });
  });

  await test.step('search: typing "shaft" routes to a non-Search side panel tab', async () => {
    await page.locator('.side-secondary-tabs button:has-text("Search")').dispatchEvent('click');
    await page.getByLabel('Search query').fill('shaft');
    await expect(page.locator('.search-results')).toBeVisible();
    await page.screenshot({ path: '/tmp/ss3-search.png' });
    await page.locator('.search-result').first().dispatchEvent('click');
    await expect(page.locator('.side-secondary-tabs button[aria-pressed="true"]')).not.toHaveText(
      'Search',
    );
    await page.screenshot({ path: '/tmp/ss3-search-result.png' });
  });

  await test.step('ramp hypothesis: appears, activates, and Theory panel shows predictions', async () => {
    await page.locator('.side-secondary-tabs button:has-text("Simulation")').dispatchEvent('click');
    const rampLabel = page.locator(
      '.hypothesis-selector label:has-text("Internal Ramp Construction")',
    );
    await expect(rampLabel).toBeVisible();
    await rampLabel
      .locator('input[type="checkbox"]')
      .evaluate((el) => (el as HTMLInputElement).click());

    await page.waitForTimeout(300);
    const session = await getSession();
    expect(session?.activeHypothesisIds).toContain('THEORY-GP-004');

    // Select Original Entrance to inspect the ramp overlay and predictions
    await page
      .locator('[data-testid="left-panel"] .left-panel-tree button:has-text("Original Entrance")')
      .dispatchEvent('click');
    await page.locator('.side-secondary-tabs button:has-text("Theory")').dispatchEvent('click');
    await expect(page.locator('[data-testid="hypothesis-item-THEORY-GP-004"]')).toBeVisible();
    await expect(page.locator('.hypothesis-predictions')).toContainText('ramp');
    await page.screenshot({ path: '/tmp/ss3-ramp-theory.png' });

    // Zoom in on Original Entrance to make the annotation overlay visible
    await zoomAtCenter(20, -10);
    await page.waitForTimeout(500);
    await page.screenshot({ path: '/tmp/ss3-ramp-overlay.png' });

    // Also inspect Descending Passage to confirm overlay on a second affected object
    await page
      .locator(
        '[data-testid="left-panel"] .left-panel-tree button:has-text("Descending Passage (sloped)")',
      )
      .dispatchEvent('click');
    await zoomAtCenter(10, -10);
    await page.waitForTimeout(500);
    await page.screenshot({ path: '/tmp/ss3-ramp-overlay-descending.png' });
  });

  await test.step('navigation list: clicking a location updates camera target', async () => {
    const before = await getSession();
    const beforeTarget = before?.cameraTarget as { x: number; y: number; z: number } | undefined;

    await page
      .getByRole('button', { name: 'Great Pyramid — Subterranean Chamber' })
      .dispatchEvent('click');
    await page.waitForTimeout(800);

    const after = await getSession();
    const afterTarget = after?.cameraTarget as { x: number; y: number; z: number } | undefined;
    expect(afterTarget).toBeDefined();
    expect(afterTarget?.z).not.toBe(beforeTarget?.z ?? 0);
    await page.screenshot({ path: '/tmp/ss3-navigation.png' });
  });

  await page.screenshot({ path: '/tmp/ss3-final.png' });

  const relevantErrors = errors.filter((t) => !t.includes('PointerLockControls'));
  expect(relevantErrors, `console/page errors: ${errors.join('\n')}`).toEqual([]);

  // eslint-disable-next-line no-console
  console.log('Console warnings:', warnings);
});
