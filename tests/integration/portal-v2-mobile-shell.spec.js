const { test, expect } = require('@playwright/test');

test.describe.configure({ timeout: 120000 });

test('demoAI rewrite stays compact after asynchronous Portal V2 actions mount', async ({ page }) => {
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

  // Always preserve post-hydration visual evidence, including failing runs.
  await page.screenshot({ path: 'artifacts/portal-v2-mobile-overview-demoai.png', fullPage: true });

  await expect(page.locator('.mobilebar')).toBeVisible();
  await expect(page.locator('.v2utilities')).toBeHidden();
  await expect(page.getByRole('button', { name: 'Export', exact: true })).toBeHidden();

  const searchGeometry = await page.locator('.searchrow > *').evaluateAll(nodes => nodes.map(node => {
    const r = node.getBoundingClientRect();
    return { x:r.x, y:r.y, width:r.width, height:r.height };
  }).filter(item => item.width > 0 && item.height > 0));
  expect(searchGeometry).toHaveLength(4);
  expect(Math.max(...searchGeometry.map(x => x.y)) - Math.min(...searchGeometry.map(x => x.y))).toBeLessThanOrEqual(2);
  expect(searchGeometry[0].width).toBeGreaterThan(180);
  expect(searchGeometry.slice(1).every(item => item.width >= 40 && item.width <= 48 && item.height >= 40)).toBeTruthy();

  const topbarHeight = await page.locator('.topbar').evaluate(node => node.getBoundingClientRect().height);
  expect(topbarHeight).toBeLessThan(260);

  const kpiState = await page.locator('.kpis').evaluate(node => {
    const style = getComputedStyle(node);
    const rect = node.getBoundingClientRect();
    return { display:style.display, gridTemplateColumns:style.gridTemplateColumns, visibility:style.visibility, width:rect.width, height:rect.height, x:rect.x, y:rect.y };
  });
  const cards = await page.locator('.kpis .kpi').evaluateAll(nodes => nodes.slice(0, 2).map(node => {
    const r = node.getBoundingClientRect();
    const s = getComputedStyle(node);
    return { x:r.x, y:r.y, width:r.width, height:r.height, display:s.display, visibility:s.visibility, position:s.position };
  }));
  console.log('MOBILE_KPI_STATE', JSON.stringify({ kpiState, cards }));
  expect(cards).toHaveLength(2);
  expect(cards.every(card => card.width >= 150 && card.height > 0)).toBeTruthy();
  expect(Math.abs(cards[0].y - cards[1].y)).toBeLessThanOrEqual(2);
  expect(cards[1].x).toBeGreaterThan(cards[0].x);

  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(1);
  expect(errors).toEqual([]);
});
