const { test, expect } = require('@playwright/test');

test.describe.configure({ timeout: 120000 });

test('demoAI stays compact after asynchronous Portal V2 hydration', async ({ page }) => {
  const preview = process.env.PREVIEW_URL;
  if (!preview) throw new Error('PREVIEW_URL is required');
  await page.setViewportSize({ width: 390, height: 844 });
  const errors = [];
  page.on('pageerror', error => errors.push(error.stack || String(error)));

  const response = await page.goto(`${preview}/klantportaal?klant=demoAI&bg_live=${Date.now()}`, {
    waitUntil: 'domcontentloaded', timeout: 45000
  });
  expect(response).not.toBeNull();
  expect(response.status()).toBeLessThan(400);
  await page.waitForSelector('.app');
  await page.waitForSelector('.v2utilities', { state: 'attached' });
  await page.waitForTimeout(1800);

  // Preserve the fully hydrated browser state on every run, including failures.
  await page.screenshot({ path: 'artifacts/portal-v2-mobile-overview-demoai.png', fullPage: true });

  await expect(page.locator('.mobilebar')).toBeVisible();
  await expect(page.locator('.v2utilities')).toBeHidden();
  await expect(page.locator('.v2globalstatus')).toBeHidden();
  await expect(page.getByRole('button', { name: 'Export', exact: true })).toBeHidden();

  const searchGeometry = await page.locator('.searchrow > *').evaluateAll(nodes => nodes.map(node => {
    const r = node.getBoundingClientRect();
    return { x:r.x, y:r.y, width:r.width, height:r.height };
  }).filter(item => item.width > 0 && item.height > 0));
  expect(searchGeometry).toHaveLength(4);
  expect(Math.max(...searchGeometry.map(x => x.y)) - Math.min(...searchGeometry.map(x => x.y))).toBeLessThanOrEqual(2);
  expect(searchGeometry[0].width).toBeGreaterThan(180);
  expect(searchGeometry.slice(1).every(item => item.width >= 40 && item.width <= 48 && item.height >= 40 && item.height <= 48)).toBeTruthy();

  const topbarHeight = await page.locator('.topbar').evaluate(node => node.getBoundingClientRect().height);
  expect(topbarHeight).toBeLessThan(260);

  const actionGeometry = await page.locator('.actionrow > .smallbtn').evaluateAll(nodes => nodes.map(node => {
    const r = node.getBoundingClientRect();
    return { width:r.width, height:r.height };
  }).filter(item => item.width > 0 && item.height > 0));
  expect(actionGeometry).toHaveLength(2);
  expect(actionGeometry.every(item => item.height >= 40 && item.height <= 48)).toBeTruthy();

  // The authenticated/customer cockpit may intentionally replace the static KPI strip.
  // The regression contract is layout stability, not preservation of pre-hydration demo content.
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(1);
  expect(errors).toEqual([]);
});
