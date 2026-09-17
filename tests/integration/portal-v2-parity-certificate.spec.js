const { test, expect } = require('@playwright/test');

const VIEWPORTS = [
  { name: 'desktop', width: 1440, height: 1000 },
  { name: 'mobile', width: 390, height: 844 }
];

test.describe.configure({ timeout: 180000 });

async function boot(page, preview, viewport = VIEWPORTS[0]) {
  await page.setViewportSize(viewport);
  await page.route('**/cdp/**', route => route.abort());
  const response = await page.goto(`${preview}/portal-v2/?parity_certificate=${Date.now()}`, {
    waitUntil: 'domcontentloaded', timeout: 45000
  });
  expect(response).not.toBeNull();
  expect(response.status()).toBeLessThan(400);
  await page.waitForFunction(() => Boolean(globalThis.__BG_PORTAL_DOMAIN_STATE__) && Boolean(document.querySelector('.app')), { timeout: 30000 });
}

async function manifest(page) {
  return page.evaluate(async () => {
    const mod = await import('/portal-v2/parity-certificate.js');
    return mod.buildParityCertificatePlan();
  });
}

async function openPage(page, pageId) {
  await page.evaluate(async id => {
    const mod = await import('/portal-v2/page-shell.js');
    mod.openPortalPage(id);
  }, pageId);
  await expect(page.locator('#portalView')).toHaveAttribute('data-page-id', pageId, { timeout: 10000 });
}

test('every legacy capability produces capability-scoped browser evidence', async ({ page }, testInfo) => {
  const preview = process.env.PREVIEW_URL;
  if (!preview) throw new Error('PREVIEW_URL is required');
  await boot(page, preview);
  const plan = await manifest(page);

  expect(plan.length).toBeGreaterThan(0);
  for (const capability of plan) {
    expect(capability.legacyCapability).toBeTruthy();
    expect(capability.pageId).toBeTruthy();
    expect(capability.implementation).toBeTruthy();
    expect(capability.stateProof).toBeTruthy();
    expect(capability.models).toBeInstanceOf(Array);
    expect(capability.calculations).toBeInstanceOf(Array);
    expect(capability.actions).toBeInstanceOf(Array);

    await openPage(page, capability.pageId);
    const browser = await page.evaluate(({ legacyCapability, pageId }) => ({
      legacyCapability,
      pageId,
      url: location.href,
      title: document.title,
      portalPageId: document.querySelector('#portalView')?.getAttribute('data-page-id') || null,
      legacyLinks: document.querySelectorAll('#portalView a[href*="klantportaal"], #portalView iframe[src*="klantportaal"]').length,
      controls: document.querySelectorAll('#portalView input, #portalView select, #portalView textarea, #portalView button').length,
      capturedAt: new Date().toISOString()
    }), capability);

    expect(browser.portalPageId).toBe(capability.pageId);
    expect(browser.legacyLinks, `${capability.legacyCapability} must be native V2`).toBe(0);
    await testInfo.attach(`parity-${capability.legacyCapability}.json`, {
      body: Buffer.from(JSON.stringify({ ...capability, browser }, null, 2)),
      contentType: 'application/json'
    });
    await testInfo.attach(`parity-${capability.legacyCapability}.png`, {
      body: await page.screenshot({ fullPage: true }),
      contentType: 'image/png'
    });
  }
});

test('BCG is native, complete, interactive and evidence-bearing in Portal V2', async ({ page }, testInfo) => {
  const preview = process.env.PREVIEW_URL;
  if (!preview) throw new Error('PREVIEW_URL is required');
  await boot(page, preview);
  await openPage(page, 'strategiemodellen');

  const bcg = page.locator('[data-model-id="bcg"]');
  await expect(bcg).toBeVisible();
  await expect(bcg.getByText('BCG-matrix', { exact: true })).toBeVisible();
  await expect(bcg.locator('[data-quadrant]')).toHaveCount(4);
  await expect(bcg.locator('[data-quadrant].current')).toHaveCount(1);
  await expect(bcg.locator('textarea[data-bcg-note]')).toBeVisible();

  const model = await page.evaluate(async () => {
    const { buildBcgModel } = await import('/portal-v2/strategic-models.js');
    const state = globalThis.__BG_PORTAL_DOMAIN_STATE__?.get?.() || {};
    return buildBcgModel(state);
  });
  expect(model.id).toBe('bcg');
  expect(model.quadrants).toHaveLength(4);
  expect(['ster', 'melkkoe', 'vraagteken', 'hond']).toContain(model.currentQuadrant);
  expect(model.evidence).toBeTruthy();
  expect(model.notePath).toBe('portal.strategicModels.bcg.note');

  await testInfo.attach('parity-bcg.json', {
    body: Buffer.from(JSON.stringify(model, null, 2)), contentType: 'application/json'
  });
  await testInfo.attach('parity-bcg.png', {
    body: await page.screenshot({ fullPage: true }), contentType: 'image/png'
  });
});
